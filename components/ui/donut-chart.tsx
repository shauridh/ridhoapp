interface Segment {
  label: string
  value: number
  colorClass: string // class fill, mis. "fill-success"
}

interface Props {
  segments: Segment[]
  formatValue?: (n: number) => string
}

// Donut chart SVG ringan dengan legenda. Tanpa dependensi eksternal.
export function DonutChart({ segments, formatValue = (n) => String(n) }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const size = 160
  const stroke = 26
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0
    const dash = fraction * circumference
    const arc = {
      seg,
      dash,
      gap: circumference - dash,
      offset: -offset,
      pct: Math.round(fraction * 100),
    }
    offset += dash
    return arc
  })

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-surface"
            strokeWidth={stroke}
          />
          {total > 0 &&
            arcs.map((a, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={a.seg.colorClass.replace("fill-", "stroke-")}
                strokeWidth={stroke}
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={a.offset}
                strokeLinecap="butt"
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xs uppercase tracking-wide text-ink-soft">
            Total
          </span>
          <span className="text-sm font-bold text-ink">
            {formatValue(total)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className={`h-3 w-3 rounded-sm ${seg.colorClass.replace("fill-", "bg-")}`}
              />
              <span className="text-ink-soft">{seg.label}</span>
              <span className="font-semibold text-ink">
                {formatValue(seg.value)}
              </span>
              <span className="text-xs text-ink-faint">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
