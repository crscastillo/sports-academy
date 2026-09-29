-- How many category brackets below/above a player's age (achieved this calendar year)
-- they may be assigned to. Max is nullable: null means no upper bound.
alter table public.academies add column age_eligibility_min integer not null default 1;
alter table public.academies add column age_eligibility_max integer;

alter table public.academies add constraint academies_age_eligibility_min_check check (age_eligibility_min >= 0);
alter table public.academies add constraint academies_age_eligibility_max_check check (age_eligibility_max is null or age_eligibility_max >= 0);
