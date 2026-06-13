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
import type { SellerStat } from "@/lib/domain/report";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface TopProductsChartProps {
  products: SellerStat[];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];

export function TopProductsChart({ products }: TopProductsChartProps) {
  if (products.length === 0) {
    return <ChartEmptyState message="Belum ada produk terjual" />;
  }

  const totalQty = products.reduce((sum, p) => sum + p.qty, 0);
  const totalOmzet = products.reduce((sum, p) => sum + p.omzet, 0);

  const chartData = products.map((p, index) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    fullName: p.name,
    qty: p.qty,
    omzet: p.omzet,
    qtyPercent: ((p.qty / totalQty) * 100).toFixed(1),
    omzetPercent: ((p.omzet / totalOmzet) * 100).toFixed(1),
    rank: index + 1,
  }));

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Produk Terlaris
        </h3>
        <span className="text-xs text-ink-faint">Top {products.length} produk</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#999" width={100} />
          <Tooltip
            formatter={(value, name) => {
              if (name === "qty") return [Number(value), "Terjual"];
              return [rupiah(Number(value)), "Omzet"];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return `#${data.rank} ${data.fullName} (${data.qtyPercent}% dari total qty)`;
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
          <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
