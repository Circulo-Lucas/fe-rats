import { supabase } from './supabase'
import { photoExpiresAt } from './photoProof'
import type { CheckInWithProfile, Community, LeaderboardRow } from '../types/database'

const BUCKET = 'check-in-proofs'

function requireClient() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}

export async function getActiveCommunityId(userId: string): Promise<string | null> {
  const client = requireClient()
  const { data } = await client
    .from('profiles')
    .select('active_community_id')
    .eq('id', userId)
    .single()
  return data?.active_community_id ?? null
}

export async function fetchFeed(communityId: string): Promise<{
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
    .eq('community_id', communityId)
    .order('occurred_at', { ascending: false })
    .limit(50)
  return { data: (data as CheckInWithProfile[]) ?? null, error: error?.message ?? null }
}

export type CreateCheckInInput = {
  userId: string
  communityId: string
  activityTypeId: string
  note: string | null
  photoFile: File
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
    community_id: input.communityId,
    activity_type_id: input.activityTypeId,
    note: input.note,
    photo_url: publicUrlData.publicUrl,
    photo_storage_path: storagePath,
    photo_taken_at: occurredAt,
    photo_expires_at: expiresAt,
    occurred_at: occurredAt,
  })

  if (insertError) {
    await client.storage.from(BUCKET).remove([storagePath])
    return { error: insertError.message }
  }

  return { error: null }
}

export async function fetchLeaderboard(communityId: string): Promise<LeaderboardRow[]> {
  const client = requireClient()
  const { data } = await client
    .from('leaderboard')
    .select('*')
    .eq('community_id', communityId)
    .order('total_points', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function fetchMyPoints(userId: string, communityId: string): Promise<number> {
  const client = requireClient()
  const { data } = await client
    .from('leaderboard')
    .select('total_points')
    .eq('user_id', userId)
    .eq('community_id', communityId)
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

export async function joinCommunityByCode(code: string): Promise<{ error: string | null }> {
  const client = requireClient()
  const { error } = await client.rpc('join_community_by_code', { p_code: code.trim() })
  return { error: error?.message ?? null }
}

export async function createCommunity(
  name: string,
): Promise<{ error: string | null; inviteCode?: string; communityId?: string }> {
  const client = requireClient()
  const { data, error } = await client.rpc('create_community', { p_name: name.trim() })
  if (error) return { error: error.message }

  const row = parseCreateCommunityRow(data)
  if (!row?.community_id) {
    return { error: 'Grupo criado, mas o servidor não devolveu o código. Atualize a página ou rode a migration 007 no Supabase.' }
  }

  let inviteCode: string | undefined = row.invite_code || undefined
  if (!inviteCode) {
    const { data: community } = await client
      .from('communities')
      .select('invite_code')
      .eq('id', row.community_id)
      .maybeSingle()
    inviteCode = community?.invite_code ?? undefined
  }

  return {
    error: null,
    communityId: row.community_id,
    inviteCode,
  }
}

function parseCreateCommunityRow(
  data: unknown,
): { community_id: string; invite_code: string } | null {
  if (!data) return null
  if (Array.isArray(data)) {
    const first = data[0] as Record<string, string> | undefined
    return first ? normalizeCreateCommunityRow(first) : null
  }
  if (typeof data === 'object') {
    return normalizeCreateCommunityRow(data as Record<string, string>)
  }
  return null
}

function normalizeCreateCommunityRow(row: Record<string, string>) {
  const communityId = row.community_id ?? row.communityId
  const inviteCode = row.invite_code ?? row.inviteCode
  if (!communityId) return null
  return { community_id: communityId, invite_code: inviteCode ?? '' }
}

export async function setActiveCommunity(communityId: string): Promise<{ error: string | null }> {
  const client = requireClient()
  const { error } = await client.rpc('set_active_community', {
    p_community_id: communityId,
  })
  return { error: error?.message ?? null }
}

export type MyCommunity = Community & { is_active: boolean }

export async function fetchMyCommunities(userId: string): Promise<MyCommunity[]> {
  const client = requireClient()
  const { data: profile } = await client
    .from('profiles')
    .select('active_community_id')
    .eq('id', userId)
    .single()

  const { data: memberships } = await client
    .from('community_members')
    .select('community_id, communities ( id, name, invite_code, created_at )')
    .eq('user_id', userId)

  if (!memberships) return []

  return memberships
    .map((m) => {
      const raw = m.communities
      const c = (Array.isArray(raw) ? raw[0] : raw) as Community | null
      if (!c) return null
      return {
        ...c,
        is_active: c.id === profile?.active_community_id,
      }
    })
    .filter((x): x is MyCommunity => x !== null)
}

export async function fetchActiveCommunity(userId: string): Promise<Community | null> {
  const client = requireClient()
  const { data: profile } = await client
    .from('profiles')
    .select('active_community_id')
    .eq('id', userId)
    .single()

  if (!profile?.active_community_id) return null

  const { data } = await client
    .from('communities')
    .select('*')
    .eq('id', profile.active_community_id)
    .single()

  return data ?? null
}
