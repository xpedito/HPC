import React, { useState, forwardRef } from 'react'
import { createPortal } from 'react-dom'

interface SelectComCriacaoProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
  options: string[]
  error?: boolean
  onAddItem?: (novoValor: string) => Promise<void> | void
  labelCriacao?: string
}

export const SelectComCriacao = forwardRef<HTMLSelectElement, SelectComCriacaoProps>(function SelectComCriacao(
  {
    placeholder,
    options,
    error,
    className = '',
    onAddItem,
    labelCriacao = 'Adicionar novo item...',
    value,
    onChange,
    ...rest
  },
  ref
) {
  const [modalAberto, setModalAberto] = useState(false)
  const [novoValor, setNovoValor]     = useState('')
  const [salvando, setSalvando]       = useState(false)
  const [erroModal, setErroModal]     = useState<string | null>(null)

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__NOVO_ITEM__') {
      setModalAberto(true)
      return
    }
    onChange?.(e)
  }

  const handleSalvarNovo = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const val = novoValor.trim()
    if (!val) return

    setErroModal(null)
    setSalvando(true)
    try {
      if (onAddItem) {
        await onAddItem(val)
      }
      setNovoValor('')
      setModalAberto(false)
    } catch (err: unknown) {
      console.error('Erro ao adicionar item pelo dropdown:', err)
      setErroModal(err instanceof Error ? err.message : 'Falha ao adicionar item.')
    } finally {
      setSalvando(false)
    }
  }

  // Garante lista única de opções cadastradas, sem repetições
  const todasOpcoes = Array.from(new Set(options.filter(Boolean)))

  return (
    <>
      <select
        ref={ref}
        value={value}
        onChange={handleSelectChange}
        className={`
          block w-full min-h-tap rounded-lg border px-3 py-2 text-base
          dark:bg-gray-800 dark:text-gray-100
          ${error
            ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-700 focus:ring-brand-500'}
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-900 dark:disabled:text-gray-600
          ${className}
        `}
        {...rest}
      >
        {placeholder && (
          <option value="">— {placeholder} —</option>
        )}
        {todasOpcoes.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        {onAddItem && (
          <option value="__NOVO_ITEM__" className="text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950/60">
            ➕ {labelCriacao}
          </option>
        )}
      </select>

      {/* Modal rápido de adição renderizado via Portal para isolar completamente do formulário principal */}
      {modalAberto && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>➕</span> {labelCriacao.replace('...', '')}
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {erroModal && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                {erroModal}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Nome do novo item
                </label>
                <input
                  type="text"
                  autoFocus
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSalvarNovo()
                    }
                  }}
                  placeholder="Ex: Ambulatório de Especialidades"
                  className="block w-full min-h-tap rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-base focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={handleSalvarNovo}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando…' : 'Salvar e Selecionar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
})
