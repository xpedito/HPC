import React from 'react'

interface BarItem {
  label: string
  valor: number
  cor?: string
}

interface GraficoBarrasHorizontalProps {
  titulo: string
  subtitulo?: string
  dados: BarItem[]
  limite?: number
}

const CORES_PADRAO = [
  'bg-blue-500 dark:bg-blue-600',
  'bg-indigo-500 dark:bg-indigo-600',
  'bg-sky-500 dark:bg-sky-600',
  'bg-teal-500 dark:bg-teal-600',
  'bg-emerald-500 dark:bg-emerald-600',
  'bg-amber-500 dark:bg-amber-600',
  'bg-rose-500 dark:bg-rose-600',
  'bg-purple-500 dark:bg-purple-600',
]

export function GraficoBarrasHorizontal({
  titulo,
  subtitulo,
  dados,
  limite = 6,
}: GraficoBarrasHorizontalProps) {
  const filtrados = dados.filter((d) => d.valor > 0).slice(0, limite)
  const max = Math.max(...filtrados.map((d) => d.valor), 1)
  const total = filtrados.reduce((acc, d) => acc + d.valor, 0)

  if (filtrados.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-baseline">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{titulo}</h3>
        {subtitulo && <span className="text-xs text-gray-500 dark:text-gray-400">{subtitulo}</span>}
      </div>

      <div className="space-y-2.5">
        {filtrados.map((item, index) => {
          const porcentagem = ((item.valor / total) * 100).toFixed(0)
          const largura = `${Math.round((item.valor / max) * 100)}%`
          const cor = item.cor || CORES_PADRAO[index % CORES_PADRAO.length]

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="truncate max-w-[200px] font-medium" title={item.label}>
                  {item.label}
                </span>
                <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-200">
                  {item.valor} <span className="text-gray-400 dark:text-gray-500 text-[11px] font-normal">({porcentagem}%)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${cor}`}
                  style={{ width: largura }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LinhaTempoItem {
  dia: string
  total: number
  atendimentos: number
}

interface GraficoLinhaDiasProps {
  titulo: string
  dados: LinhaTempoItem[]
}

export function GraficoEvolucaoDias({ titulo, dados }: GraficoLinhaDiasProps) {
  if (dados.length === 0) return null

  const maxTotal = Math.max(...dados.map((d) => d.total), 1)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{titulo}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded bg-brand-500" /> Total
          </span>
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Atendimentos
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-28 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {dados.map((d) => {
          const alturaTotal = `${Math.max(Math.round((d.total / maxTotal) * 100), 6)}%`
          const alturaAtend = `${Math.max(Math.round((d.atendimentos / maxTotal) * 100), d.atendimentos > 0 ? 6 : 0)}%`
          const diaNum = d.dia.slice(8, 10)

          return (
            <div key={d.dia} className="flex-1 min-w-[20px] flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip ao passar mouse */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] py-0.5 px-1.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20 font-medium">
                Dia {diaNum}: {d.total} tot / {d.atendimentos} atend
              </div>

              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                <div
                  className="w-2 bg-brand-500 dark:bg-brand-600 rounded-t transition-all duration-300"
                  style={{ height: alturaTotal }}
                />
                <div
                  className="w-2 bg-emerald-500 dark:bg-emerald-600 rounded-t transition-all duration-300"
                  style={{ height: alturaAtend }}
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 tabular-nums">{diaNum}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
