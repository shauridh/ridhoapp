import { type ButtonHTMLAttributes } from "react"
import { type LucideIcon } from "lucide-react"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success"
type Size = "md" | "lg"

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  secondary: "bg-accent text-ink hover:brightness-95 shadow-sm",
  ghost: "bg-white text-ink border border-hairline hover:bg-surface",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  success: "bg-success text-white hover:brightness-95 shadow-sm",
}

const sizes: Record<Size, string> = {
  md: "px-4 py-2 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[52px]",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: LucideIcon
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && !loading && <Icon size={18} />}
      {loading ? "Memuat..." : children}
    </button>
  )
}
