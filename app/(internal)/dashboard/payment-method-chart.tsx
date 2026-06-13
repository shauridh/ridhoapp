"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface PaymentMethodChartProps {
  cash: number;
  qris: number;
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const COLORS = {
  cash: "#10b981",
  qris: "#3b82f6",
};

export function PaymentMethodChart({ cash, qris }: PaymentMethodChartProps) {
  const total = cash + qris;

  if (total === 0) {
    return <ChartEmptyState message="Belum ada transaksi pembayaran" />;
  }

  const cashPercent = ((cash / total) * 100).toFixed(1);
  const qrisPercent = ((qris / total) * 100).toFixed(1);

  const chartData = [
    { name: "Cash", value: cash, percent: cashPercent },
    { name: "QRIS", value: qris, percent: qrisPercent },
  ].filter((item) => item.value > 0);

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Metode Pembayaran
        </h3>
        <span className="text-xs text-ink-faint">Total: {rupiah(total)}</span>
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
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "Cash" ? COLORS.cash : COLORS.qris}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              const percent = props.payload.percent;
              return [rupiah(Number(value)) + ` (${percent}%)`, name];
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
            formatter={(value, entry) => `${value}: ${rupiah(Number(entry.payload.value))}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
