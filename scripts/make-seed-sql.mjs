// Генерирует supabase/seed_6a.sql — SQL для вставки в Supabase → SQL Editor.
// Создаёт учителя и класс «6А» (Гимназия №70) с историей «с 1 сентября».
// Секретные ключи не нужны: логин и пароли вы впишете прямо в начале SQL перед запуском.
//
//   node scripts/make-seed-sql.mjs
//
// Список учеников — scripts/roster.txt (по одному в строке, в git не попадает).
// Без него берутся вымышленные имена.
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { buildHistory, DEFAULT_NAMES } from '../src/seed/history.js'
import { STATIONS } from '../src/lib/stations.js'

const rosterFile = new URL('./roster.txt', import.meta.url)
const names = existsSync(rosterFile) ? readFileSync(rosterFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : DEFAULT_NAMES
const h = buildHistory({ names })
const AVATARS = ['🦊', '🐼', '🐱', '🐺', '🐻', '🐸', '🦆', '🦁', '🐨', '🦭', '🦌', '🐭', '🐯', '🦓', '🦦', '🐙', '🦄']

const data = {
  names: names.map((n, i) => ({ name: n, avatar: AVATARS[i % AVATARS.length] })),
  stations: h.stations, idx: h.idx,
  deeds: h.deeds.map((d) => ({ who: d.who, tree: d.tree, title: d.title, at: d.at })),
  books: h.books.map((b) => ({ who: b.who, title: b.title, author: b.author, genre: b.genre, stars: b.stars, review: b.review, color: b.color, at: b.at })),
  fives: h.fives.map((f) => ({ who: f.who === 'teacher' ? -1 : f.who, week: f.week, subject: f.subject, count: f.count, at: f.at })),
  legs: h.legs.map((l) => ({ idx: l.idx, name: l.station.name, emoji: l.station.emoji, reward: l.station.reward || '', pushed: l.pushed, total: l.fives_total, at: l.arrived_at })),
  worries: h.worries.map((w) => ({ text: w.text, mood: w.mood, size: w.size, at: w.at, reply: w.reply, replied_at: w.replied_at })),
}

const sql = `-- ============================================================
--  Наполнение: учитель + класс «6А» с историей «с 1 сентября».
--  1) ВПИШИТЕ три значения ниже (логин и пароли, которые вы придумали).
--  2) Вставьте весь файл в Supabase → SQL Editor → Run.
--  Скрипт можно запускать повторно: он пересоздаёт класс с нуля.
-- ============================================================
do $seed$
declare
  v_login      text := 'ВПИШИТЕ_ЛОГИН_УЧИТЕЛЯ';      -- латиницей, например maria.ivanovna
  v_password   text := 'ВПИШИТЕ_ПАРОЛЬ_УЧИТЕЛЯ';     -- минимум 6 символов
  v_class_pass text := 'ВПИШИТЕ_ПАРОЛЬ_КЛАССА';      -- его вводят ученики по ссылке

  v_teacher_name text := 'Классный руководитель';
  v_school text := 'Гимназия №70';
  v_class  text := '6А';
  v_slug   text := '6a';

  h jsonb := $json$${JSON.stringify(data).replace(/[\u0080-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))}$json$::jsonb;
  v_email text; v_uid uuid := gen_random_uuid(); v_cid uuid; v_ghost uuid; v_teacher uuid; i int;
  ids uuid[] := '{}'; r jsonb; mid uuid;
begin
  if v_login like 'ВПИШИТЕ%' or v_password like 'ВПИШИТЕ%' or v_class_pass like 'ВПИШИТЕ%' then
    raise exception 'Сначала впишите логин и пароли в начале скрипта';
  end if;
  if char_length(v_password) < 6 then raise exception 'Пароль учителя — минимум 6 символов'; end if;
  v_email := lower(trim(v_login)) || '@klass70.ru';

  -- пересоздание
  delete from classes where slug = v_slug;
  delete from auth.identities where user_id in (select id from auth.users where email = v_email);
  delete from auth.users where email = v_email;

  -- учитель (пользователь Supabase Auth)
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());

  -- класс
  perform _make_class(v_uid, v_school, v_class, v_class_pass, v_teacher_name, h->'stations', v_slug);
  select id into v_cid from classes where slug = v_slug;
  select id into v_teacher from members where class_id = v_cid and role = 'teacher';

  -- ученики (регистрируются сами по ссылке, выбрав имя из списка) и «призрак» для писем
  for i in 0 .. jsonb_array_length(h->'names') - 1 loop
    insert into members(class_id, name, role, avatar) values (v_cid, h->'names'->i->>'name', 'student', h->'names'->i->>'avatar') returning id into mid;
    ids := ids || mid;
  end loop;
  insert into members(class_id, name, role) values (v_cid, '—', 'ghost') returning id into v_ghost;

  -- история
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
  update train_meta set station_idx = (h->>'idx')::int where class_id = v_cid;
  for r in select * from jsonb_array_elements(h->'worries') loop
    insert into worries(class_id, author_id, text, mood, size, created_at, reply, replied_at)
    values (v_cid, v_ghost, r->>'text', r->>'mood', (r->>'size')::int, (r->>'at')::timestamptz, nullif(r->>'reply', 'null'), nullif(r->>'replied_at', 'null')::timestamptz);
  end loop;

  raise notice 'Готово: класс %, ссылка для учеников: <адрес сайта>/#/c/%', v_class, v_slug;
end
$seed$;
`
writeFileSync(new URL('../supabase/seed_6a.sql', import.meta.url), sql)
console.log(`supabase/seed_6a.sql: ${names.length} учеников, ${h.deeds.length} дел, ${h.books.length} книг, ${h.fives.length} пятёрок, ${h.legs.length} станций, ${h.worries.length} писем`)
