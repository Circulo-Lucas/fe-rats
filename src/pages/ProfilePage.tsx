import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMyPoints, updateDisplayName } from '../lib/data'
import { ACTIVITY_TYPES } from '../constants/activities'
import { PageHeader } from '../components/PageHeader'

export function ProfilePage() {
  const location = useLocation()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    async function loadPoints() {
      if (!user) return
      try {
        setTotalPoints(await fetchMyPoints(user.id))
      } catch {
        setTotalPoints(0)
      }
    }
    void loadPoints()
  }, [user, location.key])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    const { error } = await updateDisplayName(user.id, displayName)
    setSaving(false)
    if (error) {
      setMessage(error)
    } else {
      setMessage('Nome atualizado.')
      await refreshProfile()
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Conta"
        subtitle={
          totalPoints !== null ? `${totalPoints} pontos acumulados` : undefined
        }
      />

      <div className="profile-hero">
        <div className="avatar avatar--lg">
          {(displayName || '?').charAt(0).toUpperCase()}
        </div>
        <p className="muted profile-email">{user?.email}</p>
      </div>

      <form className="profile-form" onSubmit={saveProfile}>
        <label className="field">
          <span>Nome exibido</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={40}
          />
        </label>
        {message && (
          <p className={message.startsWith('Nome') ? 'success' : 'error'}>{message}</p>
        )}
        <button type="submit" className="btn btn-secondary btn-block" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      <section className="points-guide">
        <h2 className="points-guide__title">Critérios de pontuação</h2>
        <dl className="points-dl">
          {ACTIVITY_TYPES.map((a) => (
            <div key={a.id} className="points-dl__row">
              <dt>{a.label}</dt>
              <dd>{a.points}</dd>
            </div>
          ))}
        </dl>
      </section>

      <button type="button" className="btn btn-ghost btn-block" onClick={() => signOut()}>
        Encerrar sessão
      </button>
    </div>
  )
}
