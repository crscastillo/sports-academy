-- Transport (bus vs. own) is one choice per player per matchday, not per game —
-- a player called up to more than one match on the same matchday shouldn't be
-- asked (or counted) twice.
create table public.matchday_transport (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade default public.current_academy_id(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  transport public.transport_mode,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (matchday_id, player_id)
);

create index on public.matchday_transport (matchday_id);
create index on public.matchday_transport (academy_id);

alter table public.matchday_transport enable row level security;
create policy "staff full access" on public.matchday_transport
  for all to authenticated using (academy_id = public.current_academy_id()) with check (academy_id = public.current_academy_id());

-- Backfill one row per player per matchday from their most recently answered callup.
insert into public.matchday_transport (academy_id, matchday_id, player_id, transport, responded_at)
select distinct on (md.id, c.player_id)
  md.academy_id, md.id, c.player_id, c.transport, c.responded_at
from public.callups c
join public.matches m on m.id = c.match_id
join public.matchdays md on md.id = m.matchday_id
where c.transport is not null
order by md.id, c.player_id, c.responded_at desc nulls last;

alter table public.callups drop column transport;

-- Guest call-up page now returns a matchday-wide `players` list (one entry per
-- called-up player, with their single transport choice) alongside per-match callups.
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
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id', p.id,
        'player_name', p.first_name || ' ' || p.last_name,
        'jersey_number', p.jersey_number,
        'transport', mt.transport
      ) order by p.last_name, p.first_name)
      from (
        select distinct c.player_id from public.callups c
        join public.matches m on m.id = c.match_id
        where m.matchday_id = md.id
      ) called
      join public.players p on p.id = called.player_id
      left join public.matchday_transport mt on mt.matchday_id = md.id and mt.player_id = p.id
    ), '[]'::jsonb),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'opponent', m.opponent, 'start_time', m.start_time,
        'court', m.court,
        'team', jsonb_build_object('name', t.name, 'category', t.category, 'gender', t.gender),
        'callups', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id,
            'player_id', c.player_id,
            'player_name', p.first_name || ' ' || p.last_name,
            'jersey_number', p.jersey_number,
            'status', c.status
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

-- Attendance response no longer carries transport (signature changed, so drop first).
drop function if exists public.guest_respond_callup(uuid, uuid, public.callup_status, public.transport_mode, text);

create function public.guest_respond_callup(
  p_token uuid,
  p_callup_id uuid,
  p_status public.callup_status,
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

revoke all on function public.guest_respond_callup(uuid, uuid, public.callup_status, text) from public;
grant execute on function public.guest_respond_callup(uuid, uuid, public.callup_status, text) to anon, authenticated;

-- One transport vote per player per matchday. Verifies the player is actually
-- called up somewhere in this matchday before accepting the guest's answer.
create or replace function public.guest_set_transport(
  p_token uuid,
  p_player_id uuid,
  p_transport public.transport_mode
)
returns boolean
language plpgsql volatile security definer set search_path = public
as $$
declare md public.matchdays;
begin
  select * into md from public.matchdays where share_token = p_token;
  if md.id is null then return false; end if;

  if not exists (
    select 1 from public.callups c
    join public.matches m on m.id = c.match_id
    where m.matchday_id = md.id and c.player_id = p_player_id
  ) then
    return false;
  end if;

  insert into public.matchday_transport (academy_id, matchday_id, player_id, transport, responded_at)
  values (md.academy_id, md.id, p_player_id, p_transport, now())
  on conflict (matchday_id, player_id) do update set transport = excluded.transport, responded_at = excluded.responded_at;

  return true;
end;
$$;

revoke all on function public.guest_set_transport(uuid, uuid, public.transport_mode) from public;
grant execute on function public.guest_set_transport(uuid, uuid, public.transport_mode) to anon, authenticated;
