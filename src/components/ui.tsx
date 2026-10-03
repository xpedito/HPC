import React, { forwardRef, type ReactNode } from 'react'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  hint?: string
  className?: string
}

/** Wrapper de campo de formulário com label, erro e hint */
export function Field({ label, required, error, children, hint, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
  options: string[]
  error?: boolean
}

/** Select padronizado com tap-target de 48px */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { placeholder, options, error, className = '', ...rest },
  ref
) {
  return (
    <select
      ref={ref}
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
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
})

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

/** Botão padronizado com variantes e estado de loading */
export function Button({ variant = 'primary', loading, children, disabled, className = '', ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 min-h-tap px-4 rounded-lg font-medium text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}

/** Badge de status de qualidade: verde=ok, vermelho=problema */
export function QualidadeBadge({ value, label }: { value: number; label: string }) {
  const ok = value === 0
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${ok ? 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-900/50' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50'}`}>
      <span>{label}</span>
      <span className={`font-bold text-lg ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{value}</span>
    </div>
  )
}

/** Spinner de carregamento centralizado */
export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
      <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  )
}

/** Banner de erro com botão de retry */
export function ErroBanner({ mensagem, onRetry }: { mensagem: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex flex-col gap-2 dark:bg-red-950/40 dark:border-red-900/50">
      <p className="text-sm text-red-800 dark:text-red-300 font-medium">⚠️ {mensagem}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-700 dark:text-red-400 underline self-start"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
