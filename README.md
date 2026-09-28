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
- **Staff** — email allow-list; staff sign in with a magic link.

## Architecture

- Staff-only tables are protected by RLS (`public.is_staff()` checks the JWT email against `public.staff`).
- Guests never read tables directly; share links call `SECURITY DEFINER` functions scoped by an unguessable token (`guest_get_callups`, `guest_respond_callup`, `guest_get_donation_list`, `guest_pledge_donation`). Guests only see player name and jersey number.
- Schema: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

## Setup

1. Create a Supabase project and run the migration (SQL editor or `supabase db push`).
2. Edit the last statement of the migration (or insert into `public.staff`) to register the first admin email.
3. Supabase → Authentication → URL Configuration: set **Site URL** to your deployment URL and add `https://<your-domain>/auth/callback` to **Redirect URLs**.
4. Env vars (`.env.local` / Vercel):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
   ```

5. `npm install && npm run dev`
