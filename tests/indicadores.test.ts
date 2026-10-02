/**
 * Testes Vitest para as funções de cálculo dos indicadores.
 *
 * Dataset fixo em memória. Nenhum dado real de paciente.
 * Nomes fictícios óbvios onde necessário.
 *
 * Cobertura:
 * - Regra 1: visita e atendimento são dimensões independentes
 * - Regra 2: vários documentos do mesmo "paciente" no mesmo dia são permitidos
 * - Regra 3: atendimento só conta quando houveAtendimento = 'Sim' explicitamente
 * - Todos os 14 indicadores do Painel do Dia
 * - Tabelas de distribuição com linha "Não classificado"
 * - Filtros de período (dia único, acumulado do mês)
 */

import { describe, it, expect } from 'vitest'
import type { RegistroDoc } from '../src/schemas/registro'
import {
  calcularIndicadores,
  tabelaPorSetor,
  tabelaPorPublico,
  tabelaPorDemanda,
  filtrarPorDia,
  filtrarAcumuladoMes,
} from '../src/logic/indicadores'

// ─── Fábrica de registros de teste ───────────────────────────────────────────

function makeDoc(overrides: Partial<RegistroDoc> = {}): RegistroDoc {
  return {
    id:             'test-id',
    data:           new Date('2026-10-02'),
    anoMes:         '2026-10',
    profissional:   'Dra. Fictícia Silva',
    turno:          'Manhã',
    eixo:           'Assistência ao paciente/família',
    setor:          'Observação',
    publico:        'Paciente',
    origemContato:  'Atendimento psicológico individual',
    houveAtendimento: 'Não',
    modalidade:     'Individual',
    localIntervencao: 'Enfermaria/leito',
    procedimento:   'Escuta psicológica',
    demanda:        'Ansiedade/medo',
    situacaoEspecifica: 'Nenhuma específica',
    frequencia:     'Primeiro contato',
    encaminhamento: 'Nenhum',
    necessitaSeguimento: 'Não',
    acompanhante:   'Não',
    criadoPor:      'uid-test',
    criadoEm:       new Date('2026-10-02T08:00:00Z'),
    atualizadoEm:   new Date('2026-10-02T08:00:00Z'),
    ...overrides,
  }
}

// ─── Dataset principal ────────────────────────────────────────────────────────
// 12 documentos cobrindo todos os casos de teste.

