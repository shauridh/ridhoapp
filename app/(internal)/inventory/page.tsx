import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage } from "@/lib/domain/inventory"
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
        <h1 className="text-lg font-semibold">Stok Bahan</h1>
        <Link href="/inventory/shopping" className="text-sm text-blue-600 underline">
          Saran Belanja &rarr;
        </Link>
      </div>

      <IngredientForm />
      <StockActionsForm ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))} />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Bahan</th>
            <th className="text-right">Stok</th>
            <th>Satuan</th>
            <th className="text-right">Rata-rata/hari (7h)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => {
            const totalUsed = usageMap.get(i.id) ?? 0
            const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS)
            const low = i.stock_qty <= i.low_stock_threshold
            return (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.name}</td>
                <td className="text-right">{i.stock_qty.toLocaleString("id-ID")}</td>
                <td>{i.unit}</td>
                <td className="text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</td>
                <td>{low ? <span className="text-red-600">Menipis</span> : "Aman"}</td>
              </tr>
            )
          })}
          {ingredients.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-gray-500">Belum ada bahan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
