import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchLeaderboard } from '../lib/data'
import type { LeaderboardRow } from '../types/database'
import { PageHeader } from '../components/PageHeader'
import { useCommunity } from '../context/CommunityContext'

export function RankingPage() {
  const location = useLocation()
  const { community } = useCommunity()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!community) {
        setRows([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        setRows(await fetchLeaderboard(community.id))
      } catch {
        setRows([])
      }
      setLoading(false)
    }
    void load()
  }, [location.key, community?.id])

  return (
    <div className="page">
      <PageHeader
        title="Pontuação"
        subtitle={community ? `Grupo: ${community.name}` : 'Soma de todos os registros'}
      />

      {loading && <p className="status-line muted">Carregando…</p>}

      <ol className="rank-list">
        {rows.map((row, index) => (
          <li key={row.user_id} className="rank-row">
            <span className="rank-pos">{index + 1}</span>
            <div className="avatar avatar--sm">
              {row.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="rank-info">
              <strong>{row.display_name}</strong>
              <span className="muted">{row.check_in_count} registros</span>
            </div>
            <span className="rank-points">{row.total_points}</span>
          </li>
        ))}
      </ol>

      {!loading && rows.length === 0 && (
        <div className="empty-state">
          <p className="muted">A lista aparece quando houver registros.</p>
        </div>
      )}
    </div>
  )
}
