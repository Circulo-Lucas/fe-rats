import { supabase } from './supabase'
import { photoExpiresAt } from './photoProof'
import type { CheckInWithProfile, LeaderboardRow } from '../types/database'

const BUCKET = 'check-in-proofs'

function requireClient() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}

export async function fetchFeed(): Promise<{
  data: CheckInWithProfile[] | null
  error: string | null
}> {
  const client = requireClient()
  const { data, error } = await client
    .from('check_ins')
    .select(
      `
      *,
      profiles ( display_name, avatar_url ),
      activity_types ( label, points, emoji )
    `,
    )
    .order('occurred_at', { ascending: false })
    .limit(50)
  return { data: (data as CheckInWithProfile[]) ?? null, error: error?.message ?? null }
}

export type CreateCheckInInput = {
  userId: string
  activityTypeId: string
  note: string | null
  photoFile: File
  photoTakenAt: Date
}

export async function createCheckIn(input: CreateCheckInInput): Promise<{ error: string | null }> {
  const client = requireClient()
  const checkInId = crypto.randomUUID()
  const occurredAt = new Date().toISOString()
  const expiresAt = photoExpiresAt(new Date())

  const ext =
    input.photoFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const storagePath = `${input.userId}/${checkInId}.${ext}`

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(storagePath, input.photoFile, {
      cacheControl: '604800',
      upsert: false,
      contentType: input.photoFile.type,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(storagePath)

  const { error: insertError } = await client.from('check_ins').insert({
    id: checkInId,
    user_id: input.userId,
    activity_type_id: input.activityTypeId,
    note: input.note,
    photo_url: publicUrlData.publicUrl,
    photo_storage_path: storagePath,
    photo_taken_at: input.photoTakenAt.toISOString(),
    photo_expires_at: expiresAt,
    occurred_at: occurredAt,
  })

  if (insertError) {
    await client.storage.from(BUCKET).remove([storagePath])
    return { error: insertError.message }
  }

  return { error: null }
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const client = requireClient()
  const { data } = await client
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function fetchMyPoints(userId: string): Promise<number> {
  const client = requireClient()
  const { data } = await client
    .from('leaderboard')
    .select('total_points')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.total_points ?? 0
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<{ error: string | null }> {
  const client = requireClient()
  const { error } = await client
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)
  return { error: error?.message ?? null }
}
