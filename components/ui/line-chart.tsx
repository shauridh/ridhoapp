interface Point {
  label: string
  value: number
}

interface Props {
  data: Point[]
  formatValue?: (n: number) => string
  height?: number
  labelEvery?: number
}

// Line chart SVG ringan dengan area gradient, titik, dan tooltip per titik.
export function LineChart({
  data,
  formatValue = (n) => String(n),
  height = 150,
  labelEvery = 1,
}: Props) {
  const width = 600 // viewBox; SVG diskalakan responsif
  const padX = 12
  const padY = 16
  const plotW = width - padX * 2
  const plotH = height - padY * 2
  const max = Math.max(1, ...data.map((d) => d.value))
  const n = data.length

  const x = (i: number) => (n <= 1 ? padX : padX + (plotW * i) / (n - 1))
  const y = (v: number) => padY + plotH - (v / max) * plotH

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`)
    .join(" ")
  const areaPath =
    `M ${x(0)} ${padY + plotH} ` +
    data.map((d, i) => `L ${x(i)} ${y(d.value)}`).join(" ") +
    ` L ${x(n - 1)} ${padY + plotH} Z`

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="text-brand" stopColor="currentColor" stopOpacity={0.25} />
            <stop offset="100%" className="text-brand" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* gridline */}
        {[0, 0.5, 1].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={width - padX}
            y1={padY + plotH * g}
            y2={padY + plotH * g}
            className="stroke-hairline/60"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        <path d={areaPath} fill="url(#lineFill)" />
        <path
          d={linePath}
          fill="none"
          className="stroke-brand"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => (
          <g key={i} className="group">
            <circle cx={x(i)} cy={y(d.value)} r={3.5} className="fill-brand" />
            <title>
              {d.label}: {formatValue(d.value)}
            </title>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-ink-soft">
            {i % labelEvery === 0 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  )
}
