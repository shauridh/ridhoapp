interface Segment {
  label: string;
  value: number;
  colorClass: string;
}

interface Props {
  segments: Segment[];
  formatValue?: (n: number) => string;
}

export function DonutChart({ segments, formatValue = (n) => String(n) }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 180;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dash = fraction * circumference;
    const arc = {
      seg,
      dash,
      gap: circumference - dash,
      offset: -offset,
      pct: Math.round(fraction * 100),
    };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-ink-faint/20"
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
                strokeLinecap="round"
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-wide text-ink-soft font-medium">Total</span>
          <span className="text-lg font-bold text-ink mt-1">{formatValue(total)}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          {segments.map((seg, i) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className={`h-3 w-3 rounded-full flex-shrink-0 ${seg.colorClass.replace(
                    "fill-",
                    "bg-"
                  )}`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-ink-soft">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="font-semibold text-ink">{formatValue(seg.value)}</span>
                  <span className="text-xs text-ink-soft">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
