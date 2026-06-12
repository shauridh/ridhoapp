interface Bar {
  label: string
  value: number
}

interface Props {
  data: Bar[]
  color?: string
  height?: number
  formatValue?: (n: number) => string
  // tampilkan setiap label ke-n (untuk sumbu padat seperti jam)
  labelEvery?: number
}

// Bar chart ringan berbasis CSS. Tiap kolom membungkus bar + label dalam satu
// sel flex-1 sehingga bar dan label SELALU sejajar (presisi).
export function BarChart({
  data,
  color = "bg-brand",
  height = 150,
  formatValue = (n) => String(n),
  labelEvery = 1,
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const plotH = height - 22

  return (
    <div className="w-full">
      <div className="relative">
        {/* gridline */}
        <div className="pointer-events-none absolute inset-x-0" style={{ height: plotH }}>
          {[0, 0.5, 1].map((g) => (
            <div
              key={g}
              className="absolute inset-x-0 border-t border-dashed border-hairline/50"
              style={{ bottom: `${g * 100}%` }}
            />
          ))}
        </div>

        {/* kolom: bar + label menyatu per sel */}
        <div className="flex items-end gap-1">
          {data.map((d, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center">
              <div
                className="flex w-full items-end justify-center"
                style={{ height: plotH }}
              >
                <div
                  className={`w-full max-w-[32px] rounded-t ${color} transition-all group-hover:opacity-80`}
                  style={{ height: `${Math.max(2, (d.value / max) * plotH)}px` }}
                  title={`${d.label}: ${formatValue(d.value)}`}
                />
              </div>
              <div className="mt-1 h-3 truncate text-center text-[9px] leading-3 text-ink-soft">
                {i % labelEvery === 0 ? d.label : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
