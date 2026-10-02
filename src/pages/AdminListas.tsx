import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { DOMINIO_CAMPO_MAP } from '@/schemas/registro'
import type { DominioItem } from '@/schemas/registro'
import { Button, Field, Spinner, ErroBanner } from '@/components/ui'

const CHAVES_DOMINIO = Object.keys(DOMINIO_CAMPO_MAP)

const NOMES_DOMINIO: Record<string, string> = {
  turno:              'Turno',
  eixo:               'Eixo',
  setor:              'Setor',
  publico:            'Público',
  origemContato:      'Origem do contato',
  localIntervencao:   'Local da intervenção',
  procedimento:       'Procedimento',
  demanda:            'Demanda',
  situacaoEspecifica: 'Situação específica',
  frequencia:         'Frequência',
  encaminhamento:     'Encaminhamento',
  modalidade:         'Modalidade',
}

export default function AdminListas() {
  const [chaveAtiva, setChaveAtiva] = useState(CHAVES_DOMINIO[0])
  const [itens, setItens]           = useState<DominioItem[]>([])
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState<string | null>(null)

  // Formulário de novo item
  const [novoValor, setNovoValor] = useState('')
  const [salvando, setSalvando]   = useState(false)

  async function carregarItens(chave: string) {
    setLoading(true)
    setErro(null)
    try {
      const q = query(
        collection(db, 'dominios', chave, 'itens'),
        orderBy('ordem', 'asc'),
      )
      const snap = await getDocs(q)
      setItens(snap.docs.map((d) => ({
        id:    d.id,
        valor: d.data().valor as string,
        ordem: d.data().ordem as number,
        ativo: d.data().ativo as boolean,
      })))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregarItens(chaveAtiva) }, [chaveAtiva])

  /** Verifica se o item está em uso antes de excluir */
  async function itemEmUso(valor: string): Promise<boolean> {
    const campo = DOMINIO_CAMPO_MAP[chaveAtiva]
    if (!campo) return false
    const q = query(
      collection(db, 'registros'),
      where(campo as string, '==', valor),
      limit(1),
    )
    const snap = await getDocs(q)
    return !snap.empty
  }

  async function toggleAtivo(item: DominioItem) {
    if (item.ativo) {
      // Desativando: permitido sempre (não apaga, só inativa)
      await updateDoc(doc(db, 'dominios', chaveAtiva, 'itens', item.id), { ativo: false })
    } else {
      await updateDoc(doc(db, 'dominios', chaveAtiva, 'itens', item.id), { ativo: true })
    }
    await carregarItens(chaveAtiva)
  }

  async function excluirItem(item: DominioItem) {
    setErro(null)
    const emUso = await itemEmUso(item.valor)
    if (emUso) {
      setErro(`"${item.valor}" está em uso em registros existentes. Desative-o em vez de excluir.`)
      return
    }
    if (!confirm(`Excluir "${item.valor}"? Esta ação não pode ser desfeita.`)) return
    await deleteDoc(doc(db, 'dominios', chaveAtiva, 'itens', item.id))
    await carregarItens(chaveAtiva)
  }

  async function adicionarItem() {
    const valor = novoValor.trim()
    if (!valor) return

    // Verifica duplicata
    if (itens.some((i) => i.valor.toLowerCase() === valor.toLowerCase())) {
      setErro('Já existe um item com esse valor.')
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      const ordemMax = itens.reduce((max, i) => Math.max(max, i.ordem), -1)
      await addDoc(collection(db, 'dominios', chaveAtiva, 'itens'), {
        valor,
        ordem: ordemMax + 1,
        ativo: true,
      })
      setNovoValor('')
      await carregarItens(chaveAtiva)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">⚙️ Administração de listas</h1>

      {/* Seletor de domínio */}
      <div className="flex flex-wrap gap-2">
        {CHAVES_DOMINIO.map((chave) => (
          <button
            key={chave}
            onClick={() => setChaveAtiva(chave)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              chaveAtiva === chave
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {NOMES_DOMINIO[chave]}
          </button>
        ))}
      </div>

      {/* Erro */}
      {erro && <ErroBanner mensagem={erro} onRetry={() => setErro(null)} />}

      {/* Adicionar novo item */}
      <div className="flex gap-2">
        <Field label="Novo item" className="flex-1">
          <input
            type="text"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarItem()}
            placeholder={`Novo valor para ${NOMES_DOMINIO[chaveAtiva]}…`}
            className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </Field>
        <div className="flex items-end">
          <Button
            variant="primary"
            loading={salvando}
            onClick={adicionarItem}
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de itens */}
      {loading && <Spinner />}

      {!loading && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Valor</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600 w-20">Status</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t border-gray-100 ${!item.ativo ? 'opacity-40' : ''}`}
                >
                  <td className="px-4 py-3">
                    {item.valor}
                    {!item.ativo && (
                      <span className="ml-2 text-xs text-gray-400">(inativo)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 min-h-0"
                        onClick={() => toggleAtivo(item)}
                      >
                        {item.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs px-2 py-1 min-h-0"
                        onClick={() => excluirItem(item)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhum item cadastrado.
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
