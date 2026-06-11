import { getDashboardData } from "@/lib/data/dashboard"
import { aggregateByHour, topSellers } from "@/lib/domain/report"
import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, Receipt, ShoppingBag, Banknote } from "lucide-react"

const TODAY = new Date()
const START = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()).toISOString()
const END = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 23, 59, 59).toISOString()

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export default async function DashboardPage() {
  const data = await getDashboardData(START, END)
  const hourly = aggregateByHour(data.lines)
  const sellers = topSellers(data.lines, 5)
  const maxHour = Math.max(1, ...hourly)
  const maxSeller = Math.max(1, ...sellers.map((s) => s.qty))
  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Dashboard Hari Ini</h1>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Omzet" tone="green" icon={TrendingUp} value={rupiah(data.totalOmzet)} />
        <StatCard label="Transaksi" tone="red" icon={Receipt} value={String(data.totalTransaksi)} />
        <StatCard label="Rata/Transaksi" tone="amber" icon={Banknote} value={rupiah(Math.round(avg))} />
        <StatCard label="Item Terjual" tone="blue" icon={ShoppingBag} value={String(data.totalItem)} />
      </div>

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
              <p className="text-sm text-ink-soft">Belum ada penjualan hari ini.</p>
            )}
          </div>
        </Card>
      </div>

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
  )
}
