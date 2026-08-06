import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BUCKET = 'check-in-proofs'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: rows, error } = await supabase
    .from('check_ins')
    .select('id, photo_storage_path')
    .not('photo_storage_path', 'is', null)
    .lt('photo_expires_at', new Date().toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let purged = 0
  for (const row of rows ?? []) {
    if (row.photo_storage_path) {
      await supabase.storage.from(BUCKET).remove([row.photo_storage_path])
    }
    const { error: updErr } = await supabase
      .from('check_ins')
      .update({ photo_url: null, photo_storage_path: null })
      .eq('id', row.id)
    if (!updErr) purged += 1
  }

  return new Response(JSON.stringify({ purged }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
