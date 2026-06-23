"use client";
import { rupiah } from "@/lib/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ChartEmptyState } from "@/components/ui/chart-skeleton";

interface OrderCount {
  offline: number;
  gojek: number;
  grab: number;
  shopee: number;
}

interface TransactionBreakdown {
  offline: number;
  gojek: number;
  grab: number;
  shopee: number;
}

interface TransactionTypeChartProps {
  orderCount: OrderCount;
  prevOrderCount: OrderCount;
  transactionBreakdown: TransactionBreakdown;
  prevTransactionBreakdown: TransactionBreakdown;
  title?: string;
}

const CHANNELS: {
  key: keyof OrderCount;
  label: string;
  color: string;
  bg: string;
  bar: string;
}[] = [
  { key: "offline", label: "Offline", color: "text-success", bg: "bg-tint-green", bar: "#10b981" },
  { key: "gojek", label: "GoFood", color: "text-brand", bg: "bg-tint-red", bar: "#E11B22" },
  { key: "grab", label: "GrabFood", color: "text-success", bg: "bg-tint-green", bar: "#00B14F" },
  { key: "shopee", label: "ShopeeFood", color: "text-accent", bg: "bg-tint-amber", bar: "#EE4D2D" },
];

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? null : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

function TrendBadge({ cur, prev }: { cur: number; prev: number }) {
  const pct = pctChange(cur, prev);
  if (pct === null) return <span className="text-[10px] text-ink-faint">Baru</span>;
  if (pct === 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-ink-faint">
        <Minus size={10} /> 0%
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? "text-success" : "text-danger"}`}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}

export function TransactionTypeChart({
  orderCount,
  prevOrderCount,
  transactionBreakdown,
  prevTransactionBreakdown,
  title = "Jenis Transaksi",
}: TransactionTypeChartProps) {
  const totalOrders = Object.values(orderCount).reduce((s, v) => s + v, 0);

  if (totalOrders === 0) {
    return <ChartEmptyState message="Belum ada transaksi" />;
  }

  const maxOrders = Math.max(...Object.values(orderCount), 1);

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        <span className="text-xs text-ink-faint">{totalOrders} order total</span>
      </div>

      <div className="space-y-3">
        {CHANNELS.filter((ch) => orderCount[ch.key] > 0 || prevOrderCount[ch.key] > 0).map((ch) => {
          const orders = orderCount[ch.key];
          const revenue = transactionBreakdown[ch.key];
          const barPct = maxOrders > 0 ? Math.round((orders / maxOrders) * 100) : 0;
          const sharePct = totalOrders > 0 ? Math.round((orders / totalOrders) * 100) : 0;

          return (
            <div key={ch.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${ch.bg} ${ch.color}`}
                  >
                    {ch.label[0]}
                  </span>
                  <span className="truncate text-sm font-medium text-ink">{ch.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TrendBadge cur={orders} prev={prevOrderCount[ch.key]} />
                  <span className="text-xs text-ink-soft">{sharePct}%</span>
                  <span className="text-sm font-bold text-ink w-14 text-right">{orders} order</span>
                </div>
              </div>
              {/* Bar */}
              <div className="h-2 w-full rounded-full bg-surface">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: ch.bar }}
                />
              </div>
              {/* Revenue */}
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span>{rupiah(revenue)}</span>
                <TrendBadge cur={revenue} prev={prevTransactionBreakdown[ch.key]} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total summary */}
      <div className="mt-4 rounded-xl bg-surface px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-ink-soft">Total Omzet</span>
        <div className="flex items-center gap-2">
          <TrendBadge
            cur={Object.values(transactionBreakdown).reduce((s, v) => s + v, 0)}
            prev={Object.values(prevTransactionBreakdown).reduce((s, v) => s + v, 0)}
          />
          <span className="text-sm font-bold text-ink">
            {rupiah(Object.values(transactionBreakdown).reduce((s, v) => s + v, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
