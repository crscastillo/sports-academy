-- Sports Academy: initial schema
-- Multi-tenant: every academy is isolated. Registering creates an academy and
-- makes the registering user its first staff member (see create_academy()).
-- Staff (admins) sign in with Supabase Auth. Guests (parents) use share links
-- that call SECURITY DEFINER functions, so they never read tables directly.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Academies (tenants) & staff
-- ---------------------------------------------------------------------------
create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_academy_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select academy_id from public.staff
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_academy_id() is not null;
$$;

create table public.staff (
  email text primary key,
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  full_name text,
  created_at timestamptz not null default now()
);

-- Creates a new academy and makes the calling (already-authenticated) user
-- its first staff member. Runs as security definer so it can bootstrap the
-- very first staff row, before current_academy_id() has anything to find.
create or replace function public.create_academy(p_academy_name text, p_full_name text default null)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_academy_id uuid;
begin
  if v_email = '' then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.staff where lower(email) = v_email) then
    raise exception 'this account already belongs to an academy';
  end if;
  if coalesce(trim(p_academy_name), '') = '' then
    raise exception 'academy name required';
  end if;

  insert into public.academies (name) values (trim(p_academy_name)) returning id into v_academy_id;
  insert into public.staff (email, full_name, academy_id) values (v_email, nullif(trim(coalesce(p_full_name, '')), ''), v_academy_id);

  return v_academy_id;
end;
$$;

revoke all on function public.create_academy(text, text) from public;
grant execute on function public.create_academy(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Teams & players
-- ---------------------------------------------------------------------------
create type public.team_gender as enum ('male', 'female', 'mixed');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  name text not null,
  category text not null,               -- e.g. U13, U15, Mayor
  gender public.team_gender not null default 'mixed',
  season text,
  coach text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  first_name text not null,
  last_name text not null,
  jersey_number int,
  national_id text,                     -- cédula
  birth_date date,
  gender public.team_gender,
  profile text,                         -- notes / player profile
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  wingspan_cm numeric(5,1),
  positions text[] not null default '{}',
  guardian_name text,
  guardian_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (academy_id, national_id)
);

create table public.team_players (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  created_at timestamptz not null default now(),
  primary key (team_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Trainings (planner + log)
-- ---------------------------------------------------------------------------
create type public.training_status as enum ('planned', 'completed', 'cancelled');

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  date date not null,
  start_time time,
  end_time time,
  location text,
  status public.training_status not null default 'planned',
  plan text,                            -- planned content / drills
  notes text,                           -- what was done
  observations text,                    -- coach observations
  created_at timestamptz not null default now()
);

create table public.training_teams (
  training_id uuid not null references public.trainings(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  primary key (training_id, team_id)
);

-- ---------------------------------------------------------------------------
-- Matchdays, matches, call-ups, transport
-- ---------------------------------------------------------------------------
create table public.matchdays (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  title text,
  date date not null,
  venue text not null,
  address text,
  is_home boolean not null default false,
  notes text,
  share_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  opponent text not null,
  start_time time,
  court text,
  score_for int,
  score_against int,
  notes text,
  created_at timestamptz not null default now()
);

create type public.callup_status as enum ('pending', 'confirmed', 'declined');
create type public.transport_mode as enum ('bus', 'own');

create table public.callups (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status public.callup_status not null default 'pending',
  transport public.transport_mode,
  guest_note text,
  responded_at timestamptz,
  attended boolean,                     -- marked by staff on match day
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table public.bus_trips (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  label text not null default 'Buseta',
  departure_place text,
  departure_time time,
  return_time time,
  capacity int,
  driver text,
  driver_phone text,
  cost numeric(10,2),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Donations / sales lists (home matchdays)
-- ---------------------------------------------------------------------------
create type public.donation_kind as enum ('snack_bar', 'sale', 'other');

create table public.donation_lists (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  matchday_id uuid references public.matchdays(id) on delete set null,
  title text not null,
  description text,
  is_open boolean not null default true,
  share_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.donation_items (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  list_id uuid not null references public.donation_lists(id) on delete cascade,
  name text not null,
  kind public.donation_kind not null default 'snack_bar',
  quantity_needed int not null default 1,
  unit text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.donation_pledges (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  item_id uuid not null references public.donation_items(id) on delete cascade,
  parent_name text not null,
  player_name text,
  phone text,
  quantity int not null default 1 check (quantity > 0),
  note text,
  created_at timestamptz not null default now()
);

-- Indexes
create index on public.staff (academy_id);
create index on public.teams (academy_id);
create index on public.players (academy_id);
create index on public.team_players (player_id);
create index on public.training_teams (team_id);
create index on public.trainings (academy_id);
create index on public.trainings (date);
create index on public.matchdays (academy_id);
create index on public.matchdays (date);
create index on public.matches (matchday_id);
create index on public.matches (team_id);
create index on public.callups (player_id);
create index on public.bus_trips (matchday_id);
create index on public.donation_lists (matchday_id);
create index on public.donation_items (list_id);
create index on public.donation_pledges (item_id);

-- ---------------------------------------------------------------------------
-- RLS: staff can only see/change rows in their own academy
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'staff','teams','players','team_players','trainings','training_teams',
    'matchdays','matches','callups','bus_trips',
    'donation_lists','donation_items','donation_pledges'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "staff full access" on public.%I for all to authenticated using (academy_id = public.current_academy_id()) with check (academy_id = public.current_academy_id())',
      t
    );
  end loop;
end $$;

alter table public.academies enable row level security;
create policy "staff can read own academy" on public.academies
  for select to authenticated using (id = public.current_academy_id());

-- ---------------------------------------------------------------------------
-- Guest functions (share links)
-- ---------------------------------------------------------------------------

-- Call-up page: matchday + matches + called-up players (name & number only)
create or replace function public.guest_get_callups(p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare md public.matchdays;
begin
  select * into md from public.matchdays where share_token = p_token;
  if md.id is null then return null; end if;

  return jsonb_build_object(
    'matchday', jsonb_build_object(
      'title', md.title, 'date', md.date, 'venue', md.venue,
      'address', md.address, 'is_home', md.is_home, 'notes', md.notes
    ),
    'bus_trips', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', b.label, 'departure_place', b.departure_place,
        'departure_time', b.departure_time, 'return_time', b.return_time
      ) order by b.departure_time)
      from public.bus_trips b where b.matchday_id = md.id
    ), '[]'::jsonb),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'opponent', m.opponent, 'start_time', m.start_time,
        'court', m.court,
        'team', jsonb_build_object('name', t.name, 'category', t.category, 'gender', t.gender),
        'callups', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id,
            'player_name', p.first_name || ' ' || p.last_name,
            'jersey_number', p.jersey_number,
            'status', c.status, 'transport', c.transport
          ) order by p.last_name, p.first_name)
          from public.callups c join public.players p on p.id = c.player_id
          where c.match_id = m.id
        ), '[]'::jsonb)
      ) order by m.start_time nulls last)
      from public.matches m join public.teams t on t.id = m.team_id
      where m.matchday_id = md.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.guest_respond_callup(
  p_token uuid,
  p_callup_id uuid,
  p_status public.callup_status,
  p_transport public.transport_mode,
  p_note text default null
)
returns boolean
language plpgsql volatile security definer set search_path = public
as $$
declare ok boolean;
begin
  if p_status not in ('confirmed', 'declined') then
    raise exception 'invalid status';
  end if;

  update public.callups c
     set status = p_status,
         transport = case when p_status = 'confirmed' then p_transport else null end,
         guest_note = left(p_note, 500),
         responded_at = now()
    from public.matches m, public.matchdays md
   where c.id = p_callup_id
     and m.id = c.match_id
     and md.id = m.matchday_id
     and md.share_token = p_token
  returning true into ok;

  return coalesce(ok, false);
