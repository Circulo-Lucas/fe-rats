import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { AuthPage } from './pages/AuthPage'
import { FeedPage } from './pages/FeedPage'
import { RankingPage } from './pages/RankingPage'
import { CheckInPage } from './pages/CheckInPage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/grupo" element={<Navigate to="/perfil#grupos" replace />} />
          <Route path="/conta-grupo" element={<Navigate to="/perfil#grupos" replace />} />
          <Route element={<AppLayout />}>
            <Route index element={<FeedPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="registrar" element={<CheckInPage />} />
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
