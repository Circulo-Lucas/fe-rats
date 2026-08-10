-- Grupos: criar, entrar e ver código (rode inteiro no SQL Editor)

-- Policies
drop policy if exists "Membro vê seus grupos" on public.communities;
drop policy if exists "communities_select_member_or_creator" on public.communities;
drop policy if exists "communities_insert_creator" on public.communities;

drop policy if exists "Membro vê membros do mesmo grupo" on public.community_members;
drop policy if exists "Membro vê participantes do mesmo grupo" on public.community_members;
drop policy if exists "Usuário vê próprias participações" on public.community_members;
drop policy if exists "community_members_select_own" on public.community_members;
drop policy if exists "community_members_insert_self" on public.community_members;

create policy "communities_select_member_or_creator"
  on public.communities for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.community_members cm
      where cm.community_id = communities.id
        and cm.user_id = auth.uid()
    )
  );

create policy "communities_insert_creator"
  on public.communities for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "community_members_select_own"
  on public.community_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "community_members_insert_self"
  on public.community_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- RPC que devolve JSON (PostgREST lida melhor que RETURNS TABLE)
drop function if exists public.create_community(text);

create or replace function public.create_community(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Nome do grupo muito curto';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.communities (name, invite_code, created_by)
      values (trim(p_name), v_code, v_user_id)
      returning id into v_id;
      exit;
    exception
      when unique_violation then
        v_attempts := v_attempts + 1;
        if v_attempts > 15 then
          raise exception 'Não foi possível gerar código único';
        end if;
      when check_violation then
        raise exception 'Código de convite inválido (contate suporte)';
    end;
  end loop;

  insert into public.community_members (community_id, user_id)
  values (v_id, v_user_id)
  on conflict do nothing;

  update public.profiles
  set active_community_id = v_id
  where id = v_user_id;

  return jsonb_build_object(
    'community_id', v_id,
    'invite_code', v_code
  );
end;
$$;

grant execute on function public.create_community(text) to authenticated;
