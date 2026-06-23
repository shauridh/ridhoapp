"use client";
import { rupiah } from "@/lib/format";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";
import { createClient } from "@/lib/supabase/client";

function toWibDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  d.setDate(d.getDate() + n);
  return toWibDate(d);
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

async function fetchHourlyData(dateStr: string): Promise<number[]> {
  const supabase = createClient();
  const start = `${dateStr}T00:00:00+07:00`;
  const end = `${dateStr}T23:59:59+07:00`;
  const { data } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("status", "completed")
    .gte("created_at", start)
    .lte("created_at", end);

  const slots = Array(24).fill(0);
  for (const o of data ?? []) {
    const wibHour = new Date(o.created_at).toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    });
    const h = parseInt(wibHour, 10);
    if (h >= 0 && h < 24) slots[h] += Number(o.total);
  }
  return slots;
}

interface HourlyChartProps {
  data?: number[];
  title?: string;
}

export function HourlyChart({ data: initialData, title = "Omzet per Jam" }: HourlyChartProps) {
  const todayWib = toWibDate(new Date());
  const [dateOffset, setDateOffset] = useState(0); // 0 = hari ini, -1 = kemarin, dst
  const [currentDate, setCurrentDate] = useState(todayWib);
  const [hourlyData, setHourlyData] = useState<number[]>(initialData ?? Array(24).fill(0));
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (offset: number) => {
      const target = addDays(todayWib, offset);
      setCurrentDate(target);
      if (offset === 0 && initialData) {
        setHourlyData(initialData);
        return;
      }
      setLoading(true);
      const d = await fetchHourlyData(target);
      setHourlyData(d);
      setLoading(false);
    },
    [todayWib, initialData]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dateOffset !== 0) load(dateOffset);
  }, [dateOffset, load]);

  const totalOmzet = hourlyData.reduce((sum, val) => sum + val, 0);
  const maxValue = Math.max(...hourlyData);
  const peakHours = hourlyData
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value === maxValue && maxValue > 0)
    .map((item) => item.index);

  const chartData = hourlyData.map((value, index) => ({
    hour: `${index.toString().padStart(2, "0")}:00`,
    omzet: value,
    isPeak: peakHours.includes(index),
    percentage: totalOmzet > 0 ? ((value / totalOmzet) * 100).toFixed(1) : "0",
  }));

  const nonZeroHours = chartData.filter((d) => d.omzet > 0).length;
  const isToday = dateOffset === 0;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        {peakHours.length > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-ink-faint">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Puncak: {peakHours.map((h) => `${h.toString().padStart(2, "0")}:00`).join(", ")}
            &nbsp;&middot;&nbsp;{rupiah(maxValue)}
          </span>
        )}
        <span className="text-xs text-ink-faint">{nonZeroHours} jam aktif</span>
      </div>

      {/* Day navigation */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setDateOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-soft transition hover:bg-surface"
          aria-label="Hari sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-ink">
          {isToday ? "Hari Ini" : formatDayLabel(currentDate)}
        </p>
        <button
          onClick={() => setDateOffset((o) => Math.min(0, o + 1))}
          disabled={isToday}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-soft transition hover:bg-surface disabled:opacity-30"
          aria-label="Hari berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-ink-soft">Memuat...</p>
        </div>
      ) : totalOmzet === 0 ? (
        <ChartEmptyState message="Belum ada transaksi pada hari ini" />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#EADFC8" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
                    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                    return String(v);
                  }}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  formatter={(value) => [rupiah(Number(value)), "Omzet"]}
                  labelFormatter={(label, payload) => {
                    if (payload?.[0]) {
                      const d = payload[0].payload;
                      return `${label} — ${d.percentage}% dari total`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #EADFC8",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="omzet" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="omzet"
                    position="top"
                    fontSize={9}
                    fill="#666"
                    formatter={(v: unknown) => {
                      const n = Number(v);
                      return n === maxValue && maxValue > 0 ? `${(n / 1000).toFixed(0)}k` : "";
                    }}
                  />
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPeak ? "#f59e0b" : entry.omzet > 0 ? "#10b981" : "#e5e7eb"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
