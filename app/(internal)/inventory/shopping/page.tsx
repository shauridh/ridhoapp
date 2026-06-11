import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage, projectShopping } from "@/lib/domain/inventory"
import { Card } from "@/components/ui/card"

const WINDOW_DAYS = 7
const DAYS_TO_COVER = 7

export default async function ShoppingPage() {
  const ingredients = await listIngredients()
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString()
  const usage = await usageSince(since)
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]))

  const rows = ingredients
    .filter((i) => i.tracking_type === "ingredient")
    .map((i) => {
      const perDay = avgDailyUsage(usageMap.get(i.id) ?? 0, WINDOW_DAYS)
      const projection = projectShopping({
        avgPerDay: perDay,
        daysToCover: DAYS_TO_COVER,
        currentStock: i.stock_qty,
        purchaseUnitQty: i.purchase_unit_qty,
      })
      return { ingredient: i, perDay, projection }
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Saran Belanja ({DAYS_TO_COVER} hari)</h1>
        <Link href="/inventory" className="text-sm font-semibold text-brand">
          &larr; Kembali ke stok
        </Link>
      </div>
      <p className="text-sm text-ink-soft">
        Dihitung dari rata-rata pemakaian {WINDOW_DAYS} hari terakhir.
      </p>
      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-3 py-2">Bahan</th>
              <th className="px-3 py-2 text-right">Rata/hari</th>
              <th className="px-3 py-2 text-right">Stok kini</th>
              <th className="px-3 py-2 text-right">Kurang</th>
              <th className="px-3 py-2 text-right">Beli</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ ingredient, perDay, projection }) => (
              <tr key={ingredient.id} className="border-b border-hairline text-ink">
                <td className="px-3 py-2">{ingredient.name}</td>
                <td className="px-3 py-2 text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
                <td className="px-3 py-2 text-right">{ingredient.stock_qty.toLocaleString("id-ID")} {ingredient.unit}</td>
                <td className="px-3 py-2 text-right">{projection.neededQty.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
                <td className="px-3 py-2 text-right font-bold text-brand">
                  {projection.purchaseUnits > 0
                    ? `${projection.purchaseUnits} ${ingredient.purchase_unit || "unit"}`
                    : "-"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-ink-soft">Belum ada bahan baku untuk diproyeksikan.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
