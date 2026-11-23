-- Limpeza manual de grupos (SQL Editor — use como dono do projeto)
-- Opcional: rode antes supabase/migrations/009_communities_delete_set_null.sql
-- para apagar grupo pelo Table Editor sem erro de FK em profiles.
--
-- Se der erro de FK ao apagar no painel:
--   1) update profiles set active_community_id = null where active_community_id = 'GROUP_ID';
--   2) delete from check_ins where community_id = 'GROUP_ID';  (se houver registros)
--   3) apague a linha em communities

-- 1) Seu user id
select id as user_id, email
from auth.users
where email = 'SEU_EMAIL@exemplo.com';

-- 2) Grupos que VOCÊ criou (com contagem)
select
  c.id,
  c.name,
  c.invite_code,
  c.created_at,
  (select count(*) from public.community_members cm where cm.community_id = c.id) as membros,
  (select count(*) from public.check_ins ci where ci.community_id = c.id) as registros
from public.communities c
where c.created_by = 'COLE_SEU_USER_ID_AQUI'
order by c.created_at desc;

-- 3) Candidatos a apagar: só você, zero registros (testes quebrados)
select c.id, c.name, c.invite_code, c.created_at
from public.communities c
where c.created_by = 'COLE_SEU_USER_ID_AQUI'
  and not exists (select 1 from public.check_ins ci where ci.community_id = c.id)
  and not exists (
    select 1 from public.community_members cm
    where cm.community_id = c.id and cm.user_id <> c.created_by
  );

-- 4) Apagar UM grupo (troque GROUP_ID). Rode dentro de uma transação.
begin;

-- id do grupo a remover
-- delete from public.check_ins where community_id = 'GROUP_ID';
update public.profiles
set active_community_id = null
where active_community_id = 'GROUP_ID';

delete from public.communities
where id = 'GROUP_ID'
  and created_by = 'COLE_SEU_USER_ID_AQUI'; -- só apaga se for seu

commit;

-- 5) Apagar VÁRIOS grupos vazios seus de uma vez (sem check-ins, sem outros membros)
begin;

with doomed as (
  select c.id
  from public.communities c
  where c.created_by = 'COLE_SEU_USER_ID_AQUI'
    and not exists (select 1 from public.check_ins ci where ci.community_id = c.id)
    and not exists (
      select 1 from public.community_members cm
      where cm.community_id = c.id and cm.user_id <> c.created_by
    )
)
update public.profiles p
set active_community_id = null
where p.active_community_id in (select id from doomed);

with doomed as (
  select c.id
  from public.communities c
  where c.created_by = 'COLE_SEU_USER_ID_AQUI'
    and not exists (select 1 from public.check_ins ci where ci.community_id = c.id)
    and not exists (
      select 1 from public.community_members cm
      where cm.community_id = c.id and cm.user_id <> c.created_by
    )
)
delete from public.communities c
where c.id in (select id from doomed);

commit;

-- NÃO apague o CIRCULO1 se a galera ainda usa:
-- id '00000000-0000-4000-8000-000000000010'
