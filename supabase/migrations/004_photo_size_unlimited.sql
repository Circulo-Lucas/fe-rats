-- Sem limite de tamanho por arquivo no bucket (vale o limite global do plano Supabase)
update storage.buckets
set file_size_limit = null
where id = 'check-in-proofs';
