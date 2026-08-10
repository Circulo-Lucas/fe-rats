export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  active_community_id: string | null
  created_at: string
}

type CommunityRow = {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

type ActivityTypeRow = {
  id: string
  label: string
  points: number
  emoji: string
  sort_order: number
}

type CheckInRow = {
  id: string
  user_id: string
  community_id: string
  activity_type_id: string
  note: string | null
  photo_url: string | null
  photo_storage_path: string | null
  photo_taken_at: string | null
  photo_expires_at: string | null
  occurred_at: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          active_community_id?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
          active_community_id?: string | null
        }
        Relationships: []
      }
      communities: {
        Row: CommunityRow
        Insert: Partial<CommunityRow>
        Update: Partial<CommunityRow>
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          community_id: string
          user_id: string
          joined_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      activity_types: {
        Row: ActivityTypeRow
        Insert: ActivityTypeRow
        Update: Partial<ActivityTypeRow>
        Relationships: []
      }
      check_ins: {
        Row: CheckInRow
        Insert: {
          id?: string
          user_id: string
          community_id: string
          activity_type_id: string
          note?: string | null
          photo_url?: string | null
          photo_storage_path?: string | null
          photo_taken_at?: string | null
          photo_expires_at?: string | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          note?: string | null
          photo_url?: string | null
          photo_storage_path?: string | null
          photo_taken_at?: string | null
          photo_expires_at?: string | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'check_ins_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'check_ins_activity_type_id_fkey'
            columns: ['activity_type_id']
            isOneToOne: false
            referencedRelation: 'activity_types'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          community_id: string
          user_id: string
          display_name: string
          avatar_url: string | null
          total_points: number
          check_in_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      join_community_by_code: {
        Args: { p_code: string }
        Returns: string
      }
      create_community: {
        Args: { p_name: string }
        Returns: { community_id: string; invite_code: string }[]
      }
      set_active_community: {
        Args: { p_community_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = ProfileRow
export type Community = CommunityRow
export type CheckIn = CheckInRow
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row']

export type CheckInWithProfile = CheckIn & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'> | null
  activity_types: Pick<ActivityTypeRow, 'label' | 'points' | 'emoji'> | null
}
