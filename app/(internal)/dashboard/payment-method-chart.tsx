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
} from "recharts";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface PaymentMethodChartProps {
  cash: number;
  qris: number;
  paymentBreakdown?: Record<string, number>;
  title?: string;
}

// Palet warna per metode; fallback ke urutan warna untuk metode kustom
const METHOD_COLORS: Record<string, string> = {
  cash: "#10b981",
  qris: "#3b82f6",
  transfer: "#8b5cf6",
  debit: "#f59e0b",
  lainnya: "#6b7280",
};
const FALLBACK_COLORS = ["#ef4444", "#ec4899", "#14b8a6", "#f97316", "#a3e635"];

function getColor(method: string, index: number): string {
  return METHOD_COLORS[method.toLowerCase()] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
  debit: "Debit/EDC",
  lainnya: "Lainnya",
};

export function labelName(method: string): string {
  return PAYMENT_LABEL[method.toLowerCase()] ?? method;
}

export function PaymentMethodChart({
  cash,
  qris,
  paymentBreakdown,
  title = "Metode Pembayaran",
}: PaymentMethodChartProps) {
  // Gunakan paymentBreakdown jika tersedia, fallback ke cash+qris lama
  const breakdown = paymentBreakdown ?? (cash > 0 || qris > 0 ? { cash, qris } : {});

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

  if (total === 0) {
    return <ChartEmptyState message="Belum ada transaksi pembayaran" />;
  }

  const chartData = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .map(([method, value]) => ({
      method,
      name: labelName(method),
      value,
      percent: ((value / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        <span className="text-xs text-ink-faint">Total: {rupiah(total)}</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADFC8" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => {
              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
              return String(v);
            }}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(value, _name, props) => {
              const percent = props.payload?.percent;
              return [rupiah(Number(value)) + ` (${percent}%)`, props.payload?.name];
            }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #EADFC8",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.method}`} fill={getColor(entry.method, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
