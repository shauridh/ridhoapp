"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface HourlyChartProps {
  data: number[];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function HourlyChart({ data }: HourlyChartProps) {
  const totalOmzet = data.reduce((sum, val) => sum + val, 0);

  if (totalOmzet === 0) {
    return <ChartEmptyState message="Belum ada transaksi pada periode ini" />;
  }

  const maxValue = Math.max(...data);
  const peakHours = data
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value === maxValue)
    .map((item) => item.index);

  const chartData = data.map((value, index) => ({
    hour: `${index.toString().padStart(2, "0")}:00`,
    omzet: value,
    isPeak: peakHours.includes(index),
    percentage: totalOmzet > 0 ? ((value / totalOmzet) * 100).toFixed(1) : "0",
  }));

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Omzet per Jam
        </h3>
        {peakHours.length > 0 && (
          <span className="text-xs text-ink-faint">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
            Jam Puncak: {peakHours.map((h) => `${h.toString().padStart(2, "0")}:00`).join(", ")}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                stroke="#999"
                interval={0}
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
                formatter={(value) => rupiah(Number(value))}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${label} (${data.percentage}% dari total)`;
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
              <Bar dataKey="omzet" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPeak ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
