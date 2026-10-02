/**
 * Funções puras de cálculo dos indicadores do Painel do Dia.
 *
 * Todas as funções recebem um array de RegistroDoc (já filtrado por anoMes e
 * opcionalmente por data) e retornam um número ou objeto.
 *
 * Não há dependência de Firebase, React ou DOM — testável com Vitest puro.
 *
 * REGRAS FUNDAMENTAIS (não podem ser violadas):
 * 1. Visita e atendimento são dimensões independentes. Uma ocorrência pode ser
 *    ambas ao mesmo tempo — não é dupla contagem.
 * 2. A mesma paciente pode gerar vários documentos no mesmo dia — não bloquear.
 * 3. Só conta como atendimento quando houveAtendimento = 'Sim' explicitamente.
 */

import type { RegistroDoc } from '../schemas/registro'

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export type Indicadores = {
  // Contagens primárias
  registrosAssistenciais:          number
  visitasRotina:                   number
  ocorrenciasComAtendimento:       number
  atendimentosPacientes:           number
  atendimentosFamiliares:          number
  atendimentosConjuntos:           number
  acolhimentosFamiliar:            number
  intervencoesCrise:               number
  encaminhamentos:                 number

  // Métricas do mês
  diasComRegistro:                 number
  mediaRegistrosPorDia:            number

  // Taxas (0 a 1; exibir como %)
  taxaIntervencao:                 number  // atendimentos / registrosAssistenciais
  taxaEncaminhamento:              number  // encaminhamentos / atendimentos

  // Projeção (baseada nos dias decorridos vs dias do mês)
  projecaoMes:                     number

  // Qualidade do preenchimento
  linhasRevisar:                   number
  linhasSemSetor:                  number
  linhasSemPublico:                number
  linhasSemProcedimento:           number
}

export type TabelaLinha = { categoria: string; total: number }

export type TabelaComNaoClassificado = {
  linhas:    TabelaLinha[]
  totalDocs: number
}

// ─── Constantes internas ──────────────────────────────────────────────────────

const EIXO_ASSISTENCIA = 'Assistência ao paciente/família'

const PUBLICOS_FAMILIAR = new Set([
  'Familiar',
  'Acompanhante',
  'Mãe de RN/NEO',
  'Pai/familiar de RN',
])

const ENCAMINHAMENTOS_NULOS = new Set(['Nenhum', 'Não se aplica'])

// ─── Helpers internos ─────────────────────────────────────────────────────────

function isVisitaRotina(doc: RegistroDoc): boolean {
  const v = (doc.origemContato ?? '').toLowerCase()
  return v.includes('visita') && v.includes('rotina')
}

function isAtendimento(doc: RegistroDoc): boolean {
  return doc.houveAtendimento === 'Sim'
}

function isFamiliar(doc: RegistroDoc): boolean {
  return PUBLICOS_FAMILIAR.has(doc.publico ?? '')
}

function isAcolhimentoFamiliar(doc: RegistroDoc): boolean {
  return (
    isFamiliar(doc) &&
    (doc.procedimento ?? '').toLowerCase().includes('acolhimento')
  )
}

