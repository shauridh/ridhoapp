import { getDashboardData } from "@/lib/data/dashboard";
import {
  comparePeriod,
  aggregateByHour,
  topSellers,
  aggregateByDay,
  aggregateByCategory,
} from "@/lib/domain/report";
import { resolveRange, type RangePreset } from "@/lib/domain/date-range";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { RangeSelector } from "./range-selector";
import { TrendingUp, Receipt, ShoppingBag, Banknote, Star, Clock, Tag } from "lucide-react";
import { HourlyChart } from "./hourly-chart";
import { DailyChart } from "./daily-chart";
import { TopProductsChart } from "./top-products-chart";
import { PaymentMethodChart } from "./payment-method-chart";
import { CategoryChart } from "./category-chart";

export const dynamic = "force-dynamic";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const preset = (range ?? "today") as RangePreset;
  const r = resolveRange(preset);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" actions={<RangeSelector />} />

      <div className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-ink-soft">Metrik Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Omzet"
            tone="green"
            icon={TrendingUp}
            value={rupiah(data.totalOmzet)}
            trend={t(data.totalOmzet, prev.totalOmzet)}
          />
          <StatCard
            label="Transaksi"
            tone="red"
            icon={Receipt}
            value={String(data.totalTransaksi)}
            trend={t(data.totalTransaksi, prev.totalTransaksi)}
          />
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

      {/* Insight callout cards */}
      {(bestProduct || peakHourIdx !== null || bestDay || topCategory) && (
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-ink-soft">Insight Operasional</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bestProduct ? (
              <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
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
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
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
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
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
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 shadow-sm">
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
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint">
                  <Tag size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">Kategori Dominan</p>
                  <p className="text-xs text-ink-faint">Belum ada data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <HourlyChart data={hourlyData} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopProductsChart products={topProducts} />
        <DailyChart data={dailyData} prevData={prevDailyData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart categories={categories} />
        <PaymentMethodChart cash={data.cashTotal} qris={data.qrisTotal} />
      </div>
    </div>
  );
}
