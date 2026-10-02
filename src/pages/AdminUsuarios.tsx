import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Usuario, Perfil } from '@/schemas/registro'
import { PERFIL } from '@/schemas/registro'
import { Button, Field, Spinner, ErroBanner } from '@/components/ui'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios]   = useState<Usuario[]>([])
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState<string | null>(null)
  const [sucesso, setSucesso]     = useState<string | null>(null)

  // Formulário de adicionar usuário
  const [tipoCadastro, setTipoCadastro] = useState<'emailSenha' | 'emailGoogle'>('emailGoogle')
  const [nome, setNome]                 = useState('')
  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [perfil, setPerfil]             = useState<Perfil>('psicologa')
  const [salvando, setSalvando]         = useState(false)

  async function carregarUsuarios() {
    setLoading(true)
    setErro(null)
    try {
      const snap = await getDocs(collection(db, 'usuarios'))
      const list: Usuario[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          nome: data.nome ?? '',
          email: data.email ?? '',
          perfil: data.perfil ?? 'psicologa',
          ativo: data.ativo ?? false,
          criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate() : undefined,
        }
      })
      setUsuarios(list)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function handleToggleAtivo(u: Usuario) {
    setErro(null)
    setSucesso(null)
    try {
      await updateDoc(doc(db, 'usuarios', u.id), {
        ativo: !u.ativo,
      })
      setUsuarios((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, ativo: !u.ativo } : item)),
      )
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao atualizar status.')
    }
  }

  async function handleMudarPerfil(u: Usuario, novoPerfil: Perfil) {
    setErro(null)
    setSucesso(null)
    try {
      await updateDoc(doc(db, 'usuarios', u.id), {
        perfil: novoPerfil,
      })
      setUsuarios((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, perfil: novoPerfil } : item)),
      )
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao atualizar perfil.')
    }
  }

  async function handleExcluir(u: Usuario) {
    if (!confirm(`Remover o cadastro de "${u.nome}"? O usuário perderá o acesso.`)) return
    setErro(null)
    setSucesso(null)
    try {
      await deleteDoc(doc(db, 'usuarios', u.id))
      setUsuarios((prev) => prev.filter((item) => item.id !== u.id))
      setSucesso('Usuário removido.')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao remover usuário.')
    }
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    const targetEmail = email.trim().toLowerCase()
    const targetNome = nome.trim()

    if (!targetEmail || !targetNome) {
      setErro('Preencha Nome e E-mail.')
      return
    }

    setSalvando(true)
    try {
      if (tipoCadastro === 'emailSenha') {
        if (!senha || senha.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.')
        }
        // Cria a conta no Firebase Auth sem deslogar o admin
        const { criarUsuarioAuthSemDeslogar } = await import('@/firebase/config')
        const novoUid = await criarUsuarioAuthSemDeslogar(targetEmail, senha)

        // Grava no Firestore vinculado ao novo UID
        await setDoc(doc(db, 'usuarios', novoUid), {
          nome: targetNome,
          email: targetEmail,
          perfil,
          ativo: true,
          criadoEm: serverTimestamp(),
        })
        setSucesso(`Conta criada! A profissional já pode fazer login com e-mail e senha.`)
      } else {
        // Pré-autorização por e-mail (para login com Google)
        // Cria um documento com ID gerado ou baseado no email limpo
        const docId = `email_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
        await setDoc(doc(db, 'usuarios', docId), {
          nome: targetNome,
          email: targetEmail,
          perfil,
          ativo: true,
          criadoEm: serverTimestamp(),
        })
        setSucesso(`Acesso autorizado para "${targetEmail}". Assim que ela clicar em "Entrar com Google", o acesso será liberado automaticamente!`)
      }

      setNome('')
      setEmail('')
      setSenha('')
      await carregarUsuarios()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">👥 Gerenciamento de Profissionais e Usuários</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Cadastre profissionais, defina senhas ou autorize contas Google sem precisar acessar o Firebase.
        </p>
      </div>

      {erro && <ErroBanner mensagem={erro} onRetry={() => setErro(null)} />}
      {sucesso && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 p-3 text-sm text-green-800 dark:text-green-300">
          ✓ {sucesso}
        </div>
      )}

      {/* Formulário de cadastro de usuário */}
      <form onSubmit={handleCriar} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cadastrar Nova Profissional</h3>
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              onClick={() => setTipoCadastro('emailGoogle')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                tipoCadastro === 'emailGoogle' ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Google (Gmail/Institucional)
            </button>
            <button
              type="button"
              onClick={() => setTipoCadastro('emailSenha')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                tipoCadastro === 'emailSenha' ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Criar E-mail e Senha
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nome da profissional" required>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dra. Mariana Costa"
              className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </Field>
          <Field label="E-mail" required hint={tipoCadastro === 'emailGoogle' ? 'O e-mail que ela usa no Google' : 'E-mail para login'}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mariana@hospital.com"
              className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </Field>

          {tipoCadastro === 'emailSenha' && (
            <Field label="Senha temporária" required hint="Mínimo de 6 caracteres">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="******"
                className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                required
              />
            </Field>
          )}

          <Field label="Perfil de Acesso" required>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as Perfil)}
              className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
            >
              {PERFIL.map((p) => (
                <option key={p} value={p}>
                  {p === 'admin' ? 'Administrador' : p === 'coordenacao' ? 'Coordenação' : 'Psicóloga'}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" loading={salvando}>
            {tipoCadastro === 'emailSenha' ? 'Criar Usuário e Senha' : 'Autorizar E-mail Google'}
          </Button>
        </div>
      </form>

      {/* Lista de usuários */}
      {loading ? (
        <Spinner label="Carregando usuários..." />
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Profissional</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Perfil</th>
                <th className="text-center px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-24">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={`border-t border-gray-100 dark:border-gray-800 ${!u.ativo ? 'opacity-50 bg-gray-50 dark:bg-gray-950/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{u.nome}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                    <div className="text-[11px] font-mono text-gray-400 dark:text-gray-500 truncate max-w-[200px]">UID: {u.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.perfil}
                      onChange={(e) => handleMudarPerfil(u, e.target.value as Perfil)}
                      className="text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 focus:ring-brand-500"
                    >
                      {PERFIL.map((p) => (
                        <option key={p} value={p}>
                          {p === 'admin' ? 'Admin' : p === 'coordenacao' ? 'Coordenação' : 'Psicóloga'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.ativo ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border dark:border-green-800/50' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 min-h-0"
                        onClick={() => handleToggleAtivo(u)}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs px-2 py-1 min-h-0"
                        onClick={() => handleExcluir(u)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                    Nenhum usuário cadastrado na coleção 'usuarios'.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
