-- Coach in charge of a matchday. Any coach type is eligible (head, assistant, or
-- young-division assistant) — the app falls back to the academy's default coach
-- when a matchday has none set explicitly.
alter table public.matchdays add column coach_id uuid references public.coaches(id) on delete set null;

create index on public.matchdays (coach_id);
