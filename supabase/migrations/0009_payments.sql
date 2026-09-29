-- Monthly academy fee tracking, with a waiver status for exempted players.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  player_id uuid not null references public.players(id) on delete cascade,
  period date not null, -- first day of the month, e.g. 2026-09-01
  amount numeric(10,2),
  status text not null default 'pending' check (status in ('pending', 'paid', 'waived')),
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (player_id, period)
);

create index on public.payments (academy_id);
create index on public.payments (period);

alter table public.payments enable row level security;
create policy "staff full access" on public.payments
  for all to authenticated using (academy_id = public.current_academy_id()) with check (academy_id = public.current_academy_id());

-- Optional default fee so monthly generation doesn't require retyping the amount.
alter table public.academies add column default_monthly_fee numeric(10,2);

-- Some academies track payments in an external system; this is opt-in, off by default.
alter table public.academies add column track_payments boolean not null default false;
