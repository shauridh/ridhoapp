interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  color?: string;
  height?: number;
  formatValue?: (n: number) => string;
  labelEvery?: number;
}

export function BarChart({
  data,
  color = "bg-brand",
  height = 200,
  formatValue = (n) => String(n),
  labelEvery = 1,
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotH = height - 32;
  const minBarWidth = 24;
  const minGap = 4;
  const totalMinWidth = data.length * minBarWidth + (data.length - 1) * minGap;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full" style={{ minWidth: Math.max(totalMinWidth + 32, 300) }}>
        <div className="relative">
          {/* gridlines */}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-hairline/30"
            style={{ height: plotH }}
          />
          {[0.25, 0.5, 0.75].map((g) => (
            <div
              key={g}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-hairline/20"
              style={{ bottom: `${g * 100}%`, height: plotH }}
            />
          ))}

          {/* bars */}
          <div className="flex items-end gap-1 px-4 py-4" style={{ minHeight: plotH + 32 }}>
            {data.map((d, i) => (
              <div
                key={i}
                className="group flex flex-col items-center"
                style={{ flex: `0 0 ${minBarWidth}px` }}
              >
                <div className="w-full text-center">
                  <div
                    className={`mx-auto w-full rounded-t-sm ${color} transition-all duration-150 hover:opacity-80 cursor-pointer`}
                    style={{
                      height: `${Math.max(2, (d.value / max) * plotH)}px`,
                      minHeight: "2px",
                    }}
                    title={`${d.label}\n${formatValue(d.value)}`}
                  />
                </div>
                <div className="mt-2 h-4 text-center text-[10px] font-medium leading-4 text-ink-soft whitespace-nowrap">
                  {i % labelEvery === 0 ? d.label : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
