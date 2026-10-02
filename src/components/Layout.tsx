import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { AuthState } from '@/hooks/useAuth'

interface Props {
  authState: Extract<AuthState, { status: 'authenticated' }>
  onSignOut: () => void
}

const NAV_ITEMS = [
  { to: '/',       label: '📋', title: 'Lançar'  },
  { to: '/painel', label: '📊', title: 'Painel'  },
]

export default function Layout({ authState, onSignOut }: Props) {
  const navigate = useNavigate()
  const isAdmin = authState.usuario.perfil === 'admin'

  async function handleSignOut() {
    onSignOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra superior */}
      <header className="bg-brand-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <span className="font-semibold text-sm flex-1 truncate">
          HPC Psicologia
        </span>
        <span className="text-xs text-brand-200 truncate max-w-[140px]">
          {authState.usuario.nome}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-brand-200 hover:text-white px-2 py-1 rounded"
        >
          Sair
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Navegação inferior (mobile-first) */}
      <nav className="bg-white border-t border-gray-200 flex shadow-lg sticky bottom-0">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <span className="text-xl">{item.label}</span>
            <span>{item.title}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <span className="text-xl">⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}
