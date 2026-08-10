import { supabase } from './supabase'
import { photoExpiresAt } from './photoProof'
import { generateInviteCode, mapCommunityError } from './communities'
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
  const normalized = code.trim().toUpperCase()
  const { error } = await client.rpc('join_community_by_code', { p_code: normalized })
  if (error) return { error: mapCommunityError(error.message) }
  return { error: null }
}

export async function createCommunity(
  name: string,
): Promise<{ error: string | null; inviteCode?: string; communityId?: string }> {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: 'Nome do grupo muito curto.' }

  const client = requireClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Entre de novo.' }

  const rpc = await client.rpc('create_community', { p_name: trimmed })
  if (!rpc.error && rpc.data) {
    const parsed = parseCreateCommunityPayload(rpc.data)
    if (parsed?.community_id && parsed.invite_code) {
      return {
        error: null,
        communityId: parsed.community_id,
        inviteCode: parsed.invite_code,
      }
    }
  }

  const rpcHint = rpc.error?.message ? mapCommunityError(rpc.error.message) : null
  const direct = await createCommunityDirect(client, user.id, trimmed)
  if (direct.error) {
    return { error: rpcHint ? `${direct.error} (${rpcHint})` : direct.error }
  }
  return direct
}

async function createCommunityDirect(
  client: NonNullable<typeof supabase>,
  userId: string,
  name: string,
): Promise<{ error: string | null; inviteCode?: string; communityId?: string }> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateInviteCode()
    const { data: row, error: insertError } = await client
      .from('communities')
      .insert({ name, invite_code: code, created_by: userId })
      .select('id, invite_code')
      .single()

    if (insertError) {
      if (insertError.code === '23505') continue
      return { error: mapCommunityError(insertError.message) }
    }

    const { error: memberError } = await client.from('community_members').insert({
      community_id: row.id,
      user_id: userId,
    })
    if (memberError) {
      return { error: mapCommunityError(memberError.message) }
    }

    const { error: profileError } = await client
      .from('profiles')
      .update({ active_community_id: row.id })
      .eq('id', userId)
    if (profileError) {
      return { error: mapCommunityError(profileError.message) }
    }

    return { error: null, communityId: row.id, inviteCode: row.invite_code }
  }

  return { error: 'Não foi possível gerar um código único. Tente de novo.' }
}

function parseCreateCommunityPayload(
  data: unknown,
): { community_id: string; invite_code: string } | null {
  if (!data) return null

  if (typeof data === 'object' && !Array.isArray(data)) {
    const row = data as Record<string, unknown>
    const communityId = String(row.community_id ?? row.communityId ?? '')
    const inviteCode = String(row.invite_code ?? row.inviteCode ?? '')
    if (communityId && inviteCode) {
      return { community_id: communityId, invite_code: inviteCode.toUpperCase() }
    }
  }

  if (Array.isArray(data) && data[0]) {
    return parseCreateCommunityPayload(data[0])
  }

  return null
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

  const { data: memberships, error: memberError } = await client
    .from('community_members')
    .select('community_id')
    .eq('user_id', userId)

  if (memberError || !memberships?.length) return []

  const ids = memberships.map((m) => m.community_id)
  const { data: communities, error: commError } = await client
    .from('communities')
    .select('id, name, invite_code, created_at, created_by')
    .in('id', ids)

  if (commError || !communities) return []

  return communities.map((c) => ({
    ...c,
    is_active: c.id === profile?.active_community_id,
  }))
}

export async function fetchActiveCommunity(userId: string): Promise<Community | null> {
  const client = requireClient()
  const { data: profile } = await client
    .from('profiles')
    .select('active_community_id')
    .eq('id', userId)
    .single()

  if (!profile?.active_community_id) return null

  const { data, error } = await client
    .from('communities')
    .select('*')
    .eq('id', profile.active_community_id)
    .maybeSingle()

  if (error) return null
  return data ?? null
}
