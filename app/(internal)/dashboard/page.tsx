import { getDashboardData } from "@/lib/data/dashboard";
import { rupiah } from "@/lib/format";
import {
  comparePeriod,
  aggregateByHour,
  topSellers,
  aggregateByDay,
  aggregateByCategory,
} from "@/lib/domain/report";
import { resolveRange, resolveCustomRange, type RangePreset } from "@/lib/domain/date-range";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { RangeSelector } from "./range-selector";
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Banknote,
  Star,
  Clock,
  Tag,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { RecentTransactions } from "./recent-transactions";
import { OmzetBreakdownModal } from "./omzet-breakdown-modal";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range, from, to } = await searchParams;

  // Custom date range mengambil prioritas atas preset
  const r =
    from && to ? resolveCustomRange(from, to) : resolveRange((range ?? "today") as RangePreset);

  const [data, prev] = await Promise.all([
    getDashboardData(r.start, r.end),
    getDashboardData(r.prevStart, r.prevEnd),
  ]);

  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0;
  const prevAvg = prev.totalTransaksi > 0 ? prev.totalOmzet / prev.totalTransaksi : 0;
  const avgItemsPerTrans = data.totalTransaksi > 0 ? data.totalItem / data.totalTransaksi : 0;
  const prevAvgItems = prev.totalTransaksi > 0 ? prev.totalItem / prev.totalTransaksi : 0;

  // Avg per day for multi-day ranges
  const avgPerDay = r.days > 1 ? data.totalOmzet / r.days : null;
  const prevAvgPerDay = r.days > 1 ? prev.totalOmzet / r.days : null;

  const t = (cur: number, pr: number) => {
    const c = comparePeriod(cur, pr);
    return { percent: c.percent, direction: c.direction };
  };

  // Aggregate data for charts
  const hourlyData = aggregateByHour(data.lines);
  const dailyData = aggregateByDay(data.datedSales, r.start, r.end);
  const prevDailyData = aggregateByDay(prev.datedSales, r.prevStart, r.prevEnd);
  const topProducts = topSellers(data.lines, 5);
  const categories = aggregateByCategory(data.categoryLines);

  // Best day
  const bestDay =
    dailyData.length > 0
      ? dailyData.reduce((best, d) => (d.total > best.total ? d : best), dailyData[0])
      : null;

  // Best product
  const bestProduct = topProducts[0] ?? null;

  // Peak hour
  const maxHourVal = Math.max(...hourlyData);
  const peakHourIdx = maxHourVal > 0 ? hourlyData.indexOf(maxHourVal) : null;

  // Dominant category
  const topCategory = categories[0] ?? null;
  const totalCatOmzet = categories.reduce((s, c) => s + c.omzet, 0);
  const topCategoryPercent =
    topCategory && totalCatOmzet > 0 ? Math.round((topCategory.omzet / totalCatOmzet) * 100) : null;

  // Top offline payment method (cash/qris/transfer - bukan online food)
  const offlinePayEntries = Object.entries(data.offlinePaymentBreakdown);
  const topPaymentEntry =
    offlinePayEntries.length > 0
      ? offlinePayEntries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))
      : null;
  const topPaymentLabel: Record<string, string> = {
    cash: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
    debit: "Debit/EDC",
    lainnya: "Lainnya",
  };
  const topPaymentName = topPaymentEntry
    ? (topPaymentLabel[topPaymentEntry[0].toLowerCase()] ?? topPaymentEntry[0])
    : null;
  const topPaymentTotal = topPaymentEntry ? topPaymentEntry[1] : 0;
  const topPaymentPercent =
    topPaymentEntry && data.totalOmzet > 0
      ? Math.round((topPaymentTotal / data.totalOmzet) * 100)
      : null;

  // Cash & QRIS — juga cek offlinePaymentBreakdown untuk case payment method tidak match persis
  const cashAmt =
    data.cashTotal > 0
      ? data.cashTotal
      : Object.entries(data.offlinePaymentBreakdown)
          .filter(([k]) => k.toLowerCase().includes("tunai") || k.toLowerCase() === "cash")
          .reduce((s, [, v]) => s + v, 0);
  const qrisAmt =
    data.qrisTotal > 0
      ? data.qrisTotal
      : Object.entries(data.offlinePaymentBreakdown)
          .filter(([k]) => k.toLowerCase().includes("qris"))
          .reduce((s, [, v]) => s + v, 0);

  // Semua offline payment breakdown untuk card (termasuk transfer, debit, dll)
  const hasOfflineData = data.transactionBreakdown.offline > 0;

  // Online food metrics — fix: gunakan orderCount bukan onlineOrderCount
  const onlineTotalRevenue =
    data.transactionBreakdown.gojek +
    data.transactionBreakdown.grab +
    data.transactionBreakdown.shopee;
  const onlineTotalOrders = data.orderCount.gojek + data.orderCount.grab + data.orderCount.shopee;
  const hasOnlineData = onlineTotalRevenue > 0;

  const onlinePlatforms = [
    {
      key: "gojek",
      label: "GoFood",
      color: "text-brand",
      bg: "bg-tint-red",
      revenue: data.transactionBreakdown.gojek,
      prevRevenue: prev.transactionBreakdown.gojek,
      orders: data.orderCount.gojek,
      prevOrders: prev.orderCount.gojek,
    },
    {
      key: "grab",
      label: "GrabFood",
      color: "text-success",
      bg: "bg-tint-green",
      revenue: data.transactionBreakdown.grab,
      prevRevenue: prev.transactionBreakdown.grab,
      orders: data.orderCount.grab,
      prevOrders: prev.orderCount.grab,
    },
    {
      key: "shopee",
      label: "ShopeeFood",
      color: "text-accent",
      bg: "bg-tint-amber",
      revenue: data.transactionBreakdown.shopee,
      prevRevenue: prev.transactionBreakdown.shopee,
      orders: data.orderCount.shopee,
      prevOrders: prev.orderCount.shopee,
    },
  ];

  // Breakdown data untuk modal
  const breakdownData = {
    cashTotal: data.cashTotal,
    qrisTotal: data.qrisTotal,
    offlinePaymentBreakdown: data.offlinePaymentBreakdown,
    transactionBreakdown: data.transactionBreakdown,
    prevTransactionBreakdown: prev.transactionBreakdown,
    orderCount: data.orderCount,
    prevOrderCount: prev.orderCount,
    totalOmzet: data.totalOmzet,
    prevTotalOmzet: prev.totalOmzet,
    totalTransaksi: data.totalTransaksi,
    prevTotalTransaksi: prev.totalTransaksi,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" actions={<RangeSelector />} />

      <div className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-ink-soft">Metrik Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <StatCard
              label="Omzet"
              tone="green"
              icon={TrendingUp}
              value={rupiah(data.totalOmzet)}
              trend={t(data.totalOmzet, prev.totalOmzet)}
            />
            <OmzetBreakdownModal data={breakdownData} />
          </div>
          <div className="relative">
            <StatCard
              label="Transaksi"
              tone="red"
              icon={Receipt}
              value={String(data.totalTransaksi)}
              trend={t(data.totalTransaksi, prev.totalTransaksi)}
            />
            <OmzetBreakdownModal data={breakdownData} />
          </div>
          <StatCard
            label="Rata/Transaksi"
            tone="amber"
            icon={Banknote}
            value={rupiah(Math.round(avg))}
            trend={t(avg, prevAvg)}
          />
          {avgPerDay !== null ? (
            <StatCard
              label="Omzet/Hari"
              tone="blue"
              icon={ShoppingBag}
              value={rupiah(Math.round(avgPerDay))}
              trend={prevAvgPerDay !== null ? t(avgPerDay, prevAvgPerDay) : undefined}
            />
          ) : (
            <StatCard
              label="Item/Transaksi"
              tone="blue"
              icon={ShoppingBag}
              value={avgItemsPerTrans.toFixed(1)}
              trend={t(avgItemsPerTrans, prevAvgItems)}
            />
          )}
        </div>
      </div>

      {/* Metrik Online Food — di bawah metrik utama */}
      {hasOnlineData && (
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-ink-soft">Metrik Online Food</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {onlinePlatforms
              .filter((p) => p.revenue > 0)
              .map((p) => {
                const avgOrder = p.orders > 0 ? Math.round(p.revenue / p.orders) : 0;
                const sharePercent =
                  onlineTotalRevenue > 0 ? Math.round((p.revenue / onlineTotalRevenue) * 100) : 0;
                const orderPct =
                  p.prevOrders > 0
                    ? Math.round(((p.orders - p.prevOrders) / p.prevOrders) * 100)
                    : null;
                return (
                  <div
                    key={p.key}
                    className="rounded-2xl border border-hairline bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${p.bg} ${p.color}`}
                      >
                        <Smartphone size={16} />
                      </span>
                      <span className="text-xs font-semibold text-ink-soft">{p.label}</span>
                    </div>
                    <p className="text-xl font-bold text-ink">{rupiah(p.revenue)}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                      <span>{p.orders} order</span>
                      <span>{sharePercent}% online</span>
                    </div>
                    {orderPct !== null && (
                      <p
                        className={`mt-1 text-xs font-semibold ${orderPct >= 0 ? "text-success" : "text-danger"}`}
                      >
                        {orderPct >= 0 ? "+" : ""}
                        {orderPct}% vs periode lalu
                      </p>
                    )}
                    <div className="mt-1 text-xs text-ink-faint">
                      Rata-rata: {rupiah(avgOrder)}/order
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-1 basis-40 items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm">
              <span className="text-ink-soft">Total Online</span>
              <span className="font-bold text-brand">{rupiah(onlineTotalRevenue)}</span>
            </div>
            <div className="flex flex-1 basis-40 items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm">
              <span className="text-ink-soft">Order Online</span>
              <span className="font-bold text-ink">{onlineTotalOrders} order</span>
            </div>
            <div className="flex flex-1 basis-40 items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-sm">
              <span className="text-ink-soft">% dari Omzet</span>
              <span className="font-bold text-ink">
                {data.totalOmzet > 0 ? Math.round((onlineTotalRevenue / data.totalOmzet) * 100) : 0}
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Insight callout cards */}
      {(bestProduct || peakHourIdx !== null || bestDay || topCategory) && (
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-ink-soft">Insight Operasional</h2>
          <div className="flex flex-wrap gap-3">
            {bestProduct ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-amber text-accent">
                  <Star size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Produk Terlaris</p>
                  <p className="truncate font-semibold text-ink">{bestProduct.name}</p>
                  <p className="text-xs text-ink-soft">
                    {bestProduct.qty} terjual &middot; {rupiah(bestProduct.omzet)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <Star size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Produk Terlaris</p>
                  <p className="text-xs text-ink-faint">Belum ada data</p>
                </div>
              </div>
            )}
            {peakHourIdx !== null ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-green text-success">
                  <Clock size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Jam Puncak</p>
                  <p className="font-semibold text-ink">
                    {String(peakHourIdx).padStart(2, "0")}:00 &ndash;{" "}
                    {String(peakHourIdx + 1).padStart(2, "0")}:00
                  </p>
                  <p className="text-xs text-ink-soft">{rupiah(maxHourVal)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <Clock size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Jam Puncak</p>
                  <p className="text-xs text-ink-faint">Belum ada transaksi</p>
                </div>
              </div>
            )}
            {bestDay && bestDay.total > 0 && r.days > 1 ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-blue text-info">
                  <TrendingUp size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Hari Terbaik</p>
                  <p className="font-semibold text-ink">
                    {new Date(bestDay.date).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-ink-soft">{rupiah(bestDay.total)}</p>
                </div>
              </div>
            ) : r.days > 1 ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <TrendingUp size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Hari Terbaik</p>
                  <p className="text-xs text-ink-faint">Belum ada data</p>
                </div>
              </div>
            ) : null}
            {topCategory && topCategoryPercent !== null ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    topCategoryPercent >= 60
                      ? "bg-tint-red text-brand"
                      : topCategoryPercent >= 40
                        ? "bg-tint-amber text-accent"
                        : "bg-tint-blue text-info"
                  }`}
                >
                  <Tag size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Kategori Dominan</p>
                  <p className="truncate font-semibold text-ink">{topCategory.category}</p>
                  <p className="text-xs text-ink-soft">
                    {topCategoryPercent}% dari omzet &middot; {rupiah(topCategory.omzet)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <Tag size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Kategori Dominan</p>
                  <p className="text-xs text-ink-faint">Belum ada data</p>
                </div>
              </div>
            )}
            {/* Card: Pembayaran Terbanyak */}
            {hasOfflineData ? (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-green text-success">
                  <CreditCard size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink-soft">Pembayaran Offline</p>
                  {cashAmt > 0 && (
                    <p className="text-xs text-ink">
                      <span className="font-semibold text-success">Tunai</span> {rupiah(cashAmt)}
                    </p>
                  )}
                  {qrisAmt > 0 && (
                    <p className="text-xs text-ink">
                      <span className="font-semibold text-info">QRIS</span> {rupiah(qrisAmt)}
                    </p>
                  )}
                  {/* Metode lain selain cash/qris */}
                  {Object.entries(data.offlinePaymentBreakdown)
                    .filter(
                      ([k]) =>
                        !k.toLowerCase().includes("tunai") &&
                        k.toLowerCase() !== "cash" &&
                        !k.toLowerCase().includes("qris")
                    )
                    .map(([k, v]) => (
                      <p key={k} className="text-xs text-ink">
                        <span className="font-semibold text-accent capitalize">{k}</span>{" "}
                        {rupiah(v)}
                      </p>
                    ))}
                  {topPaymentName && topPaymentPercent !== null && (
                    <p className="text-xs text-ink-faint">
                      Terbanyak: {topPaymentName} ({topPaymentPercent}%)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 basis-48 items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <CreditCard size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Pembayaran Offline</p>
                  <p className="text-xs text-ink-faint">Belum ada data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <DashboardCharts
        hourlyData={hourlyData}
        topProducts={topProducts}
        dailyData={dailyData}
        prevDailyData={prevDailyData}
        categories={categories}
        cashTotal={data.cashTotal}
        qrisTotal={data.qrisTotal}
        paymentBreakdown={data.paymentBreakdown}
        transactionBreakdown={data.transactionBreakdown}
        prevTransactionBreakdown={prev.transactionBreakdown}
        orderCount={data.orderCount}
        prevOrderCount={prev.orderCount}
      />

      <div className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-ink-soft">Transaksi Terbaru</h2>
        <RecentTransactions />
      </div>
    </div>
  );
}
