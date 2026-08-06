-- Storage: comprovantes de check-in (removidos após photo_expires_at via Edge Function)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'check-in-proofs',
  'check-in-proofs',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Comprovantes: leitura autenticada"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'check-in-proofs');

create policy "Comprovantes: upload na pasta do usuário"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'check-in-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Comprovantes: usuário apaga os próprios"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'check-in-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Se a tabela check_ins já existia sem as colunas de foto, rode também:
-- alter table public.check_ins add column if not exists photo_storage_path text;
-- alter table public.check_ins add column if not exists photo_taken_at timestamptz;
-- alter table public.check_ins add column if not exists photo_expires_at timestamptz;
