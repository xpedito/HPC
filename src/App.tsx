import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }         from '@/hooks/useAuth'
import { Spinner }         from '@/components/ui'
import Login               from '@/pages/Login'
import Layout              from '@/components/Layout'
import LancarProducao      from '@/pages/LancarProducao'
import PainelDia           from '@/pages/PainelDia'
import AdminListas         from '@/pages/AdminListas'

export default function App() {
  const { state, signIn, signOut } = useAuth()

  // ── Carregando estado inicial ──────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner label="Verificando sessão…" />
      </div>
    )
  }

  // ── Usuário inativo ────────────────────────────────────────────────────────
  if (state.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <p className="font-medium text-gray-800">Conta desativada</p>
          <p className="text-sm text-gray-500">Entre em contato com o administrador.</p>
          <button
            onClick={signOut}
            className="text-sm text-brand-600 underline"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  // ── Não autenticado ────────────────────────────────────────────────────────
  if (state.status === 'unauthenticated') {
    return <Login onSignIn={signIn} />
  }

  // ── Autenticado ────────────────────────────────────────────────────────────
  const isAdmin = state.usuario.perfil === 'admin'

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout authState={state} onSignOut={signOut} />}>
          <Route index element={<LancarProducao authState={state} />} />
          <Route path="painel" element={<PainelDia />} />
          {isAdmin && (
            <Route path="admin" element={<AdminListas />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
