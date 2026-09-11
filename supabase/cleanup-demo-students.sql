-- Optional: remove demo / incomplete records from Supabase
-- Keeps Student 1 and availability you added yourself

delete from public.appointments
where email in (
  'juan@example.com',
  'maria@example.com',
  'john@example.com',
  'angela@example.com'
)
or student_name in (
  'Juan Dela Cruz',
  'Maria Santos',
  'John Reyes',
  'Angela Garcia'
);

delete from public.profiles
where role = 'student'
  and lower(coalesce(full_name, '')) <> 'student 1'
  and (
    coalesce(trim(full_name), '') = ''
    or student_id is null
    or trim(student_id) = ''
    or email like '%@example.com'
  );

delete from public.availability
where counselor_id is null;

delete from public.appointments
where email in (
  'juan@example.com',
  'maria@example.com',
  'john@example.com',
  'angela@example.com'
)
or student_name in (
  'Juan Dela Cruz',
  'Maria Santos',
  'John Reyes',
  'Angela Garcia'
);

delete from public.profiles
where role = 'student'
  and lower(coalesce(full_name, '')) <> 'student 1'
  and (
    coalesce(trim(full_name), '') = ''
    or student_id is null
    or trim(student_id) = ''
    or email like '%@example.com'
  );
