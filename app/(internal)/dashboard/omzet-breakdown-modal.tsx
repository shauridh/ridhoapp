"use client";

import { useState } from "react";
import { rupiah } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BreakdownData {
  // Revenue breakdown
  cashTotal: number;
  qrisTotal: number;
  offlinePaymentBreakdown: Record<string, number>;
  transactionBreakdown: { offline: number; gojek: number; grab: number; shopee: number };
  prevTransactionBreakdown: { offline: number; gojek: number; grab: number; shopee: number };
  // Order count breakdown
  orderCount: { offline: number; gojek: number; grab: number; shopee: number };
  prevOrderCount: { offline: number; gojek: number; grab: number; shopee: number };
  // Totals
  totalOmzet: number;
  prevTotalOmzet: number;
  totalTransaksi: number;
  prevTotalTransaksi: number;
}

interface OmzetBreakdownModalProps {
  data: BreakdownData;
}

function PctBadge({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return <span className="text-xs text-ink-faint">Baru</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const up = pct > 0;
  const eq = pct === 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-semibold ${eq ? "text-ink-faint" : up ? "text-success" : "text-danger"}`}
    >
      {eq ? <Minus size={11} /> : up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  tunai: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
  debit: "Debit/EDC",
  lainnya: "Lainnya",
};

const CHANNEL_LABEL: Record<string, string> = {
  offline: "Offline",
  gojek: "GoFood",
  grab: "GrabFood",
  shopee: "ShopeeFood",
};

export function OmzetBreakdownModal({ data }: OmzetBreakdownModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"omzet" | "order">("omzet");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute inset-0 rounded-2xl"
        aria-label="Lihat breakdown omzet"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Breakdown Transaksi" size="md">
        {/* Tab */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("omzet")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === "omzet" ? "bg-brand text-white" : "bg-surface text-ink-soft hover:bg-hairline"}`}
          >
            Omzet
          </button>
          <button
            onClick={() => setTab("order")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === "order" ? "bg-brand text-white" : "bg-surface text-ink-soft hover:bg-hairline"}`}
          >
            Order
          </button>
        </div>

        {tab === "omzet" && (
          <div className="space-y-3">
            {/* Offline breakdown */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Offline</p>
              {Object.entries(data.offlinePaymentBreakdown)
                .filter(([, v]) => v > 0)
                .map(([method, amount]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      {PAYMENT_LABEL[method.toLowerCase()] ?? method}
                    </span>
                    <span className="font-semibold text-ink">{rupiah(amount)}</span>
                  </div>
                ))}
              {Object.values(data.offlinePaymentBreakdown).every((v) => v === 0) && (
                <p className="text-xs text-ink-faint px-1">Belum ada transaksi offline</p>
              )}
            </div>

            {/* Online breakdown */}
            {(data.transactionBreakdown.gojek > 0 ||
              data.transactionBreakdown.grab > 0 ||
              data.transactionBreakdown.shopee > 0) && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Online Food
                </p>
                {(["gojek", "grab", "shopee"] as const)
                  .filter((k) => data.transactionBreakdown[k] > 0)
                  .map((k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                    >
                      <span className="text-ink">{CHANNEL_LABEL[k]}</span>
                      <div className="flex items-center gap-2">
                        <PctBadge
                          cur={data.transactionBreakdown[k]}
                          prev={data.prevTransactionBreakdown[k]}
                        />
                        <span className="font-semibold text-ink">
                          {rupiah(data.transactionBreakdown[k])}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Total */}
            <div className="rounded-xl bg-tint-green px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-success">Total Omzet</span>
              <div className="flex items-center gap-2">
                <PctBadge cur={data.totalOmzet} prev={data.prevTotalOmzet} />
                <span className="text-lg font-bold text-success">{rupiah(data.totalOmzet)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === "order" && (
          <div className="space-y-3">
            {(["offline", "gojek", "grab", "shopee"] as const)
              .filter((k) => data.orderCount[k] > 0)
              .map((k) => {
                const totalOrders = Object.values(data.orderCount).reduce((s, v) => s + v, 0);
                const share =
                  totalOrders > 0 ? Math.round((data.orderCount[k] / totalOrders) * 100) : 0;
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                  >
                    <span className="text-ink">{CHANNEL_LABEL[k]}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-faint">{share}%</span>
                      <PctBadge cur={data.orderCount[k]} prev={data.prevOrderCount[k]} />
                      <span className="font-semibold text-ink w-16 text-right">
                        {data.orderCount[k]} order
                      </span>
                    </div>
                  </div>
                );
              })}
            {/* Total */}
            <div className="rounded-xl bg-tint-blue px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-info">Total Order</span>
              <div className="flex items-center gap-2">
                <PctBadge cur={data.totalTransaksi} prev={data.prevTotalTransaksi} />
                <span className="text-lg font-bold text-info">{data.totalTransaksi} order</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
