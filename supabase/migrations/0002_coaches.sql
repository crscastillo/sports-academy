-- Coaches: a proper record per coach (instead of a free-text name on teams),
-- with an optional email that can later be used to invite them as staff.

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (academy_id, email)
);

create index on public.coaches (academy_id);

alter table public.coaches enable row level security;
create policy "staff full access" on public.coaches
  for all to authenticated using (academy_id = public.current_academy_id()) with check (academy_id = public.current_academy_id());

-- Link teams to a coach record instead of a free-text name.
alter table public.teams add column coach_id uuid references public.coaches(id) on delete set null;

-- Backfill: one coach record per distinct name already used on a team.
insert into public.coaches (academy_id, full_name)
select distinct academy_id, trim(coach)
from public.teams
where coach is not null and trim(coach) <> '';

update public.teams t
set coach_id = c.id
from public.coaches c
where c.academy_id = t.academy_id
  and t.coach is not null
  and trim(t.coach) <> ''
  and c.full_name = trim(t.coach);

alter table public.teams drop column coach;

-- Let a pre-invited staff member (added via a coach invite, or by another
-- admin) simply join their existing academy instead of erroring when they
-- register, since they already have a staff row waiting for them.
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

  select academy_id into v_academy_id from public.staff where lower(email) = v_email;
  if v_academy_id is not null then
    return v_academy_id;
  end if;

  if coalesce(trim(p_academy_name), '') = '' then
    raise exception 'academy name required';
  end if;

  insert into public.academies (name) values (trim(p_academy_name)) returning id into v_academy_id;
  insert into public.staff (email, full_name, academy_id) values (v_email, nullif(trim(coalesce(p_full_name, '')), ''), v_academy_id);

  return v_academy_id;
end;
$$;
