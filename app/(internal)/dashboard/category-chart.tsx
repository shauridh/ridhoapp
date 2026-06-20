"use client";
import { rupiah } from "@/lib/format";

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
import type { CategoryStat } from "@/lib/domain/report";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface CategoryChartProps {
  categories: CategoryStat[];
  title?: string;
}

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

export function CategoryChart({ categories, title = "Omzet per Kategori" }: CategoryChartProps) {
  const total = categories.reduce((sum, c) => sum + c.omzet, 0);

  if (total === 0 || categories.length === 0) {
    return <ChartEmptyState message="Belum ada data kategori" />;
  }

  const chartData = categories
    .map((c, index) => ({
      name: c.category || "Lainnya",
      omzet: c.omzet,
      percent: ((c.omzet / total) * 100).toFixed(1),
      rank: index + 1,
    }))
    .sort((a, b) => b.omzet - a.omzet);

  const topCategory = chartData[0];

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        {topCategory && (
          <span className="text-xs text-ink-faint">
            Terlaris: {topCategory.name} ({topCategory.percent}%)
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 48 + 40)}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="#999"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#999" width={90} />
          <Tooltip
            formatter={(value, _name, props) => {
              const { percent, rank } = props.payload as { percent: string; rank: number };
              return [rupiah(Number(value)) + ` (${percent}%)`, `#${rank}`];
            }}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="omzet" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="percent"
              position="right"
              fontSize={10}
              fill="#999"
              formatter={(v) => `${v}%`}
            />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
