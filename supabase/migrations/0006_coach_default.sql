alter table public.coaches add column is_default boolean not null default false;

-- Only one default coach per academy.
create unique index coaches_one_default_per_academy on public.coaches (academy_id) where is_default;
