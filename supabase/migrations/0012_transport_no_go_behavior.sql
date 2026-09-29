-- "No voy" (no_go) is a matchday-wide transport choice that also declines every
-- match the player is called up to that day.
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

  if p_transport = 'no_go' then
    update public.callups c
       set status = 'declined', responded_at = now()
      from public.matches m
     where c.match_id = m.id
       and m.matchday_id = md.id
       and c.player_id = p_player_id;
  end if;

  return true;
end;
$$;

-- If a specific match's response gets overwritten after "no voy" was chosen, the
-- blanket no-go no longer reflects reality — clear it so the parent re-answers.
create or replace function public.guest_respond_callup(
  p_token uuid,
  p_callup_id uuid,
  p_status public.callup_status,
  p_note text default null
)
returns boolean
language plpgsql volatile security definer set search_path = public
as $$
declare ok boolean; v_player_id uuid; v_matchday_id uuid;
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
  returning true, c.player_id, m.matchday_id into ok, v_player_id, v_matchday_id;

  if ok then
    update public.matchday_transport
       set transport = null
     where matchday_id = v_matchday_id
       and player_id = v_player_id
       and transport = 'no_go';
  end if;

  return coalesce(ok, false);
end;
$$;
