-- Public academy page: a read-only, unauthenticated schedule page at /a/[slug]
-- listing upcoming and past jornadas with results. Staff can toggle it off.

alter table public.academies add column slug text;
alter table public.academies add column is_public boolean not null default true;

-- Backfill: slugify the name and suffix with part of the id to guarantee uniqueness.
update public.academies
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6);

alter table public.academies alter column slug set not null;
alter table public.academies add constraint academies_slug_key unique (slug);
create index on public.academies (slug);

create policy "staff can update own academy" on public.academies
  for update to authenticated using (id = public.current_academy_id()) with check (id = public.current_academy_id());

-- Give a new academy a slug at creation time (id is generated up front so the
-- slug can be derived from it).
create or replace function public.create_academy(p_academy_name text, p_full_name text default null)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_academy_id uuid;
  v_id uuid;
  v_slug text;
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

  v_id := gen_random_uuid();
  v_slug := trim(both '-' from regexp_replace(lower(trim(p_academy_name)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(v_id::text, 1, 6);

  insert into public.academies (id, name, slug) values (v_id, trim(p_academy_name), v_slug);
  insert into public.staff (email, full_name, academy_id) values (v_email, nullif(trim(coalesce(p_full_name, '')), ''), v_id);

  return v_id;
end;
$$;

-- Public schedule: academy name + upcoming/past jornadas with match results.
-- No player names, guardian info or share tokens are exposed.
create or replace function public.guest_get_academy_schedule(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare a public.academies;
begin
  select * into a from public.academies where slug = p_slug;
  if a.id is null or not a.is_public then return null; end if;

  return jsonb_build_object(
    'academy', jsonb_build_object('name', a.name),
    'upcoming', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', md.id, 'title', md.title, 'date', md.date, 'venue', md.venue,
        'address', md.address, 'is_home', md.is_home,
        'matches', coalesce((
          select jsonb_agg(jsonb_build_object(
            'opponent', m.opponent, 'start_time', m.start_time, 'court', m.court,
            'team', jsonb_build_object('name', t.name, 'category', t.category, 'gender', t.gender)
          ) order by m.start_time nulls last)
          from public.matches m join public.teams t on t.id = m.team_id
          where m.matchday_id = md.id
        ), '[]'::jsonb)
      ) order by md.date)
      from public.matchdays md
      where md.academy_id = a.id and md.date >= current_date
    ), '[]'::jsonb),
    'past', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sub.id, 'title', sub.title, 'date', sub.date, 'venue', sub.venue,
        'address', sub.address, 'is_home', sub.is_home, 'matches', sub.matches
      ) order by sub.date desc)
      from (
        select md.id, md.title, md.date, md.venue, md.address, md.is_home,
          coalesce((
            select jsonb_agg(jsonb_build_object(
              'opponent', m.opponent, 'start_time', m.start_time, 'court', m.court,
              'score_for', m.score_for, 'score_against', m.score_against,
              'team', jsonb_build_object('name', t.name, 'category', t.category, 'gender', t.gender)
            ) order by m.start_time nulls last)
            from public.matches m join public.teams t on t.id = m.team_id
            where m.matchday_id = md.id
          ), '[]'::jsonb) as matches
        from public.matchdays md
        where md.academy_id = a.id and md.date < current_date
        order by md.date desc
        limit 20
      ) sub
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.guest_get_academy_schedule(text) from public;
grant execute on function public.guest_get_academy_schedule(text) to anon, authenticated;
