import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchFeed } from '../lib/data'
import { isProofPhotoVisible } from '../lib/photoProof'
import type { CheckInWithProfile } from '../types/database'
import { formatRelativeTime } from '../lib/format'
import { getActivityById } from '../constants/activities'
import { PageHeader } from '../components/PageHeader'
import { useCommunity } from '../context/CommunityContext'

export function FeedPage() {
  const location = useLocation()
  const { community } = useCommunity()
  const [items, setItems] = useState<CheckInWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!community) {
        setItems([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await fetchFeed(community.id)
        if (err) setError(err)
        else setItems(data ?? [])
      } catch {
        setError('Supabase não configurado.')
      }
      setLoading(false)
    }
    void load()
  }, [location.key, community?.id])

  return (
    <div className="page">
      <PageHeader
        showBrand
        subtitle={
          community
            ? `${community.name} — o que o grupo registrou`
            : 'O que a comunidade registrou'
        }
      />

      {loading && <p className="status-line muted">Carregando…</p>}
      {error && <p className="status-line error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">Nenhum registro ainda</p>
          <p className="muted">Use Registrar para marcar uma atividade.</p>
        </div>
      )}

      <ul className="feed-list">
        {items.map((item) => {
          const tone = getActivityById(item.activity_type_id)?.tone ?? 'comunidade'
          const showPhoto = isProofPhotoVisible(item.photo_url, item.photo_expires_at)
          return (
            <li key={item.id} className="feed-card">
              <div className="feed-card__top">
                <div className="avatar" aria-hidden>
                  {(item.profiles?.display_name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="feed-card__meta">
                  <strong>{item.profiles?.display_name ?? 'Membro'}</strong>
                  <span className="muted">{formatRelativeTime(item.occurred_at)}</span>
                </div>
                <span className="points-badge">
                  {item.activity_types?.points ?? 0} pt
                </span>
              </div>
              <p className={`activity-tag activity-tag--${tone}`}>
                {item.activity_types?.label}
              </p>
              {showPhoto && item.photo_url && (
                <a
                  href={item.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feed-card__photo-link"
                >
                  <img
                    src={item.photo_url}
                    alt="Comprovante da atividade"
                    className="feed-card__photo"
                    loading="lazy"
                  />
                </a>
              )}
              {item.note && <p className="feed-card__note">{item.note}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
