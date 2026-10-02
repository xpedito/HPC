import { useState } from 'react'
import { Button, Field, ErroBanner } from '@/components/ui'

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignInWithGoogle: () => Promise<void>
}

export default function Login({ onSignIn, onSignInWithGoogle }: Props) {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [erro, setErro]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      await onSignIn(email, senha)
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err)
      const code = (err as { code?: string })?.code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErro('E-mail ou senha incorretos.')
      } else if (code === 'auth/too-many-requests') {
        setErro('Muitas tentativas sem sucesso. Tente novamente mais tarde.')
      } else {
        setErro((err as Error)?.message || 'Erro ao realizar login.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setErro(null)
    setGoogleLoading(true)
    try {
      await onSignInWithGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar com o Google.'
      setErro(msg)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🏥</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HPC Psicologia</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registro de Produção</p>
        </div>

        {erro && <ErroBanner mensagem={erro} />}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <Button
            type="button"
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogleLogin}
            className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
            <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">ou e-mail</span>
            <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="E-mail" required>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </Field>

            <Field label="Senha" required>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </Field>

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Acesso restrito a profissionais cadastrados pela coordenação.
        </p>
      </div>
    </div>
  )
}
