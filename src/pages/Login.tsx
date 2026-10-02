import { useState } from 'react'
import { Button, Field, ErroBanner } from '@/components/ui'

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>
}

export default function Login({ onSignIn }: Props) {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    try {
      await onSignIn(email, senha)
    } catch {
      setErro('E-mail ou senha incorretos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🏥</div>
          <h1 className="text-2xl font-bold text-gray-900">HPC Psicologia</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de Produção</p>
        </div>

        {erro && <ErroBanner mensagem={erro} />}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Field label="E-mail" required>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </Field>

          <Field label="Senha" required>
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </Field>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Acesso restrito. Conta criada pelo administrador.
        </p>
      </div>
    </div>
  )
}
