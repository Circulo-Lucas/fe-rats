-- REDivinos: check-ins e pontuação da comunidade

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.activity_types (
  id text primary key,
  label text not null,
  points integer not null check (points > 0),
  emoji text not null default '✝',
  sort_order integer not null default 0
);

insert into public.activity_types (id, label, points, emoji, sort_order) values
  ('circulo', 'Participação no Círculo', 5, '⭕', 1),
  ('missa_dominical', 'Missa dominical', 2, '⛪', 2),
  ('adoracao', 'Adoração / visita ao Santíssimo', 1, '🕯', 3),
  ('missa_semana', 'Missa em meio de semana', 1, '📿', 4),
  ('sacramentos', 'Sacramentos', 1, '💧', 5),
  ('eventos_sgm', 'Eventos do SGM (formações / ações sociais)', 1, '🤝', 6);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type_id text not null references public.activity_types (id),
  note text,
  photo_url text,
  photo_storage_path text,
  photo_taken_at timestamptz,
  photo_expires_at timestamptz,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index check_ins_occurred_at_idx on public.check_ins (occurred_at desc);
create index check_ins_user_id_idx on public.check_ins (user_id);
create index check_ins_photo_expires_idx on public.check_ins (photo_expires_at)
  where photo_storage_path is not null;

-- Perfil automático ao cadastrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.activity_types enable row level security;
alter table public.check_ins enable row level security;

create policy "Perfis visíveis para autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuário edita próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Tipos de atividade visíveis"
  on public.activity_types for select
  to authenticated
  using (true);

create policy "Check-ins visíveis para autenticados"
  on public.check_ins for select
  to authenticated
  using (true);

create policy "Usuário cria próprio check-in"
  on public.check_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário remove próprio check-in"
  on public.check_ins for delete
  to authenticated
  using (auth.uid() = user_id);

-- Ranking por pontos (soma dos tipos)
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(at.points), 0)::bigint as total_points,
  count(c.id)::bigint as check_in_count
from public.profiles p
left join public.check_ins c on c.user_id = p.id
left join public.activity_types at on at.id = c.activity_type_id
group by p.id, p.display_name, p.avatar_url;

grant select on public.leaderboard to authenticated;
