"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { rupiah } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OnlineOrderRow, OnlinePlatform } from "@/lib/data/online-orders";

const PLATFORM_CONFIG: Record<OnlinePlatform, { label: string; color: string }> = {
  web: { label: "Web", color: "bg-blue-100 text-blue-700" },
  gofood: { label: "GoFood", color: "bg-red-100 text-red-700" },
  grabfood: { label: "GrabFood", color: "bg-green-100 text-green-700" },
  shopeefood: { label: "ShopeeFood", color: "bg-orange-100 text-orange-700" },
  manual: { label: "Manual", color: "bg-gray-100 text-gray-600" },
};

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  pending: "accent",
  confirmed: "neutral",
  paid: "success",
  done: "success",
  cancelled: "danger",
};

interface Props {
  orders: OnlineOrderRow[];
  platformStats: { platform: OnlinePlatform; count: number; total: number }[];
}

export function OnlineHistoryClient({ orders, platformStats }: Props) {
  const [platformFilter, setPlatformFilter] = useState<OnlinePlatform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = orders.filter((o) => {
    if (platformFilter !== "all" && o.platform !== platformFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const totalOmzet = platformStats.reduce((s, p) => s + p.total, 0);

  const platforms = Array.from(new Set(orders.map((o) => o.platform)));

  return (
    <div className="space-y-4">
      <Link
        href="/pos"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Kembali ke Kasir
      </Link>

      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <ShoppingBag size={22} className="text-brand" /> Riwayat Order Online
      </h1>

      {/* Stat cards per platform */}
      {platformStats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((p) => {
            const cfg = PLATFORM_CONFIG[p.platform];
            return (
              <div
                key={p.platform}
                className="rounded-2xl border border-hairline bg-white p-4 shadow-sm"
              >
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cfg.color}`}>
                  {cfg.label}
                </span>
                <p className="mt-2 text-2xl font-bold text-ink">{rupiah(p.total)}</p>
                <p className="text-xs text-ink-soft">{p.count} pesanan selesai</p>
              </div>
            );
          })}
          {platformStats.length > 1 && (
            <div className="rounded-2xl border border-hairline bg-surface p-4">
              <span className="text-xs font-semibold text-ink-soft">Total Semua Platform</span>
              <p className="mt-2 text-2xl font-bold text-brand">{rupiah(totalOmzet)}</p>
              <p className="text-xs text-ink-soft">
                {platformStats.reduce((s, p) => s + p.count, 0)} pesanan selesai
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {/* Platform filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setPlatformFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              platformFilter === "all"
                ? "bg-brand text-white"
                : "border border-hairline bg-white text-ink-soft hover:bg-surface"
            }`}
          >
            Semua Platform
          </button>
          {platforms.map((p) => {
            const cfg = PLATFORM_CONFIG[p];
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  platformFilter === p
                    ? "bg-brand text-white"
                    : "border border-hairline bg-white text-ink-soft hover:bg-surface"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1">
          {(["all", "done", "paid", "confirmed", "pending", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === s
                  ? "bg-ink text-white"
                  : "border border-hairline bg-white text-ink-soft hover:bg-surface"
              }`}
            >
              {s === "all" ? "Semua Status" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const cfg = PLATFORM_CONFIG[o.platform ?? "web"];
              return (
                <tr
                  key={o.id}
                  className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
                >
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {new Date(o.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.nama}</p>
                    {o.phone !== "-" && <p className="text-xs text-ink-soft">{o.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.items.map((i, idx) => (
                      <span key={idx} className="block">
                        {i.name} x{i.qty}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{rupiah(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {filtered.map((o) => {
          const cfg = PLATFORM_CONFIG[o.platform ?? "web"];
          return (
            <Card key={o.id} className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{o.nama}</span>
                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                </div>
              </div>
              <p className="text-xs text-ink-soft">
                {new Date(o.created_at).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-ink">
                {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
              </p>
              <p className="font-bold text-brand">{rupiah(o.total)}</p>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
