-- Run this in Supabase SQL Editor
-- 1) Lets logged-in users create their own profile if it is missing
-- 2) Creates the student profile for bhasilcordova@gmail.com

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

insert into public.profiles (id, email, full_name, role, student_id, year_level)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  'student',
  raw_user_meta_data ->> 'student_id',
  raw_user_meta_data ->> 'year_level'
from auth.users
where email = 'bhasilcordova@gmail.com'
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
  role = 'student',
  student_id = coalesce(excluded.student_id, public.profiles.student_id),
  year_level = coalesce(excluded.year_level, public.profiles.year_level);
