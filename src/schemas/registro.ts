import { z } from 'zod'

// ─── Valores fixos (enums que NÃO mudam por deploy) ──────────────────────────
export const HOUVE_ATENDIMENTO = ['Sim', 'Não', 'REVISAR'] as const
export const NECESSITA_SEGUIMENTO = ['Sim', 'Não', 'Não se aplica'] as const
export const ACOMPANHANTE = ['Sim', 'Não'] as const
export const PERFIL = ['psicologa', 'coordenacao', 'admin'] as const

export type HouveAtendimento  = typeof HOUVE_ATENDIMENTO[number]
export type NecessitaSeguimento = typeof NECESSITA_SEGUIMENTO[number]
export type Perfil = typeof PERFIL[number]

// ─── Schema base do registro ──────────────────────────────────────────────────
// Todos os campos de lista são strings (o texto fica gravado, não o id).
// Campos opcionais: idade, demanda, situacaoEspecifica (dependem do eixo).
// procedimento e demanda tornam-se obrigatórios quando houveAtendimento = 'Sim'.

const dataString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
  .refine((d) => {
    const hoje = new Date().toISOString().slice(0, 10)
    return d <= hoje
  }, 'Data não pode ser futura')

export const RegistroInputSchema = z
  .object({
    // Identificação temporal
    data:   dataString,
    anoMes: z.string().regex(/^\d{4}-\d{2}$/).optional(), // derivado, não editável

    // Identificação do profissional
    profissional: z.string().min(1, 'Profissional obrigatório'),

    // Campos de lista — strings não vazias
    turno:             z.string().min(1, 'Turno obrigatório'),
    eixo:              z.string().min(1, 'Eixo obrigatório'),
    setor:             z.string().min(1, 'Setor obrigatório'),
    publico:           z.string().min(1, 'Público obrigatório'),
    origemContato:     z.string().min(1, 'Origem do contato obrigatória'),
    houveAtendimento:  z.enum(HOUVE_ATENDIMENTO, { message: 'Selecione uma opção' }),
    modalidade:        z.string().min(1, 'Modalidade obrigatória'),
    localIntervencao:  z.string().min(1, 'Local da intervenção obrigatório'),
    frequencia:        z.string().min(1, 'Frequência obrigatória'),
    encaminhamento:    z.string().min(1, 'Encaminhamento obrigatório'),
    necessitaSeguimento: z.enum(NECESSITA_SEGUIMENTO, { message: 'Selecione uma opção' }),

    // Campos condicionais (obrigatoriedade verificada em superRefine)
    procedimento:       z.string().optional(),
    demanda:            z.string().optional(),
    situacaoEspecifica: z.string().optional(),

    // Campos livres
    observacao: z.string().optional(),
    idade:      z.number().int().positive().optional(),
    acompanhante: z.enum(ACOMPANHANTE, { message: 'Selecione uma opção' }),
  })
  .superRefine((val, ctx) => {
    // Regra 1: se houveAtendimento = 'Sim', procedimento e demanda são obrigatórios.
    if (val.houveAtendimento === 'Sim') {
      if (!val.procedimento || val.procedimento.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['procedimento'],
          message: 'Procedimento é obrigatório quando há atendimento',
        })
      }
      if (!val.demanda || val.demanda.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['demanda'],
          message: 'Demanda é obrigatória quando há atendimento',
        })
      }
    }
    // Regra 2: eixo != 'Assistência ao paciente/família' → demanda e
    // situacaoEspecifica ficam ocultas e opcionais (não há validação extra).
    // A regra já está coberta pela ausência de required nessas condições.
  })

export type RegistroInput = z.infer<typeof RegistroInputSchema>

// ─── Tipo do documento salvo no Firestore ────────────────────────────────────
// Após leitura do Firestore, data chega como Date (convertido do Timestamp).
// Em testes, pode ser passado como Date ou string — o type aceita ambos.
export type RegistroDoc = Omit<RegistroInput, 'data'> & {
  id:          string
  data:        Date | string   // string ao gravar (formulário), Date ao ler (Firestore)
  criadoPor:   string          // uid do Firebase Auth
  criadoEm:    Date
  atualizadoEm: Date
}

// ─── Schema do usuário ────────────────────────────────────────────────────────
export const UsuarioSchema = z.object({
  email:     z.string().email(),
  nome:      z.string().min(1),
  perfil:    z.enum(PERFIL),
  ativo:     z.boolean(),
  criadoEm:  z.date().optional(),
})

export type Usuario = z.infer<typeof UsuarioSchema> & { id: string }

// ─── Schema de item de domínio ────────────────────────────────────────────────
export const DominioItemSchema = z.object({
  valor:  z.string().min(1),
  ordem:  z.number().int().nonnegative(),
  ativo:  z.boolean(),
})

export type DominioItem = z.infer<typeof DominioItemSchema> & { id: string }

// ─── Mapeamento domínio → campo do registro ───────────────────────────────────
// Usado pelo admin para verificar se um item está em uso antes de excluir.
export const DOMINIO_CAMPO_MAP: Record<string, keyof RegistroInput> = {
  turno:              'turno',
  eixo:               'eixo',
  setor:              'setor',
  publico:            'publico',
  origemContato:      'origemContato',
  localIntervencao:   'localIntervencao',
  procedimento:       'procedimento',
  demanda:            'demanda',
  situacaoEspecifica: 'situacaoEspecifica',
  frequencia:         'frequencia',
  encaminhamento:     'encaminhamento',
  modalidade:         'modalidade',
}

// ─── Helpers de data ──────────────────────────────────────────────────────────

/** Retorna 'YYYY-MM-DD' da data local (sem deslocamento de timezone) */
export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Retorna 'YYYY-MM' de uma string 'YYYY-MM-DD' */
export function toAnoMes(dataStr: string): string {
  return dataStr.slice(0, 7)
}

/** Sugere o turno pelo horário atual */
export function turnoSugerido(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Manhã'
  if (h < 18) return 'Tarde'
  return 'Noite'
}

/** Retorna o número de dias do mês de uma string 'YYYY-MM' */
export function diasNoMes(anoMes: string): number {
  const [ano, mes] = anoMes.split('-').map(Number)
  return new Date(ano, mes, 0).getDate()
}

/** Conta quantos dias distintos já passaram no mês até hoje (ou até a data informada) */
export function diasDecorridosNoMes(anoMes: string, ate?: string): number {
  const hoje = ate ?? toDateString(new Date())
  const [ano, mes] = anoMes.split('-').map(Number)
  const inicioMes = new Date(ano, mes - 1, 1)
  const dataAte = new Date(hoje)
  // Se a data informada é de outro mês, retorna dias do mês inteiro
  if (dataAte.getFullYear() !== ano || dataAte.getMonth() + 1 !== mes) {
    return diasNoMes(anoMes)
  }
  const diff = Math.floor((dataAte.getTime() - inicioMes.getTime()) / 86_400_000)
  return diff + 1 // +1 porque inclui o dia inicial
}
