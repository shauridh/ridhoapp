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
import { TrendingUp, Receipt, ShoppingBag, Banknote } from "lucide-react";
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

  const t = (cur: number, pr: number) => {
    const c = comparePeriod(cur, pr);
    return { percent: c.percent, direction: c.direction };
  };

  // Aggregate data for charts
  const hourlyData = aggregateByHour(data.lines);
  const dailyData = aggregateByDay(data.datedSales, r.start, r.end);
  const topProducts = topSellers(data.lines, 5);
  const categories = aggregateByCategory(data.categoryLines);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" actions={<RangeSelector />} />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-ink-soft px-1">Metrik Utama</h2>
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
          <StatCard
            label="Item/Transaksi"
            tone="blue"
            icon={ShoppingBag}
            value={avgItemsPerTrans.toFixed(1)}
            trend={t(avgItemsPerTrans, prevAvgItems)}
          />
        </div>
      </div>

      <HourlyChart data={hourlyData} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopProductsChart products={topProducts} />
        <DailyChart data={dailyData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart categories={categories} />
        <PaymentMethodChart cash={data.cashTotal} qris={data.qrisTotal} />
      </div>
    </div>
  );
}
