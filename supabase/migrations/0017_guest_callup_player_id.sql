-- The guest matchday page needs to know which player each callup belongs to
-- so it can restrict a parent to responding/setting transport only for their
-- own kids (the GuestMatch type already declared player_id, but the RPC never
-- returned it).

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
    'donation_list', (
      select jsonb_build_object('title', dl.title, 'share_token', dl.share_token)
      from public.donation_lists dl
      where dl.matchday_id = md.id
      order by dl.created_at desc
      limit 1
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
            'player_id', c.player_id,
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
