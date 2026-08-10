-- Corrige RLS: a policy antiga em community_members impedia ver a própria linha
-- (subquery recursiva), então create_community funcionava mas o app não carregava o grupo/código.

drop policy if exists "Membro vê membros do mesmo grupo" on public.community_members;

create policy "Usuário vê próprias participações"
  on public.community_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "Membro vê participantes do mesmo grupo"
  on public.community_members for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_members mine
      where mine.user_id = auth.uid()
        and mine.community_id = community_members.community_id
    )
  );
