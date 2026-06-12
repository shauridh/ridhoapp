import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage } from "@/lib/domain/inventory"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { StockActionsPanel } from "./stock-actions-panel"
import {
  Package,
  AlertTriangle,
  ClipboardCheck,
  ShoppingCart,
} from "lucide-react"

const WINDOW_DAYS = 7

export default async function InventoryPage() {
  const ingredients = await listIngredients()
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString()
  const usage = await usageSince(since)
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]))

  const lowCount = ingredients.filter(
    (i) => i.stock_qty <= i.low_stock_threshold,
  ).length
  const opts = ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Stok Bahan</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory/shopping"
            className="flex items-center gap-1 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20"
          >
            <ShoppingCart size={16} /> Saran Belanja
          </Link>
          <StockActionsPanel ingredients={opts} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Bahan" tone="blue" icon={Package} value={String(ingredients.length)} />
        <StatCard label="Menipis" tone={lowCount > 0 ? "red" : "green"} icon={AlertTriangle} value={String(lowCount)} />
        <StatCard label="Pantau (7 hari)" tone="amber" icon={ClipboardCheck} value={`${WINDOW_DAYS} hari`} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-4 py-3">Bahan</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3">Satuan</th>
              <th className="px-4 py-3 text-right">Rata-rata/hari (7h)</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => {
              const totalUsed = usageMap.get(i.id) ?? 0
              const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS)
              const low = i.stock_qty <= i.low_stock_threshold
              return (
                <tr
                  key={i.id}
                  className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
                >
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {i.stock_qty.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{i.unit}</td>
                  <td className="px-4 py-3 text-right text-ink-soft">
                    {perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    {low ? (
                      <Badge tone="danger">Menipis</Badge>
                    ) : (
                      <Badge tone="success">Aman</Badge>
                    )}
                  </td>
                </tr>
              )
            })}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  Belum ada bahan. Tambahkan lewat panel di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
