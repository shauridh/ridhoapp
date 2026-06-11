import { type LucideIcon } from "lucide-react"

type Tone = "red" | "green" | "amber" | "blue"

const toneChip: Record<Tone, string> = {
  red: "bg-tint-red text-brand",
  green: "bg-tint-green text-success",
  amber: "bg-tint-amber text-accent",
  blue: "bg-tint-blue text-blue-600",
}

const toneValue: Record<Tone, string> = {
  red: "text-brand",
  green: "text-success",
  amber: "text-ink",
  blue: "text-blue-600",
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
}

export function StatCard({ label, value, icon: Icon, tone = "red" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneChip[tone]}`}
        >
          <Icon size={18} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${toneValue[tone]}`}>{value}</p>
    </div>
  )
}
