"use client";

import { useState, useEffect, useCallback } from "react";
import { rupiah } from "@/lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";
import { createClient } from "@/lib/supabase/client";
import { toWibDateString, addDaysWib, startOfWibDay, endOfWibDay } from "@/lib/utils/wib";

interface DayData {
  date: string; // YYYY-MM-DD
  total: number;
}

interface DailyChartProps {
  // Props lama masih diterima sebagai fallback awal (opsional)
  data?: { date: string; total: number }[];
  prevData?: { date: string; total: number }[];
  title?: string;
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Hitung Senin dari weekOffset (0=minggu ini, -1=minggu lalu, dst) */
function getMondayOfWeek(weekOffset: number): string {
  const now = new Date();
  const wibNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const dow = wibNow.getDay(); // 0=Sun,1=Mon,...6=Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const thisMonday = addDaysWib(toWibDateString(now), -daysFromMonday);
  return addDaysWib(thisMonday, weekOffset * 7);
}

function formatWeekLabel(monday: string): string {
  const sunday = addDaysWib(monday, 6);
  const fmt = (d: string) => {
    const date = new Date(`${d}T00:00:00+07:00`);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

async function fetchWeekData(monday: string): Promise<DayData[]> {
  const sunday = addDaysWib(monday, 6);
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("status", "completed")
    .gte("created_at", startOfWibDay(monday))
    .lte("created_at", endOfWibDay(sunday));

  // Build 7-day array
  const totals: Record<string, number> = {};
  for (const o of data ?? []) {
    const d = toWibDateString(new Date(o.created_at));
    totals[d] = (totals[d] ?? 0) + Number(o.total);
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysWib(monday, i);
    return { date, total: totals[date] ?? 0 };
  });
}

export function DailyChart({ title = "Tren Omzet Harian" }: DailyChartProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentData, setCurrentData] = useState<DayData[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monday, setMonday] = useState(() => getMondayOfWeek(0));

  const load = useCallback(async (offset: number) => {
    setLoading(true);
    const mon = getMondayOfWeek(offset);
    const prevMon = getMondayOfWeek(offset - 1);
    setMonday(mon);
    const [curr, prev] = await Promise.all([fetchWeekData(mon), fetchWeekData(prevMon)]);
    setCurrentData(curr);
    setPrevWeekData(prev);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(weekOffset);
  }, [weekOffset, load]);

  const totalOmzet = currentData.reduce((s, d) => s + d.total, 0);
  const average = currentData.length > 0 ? totalOmzet / 7 : 0;

  const chartData = currentData.map((d, i) => ({
    day: DAY_LABELS[i],
    date: d.date,
    omzet: d.total,
    prevOmzet: prevWeekData[i]?.total ?? 0,
    aboveAvg: d.total > 0 && d.total >= average,
    isToday: d.date === toWibDateString(new Date()),
  }));

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        <span className="text-xs text-ink-faint hidden sm:block">
          {average > 0 ? `Rata-rata: ${rupiah(Math.round(average))}/hari` : ""}
        </span>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-soft transition hover:bg-surface"
          aria-label="Minggu sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs font-semibold text-ink">
            {isCurrentWeek ? "Minggu Ini" : formatWeekLabel(monday)}
          </p>
          {!isCurrentWeek && (
            <p className="text-[10px] text-ink-faint">{formatWeekLabel(monday)}</p>
          )}
          {isCurrentWeek && <p className="text-[10px] text-ink-faint">{formatWeekLabel(monday)}</p>}
        </div>
        <button
          onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
          disabled={isCurrentWeek}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-soft transition hover:bg-surface disabled:opacity-30"
          aria-label="Minggu berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-ink-soft">Memuat...</p>
        </div>
      ) : totalOmzet === 0 ? (
        <ChartEmptyState message="Belum ada data minggu ini" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADFC8" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
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
              formatter={(value, name) => {
                if (name === "omzet") return [rupiah(Number(value)), "Minggu Ini"];
                if (name === "prevOmzet") return [rupiah(Number(value)), "Minggu Lalu"];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload?.[0]) {
                  const d = payload[0].payload;
                  const date = new Date(`${d.date}T00:00:00+07:00`);
                  return date.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
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
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: "Avg", position: "right", fontSize: 10, fill: "#f59e0b" }}
              />
            )}
            <Bar dataKey="prevOmzet" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="omzet" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? "#f59e0b" : entry.aboveAvg ? "#10b981" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" /> Di atas rata-rata
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-info" /> Di bawah rata-rata
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> Hari ini
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#e2e8f0]" /> Minggu lalu
        </span>
      </div>
    </div>
  );
}
