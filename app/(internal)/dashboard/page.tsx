import { getDashboardData, getDailySales } from "@/lib/data/dashboard";
import {
  aggregateByHour,
  aggregateByDay,
  aggregateByCategory,
  comparePeriod,
  topSellers,
} from "@/lib/domain/report";
import { resolveRange, type RangePreset } from "@/lib/domain/date-range";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LineChart } from "@/components/ui/line-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { RadarChart } from "@/components/ui/radar-chart";
import { RankBars } from "@/components/ui/rank-bars";
import { BarChart } from "@/components/ui/bar-chart";
import { PageHeader } from "@/components/ui/page-header";
import { RangeSelector } from "./range-selector";
import { TrendingUp, Receipt, ShoppingBag, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

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

  const last7 = resolveRange("7d");
  const last7Sales = await getDailySales(last7.start, last7.end);
  const last7Daily = aggregateByDay(last7Sales, last7.start.slice(0, 10), last7.end.slice(0, 10));

  const sellers = topSellers(data.lines, 6);
  const categories = aggregateByCategory(data.categoryLines);

  const multiDay = r.days > 1;
  const daily = multiDay
    ? aggregateByDay(data.datedSales, r.start.slice(0, 10), r.end.slice(0, 10))
    : [];
  const hourly = aggregateByHour(data.lines);

  const t = (cur: number, pr: number) => {
    const c = comparePeriod(cur, pr);
    return { percent: c.percent, direction: c.direction };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" actions={<RangeSelector />} />

      {/* Section 1: KPI Cards */}
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
            label="Item Terjual"
            tone="blue"
            icon={ShoppingBag}
            value={String(data.totalItem)}
            trend={t(data.totalItem, prev.totalItem)}
          />
        </div>
      </div>

      {/* Section 2: Hourly Sales + Payment */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-ink-soft px-1">Penjualan Hari Ini</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Penjualan per Jam</h3>
              <span className="text-xs text-ink-soft">08:00 - 22:00</span>
            </div>
            <BarChart
              data={hourly
                .map((val, hour) => ({ hour, val }))
                .filter((h) => h.hour >= 8 && h.hour <= 22)
                .map((h) => ({ label: `${h.hour}:00`, value: h.val }))}
              color="bg-accent"
              formatValue={rupiah}
              labelEvery={2}
              height={220}
            />
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold text-ink">Metode Pembayaran</h3>
            <DonutChart
              segments={[
                { label: "Tunai", value: data.cashTotal, colorClass: "fill-success" },
                { label: "QRIS", value: data.qrisTotal, colorClass: "fill-accent" },
              ]}
              formatValue={rupiah}
            />
          </Card>
        </div>
      </div>

      {/* Section 3: Products + Trends */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-ink-soft px-1">Tren & Produk</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-semibold text-ink">Produk Terlaris</h3>
            {sellers.length > 0 ? (
              <RadarChart data={sellers.map((s) => ({ label: s.name, value: s.qty }))} />
            ) : (
              <p className="py-12 text-center text-sm text-ink-soft">Belum ada penjualan.</p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">7 Hari Terakhir</h3>
              <span className="text-xs font-medium text-ink">
                {rupiah(last7Daily.reduce((s, d) => s + d.total, 0))}
              </span>
            </div>
            <BarChart
              data={last7Daily.map((d) => {
                const dt = new Date(d.date + "T00:00:00Z");
                return {
                  label: `${DAY_LABELS[dt.getUTCDay()]} ${dt.getUTCDate()}`,
                  value: d.total,
                };
              })}
              color="bg-brand"
              formatValue={rupiah}
              height={220}
            />
          </Card>
        </div>
      </div>

      {/* Section 4: Categories + Summary */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-ink-soft px-1">Kategori & Ringkasan</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-semibold text-ink">Omzet per Kategori</h3>
            <RankBars
              data={categories.map((c) => ({ label: c.category, value: c.omzet }))}
              color="bg-accent"
              formatValue={rupiah}
              emptyText="Belum ada penjualan."
            />
          </Card>

          {multiDay ? (
            <Card>
              <h3 className="mb-4 font-semibold text-ink">Tren Omzet Periode</h3>
              <LineChart
                data={daily.map((d) => ({ label: d.date.slice(8, 10), value: d.total }))}
                formatValue={rupiah}
                labelEvery={r.days > 14 ? 3 : 1}
                height={220}
              />
            </Card>
          ) : (
            <Card>
              <h3 className="mb-4 font-semibold text-ink">Ringkasan</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface p-3">
                  <dt className="text-sm text-ink-soft">Tunai</dt>
                  <dd className="font-semibold text-ink">{rupiah(data.cashTotal)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface p-3">
                  <dt className="text-sm text-ink-soft">QRIS</dt>
                  <dd className="font-semibold text-ink">{rupiah(data.qrisTotal)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-accent/10 p-3 border border-accent/20">
                  <dt className="text-sm font-medium text-ink">Total Item</dt>
                  <dd className="font-bold text-ink text-lg">{data.totalItem}</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
