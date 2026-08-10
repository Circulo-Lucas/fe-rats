import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchActiveCommunity,
  fetchMyCommunities,
  type MyCommunity,
} from '../lib/data'
import type { Community } from '../types/database'
import { useAuth } from './AuthContext'

type CommunityContextValue = {
  community: Community | null
  communities: MyCommunity[]
  loading: boolean
  refreshCommunities: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextValue | null>(null)

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [communities, setCommunities] = useState<MyCommunity[]>([])
  const [loading, setLoading] = useState(true)

  const refreshCommunities = useCallback(async () => {
    if (!user) {
      setCommunity(null)
      setCommunities([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [active, mine] = await Promise.all([
        fetchActiveCommunity(user.id),
        fetchMyCommunities(user.id),
      ])
      setCommunity(active)
      setCommunities(mine)
    } catch {
      setCommunity(null)
      setCommunities([])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refreshCommunities()
  }, [refreshCommunities])

  const value = useMemo(
    () => ({ community, communities, loading, refreshCommunities }),
    [community, communities, loading, refreshCommunities],
  )

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const ctx = useContext(CommunityContext)
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider')
  return ctx
}
