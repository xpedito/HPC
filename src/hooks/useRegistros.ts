import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { RegistroDoc, RegistroInput } from '@/schemas/registro'
import { toAnoMes } from '@/schemas/registro'

/** Converte Timestamp ou Date do Firestore para Date JS */
function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate()
  if (v instanceof Date)      return v
  return new Date(v as string)
}

/** Hook para leitura em tempo real dos registros de um anoMes. */
export function useRegistrosMes(anoMes: string) {
  const [docs, setDocs]       = useState<RegistroDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!anoMes) return

    setLoading(true)
    // Consulta simples filtrando apenas por anoMes. A ordenação é feita em memória
    // para evitar erros de índice composto inexistente no Firestore.
    const q = query(
      collection(db, 'registros'),
      where('anoMes', '==', anoMes),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const result: RegistroDoc[] = snap.docs.map((d) => {
          const raw = d.data()
          return {
            ...(raw as Omit<RegistroDoc, 'id' | 'data' | 'criadoEm' | 'atualizadoEm'>),
            id:          d.id,
            data:        toDate(raw.data),
            criadoEm:    toDate(raw.criadoEm),
            atualizadoEm: toDate(raw.atualizadoEm),
          } as RegistroDoc
        })

        // Ordenação em memória por data decrescente (e criadoEm decrescente)
        result.sort((a, b) => {
          const timeA = a.data instanceof Date ? a.data.getTime() : new Date(a.data).getTime()
          const timeB = b.data instanceof Date ? b.data.getTime() : new Date(b.data).getTime()
          if (timeB !== timeA) return timeB - timeA
          const crA = a.criadoEm instanceof Date ? a.criadoEm.getTime() : 0
          const crB = b.criadoEm instanceof Date ? b.criadoEm.getTime() : 0
          return crB - crA
        })

        setDocs(result)
        setLoading(false)
      },
      (err) => {
        console.error('Erro ao ler registros do mês no Firestore:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsub
  }, [anoMes])

  return { docs, loading, error }
}

/** Hook para operações CRUD de registros. */
export function useRegistrosCrud(criadoPor: string, profissional: string) {
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState<Error | null>(null)

  const salvar = useCallback(
    async (input: RegistroInput): Promise<string> => {
      setSaving(true)
      setErro(null)
      try {
        // Converte data string para Timestamp meia-noite local
        const [ano, mes, dia] = input.data.split('-').map(Number)
        const dataTimestamp = Timestamp.fromDate(new Date(ano, mes - 1, dia))
        const anoMes = toAnoMes(input.data)

        const payload = {
          ...input,
          anoMes,
          data:       dataTimestamp,
          criadoPor,
          profissional,
          criadoEm:    serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        }

        // Remove campos undefined para evitar erro "Unsupported field value: undefined" no Firestore
        const payloadLimpo = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined)
        )

        const ref = await addDoc(collection(db, 'registros'), payloadLimpo)
        return ref.id
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setErro(e)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [criadoPor, profissional],
  )

  const atualizar = useCallback(
    async (id: string, input: Partial<RegistroInput>): Promise<void> => {
      setSaving(true)
      setErro(null)
      try {
        const patch: Record<string, unknown> = {
          ...input,
          atualizadoEm: serverTimestamp(),
        }
        // Se mudou a data, recalcula data e anoMes
        if (input.data) {
          const [ano, mes, dia] = input.data.split('-').map(Number)
          patch.data   = Timestamp.fromDate(new Date(ano, mes - 1, dia))
          patch.anoMes = toAnoMes(input.data)
        }

        const patchLimpo = Object.fromEntries(
          Object.entries(patch).filter(([_, v]) => v !== undefined)
        )
        await updateDoc(doc(db, 'registros', id), patchLimpo)
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        setErro(e)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const excluir = useCallback(async (id: string): Promise<void> => {
    setSaving(true)
    setErro(null)
    try {
      await deleteDoc(doc(db, 'registros', id))
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setErro(e)
      throw e
    } finally {
      setSaving(false)
    }
  }, [])

  return { salvar, atualizar, excluir, saving, erro }
}
