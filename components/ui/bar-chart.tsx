"use client"

interface Bar {
  label: string
  value: number
  // sublabel opsional untuk tampil di bawah bar (mis. tanggal)
}

interface Props {
  data: Bar[]
  color?: string
  height?: number
  // format nilai untuk tooltip & puncak
  formatValue?: (n: number) => string
  // tampilkan setiap label ke-n (untuk sumbu padat seperti jam)
  labelEvery?: number
}

// Bar chart ringan berbasis CSS dengan baseline, gridline, dan tooltip.
export function BarChart({
  data,
  color = "bg-brand",
  height = 180,
  formatValue = (n) => String(n),
  labelEvery = 1,
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const plotH = height - 28 // sisakan ruang untuk label sumbu-x

  return (
    <div className="w-full">
      <div className="relative" style={{ height: plotH }}>
        {/* gridline horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <div
            key={g}
            className="absolute inset-x-0 border-t border-dashed border-hairline/60"
            style={{ bottom: `${g * 100}%` }}
          />
        ))}
        {/* bar */}
        <div className="absolute inset-0 flex items-end gap-1">
          {data.map((d, i) => (
            <div
              key={i}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height: "100%" }}
            >
              <div
                className={`w-full rounded-t-md ${color} transition-all hover:opacity-80`}
                style={{ height: `${Math.max(2, (d.value / max) * plotH)}px` }}
              />
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow transition group-hover:opacity-100">
                {d.label}: {formatValue(d.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* label sumbu-x */}
      <div className="mt-1 flex gap-1">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] text-ink-soft"
          >
            {i % labelEvery === 0 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  )
}
