import { getDashboardData, getOmzetForRange } from "@/lib/data/dashboard"
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
const CAT_COLORS = ["bg-brand", "bg-accent", "bg-success", "bg-blue-400", "bg-purple-400"]

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

  const sellers = topSellers(data.lines, 5)
  const maxSeller = Math.max(1, ...sellers.map((s) => s.qty))
  const categories = aggregateByCategory(data.categoryLines)
  const maxCat = Math.max(1, ...categories.map((c) => c.omzet))
  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0

  const multiDay = r.days > 1
  const daily = multiDay ? aggregateByDay(data.datedSales, r.start.slice(0, 10), r.end.slice(0, 10)) : []
  const maxDay = Math.max(1, ...daily.map((d) => d.total))
  const hourly = aggregateByHour(data.lines)
  const maxHour = Math.max(1, ...hourly)

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
            <p className="text-sm text-ink-soft">vs periode sebelumnya</p>
            <p className="text-xs text-ink-faint">{rupiah(prevOmzet)}</p>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${trendColor}`}>
            <TrendIcon size={18} />
            <span>
              {cmp.percent > 0 ? "+" : ""}
              {cmp.percent}%
            </span>
            <span className="text-sm text-ink-soft">
              ({cmp.diff >= 0 ? "+" : "-"}
              {rupiah(Math.abs(cmp.diff))})
            </span>
          </div>
        </div>
      </Card>

      {multiDay && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Tren Omzet Harian</h2>
          <div className="flex items-end gap-1" style={{ height: "160px" }}>
            {daily.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-brand"
                  style={{ height: `${(d.total / maxDay) * 140}px` }}
                  title={`${d.date} — ${rupiah(d.total)}`}
                />
                <span className="mt-1 text-[9px] text-ink-soft">
                  {d.date.slice(8, 10)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Tanggal — tinggi batang = omzet</p>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Metode Pembayaran</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Tunai</span>
              <span className="font-semibold text-ink">{rupiah(data.cashTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">QRIS</span>
              <span className="font-semibold text-ink">{rupiah(data.qrisTotal)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Omzet per Kategori</h2>
          <div className="space-y-2">
            {categories.map((c, i) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm text-ink">
                  <span>{c.category}</span>
                  <span className="text-ink-soft">{rupiah(c.omzet)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface">
                  <div
                    className={`h-2 rounded-full ${CAT_COLORS[i % CAT_COLORS.length]}`}
                    style={{ width: `${(c.omzet / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-ink-soft">Belum ada penjualan.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Produk Terlaris</h2>
          <div className="space-y-2">
            {sellers.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm text-ink">
                  <span>{s.name}</span>
                  <span className="text-ink-soft">{s.qty} terjual</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${(s.qty / maxSeller) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {sellers.length === 0 && (
              <p className="text-sm text-ink-soft">Belum ada penjualan.</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Penjualan per Jam</h2>
          <div className="flex items-end gap-1" style={{ height: "160px" }}>
            {hourly.map((val, hour) => (
              <div key={hour} className="flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${(val / maxHour) * 140}px` }}
                  title={`${hour}:00 — ${rupiah(val)}`}
                />
                {hour % 3 === 0 && (
                  <span className="mt-1 text-[9px] text-ink-soft">{hour}</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Jam (0-23) — tinggi batang = omzet</p>
        </Card>
      </div>
    </div>
  )
}
