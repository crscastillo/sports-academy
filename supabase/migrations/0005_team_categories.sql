-- Categories are now a fixed, age-based list instead of free text.
-- Existing rows already fall within the new set once trimmed; normalize just in case.
update public.teams set category = trim(category) where category <> trim(category);

alter table public.teams
  add constraint teams_category_check check (category in (
    'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'U22', 'U23', 'U24',
    'Juegos Nacionales', '2da', '1era', 'Master'
  ));
