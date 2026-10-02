import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { DominioItem } from '@/schemas/registro'

/** Mapa completo de todos os domínios: { chave: DominioItem[] } */
export type DominiosMap = Record<string, DominioItem[]>

/** Hook que carrega TODOS os domínios ativos de uma vez ao montar.
 *  Os domínios mudam raramente — um único fetch por sessão é suficiente.
 */
export function useDominios() {
  const [dominios, setDominios] = useState<DominiosMap>({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Lista todos os documentos de cada domínio conhecido
        const chaves = [
          'turno', 'eixo', 'setor', 'publico', 'origemContato',
          'localIntervencao', 'procedimento', 'demanda', 'situacaoEspecifica',
          'frequencia', 'encaminhamento', 'modalidade',
        ]

        const resultado: DominiosMap = {}

        await Promise.all(
          chaves.map(async (chave) => {
            const q = query(
              collection(db, 'dominios', chave, 'itens'),
              where('ativo', '==', true),
              orderBy('ordem', 'asc'),
            )
            const snap = await getDocs(q)
            resultado[chave] = snap.docs.map((d) => ({
              id:    d.id,
              valor: d.data().valor as string,
              ordem: d.data().ordem as number,
              ativo: d.data().ativo as boolean,
            }))
          }),
        )

        if (!cancelled) {
          setDominios(resultado)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  /** Retorna os valores de um domínio como array de strings */
  function valores(chave: string): string[] {
    return (dominios[chave] ?? []).map((i) => i.valor)
  }

  return { dominios, loading, error, valores }
}
