-- Let an academy choose its own slug at registration and change it later from
-- Settings, instead of only ever getting the auto-generated name+id one.

create or replace function public.is_valid_slug(p_slug text)
returns boolean
language sql immutable
as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and length(p_slug) between 3 and 40
    and p_slug not in ('login', 'auth', 'a', 'c', 'd', 'en');
$$;

create or replace function public.create_academy(p_academy_name text, p_full_name text default null, p_slug text default null)
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

  if coalesce(trim(p_slug), '') = '' then
    v_slug := trim(both '-' from regexp_replace(lower(trim(p_academy_name)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(v_id::text, 1, 6);
  else
    v_slug := lower(trim(p_slug));
    if not public.is_valid_slug(v_slug) then
      raise exception 'invalid slug';
    end if;
  end if;

  insert into public.academies (id, name, slug) values (v_id, trim(p_academy_name), v_slug);
  insert into public.staff (email, full_name, academy_id) values (v_email, nullif(trim(coalesce(p_full_name, '')), ''), v_id);

  return v_id;
end;
$$;

-- Slug changes go through a dedicated RPC (rather than a plain table update)
-- so both the create-time and change-later paths share one validation rule.
create or replace function public.update_academy_slug(p_slug text)
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_academy_id uuid := public.current_academy_id();
  v_slug text := lower(trim(p_slug));
begin
  if v_academy_id is null then
    raise exception 'not authorized';
  end if;
  if not public.is_valid_slug(v_slug) then
    raise exception 'invalid slug';
  end if;

  update public.academies set slug = v_slug where id = v_academy_id;
end;
$$;
