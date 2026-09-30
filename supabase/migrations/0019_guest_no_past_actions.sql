-- Guests shouldn't be able to respond to call-ups or set transport for a
-- matchday that has already happened. Enforced here (not just client-side)
-- since these are security-definer RPCs callable directly by anon.

create or replace function public.guest_respond_callup(
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
     and md.date >= current_date
  returning true into ok;

  return coalesce(ok, false);
end;
$$;

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
  if md.date < current_date then return false; end if;

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
