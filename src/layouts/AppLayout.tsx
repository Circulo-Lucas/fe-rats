import { Navigate, Outlet } from 'react-router-dom'
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

  if (!community) {
    return <Navigate to="/grupo" replace />
  }

  return (
    <div className="app-shell">
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
