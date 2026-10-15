-- ============================================================
--  «Наш класс» — схема базы (Supabase / Postgres), версия 2: много классов
--  Вставьте целиком в Supabase → SQL Editor → Run. Можно запускать повторно.
--
--  Модель:
--   classes  — класс (школа, название, хэш пароля класса, ссылка = slug)
--   members  — участники класса: учитель, ученики, «призраки» (для демо-истории).
--              user_id пуст у ученика из списка, который ещё не зарегистрировался.
--   Всё остальное (дела, книги, пятёрки, поезд, ящик) принадлежит классу.
--  Пароль класса нужен только чтобы зарегистрироваться по ссылке.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Классы и участники ----------
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null check (char_length(name) between 1 and 40),
  school text not null check (char_length(school) between 1 and 80),
  pw_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  role text not null default 'student' check (role in ('teacher', 'student', 'ghost')),
  avatar text not null default '🙂',
  created_at timestamptz not null default now()
);
create index if not exists members_class_idx on members(class_id);

-- Кто я и из какого я класса (по сессии Supabase Auth)
create or replace function my_member() returns uuid
language sql security definer stable set search_path = public as $$
  select id from members where user_id = auth.uid() limit 1;
$$;
create or replace function my_class() returns uuid
language sql security definer stable set search_path = public as $$
  select class_id from members where user_id = auth.uid() limit 1;
$$;
create or replace function is_teacher() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from members where user_id = auth.uid() and role = 'teacher');
$$;

alter table classes enable row level security;   -- напрямую классы не читаются: только через функции
alter table members enable row level security;
drop policy if exists "members read" on members;
create policy "members read" on members for select to authenticated using (class_id = my_class() and role <> 'ghost');
revoke all on members from authenticated;
grant select (id, class_id, name, role, avatar, created_at) on members to authenticated;
-- менять аватар можно только себе
drop policy if exists "members avatar" on members;
create policy "members avatar" on members for update to authenticated using (user_id = auth.uid());
grant update (avatar) on members to authenticated;

-- ---------- Защита пароля класса от подбора ----------
create table if not exists class_fail (slug text not null, at timestamptz not null default now());
alter table class_fail enable row level security;

create or replace function _check_class_password(p_slug text, p_password text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare c classes; fails int;
begin
  select * into c from classes where slug = p_slug;
  if not found then return null; end if;
  select count(*) into fails from class_fail where slug = p_slug and at > now() - interval '10 minutes';
  if fails >= 10 then raise exception 'Слишком много неверных попыток. Подождите 10 минут.'; end if;
  if p_password is null or c.pw_hash <> crypt(p_password, c.pw_hash) then
    insert into class_fail(slug) values (p_slug);
    delete from class_fail where at < now() - interval '1 day';
    return null;
  end if;
  return c.id;
end $$;

-- Страница по ссылке: название и школа видны всем; список учеников — только с верным паролем
create or replace function class_info(p_slug text, p_password text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c classes; cid uuid; roster jsonb := '[]'::jsonb;
begin
  select * into c from classes where slug = p_slug;
  if not found then return null; end if;
  if p_password is not null then
    cid := _check_class_password(p_slug, p_password);
    if cid is not null then
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name), '[]'::jsonb) into roster
      from members where class_id = c.id and role = 'student' and user_id is null;
    end if;
  end if;
  return jsonb_build_object('name', c.name, 'school', c.school, 'slug', c.slug, 'ok', cid is not null, 'roster', roster);
end $$;

