import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import {
  createCommunity,
  fetchMyPoints,
  joinCommunityByCode,
  setActiveCommunity,
  updateDisplayName,
} from '../lib/data'
import { ACTIVITY_TYPES } from '../constants/activities'
import { PageHeader } from '../components/PageHeader'

export function ProfilePage() {
  const location = useLocation()
  const groupsRef = useRef<HTMLElement>(null)
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { community, communities, refreshCommunities } = useCommunity()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [groupBusy, setGroupBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    if (location.hash === '#grupos') {
      groupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, location.key])

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
    if (error) {
      setGroupBusy(false)
      setMessage(error)
      return
    }
    setNewGroupName('')
    setNewInviteCode(inviteCode ?? null)
    await refreshCommunities()
    setGroupBusy(false)
    const code = inviteCode ?? null
    if (!code) {
      setMessage('Grupo criado, mas não foi possível carregar o código. Rode a migration 007 no Supabase e atualize a página.')
      return
    }
    setMessage('Grupo criado. Compartilhe o código abaixo para outras pessoas entrarem.')
  }

  const displayedInviteCode = newInviteCode ?? community?.invite_code ?? null

  async function copyInviteCode() {
    if (!displayedInviteCode) return
    try {
      await navigator.clipboard.writeText(displayedInviteCode)
      setMessage('Código copiado.')
    } catch {
      setMessage('Não foi possível copiar. Selecione o código manualmente.')
    }
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault()
    setGroupBusy(true)
    setMessage(null)
    const { error } = await joinCommunityByCode(joinCode)
    setGroupBusy(false)
    if (error) {
      setMessage(error.toLowerCase().includes('inválido') ? 'Código inválido.' : error)
      return
    }
    setJoinCode('')
    await refreshCommunities()
    setMessage('Você entrou no grupo.')
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
          community
            ? totalPoints !== null
              ? `${totalPoints} pontos neste grupo`
              : undefined
            : 'Entrar ou criar um grupo quando quiser'
        }
      />

      <div className="profile-hero">
        <div className="avatar avatar--lg">
          {(displayName || '?').charAt(0).toUpperCase()}
        </div>
        <p className="muted profile-email">{user?.email}</p>
      </div>

      <section id="grupos" ref={groupsRef} className="points-guide group-panel">
        <h2 className="points-guide__title">Grupos</h2>
        {!community && (
          <p className="muted group-panel__intro">
            Opcional: escolha um grupo para ver o feed, o ranking e registrar atividades com o
            pessoal da sua paróquia ou círculo.
          </p>
        )}
        {community && (
          <>
            <p className="group-panel__name">{community.name}</p>
          </>
        )}

        {displayedInviteCode && (
          <div className="invite-code-box">
            <p className="invite-code-box__label">Código para convidar</p>
            <p className="invite-code-box__code">{displayedInviteCode}</p>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => void copyInviteCode()}>
              Copiar código
            </button>
          </div>
        )}

        {!community ? (
          <form className="group-create" onSubmit={handleCreateGroup}>
            <label className="field">
              <span>Criar um grupo</span>
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
              className="btn btn-primary btn-block"
              disabled={groupBusy || newGroupName.trim().length < 2}
            >
              {groupBusy ? 'Criando…' : 'Criar grupo e gerar código'}
            </button>
          </form>
        ) : null}

        <form className="group-create" onSubmit={handleJoinByCode}>
          <label className="field">
            <span>{community ? 'Entrar em outro grupo' : 'Entrar com código'}</span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código do grupo (6 a 12 caracteres)"
              minLength={6}
              maxLength={12}
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary btn-block"
            disabled={groupBusy || joinCode.trim().length < 6}
          >
            {groupBusy ? 'Entrando…' : 'Entrar no grupo'}
          </button>
        </form>

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

        {community && (
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
        )}

        {message && (
          <p
            className={
              message.includes('atualizado') ||
              message.includes('criado') ||
              message.includes('alterado') ||
              message.includes('entrou') ||
              message.includes('copiado') ||
              message.includes('Compartilhe')
                ? 'success'
                : 'error'
            }
          >
            {message}
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
