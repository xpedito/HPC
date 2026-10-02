import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { DominioItem } from '@/schemas/registro'

/** Mapa completo de todos os domínios: { chave: DominioItem[] } */
export type DominiosMap = Record<string, DominioItem[]>

const CHAVES_DOMINIO_LIST = [
  'turno', 'eixo', 'setor', 'publico', 'origemContato',
  'localIntervencao', 'procedimento', 'demanda', 'situacaoEspecifica',
  'frequencia', 'encaminhamento', 'modalidade',
]

/** Hook que sincroniza em tempo real TODOS os domínios ativos via onSnapshot.
 *  Qualquer item adicionado no Admin ou em outra aba reflete instantaneamente!
 */
export function useDominios() {
  const [dominios, setDominios] = useState<DominiosMap>({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<Error | null>(null)

  useEffect(() => {
    let unsubs: Array<() => void> = []

    try {
      unsubs = CHAVES_DOMINIO_LIST.map((chave) => {
        // Consulta simples por coleção sem exigir índice composto (ordena em memória)
        const q = collection(db, 'dominios', chave, 'itens')
        return onSnapshot(
          q,
          (snap) => {
            const itens = snap.docs
              .map((d) => ({
                id:    d.id,
                valor: (d.data().valor ?? '') as string,
                ordem: (d.data().ordem ?? 0) as number,
                ativo: d.data().ativo !== false, // default true
              }))
              .filter((i) => i.ativo && i.valor.trim() !== '')
              .sort((a, b) => a.ordem - b.ordem)

            setDominios((prev) => ({
              ...prev,
              [chave]: itens,
            }))
            setLoading(false)
          },
          (err) => {
            console.error(`Erro ao sincronizar domínio ${chave}:`, err)
            setError(err)
            setLoading(false)
          },
        )
      })
    } catch (err: unknown) {
      console.error('Erro ao configurar listeners de domínio:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setLoading(false)
    }

    return () => {
      unsubs.forEach((unsub) => unsub())
    }
  }, [])

  /** Retorna os valores de um domínio como array de strings */
  function valores(chave: string): string[] {
    return (dominios[chave] ?? []).map((i) => i.valor)
  }

  /** Adiciona um novo item ao domínio diretamente pelo formulário */
  async function adicionarItem(chave: string, novoValor: string): Promise<string> {
    const valor = novoValor.trim()
    if (!valor) throw new Error('Valor não pode ser vazio.')

    const itensAtuais = dominios[chave] || []
    const jaExiste = itensAtuais.some((i) => i.valor.toLowerCase() === valor.toLowerCase())
    if (jaExiste) return valor

    const ordemMax = itensAtuais.reduce((max, i) => Math.max(max, i.ordem), -1)
    const novoItemData = {
      valor,
      ordem: ordemMax + 1,
      ativo: true,
    }

    await addDoc(collection(db, 'dominios', chave, 'itens'), novoItemData)

    return valor
  }

  return { dominios, loading, error, valores, adicionarItem }
}
