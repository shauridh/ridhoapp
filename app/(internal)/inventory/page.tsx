import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage } from "@/lib/domain/inventory"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IngredientForm } from "./ingredient-form"
import { StockActionsForm } from "./stock-actions-form"

const WINDOW_DAYS = 7

export default async function InventoryPage() {
  const ingredients = await listIngredients()
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString()
  const usage = await usageSince(since)
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Stok Bahan</h1>
        <Link href="/inventory/shopping" className="text-sm font-semibold text-brand">
          Saran Belanja &rarr;
        </Link>
      </div>

      <IngredientForm />
      <StockActionsForm ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))} />

      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-3 py-2">Bahan</th>
              <th className="px-3 py-2 text-right">Stok</th>
              <th className="px-3 py-2">Satuan</th>
              <th className="px-3 py-2 text-right">Rata-rata/hari (7h)</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((i) => {
              const totalUsed = usageMap.get(i.id) ?? 0
              const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS)
              const low = i.stock_qty <= i.low_stock_threshold
              return (
                <tr key={i.id} className="border-b border-hairline text-ink">
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2 text-right">{i.stock_qty.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2">{i.unit}</td>
                  <td className="px-3 py-2 text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2">
                    {low ? <Badge tone="danger">Menipis</Badge> : <Badge tone="success">Aman</Badge>}
                  </td>
                </tr>
              )
            })}
            {ingredients.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-ink-soft">Belum ada bahan.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
