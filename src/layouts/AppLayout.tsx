import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BottomNav } from '../components/BottomNav'

export function AppLayout() {
  const { user, loading } = useAuth()

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

  return (
    <div className="app-shell">
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