end;
$$;

-- Donation list page
create or replace function public.guest_get_donation_list(p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare dl public.donation_lists;
begin
  select * into dl from public.donation_lists where share_token = p_token;
  if dl.id is null then return null; end if;

  return jsonb_build_object(
    'list', jsonb_build_object(
      'title', dl.title, 'description', dl.description, 'is_open', dl.is_open
    ),
    'matchday', (
      select jsonb_build_object('date', md.date, 'venue', md.venue, 'address', md.address)
      from public.matchdays md where md.id = dl.matchday_id
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.name, 'kind', i.kind,
        'quantity_needed', i.quantity_needed, 'unit', i.unit, 'notes', i.notes,
        'pledged', coalesce((select sum(dp.quantity) from public.donation_pledges dp where dp.item_id = i.id), 0),
        'pledges', coalesce((
          select jsonb_agg(jsonb_build_object(
            'parent_name', dp.parent_name, 'player_name', dp.player_name, 'quantity', dp.quantity
          ) order by dp.created_at)
          from public.donation_pledges dp where dp.item_id = i.id
        ), '[]'::jsonb)
      ) order by i.kind, i.sort_order, i.name)
      from public.donation_items i where i.list_id = dl.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.guest_pledge_donation(
  p_token uuid,
  p_item_id uuid,
  p_parent_name text,
  p_player_name text,
  p_phone text,
  p_quantity int,
  p_note text default null
)
returns boolean
language plpgsql volatile security definer set search_path = public
as $$
declare v_item uuid;
    v_academy_id uuid;
begin
  if coalesce(trim(p_parent_name), '') = '' then
    raise exception 'name required';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 1000 then
    raise exception 'invalid quantity';
  end if;

  select i.id, i.academy_id into v_item, v_academy_id
    from public.donation_items i
    join public.donation_lists dl on dl.id = i.list_id
   where i.id = p_item_id and dl.share_token = p_token and dl.is_open;

  if v_item is null then return false; end if;

  insert into public.donation_pledges (item_id, academy_id, parent_name, player_name, phone, quantity, note)
  values (v_item, v_academy_id, left(trim(p_parent_name), 120), left(p_player_name, 120),
          left(p_phone, 40), p_quantity, left(p_note, 500));
  return true;
end;
$$;

revoke all on function public.guest_get_callups(uuid) from public;
revoke all on function public.guest_respond_callup(uuid, uuid, public.callup_status, public.transport_mode, text) from public;
revoke all on function public.guest_get_donation_list(uuid) from public;
revoke all on function public.guest_pledge_donation(uuid, uuid, text, text, text, int, text) from public;

grant execute on function public.guest_get_callups(uuid) to anon, authenticated;
grant execute on function public.guest_respond_callup(uuid, uuid, public.callup_status, public.transport_mode, text) to anon, authenticated;
grant execute on function public.guest_get_donation_list(uuid) to anon, authenticated;
grant execute on function public.guest_pledge_donation(uuid, uuid, text, text, text, int, text) to anon, authenticated;
