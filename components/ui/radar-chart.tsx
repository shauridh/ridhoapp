interface RadarPoint {
  label: string
  value: number
}

interface Props {
  data: RadarPoint[]
  formatValue?: (n: number) => string
}

// Radar/spider chart SVG untuk membandingkan beberapa item (mis. produk terlaris).
export function RadarChart({ data, formatValue = (n) => String(n) }: Props) {
  const size = 240
  const center = size / 2
  const radius = size / 2 - 40
  const max = Math.max(1, ...data.map((d) => d.value))
  const n = data.length

  if (n < 3) {
    // Radar butuh minimal 3 titik agar berbentuk. Fallback: pesan.
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        Butuh minimal 3 produk untuk grafik radar.
      </p>
    )
  }

  // Titik sudut untuk nilai tertentu (0..1 dari max).
  const pointAt = (i: number, ratio: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio,
    }
  }

  const rings = [0.25, 0.5, 0.75, 1]
  const dataPoints = data.map((d, i) => pointAt(i, d.value / max))
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {/* grid rings */}
        {rings.map((r, ri) => (
          <polygon
            key={ri}
            points={data
              .map((_, i) => {
                const p = pointAt(i, r)
                return `${p.x},${p.y}`
              })
              .join(" ")}
            fill="none"
            className="stroke-hairline"
            strokeWidth={1}
          />
        ))}
        {/* axis lines */}
        {data.map((_, i) => {
          const p = pointAt(i, 1)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              className="stroke-hairline"
              strokeWidth={1}
            />
          )
        })}
        {/* data polygon */}
        <polygon
          points={polygon}
          className="fill-brand/20 stroke-brand"
          strokeWidth={2}
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-brand" />
        ))}
        {/* labels */}
        {data.map((d, i) => {
          const p = pointAt(i, 1.16)
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink text-[9px] font-medium"
            >
              {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
            </text>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-ink-soft">
            <span className="font-semibold text-ink">{d.label}</span>:{" "}
            {formatValue(d.value)}
          </span>
        ))}
      </div>
    </div>
  )
}
