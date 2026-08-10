import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CommunityProvider, useCommunity } from '../context/CommunityContext'
import { BottomNav } from '../components/BottomNav'

function AppLayoutInner() {
  const { user, loading: authLoading } = useAuth()
  const { community, loading: communityLoading } = useCommunity()

  if (authLoading || communityLoading) {
    return (
      <div className="screen center">
        <p className="muted">Carregando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" replace />
  }

  return (
    <div className="app-shell">
      {!community && (
        <div className="group-banner">
          <span className="group-banner__text">Sem grupo ativo — feed e registros ficam disponíveis depois que você entrar ou criar um.</span>
          <Link to="/perfil#grupos" className="group-banner__link">
            Grupos
          </Link>
        </div>
      )}
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export function AppLayout() {
  return (
    <CommunityProvider>
      <AppLayoutInner />
    </CommunityProvider>
  )
}
