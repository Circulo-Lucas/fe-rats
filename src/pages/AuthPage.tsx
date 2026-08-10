import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from '../components/Brand'

export function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (loading) {
    return (
      <div className="screen center">
        <p className="muted">Carregando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setInfo(null)

    if (mode === 'login') {
      const result = await signIn(email, password)
      setPending(false)
      if (result.error) setError(result.error)
      return
    }

    const result = await signUp(email, password, displayName)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.signedIn) return
    setMode('login')
    setInfo('Conta criada. Entre com seu e-mail e senha para continuar.')
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-card">
        <div className="brand-block">
          <Brand size="lg" />
          <p className="brand-tagline">Comunidade, presença e constância na vida da igreja.</p>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError(null)
              setInfo(null)
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setError(null)
              setInfo(null)
            }}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <label className="field">
              <span>Nome</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'signup' && (
            <p className="auth-hint muted">
              Depois do cadastro, em <strong>Conta</strong> você pode entrar ou criar um grupo — não é obrigatório na hora.
            </p>
          )}
          {info && <p className="success">{info}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
            {pending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
