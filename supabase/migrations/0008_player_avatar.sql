alter table public.players add column avatar_url text;

-- Public bucket so avatar URLs can be rendered directly; writes are restricted
-- below to authenticated staff, scoped to their own academy's folder.
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "staff can upload player photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_academy_id()::text);

create policy "staff can update player photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_academy_id()::text)
  with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_academy_id()::text);

create policy "staff can delete player photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_academy_id()::text);
