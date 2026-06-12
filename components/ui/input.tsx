import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react"

const baseField =
  "w-full rounded-lg border border-hairline bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  // Field nilai uang: PageUp/PageDown menambah/mengurangi kelipatan (default 1000).
  money?: boolean
  moneyStep?: number
}

export function Input({
  label,
  error,
  className = "",
  money = false,
  moneyStep = 1000,
  onKeyDown,
  ...props
}: InputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (money && (e.key === "PageUp" || e.key === "PageDown")) {
      e.preventDefault()
      const el = e.currentTarget
      const cur = Number(el.value) || 0
      const delta = e.key === "PageUp" ? moneyStep : -moneyStep
      const next = Math.max(0, cur + delta)
      // Set value lewat native setter agar React onChange ikut ter-trigger.
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set
      setter?.call(el, String(next))
      el.dispatchEvent(new Event("input", { bubbles: true }))
    }
    onKeyDown?.(e)
  }

  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-ink-soft">{label}</span>}
      <input
        className={`${baseField} ${className}`}
        onKeyDown={handleKeyDown}
        {...props}
      />
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
