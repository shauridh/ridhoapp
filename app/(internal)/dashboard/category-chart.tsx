"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CategoryStat } from "@/lib/domain/report";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface CategoryChartProps {
  categories: CategoryStat[];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
];

export function CategoryChart({ categories }: CategoryChartProps) {
  const total = categories.reduce((sum, c) => sum + c.omzet, 0);

  if (total === 0 || categories.length === 0) {
    return <ChartEmptyState message="Belum ada data kategori" />;
  }

  const chartData = categories.map((c, index) => ({
    name: c.category || "Lainnya",
    value: c.omzet,
    percent: ((c.omzet / total) * 100).toFixed(1),
    rank: index + 1,
  }));

  const topCategory = chartData[0];

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Omzet per Kategori
        </h3>
        {topCategory && (
          <span className="text-xs text-ink-faint">
            Terlaris: {topCategory.name} ({topCategory.percent}%)
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name} (${entry.percent}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              const percent = props.payload.percent;
              const rank = props.payload.rank;
              return [rupiah(Number(value)) + ` (${percent}%) - Rank #${rank}`, name];
            }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => `${value}: ${entry.payload.percent}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
