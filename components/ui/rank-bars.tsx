interface Row {
  label: string
  value: number
  sublabel?: string
}

interface Props {
  data: Row[]
  color?: string
  formatValue?: (n: number) => string
  emptyText?: string
}

// Daftar peringkat dengan bar horizontal (top produk, kategori).
export function RankBars({
  data,
  color = "bg-brand",
  formatValue = (n) => String(n),
  emptyText = "Belum ada data.",
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))

  if (data.length === 0) {
    return <p className="text-sm text-ink-soft">{emptyText}</p>
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-2 text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-ink-soft">
                {i + 1}
              </span>
              {d.label}
            </span>
            <span className="font-semibold text-ink">
              {formatValue(d.value)}
              {d.sublabel && (
                <span className="ml-1 text-xs font-normal text-ink-soft">
                  {d.sublabel}
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full ${color} transition-all`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
