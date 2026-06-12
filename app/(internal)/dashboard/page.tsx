import { getDashboardData, getOmzetForRange, getDailySales } from "@/lib/data/dashboard"
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
import { BarChart } from "@/components/ui/bar-chart"
import { RankBars } from "@/components/ui/rank-bars"
import { SplitBar } from "@/components/ui/split-bar"
import { RangeSelector } from "./range-selector"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  ShoppingBag,
  Banknote,
} from "lucide-react"

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

  const data = await getDashboardData(r.start, r.end)
  const prevOmzet = await getOmzetForRange(r.prevStart, r.prevEnd)
  const cmp = comparePeriod(data.totalOmzet, prevOmzet)

  // Tren 7 hari terakhir SELALU tampil, lepas dari rentang yang dipilih.
  const last7 = resolveRange("7d")
  const last7Sales = await getDailySales(last7.start, last7.end)
  const last7Daily = aggregateByDay(
    last7Sales,
    last7.start.slice(0, 10),
    last7.end.slice(0, 10),
  )

  const sellers = topSellers(data.lines, 5)
  const categories = aggregateByCategory(data.categoryLines)
  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0

  const multiDay = r.days > 1
  const daily = multiDay
    ? aggregateByDay(data.datedSales, r.start.slice(0, 10), r.end.slice(0, 10))
    : []
  const hourly = aggregateByHour(data.lines)

  const TrendIcon =
    cmp.direction === "up" ? TrendingUp : cmp.direction === "down" ? TrendingDown : Minus
  const trendColor =
    cmp.direction === "up"
      ? "text-success"
      : cmp.direction === "down"
        ? "text-danger"
        : "text-ink-soft"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <RangeSelector />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Omzet" tone="green" icon={TrendingUp} value={rupiah(data.totalOmzet)} />
        <StatCard label="Transaksi" tone="red" icon={Receipt} value={String(data.totalTransaksi)} />
        <StatCard label="Rata/Transaksi" tone="amber" icon={Banknote} value={rupiah(Math.round(avg))} />
        <StatCard label="Item Terjual" tone="blue" icon={ShoppingBag} value={String(data.totalItem)} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">vs periode sebelumnya</p>
            <p className="text-xs text-ink-faint">{rupiah(prevOmzet)}</p>
          </div>
          <div className={`flex items-center gap-2 ${trendColor}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
              <TrendIcon size={18} />
            </span>
            <div className="text-right">
              <div className="font-bold leading-tight">
                {cmp.percent > 0 ? "+" : ""}
                {cmp.percent}%
              </div>
              <div className="text-xs text-ink-soft">
                {cmp.diff >= 0 ? "+" : "-"}
                {rupiah(Math.abs(cmp.diff))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Penjualan 7 Hari Terakhir</h2>
          <span className="text-xs text-ink-soft">
            Total: {rupiah(last7Daily.reduce((s, d) => s + d.total, 0))}
          </span>
        </div>
        <BarChart
          data={last7Daily.map((d) => {
            const dt = new Date(d.date + "T00:00:00Z")
            return {
              label: `${DAY_LABELS[dt.getUTCDay()]} ${dt.getUTCDate()}`,
              value: d.total,
            }
          })}
          color="bg-brand"
          formatValue={rupiah}
        />
      </Card>

      {multiDay && (
        <Card>
          <h2 className="mb-4 font-semibold text-ink">Tren Omzet Harian (Periode)</h2>
          <BarChart
            data={daily.map((d) => ({ label: d.date.slice(8, 10), value: d.total }))}
            color="bg-brand"
            formatValue={rupiah}
            labelEvery={r.days > 14 ? 3 : 1}
          />
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink">Metode Pembayaran</h2>
          <SplitBar
            segments={[
              { label: "Tunai", value: data.cashTotal, colorClass: "bg-success" },
              { label: "QRIS", value: data.qrisTotal, colorClass: "bg-accent" },
            ]}
            formatValue={rupiah}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink">Omzet per Kategori</h2>
          <RankBars
            data={categories.map((c) => ({ label: c.category, value: c.omzet }))}
            color="bg-accent"
            formatValue={rupiah}
            emptyText="Belum ada penjualan."
          />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink">Produk Terlaris</h2>
          <RankBars
            data={sellers.map((s) => ({
              label: s.name,
              value: s.qty,
              sublabel: "terjual",
            }))}
            color="bg-brand"
            emptyText="Belum ada penjualan."
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink">Penjualan per Jam</h2>
          <BarChart
            data={hourly.map((val, hour) => ({ label: String(hour), value: val }))}
            color="bg-accent"
            formatValue={rupiah}
            labelEvery={3}
          />
        </Card>
      </div>
    </div>
  )
}
