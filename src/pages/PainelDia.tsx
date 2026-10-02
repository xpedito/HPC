import { useState, useMemo } from 'react'
import { useRegistrosMes } from '@/hooks/useRegistros'
import { Spinner, QualidadeBadge } from '@/components/ui'
import {
  calcularIndicadores,
  tabelaPorSetor,
  tabelaPorPublico,
  tabelaPorDemanda,
  filtrarPorDia,
  filtrarAcumuladoMes,
} from '@/logic/indicadores'
import { toDateString, toAnoMes, diasNoMes, diasDecorridosNoMes } from '@/schemas/registro'

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}
function num(n: number, decimais = 1): string {
  return Number.isFinite(n) ? n.toFixed(decimais) : '—'
}

interface IndicadorLinhaProps {
  label:     string
  dia:       number | string
  mes:       number | string
  destaque?: boolean
}

function IndicadorLinha({ label, dia, mes, destaque }: IndicadorLinhaProps) {
  return (
    <div className={`flex items-center py-2 border-b border-gray-100 last:border-0 gap-2 ${destaque ? 'font-semibold' : ''}`}>
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      <span className="w-14 text-right text-sm tabular-nums text-gray-900">{dia}</span>
      <span className="w-14 text-right text-sm tabular-nums text-brand-700">{mes}</span>
    </div>
  )
}

function TabelaDistribuicao({ titulo, linhas, total }: {
  titulo: string
  linhas: Array<{ categoria: string; total: number }>
  total:  number
}) {
  if (linhas.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Categoria</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 w-16">N</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 w-16">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr
                key={l.categoria}
                className={`border-t border-gray-100 ${l.categoria === 'Não classificado' ? 'bg-amber-50 text-amber-800' : ''}`}
              >
                <td className="px-3 py-2">{l.categoria}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.total}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                  {total > 0 ? pct(l.total / total) : '—'}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{total}</td>
              <td className="px-3 py-2 text-right text-gray-500">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PainelDia() {
  const hoje = toDateString(new Date())
  const [dataSelecionada, setDataSelecionada] = useState(hoje)

  const anoMes = toAnoMes(dataSelecionada)
  const { docs: docsMes, loading } = useRegistrosMes(anoMes)

  const { indDia, indMes, tabSetorMes, tabPublicoMes, tabDemandaMes } = useMemo(() => {
    const docsD = filtrarPorDia(docsMes, dataSelecionada)
    const docsM = filtrarAcumuladoMes(docsMes, dataSelecionada)

    const diasDecorridos = diasDecorridosNoMes(anoMes, dataSelecionada)
    const diasMes        = diasNoMes(anoMes)

    return {
      indDia:      calcularIndicadores(docsD, 1, diasMes),
      indMes:      calcularIndicadores(docsM, diasDecorridos, diasMes),
      tabSetorMes:  tabelaPorSetor(docsM),
      tabPublicoMes: tabelaPorPublico(docsM),
      tabDemandaMes: tabelaPorDemanda(docsM),
    }
  }, [docsMes, dataSelecionada, anoMes])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">📊 Painel do dia</h1>
        <input
          type="date"
          max={hoje}
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading && <Spinner />}

      {!loading && (
        <>
          {/* Indicadores principais */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Cabeçalho da tabela */}
            <div className="flex px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide gap-2">
              <span className="flex-1">Indicador</span>
              <span className="w-14 text-right">Dia</span>
              <span className="w-14 text-right text-brand-600">Mês</span>
            </div>

            <div className="px-3 divide-y divide-gray-100">
              <IndicadorLinha destaque label="Registros assistenciais"
                dia={indDia.registrosAssistenciais} mes={indMes.registrosAssistenciais} />
              <IndicadorLinha label="Visitas / monitoramento de rotina"
                dia={indDia.visitasRotina} mes={indMes.visitasRotina} />
              <IndicadorLinha label="Ocorrências com atendimento"
                dia={indDia.ocorrenciasComAtendimento} mes={indMes.ocorrenciasComAtendimento} />
              <IndicadorLinha label="Atendimentos — pacientes"
                dia={indDia.atendimentosPacientes} mes={indMes.atendimentosPacientes} />
              <IndicadorLinha label="Atendimentos — familiares/acompanhantes"
                dia={indDia.atendimentosFamiliares} mes={indMes.atendimentosFamiliares} />
              <IndicadorLinha label="Atendimentos conjuntos"
                dia={indDia.atendimentosConjuntos} mes={indMes.atendimentosConjuntos} />
              <IndicadorLinha label="Acolhimentos de familiar"
                dia={indDia.acolhimentosFamiliar} mes={indMes.acolhimentosFamiliar} />
              <IndicadorLinha label="Intervenções em crise"
                dia={indDia.intervencoesCrise} mes={indMes.intervencoesCrise} />
              <IndicadorLinha label="Encaminhamentos"
                dia={indDia.encaminhamentos} mes={indMes.encaminhamentos} />
            </div>
          </div>

          {/* Métricas do mês */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Métricas do mês ({anoMes})
            </div>
            <div className="px-3 divide-y divide-gray-100">
              <IndicadorLinha label="Dias com registro"
                dia="—" mes={indMes.diasComRegistro} />
              <IndicadorLinha label="Média de registros/dia com registro"
                dia="—" mes={num(indMes.mediaRegistrosPorDia)} />
              <IndicadorLinha label="Taxa de intervenção"
                dia={pct(indDia.taxaIntervencao)} mes={pct(indMes.taxaIntervencao)} />
              <IndicadorLinha label="Taxa de encaminhamento"
                dia={pct(indDia.taxaEncaminhamento)} mes={pct(indMes.taxaEncaminhamento)} />
            </div>
            {/* Projeção */}
            <div className="px-3 py-3 bg-blue-50 border-t border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-0.5">
                Projeção do mês <span className="font-normal">(estimativa de ritmo, não meta)</span>
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {Math.round(indMes.projecaoMes)} registros
              </p>
            </div>
          </div>

          {/* Qualidade do preenchimento */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Qualidade do preenchimento — mês
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <QualidadeBadge value={indMes.linhasRevisar}       label="Pendentes REVISAR" />
              <QualidadeBadge value={indMes.linhasSemSetor}      label="Sem setor" />
              <QualidadeBadge value={indMes.linhasSemPublico}    label="Sem público" />
              <QualidadeBadge value={indMes.linhasSemProcedimento} label="Sem procedimento" />
            </div>
          </div>

          {/* Tabelas de distribuição */}
          <TabelaDistribuicao
            titulo="Produção por setor"
            linhas={tabSetorMes.linhas}
            total={tabSetorMes.totalDocs}
          />
          <TabelaDistribuicao
            titulo="Produção por público"
            linhas={tabPublicoMes.linhas}
            total={tabPublicoMes.totalDocs}
          />
          <TabelaDistribuicao
            titulo="Produção por demanda (assistência ao paciente/família)"
            linhas={tabDemandaMes.linhas}
            total={tabDemandaMes.totalDocs}
          />
        </>
      )}
    </div>
  )
}
