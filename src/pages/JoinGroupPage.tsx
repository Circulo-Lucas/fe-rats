import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { joinCommunityByCode } from '../lib/data'
import { Brand } from '../components/Brand'
import { PageHeader } from '../components/PageHeader'

export function JoinGroupPage() {
  const { user, loading } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (loading) {
    return (
      <div className="screen center">
        <p className="muted">Carregando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const { error: err } = await joinCommunityByCode(code)
    setPending(false)
    if (err) {
      setError(err.includes('invalid') ? 'Código de grupo inválido.' : err)
      return
    }
    window.location.href = '/'
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-card">
        <Brand size="lg" />
        <PageHeader title="Entrar no grupo" subtitle="Use o código que o responsável do grupo passou" />

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Código do grupo</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              minLength={6}
              maxLength={12}
              placeholder="Ex.: CIRCULO1"
              autoComplete="off"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
            {pending ? 'Entrando…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
