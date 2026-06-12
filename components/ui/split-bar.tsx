interface Segment {
  label: string
  value: number
  colorClass: string
}

interface Props {
  segments: Segment[]
  formatValue?: (n: number) => string
}

// Bar proporsi tersegmentasi (mis. tunai vs QRIS) dengan legenda.
export function SplitBar({ segments, formatValue = (n) => String(n) }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0)

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-surface">
        {total > 0 &&
          segments.map((s, i) => (
            <div
              key={i}
              className={s.colorClass}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${formatValue(s.value)}`}
            />
          ))}
      </div>
      <div className="space-y-1.5">
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-soft">
                <span className={`h-3 w-3 rounded-sm ${s.colorClass}`} />
                {s.label}
              </span>
              <span className="font-semibold text-ink">
                {formatValue(s.value)}
                <span className="ml-1 text-xs font-normal text-ink-soft">
                  ({pct}%)
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
