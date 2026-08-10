import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import {
  createCommunity,
  fetchMyPoints,
  setActiveCommunity,
  updateDisplayName,
} from '../lib/data'
import { ACTIVITY_TYPES } from '../constants/activities'
import { PageHeader } from '../components/PageHeader'

export function ProfilePage() {
  const location = useLocation()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { community, communities, refreshCommunities } = useCommunity()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [groupBusy, setGroupBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    async function loadPoints() {
      if (!user || !community) return
      try {
        setTotalPoints(await fetchMyPoints(user.id, community.id))
      } catch {
        setTotalPoints(0)
      }
    }
    void loadPoints()
  }, [user, community?.id, location.key])

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

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    setGroupBusy(true)
    setMessage(null)
    setNewInviteCode(null)
    const { error, inviteCode } = await createCommunity(newGroupName)
    setGroupBusy(false)
    if (error) {
      setMessage(error)
      return
    }
    setNewGroupName('')
    setNewInviteCode(inviteCode ?? null)
    await refreshCommunities()
    setMessage('Novo grupo criado. Compartilhe o código abaixo.')
  }

  async function handleSwitchGroup(communityId: string) {
    setGroupBusy(true)
    setMessage(null)
    const { error } = await setActiveCommunity(communityId)
    setGroupBusy(false)
    if (error) {
      setMessage(error)
      return
    }
    await refreshCommunities()
    setMessage('Grupo alterado.')
  }

  return (
    <div className="page">
      <PageHeader
        title="Conta"
        subtitle={
          totalPoints !== null ? `${totalPoints} pontos neste grupo` : undefined
        }
      />

      <div className="profile-hero">
        <div className="avatar avatar--lg">
          {(displayName || '?').charAt(0).toUpperCase()}
        </div>
        <p className="muted profile-email">{user?.email}</p>
      </div>

      <section className="points-guide group-panel">
        <h2 className="points-guide__title">Seu grupo</h2>
        {community && (
          <>
            <p className="group-panel__name">{community.name}</p>
            <p className="group-panel__code">
              Código para convidar: <strong>{community.invite_code}</strong>
            </p>
          </>
        )}

        {communities.length > 1 && (
          <div className="group-switch">
            <span className="field-label">Trocar grupo</span>
            <ul className="group-switch-list">
              {communities.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`group-switch-btn ${c.is_active ? 'active' : ''}`}
                    disabled={groupBusy || c.is_active}
                    onClick={() => void handleSwitchGroup(c.id)}
                  >
                    {c.name}
                    {c.is_active ? ' (atual)' : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="group-create" onSubmit={handleCreateGroup}>
          <label className="field">
            <span>Abrir outro grupo</span>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ex.: Paróquia São José"
              minLength={2}
              maxLength={60}
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary btn-block"
            disabled={groupBusy || newGroupName.trim().length < 2}
          >
            {groupBusy ? 'Criando…' : 'Criar grupo e gerar código'}
          </button>
        </form>

        {newInviteCode && (
          <p className="success">
            Código do novo grupo: <strong>{newInviteCode}</strong>
          </p>
        )}
      </section>

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
          <p className={message.includes('atualizado') || message.includes('criado') || message.includes('alterado') ? 'success' : 'error'}>
            {message}
          </p>
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
