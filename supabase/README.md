# PsyCheck + Supabase setup

## 1. Create a Supabase project
1. Go to https://supabase.com and create a project
2. Open **Project Settings → API**
3. Copy **Project URL** and **anon public** key

## 2. Add environment variables
1. Copy `.env.local.example` to `.env.local`
2. Paste your URL and anon key

```bash
cp .env.local.example .env.local
```

## 3. Create the database tables
1. In Supabase, open **SQL Editor**
2. Paste and run the contents of `supabase/schema.sql`

This creates:
- `profiles` — user roles (student / counselor / admin)
- `availability` — counselor schedule slots
- `appointments` — student booking requests
- Row Level Security policies
- Demo seed data

## 4. Create demo login users
In Supabase go to **Authentication → Users → Add user** and create:

| Email | Password | Role to set |
|-------|----------|-------------|
| student@psycheck.com | psycheck1234 | student |
| counselor@psycheck.com | psycheck1234 | counselor |
| admin@psycheck.com | psycheck1234 | admin |

After creating each user, run this in SQL Editor (adjust roles as needed):

```sql
update public.profiles
set role = 'student'
where email = 'student@psycheck.com';

update public.profiles
set role = 'counselor'
where email = 'counselor@psycheck.com';

update public.profiles
set role = 'admin'
where email = 'admin@psycheck.com';
```

Tip: In **Authentication → Providers → Email**, you can turn off
**Confirm email** while developing so logins and registration work immediately.

## Registration

Students can open `/login` → **Register** to create an account.
Registered students are stored in `profiles` and shown in Admin → **Students**.

If you already ran an older schema, also run
`supabase/update-registration-trigger.sql` so student ID / year level
are saved on signup.


## 5. Run the app
```bash
npm run dev
```

Open http://localhost:3000

- Students log in → booking form saves to `appointments`
- Counselor/Admin log in → admin dashboard reads/writes Supabase

## Appointment approval emails

When an admin sets an appointment status to **Confirmed**, PsyCheck sends a
no-reply email to the student's registered address.

Add these to `.env.local` (Gmail example):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM="PsyCheck No-Reply <yourgmail@gmail.com>"
```

Gmail setup:
1. Turn on 2-Step Verification
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Paste that password into `SMTP_PASS`
4. Restart `npm run dev`

