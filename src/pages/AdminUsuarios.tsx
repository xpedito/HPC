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
  const [uid, setUid]             = useState('')
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [perfil, setPerfil]       = useState<Perfil>('psicologa')
  const [salvando, setSalvando]   = useState(false)

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
    const targetUid = uid.trim()
    const targetEmail = email.trim()
    const targetNome = nome.trim()

    if (!targetUid || !targetEmail || !targetNome) {
      setErro('Preencha UID, Nome e E-mail.')
      return
    }

    setSalvando(true)
    try {
      await setDoc(doc(db, 'usuarios', targetUid), {
        nome: targetNome,
        email: targetEmail,
        perfil,
        ativo: true,
        criadoEm: serverTimestamp(),
      })
      setSucesso(`Usuário ${targetNome} cadastrado com sucesso!`)
      setUid('')
      setNome('')
      setEmail('')
      setPerfil('psicologa')
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
        <h2 className="text-lg font-bold text-gray-900">👥 Gerenciamento de Usuários</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Libere ou revogue acesso de psicólogas e administradores. O UID é gerado pelo Firebase Auth ao criar conta ou logar com o Google.
        </p>
      </div>

      {erro && <ErroBanner mensagem={erro} onRetry={() => setErro(null)} />}
      {sucesso && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          ✓ {sucesso}
        </div>
      )}

      {/* Formulário de cadastro de usuário */}
      <form onSubmit={handleCriar} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Autorizar novo usuário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="User UID (do Firebase Auth)" required hint="Copie o UID gerado pelo Firebase Auth ou informe o UID do Google">
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="ex: pQwErTy12345..."
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </Field>
          <Field label="Nome da profissional" required>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dra. Mariana Costa"
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </Field>
          <Field label="E-mail institucional/Google" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mariana@hospital.com"
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </Field>
          <Field label="Perfil de Acesso" required>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as Perfil)}
              className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
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
            Salvar e Autorizar Acesso
          </Button>
        </div>
      </form>

      {/* Lista de usuários */}
      {loading ? (
        <Spinner label="Carregando usuários..." />
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Profissional</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Perfil</th>
                <th className="text-center px-4 py-2.5 font-medium text-gray-600 w-24">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={`border-t border-gray-100 ${!u.ativo ? 'opacity-50 bg-gray-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.nome}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                    <div className="text-[11px] font-mono text-gray-400 truncate max-w-[200px]">UID: {u.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.perfil}
                      onChange={(e) => handleMudarPerfil(u, e.target.value as Perfil)}
                      className="text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:ring-brand-500"
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
                        u.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
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
