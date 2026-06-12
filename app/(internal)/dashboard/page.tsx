import { getDashboardData, getDailySales } from "@/lib/data/dashboard"
import {
  aggregateByHour,
  aggregateByDay,
  aggregateByCategory,
  comparePeriod,
  topSellers,
} from "@/lib/domain/report"
import { resolveRange, type RangePreset } from "@/lib/domain/date-range"
import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { LineChart } from "@/components/ui/line-chart"
import { DonutChart } from "@/components/ui/donut-chart"
import { RadarChart } from "@/components/ui/radar-chart"
import { RankBars } from "@/components/ui/rank-bars"
import { RangeSelector } from "./range-selector"
import { TrendingUp, Receipt, ShoppingBag, Banknote } from "lucide-react"

export const dynamic = "force-dynamic"

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`
const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const preset = (range ?? "today") as RangePreset
  const r = resolveRange(preset)

  const [data, prev] = await Promise.all([
    getDashboardData(r.start, r.end),
    getDashboardData(r.prevStart, r.prevEnd),
  ])

  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0
  const prevAvg =
    prev.totalTransaksi > 0 ? prev.totalOmzet / prev.totalTransaksi : 0

  const last7 = resolveRange("7d")
  const last7Sales = await getDailySales(last7.start, last7.end)
  const last7Daily = aggregateByDay(
    last7Sales,
    last7.start.slice(0, 10),
    last7.end.slice(0, 10),
  )

  const sellers = topSellers(data.lines, 6)
  const categories = aggregateByCategory(data.categoryLines)

  const multiDay = r.days > 1
  const daily = multiDay
    ? aggregateByDay(data.datedSales, r.start.slice(0, 10), r.end.slice(0, 10))
    : []
  const hourly = aggregateByHour(data.lines)

  const t = (cur: number, pr: number) => {
    const c = comparePeriod(cur, pr)
    return { percent: c.percent, direction: c.direction }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <RangeSelector />
      </div>

      {/* KPI dengan tren built-in vs periode sebelumnya */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Baris 1: Line 7 hari (2/3) + Donut metode bayar (1/3) */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Penjualan 7 Hari Terakhir</h2>
            <span className="text-xs text-ink-soft">
              Total: {rupiah(last7Daily.reduce((s, d) => s + d.total, 0))}
            </span>
          </div>
          <LineChart
            data={last7Daily.map((d) => {
              const dt = new Date(d.date + "T00:00:00Z")
              return {
                label: `${DAY_LABELS[dt.getUTCDay()]} ${dt.getUTCDate()}`,
                value: d.total,
              }
            })}
            formatValue={rupiah}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Metode Pembayaran</h2>
          <DonutChart
            segments={[
              { label: "Tunai", value: data.cashTotal, colorClass: "fill-success" },
              { label: "QRIS", value: data.qrisTotal, colorClass: "fill-accent" },
            ]}
            formatValue={rupiah}
          />
        </Card>
      </div>

      {/* Baris 2: Radar produk terlaris + Bar per jam */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Produk Terlaris</h2>
          {sellers.length > 0 ? (
            <RadarChart
              data={sellers.map((s) => ({ label: s.name, value: s.qty }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-ink-soft">
              Belum ada penjualan.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Penjualan per Jam</h2>
          <LineChart
            data={hourly
              .map((val, hour) => ({ hour, val }))
              .filter((h) => h.hour >= 8 && h.hour <= 22)
              .map((h) => ({ label: `${h.hour}`, value: h.val }))}
            formatValue={rupiah}
            labelEvery={2}
          />
          <p className="mt-1 text-center text-[10px] text-ink-faint">
            Jam operasional (08.00 - 22.00)
          </p>
        </Card>
      </div>

      {/* Baris 3: Omzet per kategori + Tren periode / ringkasan */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Omzet per Kategori</h2>
          <RankBars
            data={categories.map((c) => ({ label: c.category, value: c.omzet }))}
            color="bg-accent"
            formatValue={rupiah}
            emptyText="Belum ada penjualan."
          />
        </Card>

        {multiDay ? (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Tren Omzet Periode</h2>
            <LineChart
              data={daily.map((d) => ({ label: d.date.slice(8, 10), value: d.total }))}
              formatValue={rupiah}
              labelEvery={r.days > 14 ? 3 : 1}
            />
          </Card>
        ) : (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Ringkasan</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Tunai</dt>
                <dd className="font-semibold text-ink">{rupiah(data.cashTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">QRIS</dt>
                <dd className="font-semibold text-ink">{rupiah(data.qrisTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2">
                <dt className="text-ink-soft">Total item terjual</dt>
                <dd className="font-semibold text-ink">{data.totalItem}</dd>
              </div>
            </dl>
          </Card>
        )}
      </div>
    </div>
  )
}
