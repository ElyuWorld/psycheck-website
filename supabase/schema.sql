-- PsyCheck database schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- Profiles (linked to Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'student'
    check (role in ('student', 'counselor', 'admin')),
  student_id text,
  year_level text,
  created_at timestamptz not null default now()
);

-- Counselor availability slots
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid references public.profiles (id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  appointment_type text not null,
  mode text not null check (mode in ('Online', 'In-person')),
  created_at timestamptz not null default now()
);

-- Student appointment requests
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid references public.profiles (id) on delete set null,
  student_name text not null,
  student_id text not null,
  email text not null,
  year_level text,
  appointment_type text not null,
  mode text not null default 'In-person'
    check (mode in ('Online', 'In-person')),
  preferred_date date not null,
  preferred_time text not null,
  reason text,
  message text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  meeting_link text default '',
  created_at timestamptz not null default now()
);

create index if not exists appointments_status_idx
  on public.appointments (status);

create index if not exists appointments_preferred_date_idx
  on public.appointments (preferred_date);

create index if not exists availability_date_idx
  on public.availability (date);

-- Auto-create profile when a user signs up
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Helper: current user's role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;

-- Profiles policies
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Staff can read all profiles" on public.profiles;
create policy "Staff can read all profiles"
  on public.profiles for select
  using (public.current_user_role() in ('counselor', 'admin'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

grant execute on function public.current_user_role() to authenticated;

-- Availability policies
drop policy if exists "Anyone authenticated can read availability" on public.availability;
create policy "Anyone authenticated can read availability"
  on public.availability for select
  to authenticated
  using (true);

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

-- Appointments policies
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
