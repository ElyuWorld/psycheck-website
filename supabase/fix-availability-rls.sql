-- Fix counselor availability inserts blocked by RLS
-- Run this in Supabase SQL Editor, then try + Add Availability again

grant execute on function public.current_user_role() to authenticated;

update public.profiles
set role = 'counselor'
where email in ('counselor1@psycheck.com', 'counsellor1@psycheck.com')
  and role is distinct from 'admin';

drop policy if exists "Staff can insert availability" on public.availability;
create policy "Staff can insert availability"
  on public.availability for insert
  to authenticated
  with check (
    counselor_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('counselor', 'admin')
    )
  );

drop policy if exists "Staff can update availability" on public.availability;
create policy "Staff can update availability"
  on public.availability for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('counselor', 'admin')
    )
  );

drop policy if exists "Staff can delete availability" on public.availability;
create policy "Staff can delete availability"
  on public.availability for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('counselor', 'admin')
    )
  );
