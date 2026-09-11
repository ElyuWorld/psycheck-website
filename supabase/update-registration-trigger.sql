-- Run this in Supabase SQL Editor if you already applied the older schema.sql
-- Updates the signup trigger so student registration saves student_id + year_level

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, student_id, year_level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    new.raw_user_meta_data ->> 'student_id',
    new.raw_user_meta_data ->> 'year_level'
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role),
    student_id = coalesce(excluded.student_id, public.profiles.student_id),
    year_level = coalesce(excluded.year_level, public.profiles.year_level);

  return new;
end;
$$;
