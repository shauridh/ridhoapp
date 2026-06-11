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
      className={`flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition hover:bg-surface active:scale-[0.95] ${className}`}
    >
      <Icon size={18} />
    </button>
  )
}
