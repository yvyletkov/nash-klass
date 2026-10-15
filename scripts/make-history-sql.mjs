// Генерирует supabase/history.sql: добавляет в УЖЕ СОЗДАННЫЙ класс историю «с 1 сентября»
// (дела, книги, пятёрки, журнал поезда, письма в ящик). Ученики берутся из класса по именам из scripts/roster.txt.
//   node scripts/make-history-sql.mjs [slug]       (по умолчанию slug из SLUG или cadecec8973)
// Скрипт можно запускать повторно: прежняя история класса заменяется.
import { readFileSync, writeFileSync } from 'node:fs'
import { buildHistory } from '../src/seed/history.js'

const slug = process.argv[2] || process.env.SLUG || 'cadecec8973'
const names = readFileSync(new URL('./roster.txt', import.meta.url), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
const h = buildHistory({ names })
const data = {
  names, idx: h.idx, stations: h.stations,
  deeds: h.deeds.map((d) => ({ who: d.who, tree: d.tree, title: d.title, at: d.at })),
  books: h.books.map((b) => ({ who: b.who, title: b.title, author: b.author, genre: b.genre, stars: b.stars, review: b.review, color: b.color, at: b.at })),
  fives: h.fives.map((f) => ({ who: f.who === 'teacher' ? -1 : f.who, week: f.week, subject: f.subject, count: f.count, at: f.at })),
  legs: h.legs.map((l) => ({ idx: l.idx, name: l.station.name, emoji: l.station.emoji, reward: l.station.reward || '', pushed: l.pushed, total: l.fives_total, at: l.arrived_at })),
  worries: h.worries.map((w) => ({ text: w.text, mood: w.mood, size: w.size, at: w.at, reply: w.reply, replied_at: w.replied_at })),
}
const sql = `-- История «с 1 сентября» для класса ${slug}. Вставьте целиком в Supabase → SQL Editor → Run. Ничего вписывать не нужно.
do $hist$
declare
  v_slug text := '${slug}';
  h jsonb := $json$${JSON.stringify(data).replace(/[\u0080-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))}$json$::jsonb;
  v_cid uuid; v_teacher uuid; v_ghost uuid; ids uuid[] := '{}'; mid uuid; i int; r jsonb;
begin
  select id into v_cid from classes where slug = v_slug;
  if v_cid is null then raise exception 'Класс % не найден', v_slug; end if;
  select id into v_teacher from members where class_id = v_cid and role = 'teacher';

  -- ученики по именам (должны быть добавлены в список класса)
  for i in 0 .. jsonb_array_length(h->'names') - 1 loop
    select id into mid from members where class_id = v_cid and role = 'student' and name = h->'names'->>i limit 1;
    if mid is null then raise exception 'В классе нет ученика «%»', h->'names'->>i; end if;
    ids := ids || mid;
  end loop;

  -- прежнюю историю заменяем
  delete from deeds where class_id = v_cid; delete from books where class_id = v_cid; delete from fives where class_id = v_cid;
  delete from train_legs where class_id = v_cid; delete from worries where class_id = v_cid;
  delete from members where class_id = v_cid and role = 'ghost';
  insert into members(class_id, name, role) values (v_cid, '—', 'ghost') returning id into v_ghost;

  for r in select * from jsonb_array_elements(h->'deeds') loop
    insert into deeds(class_id, member_id, tree, title, created_at) values (v_cid, ids[(r->>'who')::int + 1], r->>'tree', r->>'title', (r->>'at')::timestamptz);
  end loop;
  for r in select * from jsonb_array_elements(h->'books') loop
    insert into books(class_id, member_id, title, author, genre, stars, review, color, created_at)
    values (v_cid, ids[(r->>'who')::int + 1], r->>'title', r->>'author', r->>'genre', (r->>'stars')::int, r->>'review', r->>'color', (r->>'at')::timestamptz);
  end loop;
  for r in select * from jsonb_array_elements(h->'fives') loop
    insert into fives(class_id, member_id, week_idx, subject, count, created_at)
    values (v_cid, case when (r->>'who')::int < 0 then v_teacher else ids[(r->>'who')::int + 1] end, (r->>'week')::int, r->>'subject', (r->>'count')::int, (r->>'at')::timestamptz);
  end loop;
  for r in select * from jsonb_array_elements(h->'legs') loop
    insert into train_legs(class_id, idx, station_name, station_emoji, reward, pushed, fives_total, arrived_at)
    values (v_cid, (r->>'idx')::int, r->>'name', r->>'emoji', r->>'reward', (r->>'pushed')::boolean, (r->>'total')::int, (r->>'at')::timestamptz);
  end loop;
  update train_meta set station_idx = (h->>'idx')::int, stations = h->'stations' where class_id = v_cid;
  for r in select * from jsonb_array_elements(h->'worries') loop
    insert into worries(class_id, author_id, text, mood, size, created_at, reply, replied_at)
    values (v_cid, v_ghost, r->>'text', r->>'mood', (r->>'size')::int, (r->>'at')::timestamptz, nullif(r->>'reply', 'null'), nullif(r->>'replied_at', 'null')::timestamptz);
  end loop;
  raise notice 'Готово: история добавлена в класс %', v_slug;
end
$hist$;
`
writeFileSync(new URL('../supabase/history.sql', import.meta.url), sql)
console.log(`supabase/history.sql: ${names.length} учеников, ${h.deeds.length} дел, ${h.books.length} книг, ${h.fives.length} пятёрок, ${h.legs.length} станций, ${h.worries.length} писем`)
