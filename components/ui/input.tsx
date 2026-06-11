import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react"

const baseField =
  "w-full rounded-lg border border-hairline bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-ink-soft">{label}</span>}
      <input className={`${baseField} ${className}`} {...props} />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-ink-soft">{label}</span>}
      <select className={`${baseField} ${className}`} {...props}>
        {children}
      </select>
    </label>
  )
}
