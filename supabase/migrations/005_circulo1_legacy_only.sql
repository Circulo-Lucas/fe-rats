-- PRÉ-REQUISITO: migration 003_communities.sql já aplicada (cria communities + community_members).
-- Se você NUNCA rodou o 003: rode só o 003 (versão atual) — não precisa deste arquivo.
-- Use o 005 apenas se já tinha rodado um 003 antigo que colocava todo mundo no CIRCULO1.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_members'
  ) then
    raise exception
      'Tabela public.community_members não existe. No SQL Editor, rode primeiro o arquivo supabase/migrations/003_communities.sql (inteiro). Depois, se precisar, rode este 005.';
  end if;
end $$;

-- Quem entrou depois dos grupos não fica no CIRCULO1 por engano.
-- Legado (perfil criado na hora ou antes da migration 003) permanece no CIRCULO1.

delete from public.community_members cm
using public.profiles p, public.communities c
where cm.user_id = p.id
  and cm.community_id = c.id
  and c.id = '00000000-0000-4000-8000-000000000010'
  and p.created_at > c.created_at;

update public.profiles p
set active_community_id = null
from public.communities c
where p.active_community_id = c.id
  and c.id = '00000000-0000-4000-8000-000000000010'
  and p.created_at > c.created_at
  and not exists (
    select 1 from public.community_members cm
    where cm.user_id = p.id and cm.community_id = c.id
  );

-- Garantir legado com check-ins no CIRCULO1
insert into public.community_members (community_id, user_id)
select c.id, p.id
from public.profiles p
cross join public.communities c
where c.id = '00000000-0000-4000-8000-000000000010'
  and p.created_at <= c.created_at
  and exists (select 1 from public.check_ins ci where ci.user_id = p.id)
on conflict do nothing;

update public.profiles p
set active_community_id = c.id
from public.communities c
where c.id = '00000000-0000-4000-8000-000000000010'
  and p.created_at <= c.created_at
  and p.active_community_id is null
  and exists (
    select 1 from public.community_members cm
    where cm.user_id = p.id and cm.community_id = c.id
  );