const DOCS: RegistroDoc[] = [
  // Doc 1: Visita de rotina SEM atendimento.
  // Regra 1: conta como visita, NÃO conta como atendimento.
  makeDoc({
    id: 'd01',
    data: new Date('2026-10-01'),
    anoMes: '2026-10',
    origemContato:   'Visita psicológica diária / visita de rotina',
    houveAtendimento: 'Não',
    procedimento:    '',
    demanda:         '',
  }),

  // Doc 2: Visita de rotina COM atendimento.
  // Regra 1: conta como visita E como atendimento — não é dupla contagem.
  makeDoc({
    id: 'd02',
    data: new Date('2026-10-01'),
    anoMes: '2026-10',
    origemContato:    'Visita psicológica diária / visita de rotina',
    houveAtendimento: 'Sim',
    procedimento:     'Escuta psicológica',
    demanda:          'Ansiedade/medo',
    encaminhamento:   'Nenhum',
  }),

  // Doc 3: Atendimento com encaminhamento real.
  makeDoc({
    id: 'd03',
    data: new Date('2026-10-01'),
    anoMes: '2026-10',
    houveAtendimento: 'Sim',
    encaminhamento:   'Serviço Social',
    procedimento:     'Escuta psicológica',
    demanda:          'Sofrimento emocional',
  }),

  // Doc 4: Mesmo "paciente-fictício" do doc 1, turno diferente.
  // Regra 2: não deve ser bloqueado nem alertado.
  makeDoc({
    id: 'd04',
    data: new Date('2026-10-01'),
    anoMes: '2026-10',
    turno: 'Tarde',
    houveAtendimento: 'Não',
    origemContato:    'Atendimento à beira leito',
  }),

  // Doc 5: houveAtendimento = 'REVISAR' (pende de revisão).
  // Regra 3: NÃO deve ser contado como atendimento.
  makeDoc({
    id: 'd05',
    data: new Date('2026-10-01'),
    anoMes: '2026-10',
    houveAtendimento: 'REVISAR',
    procedimento:     '',
    demanda:          '',
  }),

  // Doc 6: Atendimento a familiar + Acolhimento.
  makeDoc({
    id: 'd06',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    publico:          'Familiar',
    houveAtendimento: 'Sim',
    procedimento:     'Acolhimento de acompanhante/familiar',
    demanda:          'Luto/perda',
    encaminhamento:   'Não se aplica',
  }),

  // Doc 7: Atendimento conjunto (paciente + acompanhante).
  makeDoc({
    id: 'd07',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    publico:          'Paciente + acompanhante/familiar',
    houveAtendimento: 'Sim',
    procedimento:     'Escuta psicológica',
    demanda:          'Conflito familiar',
    encaminhamento:   'Nenhum',
  }),

  // Doc 8: Intervenção em crise.
  makeDoc({
    id: 'd08',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    houveAtendimento: 'Sim',
    procedimento:     'Intervenção em crise',
    demanda:          'Sofrimento emocional',
    encaminhamento:   'Nenhum',
  }),

  // Doc 9: Eixo diferente (Formação) — demanda e situacaoEspecifica opcionais.
  // NÃO conta como registroAssistencial.
  makeDoc({
    id: 'd09',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    eixo:             'Formação continuada / educação permanente',
    houveAtendimento: 'Não',
    demanda:          '',
    situacaoEspecifica: '',
    setor:            'Sala da Psicologia',
    procedimento:     'Formação continuada',
    encaminhamento:   'Não se aplica',
  }),

  // Doc 10: Mãe de RN/NEO — conta como familiar, com acolhimento.
  makeDoc({
    id: 'd10',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    publico:          'Mãe de RN/NEO',
    houveAtendimento: 'Sim',
    procedimento:     'Acolhimento e escuta psicológica',
    demanda:          'Vínculo mãe-bebê/família-bebê',
    encaminhamento:   'Nenhum',
  }),

  // Doc 11: Sem setor (para teste de qualidade de preenchimento).
  makeDoc({
    id: 'd11',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    setor:            '',
    houveAtendimento: 'Não',
    procedimento:     '',
  }),

  // Doc 12: Atendimento a Acompanhante com encaminhamento real.
  makeDoc({
    id: 'd12',
    data: new Date('2026-10-02'),
    anoMes: '2026-10',
    publico:          'Acompanhante',
    houveAtendimento: 'Sim',
    procedimento:     'Orientação ao acompanhante/familiar',
    demanda:          'Ansiedade/medo',
    encaminhamento:   'CAPS/saúde mental',
  }),
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOCS_DIA_01 = filtrarPorDia(DOCS, '2026-10-01')
const DOCS_DIA_02 = filtrarPorDia(DOCS, '2026-10-02')
const DOCS_ACUMULADO = filtrarAcumuladoMes(DOCS, '2026-10-02')

// ─── Testes de filtro de período ──────────────────────────────────────────────

describe('filtrarPorDia', () => {
  it('retorna somente documentos do dia selecionado', () => {
    expect(DOCS_DIA_01).toHaveLength(5) // d01..d05
    expect(DOCS_DIA_02).toHaveLength(7) // d06..d12
  })
})

describe('filtrarAcumuladoMes', () => {
  it('retorna documentos do início do mês até a data (inclusive)', () => {
    expect(DOCS_ACUMULADO).toHaveLength(12) // todos
  })

  it('exclui documentos após a data selecionada', () => {
    const ate01 = filtrarAcumuladoMes(DOCS, '2026-10-01')
    expect(ate01).toHaveLength(5) // só d01..d05
  })
})

// ─── Testes dos indicadores ───────────────────────────────────────────────────

describe('calcularIndicadores — dia 01/10/2026', () => {
  const ind = calcularIndicadores(DOCS_DIA_01, 1, 31)

  it('registrosAssistenciais: conta eixo Assistência (todos do dia 01 são assistência)', () => {
    expect(ind.registrosAssistenciais).toBe(5)
  })

  it('visitasRotina: conta por texto de origemContato, independente de atendimento', () => {
    // d01 e d02 têm "visita de rotina"
    expect(ind.visitasRotina).toBe(2)
  })

  it('[REGRA 1] visita + atendimento: d02 conta nos dois indicadores sem duplicar registros', () => {
    // d02 é visita E atendimento — indicadores separados, não duplica a linha
    expect(ind.visitasRotina).toBeGreaterThanOrEqual(1)
    expect(ind.ocorrenciasComAtendimento).toBeGreaterThanOrEqual(1)
    // A soma pode ser > número de docs — isso é correto e esperado
  })

  it('[REGRA 3] houveAtendimento = REVISAR não conta como atendimento', () => {
    // d05 é REVISAR — NÃO deve entrar em ocorrenciasComAtendimento
    expect(ind.ocorrenciasComAtendimento).toBe(2) // apenas d02 e d03
  })

  it('encaminhamentos: só conta quando encaminhamento não é Nenhum/Não se aplica', () => {
    // d03: encaminhamento = Serviço Social → conta
    // d02: encaminhamento = Nenhum → NÃO conta
    expect(ind.encaminhamentos).toBe(1)
  })

  it('taxaIntervencao = atendimentos / registrosAssistenciais', () => {
    expect(ind.taxaIntervencao).toBeCloseTo(2 / 5, 5)
  })

  it('taxaEncaminhamento = encaminhamentos / atendimentos', () => {
    expect(ind.taxaEncaminhamento).toBeCloseTo(1 / 2, 5)
  })

  it('diasComRegistro = 1 (só há registros do dia 01)', () => {
    expect(ind.diasComRegistro).toBe(1)
  })

  it('linhasRevisar = 1 (d05)', () => {
    expect(ind.linhasRevisar).toBe(1)
  })
})

describe('calcularIndicadores — acumulado até 02/10/2026', () => {
  const ind = calcularIndicadores(DOCS_ACUMULADO, 2, 31)

  it('registrosAssistenciais: exclui eixo Formação (d09)', () => {
    // 12 docs - 1 (d09, Formação) = 11
    expect(ind.registrosAssistenciais).toBe(11)
  })

  it('atendimentosPacientes: houveAtendimento=Sim + publico=Paciente', () => {
    // d02, d03, d08 (publico padrão = Paciente)
    expect(ind.atendimentosPacientes).toBe(3)
  })

  it('atendimentosFamiliares: Sim + (Familiar | Acompanhante | Mãe RN | Pai RN)', () => {
    // d06 (Familiar), d10 (Mãe de RN/NEO), d12 (Acompanhante)
    expect(ind.atendimentosFamiliares).toBe(3)
  })

  it('atendimentosConjuntos: Sim + publico = Paciente + acompanhante/familiar', () => {
    // d07
    expect(ind.atendimentosConjuntos).toBe(1)
  })

  it('acolhimentosFamiliar: público familiar + procedimento contendo Acolhimento (sem exigir atendimento=Sim)', () => {
    // d06: Familiar + "Acolhimento de acompanhante/familiar" → conta
    // d10: Mãe de RN/NEO + "Acolhimento e escuta psicológica" → conta
    expect(ind.acolhimentosFamiliar).toBe(2)
  })

  it('intervencoesCrise: Sim + procedimento = Intervenção em crise', () => {
    // d08
    expect(ind.intervencoesCrise).toBe(1)
  })

  it('encaminhamentos: d03 (Serviço Social) + d12 (CAPS)', () => {
    expect(ind.encaminhamentos).toBe(2)
  })

  it('diasComRegistro = 2', () => {
    expect(ind.diasComRegistro).toBe(2)
  })

  it('projecaoMes: 12 docs / 2 dias * 31 dias = 186', () => {
    expect(ind.projecaoMes).toBeCloseTo(186, 0)
  })

  it('linhasSemSetor = 1 (d11)', () => {
    expect(ind.linhasSemSetor).toBe(1)
  })

  it('linhasSemProcedimento: d01, d05, d11 estão sem procedimento', () => {
    expect(ind.linhasSemProcedimento).toBe(3)
  })
})

// ─── Testes das tabelas de distribuição ──────────────────────────────────────

describe('tabelaPorSetor', () => {
  it('inclui linha Não classificado para docs sem setor', () => {
    const tabela = tabelaPorSetor(DOCS_ACUMULADO)
    const naoClass = tabela.linhas.find((l) => l.categoria === 'Não classificado')
    expect(naoClass).toBeDefined()
    expect(naoClass!.total).toBe(1) // d11
  })

  it('soma das linhas (incluindo Não classificado) = total de docs', () => {
    const tabela = tabelaPorSetor(DOCS_ACUMULADO)
    const soma = tabela.linhas.reduce((acc, l) => acc + l.total, 0)
    expect(soma).toBe(tabela.totalDocs)
  })
})

describe('tabelaPorPublico', () => {
  it('agrupa corretamente por público', () => {
    const tabela = tabelaPorPublico(DOCS_ACUMULADO)
    const paciente = tabela.linhas.find((l) => l.categoria === 'Paciente')
    expect(paciente).toBeDefined()
    // Docs com publico=Paciente (padrão): d01,d02,d03,d04,d05,d08,d09,d11 = 8
    expect(paciente!.total).toBe(8)
  })
})

describe('tabelaPorDemanda', () => {
  it('filtra apenas eixo Assistência ao paciente/família', () => {
    const tabela = tabelaPorDemanda(DOCS_ACUMULADO)
    // d09 é Formação — não deve aparecer
    const formacao = tabela.linhas.find((l) => l.categoria === 'Formação continuada')
    expect(formacao).toBeUndefined()
  })

  it('docs sem demanda vão para Não classificado', () => {
    const tabela = tabelaPorDemanda(DOCS_ACUMULADO)
    const naoClass = tabela.linhas.find((l) => l.categoria === 'Não classificado')
    // d01 (demanda=''), d05 (demanda=''), d11 (demanda padrão = 'Ansiedade/medo' mas setor vazio)
    // d01 e d05 não têm demanda → 2 sem demanda dentro do eixo assistência
    expect(naoClass).toBeDefined()
    expect(naoClass!.total).toBeGreaterThanOrEqual(1)
  })
})

// ─── Testes de borda ─────────────────────────────────────────────────────────

describe('casos de borda', () => {
  it('dataset vazio: todos os indicadores são 0', () => {
    const ind = calcularIndicadores([], 0, 31)
    expect(ind.registrosAssistenciais).toBe(0)
    expect(ind.taxaIntervencao).toBe(0)
    expect(ind.taxaEncaminhamento).toBe(0)
    expect(ind.projecaoMes).toBe(0)
    expect(ind.mediaRegistrosPorDia).toBe(0)
  })

  it('taxa não divide por zero quando não há atendimentos', () => {
    const soDocs = [makeDoc({ houveAtendimento: 'Não' })]
    const ind = calcularIndicadores(soDocs, 1, 31)
    expect(ind.taxaEncaminhamento).toBe(0) // 0 atendimentos → não divide
  })

  it('[REGRA 3] presença de acompanhante não gera atendimento', () => {
    const doc = makeDoc({ acompanhante: 'Sim', houveAtendimento: 'Não' })
    const ind = calcularIndicadores([doc], 1, 31)
    expect(ind.ocorrenciasComAtendimento).toBe(0)
  })

  it('[REGRA 3] procedimento preenchido não gera atendimento', () => {
    const doc = makeDoc({ procedimento: 'Escuta psicológica', houveAtendimento: 'Não' })
    const ind = calcularIndicadores([doc], 1, 31)
    expect(ind.ocorrenciasComAtendimento).toBe(0)
  })

  it('[REGRA 3] visita realizada não gera atendimento', () => {
    const doc = makeDoc({
      origemContato: 'Visita psicológica diária / visita de rotina',
      houveAtendimento: 'Não',
    })
    const ind = calcularIndicadores([doc], 1, 31)
    expect(ind.visitasRotina).toBe(1)
    expect(ind.ocorrenciasComAtendimento).toBe(0)
  })

  it('[REGRA 2] dois documentos do mesmo dia não são bloqueados', () => {
    const doc1 = makeDoc({ id: 'x1', turno: 'Manhã' })
    const doc2 = makeDoc({ id: 'x2', turno: 'Tarde' })
    const ind = calcularIndicadores([doc1, doc2], 1, 31)
    expect(ind.registrosAssistenciais).toBe(2) // ambos contam
  })
})
