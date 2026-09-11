-- Fix student booking inserts blocked by RLS
-- Run this in Supabase SQL Editor, then try Request Appointment again

grant execute on function public.current_user_role() to authenticated;

update public.profiles
set role = 'student'
where email = 'bhasilcordova@gmail.com';

drop policy if exists "Students can create appointments" on public.appointments;
create policy "Students can create appointments"
  on public.appointments for insert
  to authenticated
  with check (
    student_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'student'
    )
  );

drop policy if exists "Students can read own appointments" on public.appointments;
create policy "Students can read own appointments"
  on public.appointments for select
  to authenticated
  using (
    student_user_id = auth.uid()
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('counselor', 'admin')
    )
  );

drop policy if exists "Staff can update appointments" on public.appointments;
create policy "Staff can update appointments"
  on public.appointments for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('counselor', 'admin')
    )
  );
