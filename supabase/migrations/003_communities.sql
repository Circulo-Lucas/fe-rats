-- Grupos (comunidades) isolados — quem já usa vai para o grupo padrão

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint communities_invite_code_format check (invite_code ~ '^[A-Z0-9]{6,12}$')
);

create unique index communities_invite_code_lower_idx
  on public.communities (upper(invite_code));

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

create index community_members_community_idx on public.community_members (community_id);

alter table public.profiles
  add column if not exists active_community_id uuid references public.communities (id);

alter table public.check_ins
  add column if not exists community_id uuid references public.communities (id);

-- Grupo padrão: membros e registros atuais
insert into public.communities (id, name, invite_code)
values (
  '00000000-0000-4000-8000-000000000010',
  'Comunidade Círculo Lucas',
  'CIRCULO1'
)
on conflict (id) do nothing;

insert into public.community_members (community_id, user_id)
select '00000000-0000-4000-8000-000000000010', p.id
from public.profiles p
on conflict do nothing;

update public.profiles
set active_community_id = '00000000-0000-4000-8000-000000000010'
where active_community_id is null;

update public.check_ins
set community_id = '00000000-0000-4000-8000-000000000010'
where community_id is null;

alter table public.check_ins
  alter column community_id set not null;

create index check_ins_community_id_idx on public.check_ins (community_id);

-- Ranking por grupo
drop view if exists public.leaderboard;

create view public.leaderboard as
select
  cm.community_id,
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(at.points), 0)::bigint as total_points,
  count(ci.id)::bigint as check_in_count
from public.community_members cm
inner join public.profiles p on p.id = cm.user_id
left join public.check_ins ci
  on ci.user_id = p.id
  and ci.community_id = cm.community_id
left join public.activity_types at on at.id = ci.activity_type_id
group by cm.community_id, p.id, p.display_name, p.avatar_url;

grant select on public.leaderboard to authenticated;

-- Gera código de convite
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- Entrar em grupo pelo código (cadastro ou convite)
create or replace function public.join_community_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select id into v_community_id
  from public.communities
  where upper(trim(p_code)) = upper(trim(invite_code));

  if v_community_id is null then
    raise exception 'Código de grupo inválido';
  end if;

  insert into public.community_members (community_id, user_id)
  values (v_community_id, v_user_id)
  on conflict do nothing;

  update public.profiles
  set active_community_id = v_community_id
  where id = v_user_id;

  return v_community_id;
end;
$$;

-- Criar novo grupo (você continua no antigo; passa a ver o novo)
create or replace function public.create_community(p_name text)
returns table (community_id uuid, invite_code text)
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
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'Não foi possível gerar código único';
      end if;
    end;
  end loop;

  insert into public.community_members (community_id, user_id)
  values (v_id, v_user_id)
  on conflict do nothing;

  update public.profiles
  set active_community_id = v_id
  where id = v_user_id;

  return query select v_id, v_code;
end;
$$;

create or replace function public.set_active_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.community_members
    where user_id = v_user_id and community_id = p_community_id
  ) then
    raise exception 'Você não participa deste grupo';
  end if;

  update public.profiles
  set active_community_id = p_community_id
  where id = v_user_id;
end;
$$;

grant execute on function public.join_community_by_code(text) to authenticated;
grant execute on function public.create_community(text) to authenticated;
grant execute on function public.set_active_community(uuid) to authenticated;

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy "Membro vê seus grupos"
  on public.communities for select
  to authenticated
  using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = id and cm.user_id = auth.uid()
    )
  );

create policy "Membro vê membros do mesmo grupo"
  on public.community_members for select
  to authenticated
  using (
    community_id in (
      select community_id from public.community_members where user_id = auth.uid()
    )
  );

-- Check-ins: só o grupo ativo
drop policy if exists "Check-ins visíveis para autenticados" on public.check_ins;
drop policy if exists "Usuário cria próprio check-in" on public.check_ins;

create policy "Check-ins visíveis no grupo ativo"
  on public.check_ins for select
  to authenticated
  using (
    community_id = (
      select active_community_id from public.profiles where id = auth.uid()
    )
  );

create policy "Usuário cria check-in no grupo ativo"
  on public.check_ins for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and community_id = (
      select active_community_id from public.profiles where id = auth.uid()
    )
    and exists (
      select 1 from public.community_members
      where user_id = auth.uid() and community_id = check_ins.community_id
    )
  );
