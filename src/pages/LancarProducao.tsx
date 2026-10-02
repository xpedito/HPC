import { useState, useCallback } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegistroInputSchema, toDateString, turnoSugerido, toAnoMes } from '@/schemas/registro'
import type { RegistroDoc } from '@/schemas/registro'
import { useDominios } from '@/hooks/useDominios'
import { useRegistrosMes, useRegistrosCrud } from '@/hooks/useRegistros'
import { Field, Select, Button, Spinner, ErroBanner } from '@/components/ui'
import { filtrarPorDia } from '@/logic/indicadores'
import type { AuthState } from '@/hooks/useAuth'

type FormData = z.infer<typeof RegistroInputSchema>

interface Props {
  authState: Extract<AuthState, { status: 'authenticated' }>
}

function docDataStr(doc: RegistroDoc): string {
  if (doc.data instanceof Date) return toDateString(doc.data)
  if (typeof doc.data === 'string') return doc.data.slice(0, 10)
  return toDateString(new Date(doc.data as unknown as string))
}

const BLANK_DEFAULTS = {
  acompanhante: 'Não' as const,
  necessitaSeguimento: 'Não se aplica' as const,
  houveAtendimento: 'Não' as const,
}

export default function LancarProducao({ authState }: Props) {
  const hoje = toDateString(new Date())
  const { usuario } = authState

  const { valores, loading: loadingDominios } = useDominios()
  const anoMes = toAnoMes(hoje)
  const { docs: docsMes, loading: loadingDocs } = useRegistrosMes(anoMes)
  const { salvar, atualizar, excluir, saving, erro: erroSalvar } = useRegistrosCrud(
    usuario.id,
    usuario.nome,
  )

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(RegistroInputSchema),
    defaultValues: {
      data:         hoje,
      turno:        turnoSugerido(),
      profissional: usuario.nome,
      ...BLANK_DEFAULTS,
    },
  })

  const eixo             = watch('eixo')
  const houveAtendimento = watch('houveAtendimento')
  const dataAtual        = watch('data')
  const isAssistencia    = eixo === 'Assistência ao paciente/família'

  const docsHoje = filtrarPorDia(docsMes, dataAtual ?? hoje)

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setErroMsg(null)
    try {
      if (editandoId) {
        await atualizar(editandoId, data)
        setEditandoId(null)
      }
      else {
        await salvar(data)
      }
      // "Salvar e lançar outro": preserva data, turno, setor, profissional
      reset({
        data:         getValues('data'),
        turno:        getValues('turno'),
        setor:        getValues('setor'),
        profissional: usuario.nome,
        ...BLANK_DEFAULTS,
      } as Partial<FormData>)
    } catch {
      setErroMsg('Falha ao salvar. Verifique a conexão e tente novamente.')
    }
  }

  // ─── Edição ───────────────────────────────────────────────────────────────────

  const iniciarEdicao = useCallback((doc: RegistroDoc) => {
    setEditandoId(doc.id)
    reset({
      ...doc,
      data: docDataStr(doc),
    } as Partial<FormData>)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [reset])

  const cancelarEdicao = useCallback(() => {
    setEditandoId(null)
    reset({
      data:         hoje,
      turno:        turnoSugerido(),
      profissional: usuario.nome,
      ...BLANK_DEFAULTS,
    } as Partial<FormData>)
  }, [hoje, usuario.nome, reset])

  const handleExcluir = useCallback(async (id: string) => {
    if (!confirm('Excluir este registro?')) return
    try {
      await excluir(id)
    } catch {
      setErroMsg('Falha ao excluir. Tente novamente.')
    }
  }, [excluir])

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loadingDominios) return <Spinner label="Carregando listas…" />

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {editandoId ? '✏️ Editar registro' : '📋 Lançar produção'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Profissional: <strong>{usuario.nome}</strong>
        </p>
      </div>

      {/* Erro persistente (conexão) */}
      {(erroMsg || erroSalvar) && (
        <ErroBanner
          mensagem={erroMsg ?? erroSalvar?.message ?? 'Erro desconhecido'}
          onRetry={() => setErroMsg(null)}
        />
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        <Field label="Data" required error={errors.data?.message}>
          <input
            type="date"
            max={hoje}
            className={`block w-full min-h-tap rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:border-transparent ${errors.data ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-500'}`}
            {...register('data')}
          />
        </Field>

        <Field label="Turno" required error={errors.turno?.message}>
          <Select options={valores('turno')} placeholder="Selecione" error={!!errors.turno} {...register('turno')} />
        </Field>

        <Field label="Eixo" required error={errors.eixo?.message}>
          <Select options={valores('eixo')} placeholder="Selecione" error={!!errors.eixo} {...register('eixo')} />
        </Field>

        <Field label="Setor" required error={errors.setor?.message}>
          <Select options={valores('setor')} placeholder="Selecione" error={!!errors.setor} {...register('setor')} />
        </Field>

        <Field label="Público" required error={errors.publico?.message}>
          <Select options={valores('publico')} placeholder="Selecione" error={!!errors.publico} {...register('publico')} />
        </Field>

        <Field label="Origem do contato" required error={errors.origemContato?.message}>
          <Select options={valores('origemContato')} placeholder="Selecione" error={!!errors.origemContato} {...register('origemContato')} />
        </Field>

        <Field label="Houve atendimento psicológico?" required error={errors.houveAtendimento?.message}>
          <Select options={['Sim', 'Não', 'REVISAR']} error={!!errors.houveAtendimento} {...register('houveAtendimento')} />
        </Field>

        <Field label="Modalidade" required error={errors.modalidade?.message}>
          <Select options={valores('modalidade')} placeholder="Selecione" error={!!errors.modalidade} {...register('modalidade')} />
        </Field>

        <Field label="Local da intervenção" required error={errors.localIntervencao?.message}>
          <Select options={valores('localIntervencao')} placeholder="Selecione" error={!!errors.localIntervencao} {...register('localIntervencao')} />
        </Field>

        <Field label="Procedimento" required={houveAtendimento === 'Sim'} error={errors.procedimento?.message}>
          <Select options={valores('procedimento')} placeholder="Selecione" error={!!errors.procedimento} {...register('procedimento')} />
        </Field>

        {isAssistencia && (
          <Field label="Demanda" required={houveAtendimento === 'Sim'} error={errors.demanda?.message}>
            <Select options={valores('demanda')} placeholder="Selecione" error={!!errors.demanda} {...register('demanda')} />
          </Field>
        )}

        {isAssistencia && (
          <Field label="Situação específica" error={errors.situacaoEspecifica?.message}>
            <Select options={valores('situacaoEspecifica')} placeholder="Selecione (opcional)" error={!!errors.situacaoEspecifica} {...register('situacaoEspecifica')} />
          </Field>
        )}

        <Field label="Frequência" required error={errors.frequencia?.message}>
          <Select options={valores('frequencia')} placeholder="Selecione" error={!!errors.frequencia} {...register('frequencia')} />
        </Field>

        <Field label="Encaminhamento" required error={errors.encaminhamento?.message}>
          <Select options={valores('encaminhamento')} placeholder="Selecione" error={!!errors.encaminhamento} {...register('encaminhamento')} />
        </Field>

        <Field label="Necessita seguimento?" required error={errors.necessitaSeguimento?.message}>
          <Select options={['Sim', 'Não', 'Não se aplica']} error={!!errors.necessitaSeguimento} {...register('necessitaSeguimento')} />
        </Field>

        <Field label="Há acompanhante?" required error={errors.acompanhante?.message}>
          <Select options={['Sim', 'Não']} error={!!errors.acompanhante} {...register('acompanhante')} />
        </Field>

        <Field label="Idade" hint="Opcional" error={errors.idade?.message}>
          <input
            type="number"
            min={0}
            max={130}
            placeholder="Ex: 34"
            className="block w-full min-h-tap rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            {...register('idade', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          />
        </Field>

        <Field label="Observação" hint="Texto livre, opcional">
          <textarea
            rows={3}
            placeholder="Anotações adicionais…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            {...register('observacao')}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} className="flex-1">
            {editandoId ? 'Salvar alterações' : 'Salvar e lançar outro'}
          </Button>
          {editandoId && (
            <Button type="button" variant="secondary" onClick={cancelarEdicao}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Lista dos lançamentos do dia */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">
          Lançamentos do dia ({docsHoje.length})
        </h2>

        {loadingDocs && <Spinner label="Carregando registros…" />}

        {!loadingDocs && docsHoje.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum lançamento hoje ainda.
          </p>
        )}

        {docsHoje.map((doc) => (
          <div
            key={doc.id}
            className={`rounded-lg border p-3 space-y-1 ${
              doc.houveAtendimento === 'REVISAR'
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.setor || <span className="text-gray-400">Sem setor</span>}
                  {' · '}{doc.turno}
                </p>
                <p className="text-xs text-gray-600">
                  {doc.publico || '—'} · {doc.origemContato || '—'}
                </p>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    doc.houveAtendimento === 'Sim'
                      ? 'bg-green-100 text-green-800'
                      : doc.houveAtendimento === 'REVISAR'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.houveAtendimento === 'Sim'
                      ? '✓ Atendimento'
                      : doc.houveAtendimento === 'REVISAR'
                      ? '⚠ REVISAR'
                      : 'Sem atendimento'}
                  </span>
                  {doc.procedimento && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                      {doc.procedimento}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => iniciarEdicao(doc)} className="text-xs text-brand-600 hover:text-brand-800 px-2 py-1 rounded" title="Editar">✏️</button>
                <button onClick={() => handleExcluir(doc.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded" title="Excluir">🗑</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
