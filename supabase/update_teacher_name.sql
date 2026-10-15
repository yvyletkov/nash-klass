-- Добавляет возможность менять имя учителя и сразу ставит имя «Вылеткова Т.К.» в классе 6А.
create or replace function teacher_rename(p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then raise exception 'only teacher'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Введите имя'; end if;
  update members set name = trim(p_name) where user_id = auth.uid() and role = 'teacher';
end $$;

revoke all on function teacher_rename(text) from public, anon;
grant execute on function teacher_rename(text) to authenticated;

update members set name = U&'\0412\044B\043B\0435\0442\043A\043E\0432\0430 \0422.\041A.'
where role = 'teacher' and class_id = (select id from classes where slug = 'cadecec8973');
