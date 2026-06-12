import { getDashboardData } from "@/lib/data/dashboard"
import { listDashboardWidgets } from "@/lib/data/dashboard-widgets"
import {
  aggregateByHour,
  aggregateByDay,
  aggregateByCategory,
  comparePeriod,
  topSellers,
} from "@/lib/domain/report"
import { resolveRange, type RangePreset } from "@/lib/domain/date-range"
import { getDailySales } from "@/lib/data/dashboard"
import { DashboardGrid } from "./dashboard-grid"
import { RangeSelector } from "./range-selector"
import type { WidgetData } from "./widget-renderer"

export const dynamic = "force-dynamic"

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const preset = (range ?? "today") as RangePreset
  const r = resolveRange(preset)

  const [data, prev, widgets] = await Promise.all([
    getDashboardData(r.start, r.end),
    getDashboardData(r.prevStart, r.prevEnd),
    listDashboardWidgets(),
  ])

  const last7 = resolveRange("7d")
  const last7Sales = await getDailySales(last7.start, last7.end)
  const last7Daily = aggregateByDay(
    last7Sales,
    last7.start.slice(0, 10),
    last7.end.slice(0, 10),
  )

  const avg = data.totalTransaksi > 0 ? data.totalOmzet / data.totalTransaksi : 0
  const prevAvg =
    prev.totalTransaksi > 0 ? prev.totalOmzet / prev.totalTransaksi : 0
  const hourly = aggregateByHour(data.lines)
  const categories = aggregateByCategory(data.categoryLines)
  const sellers = topSellers(data.lines, 6)

  const trend = (cur: number, pr: number) => {
    const c = comparePeriod(cur, pr)
    return { percent: c.percent, direction: c.direction }
  }

  const widgetData: WidgetData = {
    omzet: data.totalOmzet,
    transaksi: data.totalTransaksi,
    rataTransaksi: avg,
    itemTerjual: data.totalItem,
    trends: {
      omzet: trend(data.totalOmzet, prev.totalOmzet),
      transaksi: trend(data.totalTransaksi, prev.totalTransaksi),
      rata_transaksi: trend(avg, prevAvg),
      item_terjual: trend(data.totalItem, prev.totalItem),
    },
    penjualanHarian: last7Daily.map((d) => {
      const dt = new Date(d.date + "T00:00:00Z")
      return {
        label: `${DAY_LABELS[dt.getUTCDay()]} ${dt.getUTCDate()}`,
        value: d.total,
      }
    }),
    penjualanPerJam: hourly.map((val, hour) => ({
      label: String(hour),
      value: val,
    })),
    metodeBayar: { tunai: data.cashTotal, qris: data.qrisTotal },
    omzetKategori: categories.map((c) => ({ label: c.category, value: c.omzet })),
    produkTerlaris: sellers.map((s) => ({ label: s.name, value: s.qty })),
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RangeSelector />
      </div>
      <DashboardGrid widgets={widgets} data={widgetData} />
    </div>
  )
}
