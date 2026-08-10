-- Restaura Comunidade Círculo Lucas (CIRCULO1) para quem já usava o app.
-- Rode no SQL Editor se a galera perdeu o grupo após o 005 ou backfill restrito.
-- Idempotente: pode rodar mais de uma vez.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_members'
  ) then
    raise exception 'Rode antes o 003_communities.sql.';
  end if;
end $$;

-- 1) Quem já tinha perfil quando o grupo CIRCULO1 foi criado (backfill original)
insert into public.community_members (community_id, user_id)
select c.id, p.id
from public.profiles p
cross join public.communities c
where c.id = '00000000-0000-4000-8000-000000000010'
  and p.created_at <= c.created_at
on conflict do nothing;

-- 2) Quem fez pelo menos um check-in (usou o FéRats antes dos grupos ou no Círculo)
insert into public.community_members (community_id, user_id)
select '00000000-0000-4000-8000-000000000010', p.id
from public.profiles p
where exists (
  select 1 from public.check_ins ci where ci.user_id = p.id
)
on conflict do nothing;

-- 3) Check-ins que já eram do Círculo Lucas
insert into public.community_members (community_id, user_id)
select distinct '00000000-0000-4000-8000-000000000010', ci.user_id
from public.check_ins ci
where ci.community_id = '00000000-0000-4000-8000-000000000010'
on conflict do nothing;

-- Grupo ativo: quem é membro do CIRCULO1 e ainda não tem grupo selecionado
update public.profiles p
set active_community_id = '00000000-0000-4000-8000-000000000010'
where p.active_community_id is null
  and exists (
    select 1
    from public.community_members cm
    where cm.user_id = p.id
      and cm.community_id = '00000000-0000-4000-8000-000000000010'
  );

-- Quem é membro só do CIRCULO1: reativa esse grupo se ficou sem active_community_id
update public.profiles p
set active_community_id = '00000000-0000-4000-8000-000000000010'
from (
  select cm.user_id
  from public.community_members cm
  group by cm.user_id
  having count(*) = 1
     and max(cm.community_id) = '00000000-0000-4000-8000-000000000010'::uuid
) only_circulo
where p.id = only_circulo.user_id
  and p.active_community_id is null;
