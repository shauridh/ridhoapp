"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DayTotal } from "@/lib/domain/report";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface DailyChartProps {
  data: DayTotal[];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString("id-ID", { month: "short" });
  return `${day} ${month}`;
}

export function DailyChart({ data }: DailyChartProps) {
  const totalOmzet = data.reduce((sum, d) => sum + d.total, 0);

  if (totalOmzet === 0) {
    return <ChartEmptyState message="Belum ada data penjualan harian" />;
  }

  const average = totalOmzet / data.length;

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    omzet: d.total,
    vsAverage: d.total - average,
  }));

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Tren Omzet Harian
        </h3>
        <span className="text-xs text-ink-faint">
          Rata-rata: {rupiah(Math.round(average))}/hari
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#999"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#999"
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "omzet") {
                return [rupiah(Number(value)), "Omzet"];
              }
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                const diff = data.vsAverage;
                const diffText =
                  diff >= 0
                    ? `+${rupiah(Math.round(diff))} dari rata-rata`
                    : `${rupiah(Math.round(diff))} dari rata-rata`;
                return `${formatDate(data.fullDate)} (${diffText})`;
              }
              return label;
            }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <ReferenceLine
            y={average}
            stroke="#999"
            strokeDasharray="3 3"
            label={{ value: "Rata-rata", position: "right", fontSize: 10, fill: "#999" }}
          />
          <Line
            type="monotone"
            dataKey="omzet"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 3 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
