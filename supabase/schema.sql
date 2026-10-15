-- ============================================================
--  Наш класс · Гимназия №70 — схема базы (Supabase / Postgres)
--  Вставьте целиком в Supabase → SQL Editor → Run.
--  Можно запускать повторно.
-- ============================================================

-- ---------- Профили (логин, имя, роль) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login text unique not null,
  name text not null,
  role text not null default 'student' check (role in ('student','teacher')),
  avatar text not null default '🐥'
);

create or replace function is_teacher() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher');
$$;

alter table profiles enable row level security;
drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update to authenticated using (id = auth.uid());
-- менять можно только аватар (роль и имя — нельзя)
revoke update on profiles from authenticated;
grant update (avatar) on profiles to authenticated;

-- ---------- Сад добрых дел ----------
create table if not exists deeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  tree text not null,
  title text not null check (char_length(title) between 3 and 140),
  created_at timestamptz not null default now()
);
alter table deeds enable row level security;
drop policy if exists "deeds read" on deeds;
create policy "deeds read" on deeds for select to authenticated using (true);
drop policy if exists "deeds insert" on deeds;
create policy "deeds insert" on deeds for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "deeds delete" on deeds;
create policy "deeds delete" on deeds for delete to authenticated using (user_id = auth.uid() or is_teacher());

-- ---------- Книжная полка ----------
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 120),
  author text not null default '',
  genre text not null default 'Другое',
  stars int not null default 5 check (stars between 1 and 5),
  review text not null check (char_length(review) between 5 and 800),
  color text not null default '#ff6b6b',
  created_at timestamptz not null default now()
);
alter table books enable row level security;
drop policy if exists "books read" on books;
create policy "books read" on books for select to authenticated using (true);
drop policy if exists "books insert" on books;
create policy "books insert" on books for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "books delete" on books;
create policy "books delete" on books for delete to authenticated using (user_id = auth.uid() or is_teacher());

-- ---------- Поезд класса ----------
create table if not exists train_meta (
  id int primary key default 1 check (id = 1),
  station_idx int not null default 0,
  fives_goal int not null default 60,
  acts_goal int not null default 20,
  rewards jsonb not null default '{}'::jsonb
);
insert into train_meta (id) values (1) on conflict do nothing;
alter table train_meta enable row level security;
drop policy if exists "meta read" on train_meta;
create policy "meta read" on train_meta for select to authenticated using (true);
drop policy if exists "meta teacher update" on train_meta;
create policy "meta teacher update" on train_meta for update to authenticated using (is_teacher());

create table if not exists fives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  week_idx int not null,
  subject text not null default '',
  count int not null default 1 check (count between 1 and 30),
  created_at timestamptz not null default now()
);
alter table fives enable row level security;
drop policy if exists "fives read" on fives;
create policy "fives read" on fives for select to authenticated using (true);
drop policy if exists "fives insert" on fives;
create policy "fives insert" on fives for insert to authenticated
  with check (user_id = auth.uid() and (count = 1 or is_teacher()));
drop policy if exists "fives delete" on fives;
create policy "fives delete" on fives for delete to authenticated using (user_id = auth.uid() or is_teacher());

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  week_idx int not null,
  title text not null check (char_length(title) between 2 and 140),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table tasks enable row level security;
drop policy if exists "tasks read" on tasks;
create policy "tasks read" on tasks for select to authenticated using (true);
drop policy if exists "tasks teacher write" on tasks;
create policy "tasks teacher write" on tasks for all to authenticated using (is_teacher()) with check (is_teacher());

-- ---------- Ящик тревог (анонимный) ----------
-- Таблица worries видна ТОЛЬКО автору. Учитель читает письма
-- через функцию teacher_inbox(), которая НЕ возвращает автора.
create table if not exists worries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  text text not null check (char_length(text) between 3 and 1500),
  mood text not null default 'cloud',
  size int not null default 1 check (size between 1 and 3),
  created_at timestamptz not null default now(),
  reply text,
  replied_at timestamptz
);
alter table worries enable row level security;
drop policy if exists "worries own read" on worries;
create policy "worries own read" on worries for select to authenticated using (author_id = auth.uid());
drop policy if exists "worries own insert" on worries;
create policy "worries own insert" on worries for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "worries own delete" on worries;
create policy "worries own delete" on worries for delete to authenticated using (author_id = auth.uid());
-- UPDATE/DELETE учителю напрямую запрещены; отвечает он только через teacher_reply()

create or replace function teacher_inbox()
returns table (id uuid, text text, mood text, size int, day date, reply text, replied_at timestamptz)
language sql security definer set search_path = public stable as $$
  select w.id, w.text, w.mood, w.size, w.created_at::date, w.reply, w.replied_at
  from worries w
  where is_teacher()
  -- порядок: сначала без ответа, внутри — «перемешанный» стабильно, чтобы по порядку нельзя было угадать автора
  order by (w.reply is not null), md5(w.id::text);
$$;

create or replace function teacher_reply(worry_id uuid, answer text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  update worries set reply = answer, replied_at = now() where id = worry_id;
end $$;

revoke all on function teacher_inbox() from public, anon;
revoke all on function teacher_reply(uuid, text) from public, anon;
grant execute on function teacher_inbox() to authenticated;
grant execute on function teacher_reply(uuid, text) to authenticated;
