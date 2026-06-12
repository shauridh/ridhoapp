"use client"

import { StatCard } from "@/components/ui/stat-card"
import { LineChart } from "@/components/ui/line-chart"
import { BarChart } from "@/components/ui/bar-chart"
import { DonutChart } from "@/components/ui/donut-chart"
import { RadarChart } from "@/components/ui/radar-chart"
import { RankBars } from "@/components/ui/rank-bars"
import { TrendingUp, Receipt, Banknote, ShoppingBag } from "lucide-react"
import type { ChartType } from "@/lib/data/dashboard-widgets"

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

// Bundel data siap-pakai yang dihitung di server.
export interface WidgetData {
  omzet: number
  transaksi: number
  rataTransaksi: number
  itemTerjual: number
  trends: {
    omzet?: { percent: number; direction: "up" | "down" | "flat" }
    transaksi?: { percent: number; direction: "up" | "down" | "flat" }
    rata_transaksi?: { percent: number; direction: "up" | "down" | "flat" }
    item_terjual?: { percent: number; direction: "up" | "down" | "flat" }
  }
  penjualanHarian: { label: string; value: number }[]
  penjualanPerJam: { label: string; value: number }[]
  metodeBayar: { tunai: number; qris: number }
  omzetKategori: { label: string; value: number }[]
  produkTerlaris: { label: string; value: number }[]
}

const STAT_ICONS = {
  omzet: TrendingUp,
  transaksi: Receipt,
  rata_transaksi: Banknote,
  item_terjual: ShoppingBag,
} as const

export function WidgetRenderer({
  metric,
  chartType,
  title,
  data,
}: {
  metric: string
  chartType: ChartType
  title: string
  data: WidgetData
}) {
  // STAT
  if (chartType === "stat") {
    const map: Record<string, { value: string; icon: typeof TrendingUp; tone: "green" | "red" | "amber" | "blue"; trendKey?: keyof WidgetData["trends"] }> = {
      omzet: { value: rupiah(data.omzet), icon: STAT_ICONS.omzet, tone: "green", trendKey: "omzet" },
      transaksi: { value: String(data.transaksi), icon: STAT_ICONS.transaksi, tone: "red", trendKey: "transaksi" },
      rata_transaksi: { value: rupiah(Math.round(data.rataTransaksi)), icon: STAT_ICONS.rata_transaksi, tone: "amber", trendKey: "rata_transaksi" },
      item_terjual: { value: String(data.itemTerjual), icon: STAT_ICONS.item_terjual, tone: "blue", trendKey: "item_terjual" },
    }
    const s = map[metric] ?? map.omzet
    return (
      <StatCard
        label={title || s.value}
        value={s.value}
        icon={s.icon}
        tone={s.tone}
        trend={s.trendKey ? data.trends[s.trendKey] : undefined}
      />
    )
  }

  // Konten chart dibungkus card.
  const body = (() => {
    switch (metric) {
      case "penjualan_harian":
        return chartType === "bar" ? (
          <BarChart data={data.penjualanHarian} formatValue={rupiah} color="bg-brand" />
        ) : (
          <LineChart data={data.penjualanHarian} formatValue={rupiah} />
        )
      case "penjualan_per_jam":
        return chartType === "line" ? (
          <LineChart data={data.penjualanPerJam} formatValue={rupiah} labelEvery={3} />
        ) : (
          <BarChart data={data.penjualanPerJam} formatValue={rupiah} color="bg-accent" labelEvery={3} />
        )
      case "metode_bayar":
        return chartType === "rank" ? (
          <RankBars
            data={[
              { label: "Tunai", value: data.metodeBayar.tunai },
              { label: "QRIS", value: data.metodeBayar.qris },
            ]}
            formatValue={rupiah}
          />
        ) : (
          <DonutChart
            segments={[
              { label: "Tunai", value: data.metodeBayar.tunai, colorClass: "fill-success" },
              { label: "QRIS", value: data.metodeBayar.qris, colorClass: "fill-accent" },
            ]}
            formatValue={rupiah}
          />
        )
      case "omzet_kategori":
        if (chartType === "donut")
          return (
            <DonutChart
              segments={data.omzetKategori.map((c, i) => ({
                label: c.label,
                value: c.value,
                colorClass: ["fill-brand", "fill-accent", "fill-success", "fill-blue-400", "fill-purple-400"][i % 5],
              }))}
              formatValue={rupiah}
            />
          )
        if (chartType === "bar")
          return <BarChart data={data.omzetKategori} formatValue={rupiah} color="bg-accent" />
        return <RankBars data={data.omzetKategori} formatValue={rupiah} color="bg-accent" emptyText="Belum ada penjualan." />
      case "produk_terlaris":
        if (chartType === "radar")
          return data.produkTerlaris.length >= 3 ? (
            <RadarChart data={data.produkTerlaris} />
          ) : (
            <p className="py-8 text-center text-sm text-ink-soft">Butuh min. 3 produk.</p>
          )
        if (chartType === "bar")
          return <BarChart data={data.produkTerlaris} color="bg-brand" />
        return <RankBars data={data.produkTerlaris} emptyText="Belum ada penjualan." />
      default:
        return <p className="text-sm text-ink-soft">Metrik tidak dikenal.</p>
    }
  })()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      <div className="min-h-0 flex-1 overflow-auto">{body}</div>
    </div>
  )
}
