-- New transport option: "no voy" (not attending at all). Added on its own so the
-- value can safely be referenced by functions defined in a later migration.
alter type public.transport_mode add value if not exists 'no_go';