function isEncaminhamento(doc: RegistroDoc): boolean {
  return (
    isAtendimento(doc) &&
    !!doc.encaminhamento &&
    !ENCAMINHAMENTOS_NULOS.has(doc.encaminhamento)
  )
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Calcula todos os indicadores a partir de um conjunto de documentos.
 *
 * @param docs        Documentos já filtrados pelo período desejado.
 * @param diasDecorridos Número de dias já decorridos no período (para projeção).
 * @param diasDoMes   Total de dias do mês (para projeção).
 */
export function calcularIndicadores(
  docs: RegistroDoc[],
  diasDecorridos: number,
  diasDoMes: number,
): Indicadores {
  const assistenciais = docs.filter((d) => d.eixo === EIXO_ASSISTENCIA)
  const atendimentos  = docs.filter(isAtendimento)
  const encaminhados  = docs.filter(isEncaminhamento)

  const registrosAssistenciais    = assistenciais.length
  const visitasRotina             = docs.filter(isVisitaRotina).length
  const ocorrenciasComAtendimento = atendimentos.length
  const atendimentosPacientes     = atendimentos.filter((d) => d.publico === 'Paciente').length
  const atendimentosFamiliares    = atendimentos.filter(isFamiliar).length
  const atendimentosConjuntos     = atendimentos.filter(
    (d) => d.publico === 'Paciente + acompanhante/familiar',
  ).length
  // Acolhimentos de familiar: NÃO requer houveAtendimento = 'Sim'
  // Conta todos os documentos com público familiar E procedimento contendo 'Acolhimento'
  const acolhimentosFamiliar = docs.filter(isAcolhimentoFamiliar).length
  const intervencoesCrise    = atendimentos.filter(
    (d) => d.procedimento === 'Intervenção em crise',
  ).length
  const encaminhamentos = encaminhados.length

  // Métricas do mês
  const datasDistintas = new Set(docs.map((d) => d.data.toString().slice(0, 10)))
  const diasComRegistro   = datasDistintas.size
  const mediaRegistrosPorDia = diasComRegistro > 0
    ? docs.length / diasComRegistro
    : 0

  // Taxas
  const taxaIntervencao = registrosAssistenciais > 0
    ? ocorrenciasComAtendimento / registrosAssistenciais
    : 0
  const taxaEncaminhamento = ocorrenciasComAtendimento > 0
    ? encaminhamentos / ocorrenciasComAtendimento
    : 0

  // Projeção do mês (estimativa de ritmo, não meta)
  const projecaoMes = diasDecorridos > 0
    ? (docs.length / diasDecorridos) * diasDoMes
    : 0

  // Qualidade do preenchimento
  const linhasRevisar       = docs.filter((d) => d.houveAtendimento === 'REVISAR').length
  const linhasSemSetor      = docs.filter((d) => !d.setor || d.setor.trim() === '').length
  const linhasSemPublico    = docs.filter((d) => !d.publico || d.publico.trim() === '').length
  const linhasSemProcedimento = docs.filter(
    (d) => !d.procedimento || d.procedimento.trim() === '',
  ).length

  return {
    registrosAssistenciais,
    visitasRotina,
    ocorrenciasComAtendimento,
    atendimentosPacientes,
    atendimentosFamiliares,
    atendimentosConjuntos,
    acolhimentosFamiliar,
    intervencoesCrise,
    encaminhamentos,
    diasComRegistro,
    mediaRegistrosPorDia,
    taxaIntervencao,
    taxaEncaminhamento,
    projecaoMes,
    linhasRevisar,
    linhasSemSetor,
    linhasSemPublico,
    linhasSemProcedimento,
  }
}

// ─── Tabelas de distribuição ──────────────────────────────────────────────────

/**
 * Produção por setor.
 * Linha "Não classificado" = documentos sem setor ou com setor não listado.
 */
export function tabelaPorSetor(docs: RegistroDoc[]): TabelaComNaoClassificado {
  return agruparComNaoClassificado(docs, (d) => d.setor ?? '')
}

/**
 * Produção por público.
 */
export function tabelaPorPublico(docs: RegistroDoc[]): TabelaComNaoClassificado {
  return agruparComNaoClassificado(docs, (d) => d.publico ?? '')
}

/**
 * Produção por demanda.
 * Inclui apenas documentos com eixo = Assistência ao paciente/família.
 * Documentos sem demanda preenchida vão para "Não classificado".
 */
export function tabelaPorDemanda(docs: RegistroDoc[]): TabelaComNaoClassificado {
  const assistenciais = docs.filter((d) => d.eixo === EIXO_ASSISTENCIA)
  return agruparComNaoClassificado(assistenciais, (d) => d.demanda ?? '')
}

/**
 * Agrupa documentos por uma chave e adiciona "Não classificado".
 * A linha "Não classificado" = totalDocs - soma das categorias nominadas.
 * Isso garante que dado inconsistente apareça em vez de desaparecer.
 */
function agruparComNaoClassificado(
  docs: RegistroDoc[],
  chave: (d: RegistroDoc) => string,
): TabelaComNaoClassificado {
  const contagem = new Map<string, number>()
  let naoClassificado = 0

  for (const doc of docs) {
    const k = chave(doc).trim()
    if (k === '') {
      naoClassificado++
    } else {
      contagem.set(k, (contagem.get(k) ?? 0) + 1)
    }
  }

  const linhas: TabelaLinha[] = Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1]) // maior para menor
    .map(([categoria, total]) => ({ categoria, total }))

  if (naoClassificado > 0) {
    linhas.push({ categoria: 'Não classificado', total: naoClassificado })
  }

  return { linhas, totalDocs: docs.length }
}

// ─── Helper interno para extrair string de data de Date|string ───────────────

function dataStr(d: RegistroDoc): string {
  if (typeof d.data === 'string') return d.data.slice(0, 10)
  return (d.data as Date).toISOString().slice(0, 10)
}

// ─── Filtros de período ───────────────────────────────────────────────────────

/**
 * Filtra documentos de um único dia (string 'YYYY-MM-DD').
 */
export function filtrarPorDia(docs: RegistroDoc[], data: string): RegistroDoc[] {
  return docs.filter((d) => dataStr(d) === data)
}

/**
 * Filtra documentos do início do mês até a data informada (inclusive).
 * Acumulado do mês = data >= início do mês E data <= dataSelecionada.
 */
export function filtrarAcumuladoMes(docs: RegistroDoc[], ate: string): RegistroDoc[] {
  const anoMes = ate.slice(0, 7)
  const inicio = `${anoMes}-01`
  return docs.filter((d) => {
    const docData = dataStr(d)
    return docData >= inicio && docData <= ate
  })
}
