-- Allow staff to mark appointments as Rescheduled.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'appointments'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format(
      'alter table public.appointments drop constraint %I',
      constraint_name
    );
  end loop;

  alter table public.appointments
    add constraint appointments_status_check
    check (
      status in (
        'Pending',
        'Confirmed',
        'Rescheduled',
        'Completed',
        'Cancelled'
      )
    );
end $$;
