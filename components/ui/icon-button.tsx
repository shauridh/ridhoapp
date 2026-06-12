import { type LucideIcon } from "lucide-react"

interface IconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition hover:bg-surface active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 ${className}`}
    >
      <Icon size={18} />
    </button>
  )
}