-- Внутренний помощник: создаёт класс и учителя
create or replace function _make_class(p_user uuid, p_school text, p_name text, p_password text, p_teacher text, p_stations jsonb, p_slug text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare cid uuid; s text;
begin
  if char_length(coalesce(p_password, '')) < 4 then raise exception 'Пароль класса — минимум 4 символа'; end if;
  s := coalesce(p_slug, 'c' || encode(gen_random_bytes(5), 'hex'));
  insert into classes(slug, name, school, pw_hash) values (s, trim(p_name), trim(p_school), crypt(p_password, gen_salt('bf'))) returning id into cid;
  insert into members(class_id, user_id, name, role, avatar) values (cid, p_user, trim(p_teacher), 'teacher', '🦉');
  insert into train_meta(class_id, stations) values (cid, p_stations);
  return jsonb_build_object('id', cid, 'slug', s);
end $$;

-- Учитель создаёт класс (после регистрации логином и паролем)
create or replace function create_class(p_school text, p_name text, p_password text, p_teacher text, p_stations jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'Нужно войти'; end if;
  if my_member() is not null then raise exception 'У вас уже есть класс'; end if;
  return _make_class(auth.uid(), p_school, p_name, p_password, p_teacher, p_stations, null);
end $$;

-- Ученик по ссылке: пароль класса + выбор себя из списка (или новое имя)
create or replace function join_class(p_slug text, p_password text, p_member uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare cid uuid; m members; av text[] := array['🦊','🐼','🦉','🐱','🐺','🐻','🐸','🦆','🦁','🐨','🦭','🦌','🐭','🐯','🦓','🦦','🐙','🦄'];
begin
  if auth.uid() is null then raise exception 'Нужно войти'; end if;
  if my_member() is not null then raise exception 'Вы уже в классе'; end if;
  cid := _check_class_password(p_slug, p_password);
  if cid is null then raise exception 'Неверный пароль класса'; end if;
  if p_member is not null then
    update members set user_id = auth.uid() where id = p_member and class_id = cid and role = 'student' and user_id is null returning * into m;
    if not found then raise exception 'Это имя уже занято'; end if;
  else
    if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Введите имя'; end if;
    insert into members(class_id, user_id, name, role, avatar)
    values (cid, auth.uid(), trim(p_name), 'student', av[1 + floor(random() * array_length(av, 1))::int]) returning * into m;
  end if;
  if m.avatar = '🙂' then update members set avatar = av[1 + floor(random() * array_length(av, 1))::int] where id = m.id; end if;
  return jsonb_build_object('id', m.id);
end $$;

-- Профиль текущего пользователя
create or replace function my_profile() returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'member', jsonb_build_object('id', m.id, 'name', m.name, 'role', m.role, 'avatar', m.avatar),
    'class', jsonb_build_object('id', c.id, 'slug', c.slug, 'name', c.name, 'school', c.school))
  from members m join classes c on c.id = m.class_id where m.user_id = auth.uid() limit 1;
$$;

-- Учитель: управление классом
create or replace function class_update(p_school text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  update classes set school = trim(p_school), name = trim(p_name) where id = my_class();
end $$;
create or replace function change_class_password(p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  if char_length(coalesce(p_new, '')) < 4 then raise exception 'Пароль класса — минимум 4 символа'; end if;
  update classes set pw_hash = crypt(p_new, gen_salt('bf')) where id = my_class();
end $$;
create or replace function roster_add(p_names text[]) returns void
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  foreach n in array p_names loop
    if char_length(trim(n)) >= 2 then insert into members(class_id, name, role) values (my_class(), trim(n), 'student'); end if;
  end loop;
end $$;
create or replace function member_remove(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  delete from members where id = p_member and class_id = my_class() and role = 'student';
end $$;

-- Список класса с пометкой «уже зарегистрирован» (без раскрытия user_id)
create or replace function class_roster()
returns table (id uuid, name text, role text, avatar text, claimed boolean)
language sql security definer stable set search_path = public as $$
  select m.id, m.name, m.role, m.avatar, m.user_id is not null
  from members m where m.class_id = my_class() and m.role <> 'ghost' order by m.name;
$$;

-- ---------- Сад добрых дел ----------
create table if not exists deeds (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade default my_class(),
  member_id uuid not null references members(id) on delete cascade default my_member(),
  tree text not null,
  title text not null check (char_length(title) between 3 and 140),
  created_at timestamptz not null default now()
);
create index if not exists deeds_class_idx on deeds(class_id, created_at);
alter table deeds enable row level security;
drop policy if exists "deeds read" on deeds;
create policy "deeds read" on deeds for select to authenticated using (class_id = my_class());
drop policy if exists "deeds insert" on deeds;
create policy "deeds insert" on deeds for insert to authenticated with check (class_id = my_class() and member_id = my_member());
drop policy if exists "deeds delete" on deeds;
create policy "deeds delete" on deeds for delete to authenticated using (class_id = my_class() and (member_id = my_member() or is_teacher()));

-- ---------- Книжная полка ----------
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade default my_class(),
  member_id uuid not null references members(id) on delete cascade default my_member(),
  title text not null check (char_length(title) between 1 and 120),
  author text not null default '',
  genre text not null default 'Другое',
  stars int not null default 5 check (stars between 1 and 5),
  review text not null check (char_length(review) between 5 and 800),
  color text not null default '#ef6a5a',
  created_at timestamptz not null default now()
);
create index if not exists books_class_idx on books(class_id, created_at);
alter table books enable row level security;
drop policy if exists "books read" on books;
create policy "books read" on books for select to authenticated using (class_id = my_class());
drop policy if exists "books insert" on books;
create policy "books insert" on books for insert to authenticated with check (class_id = my_class() and member_id = my_member());
drop policy if exists "books delete" on books;
create policy "books delete" on books for delete to authenticated using (class_id = my_class() and (member_id = my_member() or is_teacher()));

-- ---------- Поезд класса ----------
-- stations: маршрут, который придумывает учитель: [{name, emoji, reward}, ...]
create table if not exists train_meta (
  class_id uuid primary key references classes(id) on delete cascade,
  station_idx int not null default 0,
  fives_goal int not null default 60,
  stations jsonb not null
);
alter table train_meta enable row level security;
drop policy if exists "meta read" on train_meta;
create policy "meta read" on train_meta for select to authenticated using (class_id = my_class());
drop policy if exists "meta teacher update" on train_meta;
create policy "meta teacher update" on train_meta for update to authenticated using (class_id = my_class() and is_teacher());

create table if not exists fives (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade default my_class(),
  member_id uuid not null references members(id) on delete cascade default my_member(),
  week_idx int not null,
  subject text not null default '',
  count int not null default 1 check (count between 1 and 60),
  created_at timestamptz not null default now()
);
create index if not exists fives_class_idx on fives(class_id, week_idx);
alter table fives enable row level security;
drop policy if exists "fives read" on fives;
create policy "fives read" on fives for select to authenticated using (class_id = my_class());
drop policy if exists "fives insert" on fives;
create policy "fives insert" on fives for insert to authenticated
  with check (class_id = my_class() and member_id = my_member() and (count = 1 or is_teacher()));
drop policy if exists "fives delete" on fives;
create policy "fives delete" on fives for delete to authenticated using (class_id = my_class() and (member_id = my_member() or is_teacher()));

-- Бортовой журнал: каждый перегон, который прошёл поезд
create table if not exists train_legs (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade default my_class(),
  idx int not null,              -- номер станции прибытия
  station_name text not null,
  station_emoji text not null default '',
  reward text not null default '',
  pushed boolean not null default false,   -- true: «дотолкали», награда не получена
  fives_total int not null default 0,
  arrived_at timestamptz not null default now()
);
create index if not exists legs_class_idx on train_legs(class_id, idx);
alter table train_legs enable row level security;
drop policy if exists "legs read" on train_legs;
create policy "legs read" on train_legs for select to authenticated using (class_id = my_class());
drop policy if exists "legs teacher write" on train_legs;
create policy "legs teacher write" on train_legs for all to authenticated using (class_id = my_class() and is_teacher()) with check (class_id = my_class() and is_teacher());

-- ---------- Ящик тревог (анонимный) ----------
-- Таблица worries видна ТОЛЬКО автору. Учитель читает письма через teacher_inbox(),
-- которая НЕ возвращает автора. Отвечает только через teacher_reply().
create table if not exists worries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade default my_class(),
  author_id uuid not null references members(id) on delete cascade default my_member(),
  text text not null check (char_length(text) between 3 and 1500),
  mood text not null default 'cloud',
  size int not null default 1 check (size between 1 and 3),
  created_at timestamptz not null default now(),
  reply text,
  replied_at timestamptz
);
create index if not exists worries_class_idx on worries(class_id);
alter table worries enable row level security;
drop policy if exists "worries own read" on worries;
create policy "worries own read" on worries for select to authenticated using (author_id = my_member());
drop policy if exists "worries own insert" on worries;
create policy "worries own insert" on worries for insert to authenticated with check (class_id = my_class() and author_id = my_member());
drop policy if exists "worries own delete" on worries;
create policy "worries own delete" on worries for delete to authenticated using (author_id = my_member());

create or replace function teacher_inbox()
returns table (id uuid, text text, mood text, size int, day date, reply text, replied_at timestamptz)
language sql security definer stable set search_path = public as $$
  select w.id, w.text, w.mood, w.size, w.created_at::date, w.reply, w.replied_at
  from worries w
  where is_teacher() and w.class_id = my_class()
  order by (w.reply is not null), md5(w.id::text);   -- порядок «перемешан», чтобы по нему нельзя было угадать автора
$$;
create or replace function teacher_reply(worry_id uuid, answer text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  update worries set reply = answer, replied_at = now() where id = worry_id and class_id = my_class();
end $$;

-- ---------- Для скрипта наполнения (только service_role) ----------
create or replace function admin_create_class(p_user uuid, p_school text, p_name text, p_password text, p_teacher text, p_stations jsonb, p_slug text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select _make_class(p_user, p_school, p_name, p_password, p_teacher, p_stations, p_slug);
$$;

-- ---------- Права ----------
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function class_info(text, text) to anon, authenticated;
grant execute on function create_class(text, text, text, text, jsonb), join_class(text, text, uuid, text), my_profile(),
  class_update(text, text), change_class_password(text), roster_add(text[]), member_remove(uuid),
  teacher_inbox(), teacher_reply(uuid, text), class_roster(), my_member(), my_class(), is_teacher() to authenticated;
revoke all on all tables in schema public from anon;
revoke all on classes, class_fail from authenticated;
