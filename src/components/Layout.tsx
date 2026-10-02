import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { AuthState } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

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
  const { theme, toggleTheme } = useTheme()
  const isAdmin = authState.usuario.perfil === 'admin'

  async function handleSignOut() {
    onSignOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      {/* Barra superior */}
      <header className="bg-brand-700 dark:bg-gray-900 text-white px-4 py-3 flex items-center gap-3 shadow-md border-b dark:border-gray-800">
        <span className="font-semibold text-sm flex-1 truncate">
          HPC Psicologia
        </span>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="text-sm p-1.5 rounded-lg bg-brand-800/60 dark:bg-gray-800 hover:bg-brand-800 dark:hover:bg-gray-700 text-brand-100 dark:text-amber-400 transition-colors"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="text-xs text-brand-200 dark:text-gray-400 truncate max-w-[140px]">
          {authState.usuario.nome}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-brand-200 dark:text-gray-400 hover:text-white px-2 py-1 rounded"
        >
          Sair
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Navegação inferior (mobile-first) */}
      <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex shadow-lg sticky bottom-0 z-10">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
