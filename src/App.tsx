import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }         from '@/hooks/useAuth'
import { ThemeProvider }   from '@/hooks/useTheme'
import { Spinner }         from '@/components/ui'
import Login               from '@/pages/Login'
import Layout              from '@/components/Layout'
import LancarProducao      from '@/pages/LancarProducao'
import PainelDia           from '@/pages/PainelDia'
import AdminListas         from '@/pages/AdminListas'

export default function App() {
  const { state, signIn, signInWithGoogle, signOut } = useAuth()

  // ── Carregando estado inicial ──────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner label="Verificando sessão…" />
      </div>
    )
  }

  // ── Usuário inativo / aguardando autorização ───────────────────────────────
  if (state.status === 'inactive') {
    const user = state.user
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center space-y-4">
          <p className="text-3xl">🔒</p>
          <h2 className="text-lg font-bold text-gray-900">Acesso aguardando autorização</h2>
          <p className="text-sm text-gray-600">
            Você está autenticado como <strong>{user.email || 'usuário'}</strong>.
          </p>

          <div className="bg-amber-50 rounded-lg p-3 text-left border border-amber-200 text-xs space-y-1 text-amber-800">
            <div className="font-semibold">Diagnóstico:</div>
            <div>{state.motivo}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-left border border-gray-200 text-xs space-y-1">
            <div className="text-gray-500 font-medium">Seu identificador (UID):</div>
            <div className="font-mono bg-white p-2 border border-gray-300 rounded text-gray-800 break-all select-all">
              {user.uid}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={signOut}
              className="text-sm text-brand-600 hover:text-brand-800 underline font-medium"
            >
              Sair e tentar outra conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Não autenticado ────────────────────────────────────────────────────────
  if (state.status === 'unauthenticated') {
    return <Login onSignIn={signIn} onSignInWithGoogle={signInWithGoogle} />
  }

  // ── Autenticado ────────────────────────────────────────────────────────────
  const isAdmin = state.usuario.perfil === 'admin'

  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}
