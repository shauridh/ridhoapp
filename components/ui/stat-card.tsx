import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Tone = "red" | "green" | "amber" | "blue";

const toneChip: Record<Tone, string> = {
  red: "bg-tint-red text-brand",
  green: "bg-tint-green text-success",
  amber: "bg-tint-amber text-accent",
  blue: "bg-tint-blue text-info",
};

const toneValue: Record<Tone, string> = {
  red: "text-brand",
  green: "text-success",
  amber: "text-ink",
  blue: "text-info",
};

interface Trend {
  percent: number;
  direction: "up" | "down" | "flat";
}

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: Trend;
  /** Sub-label di bawah value, mis. rata-rata atau konteks tambahan */
  sublabel?: string;
}

// Perubahan dianggap tajam jika > 20% — diberi emphasis lebih kuat
function isSharpeChange(trend: Trend): boolean {
  return Math.abs(trend.percent) >= 20;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "red",
  trend,
  sublabel,
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;

  const sharp = trend ? isSharpeChange(trend) : false;

  // Warna badge tren: naik tajam = success kuat, turun tajam = danger kuat
  const trendBg = trend
    ? trend.direction === "up"
      ? sharp
        ? "bg-tint-green text-success"
        : "bg-tint-green/60 text-success"
      : trend.direction === "down"
        ? sharp
          ? "bg-tint-red text-danger"
          : "bg-tint-red/60 text-danger"
        : "bg-surface text-ink-soft"
    : "";

  // Border glow untuk perubahan tajam
  const sharpBorder =
    sharp && trend
      ? trend.direction === "up"
        ? "ring-1 ring-success/30"
        : "ring-1 ring-danger/30"
      : "";

  return (
    <div
      className={`rounded-2xl border border-hairline bg-white p-4 shadow-sm transition ${sharpBorder}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneChip[tone]}`}>
            <Icon size={18} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {label}
          </span>
        </span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${trendBg}`}
          >
            <TrendIcon size={13} />
            {trend.percent > 0 ? "+" : ""}
            {trend.percent}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${toneValue[tone]}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-ink-soft">{sublabel}</p>}
      {trend && <p className="mt-0.5 text-2xs text-ink-faint">vs periode sebelumnya</p>}
    </div>
  );
}
