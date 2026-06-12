import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Tone = "red" | "green" | "amber" | "blue"

const toneChip: Record<Tone, string> = {
  red: "bg-tint-red text-brand",
  green: "bg-tint-green text-success",
  amber: "bg-tint-amber text-accent",
  blue: "bg-tint-blue text-info",
}

const toneValue: Record<Tone, string> = {
  red: "text-brand",
  green: "text-success",
  amber: "text-ink",
  blue: "text-info",
}

interface Trend {
  percent: number
  direction: "up" | "down" | "flat"
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  trend?: Trend
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "red",
  trend,
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus
  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
        ? "text-danger"
        : "text-ink-soft"

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneChip[tone]}`}
          >
            <Icon size={18} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {label}
          </span>
        </span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}
          >
            <TrendIcon size={13} />
            {trend.percent > 0 ? "+" : ""}
            {trend.percent}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${toneValue[tone]}`}>{value}</p>
      {trend && (
        <p className="mt-0.5 text-2xs text-ink-faint">vs periode sebelumnya</p>
      )}
    </div>
  )
}
