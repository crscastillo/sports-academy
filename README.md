# Sports Academy

Basketball academy management app — Next.js 16 (App Router) + Supabase. UI in Spanish (Costa Rica).

## Features

- **Teams** — category (U13, U15…), gender (male / female / mixed), season, coach; roster assignment.
- **Players** — name, jersey number, national ID (cédula), birth date, profile, height, weight, wingspan, positions, guardian contact; multi-team membership.
- **Trainings** — weekly planner, teams that trained, plan / notes / coach observations, status, weekly repeat.
- **Matchdays** — date, venue, address, home/away; matches per category; call-ups per match; attendance marking; results.
- **Guest call-up link** (`/c/<token>`) — parents confirm or decline and choose **bus** or **own transport**. No account needed.
- **Bus planning** — bus trips per matchday with capacity; live passenger list from confirmations.
- **Donation lists** (`/d/<token>`) — for home matchdays; admin creates items (snack bar / sales), parents sign up with what they bring.
- **Staff** — email allow-list per academy; staff register or sign in with email + password.
- **Multi-tenant** — registering creates a new academy (tenant) and makes you its first staff member; every table is scoped to your academy.

## Architecture

- Multi-tenant: every business table carries `academy_id`. RLS (`public.current_academy_id()` / `public.is_staff()`) scopes every read/write to the caller's own academy.
- `public.create_academy(name, full_name)` is a `SECURITY DEFINER` RPC that creates a new academy and makes the calling (already-authenticated) user its first staff row — this is what the registration form calls.
- Guests never read tables directly; share links call `SECURITY DEFINER` functions scoped by an unguessable token (`guest_get_callups`, `guest_respond_callup`, `guest_get_donation_list`, `guest_pledge_donation`). Guests only see player name and jersey number.
- Schema: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

## Setup

1. Create a Supabase project and run the migration (SQL editor or `supabase db push`).
2. Supabase → Authentication → Providers → Email: disable "Confirm email" so registration doesn't require a confirmation email (the app relies on the session being returned immediately from sign-up).
3. Supabase → Authentication → URL Configuration: set **Site URL** to your deployment URL and add `https://<your-domain>/auth/callback` to **Redirect URLs**.
4. Env vars (`.env.local` / Vercel):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
   ```

5. `npm install && npm run dev`, then go to `/login?mode=register` to create the first academy.
