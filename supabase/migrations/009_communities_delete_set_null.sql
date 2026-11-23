-- Ao apagar um grupo, perfis deixam de apontar para ele (Table Editor / DELETE funciona)
alter table public.profiles
  drop constraint if exists profiles_active_community_id_fkey;

alter table public.profiles
  add constraint profiles_active_community_id_fkey
  foreign key (active_community_id)
  references public.communities (id)
  on delete set null;
