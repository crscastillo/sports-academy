alter table public.coaches
  add column type text not null default 'head'
  check (type in ('head', 'assistant', 'young_assistant'));
