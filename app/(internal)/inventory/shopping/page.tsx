import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage, projectShopping } from "@/lib/domain/inventory"

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
        <h1 className="text-lg font-semibold">Saran Belanja ({DAYS_TO_COVER} hari)</h1>
        <Link href="/inventory" className="text-sm text-blue-600 underline">
          &larr; Kembali ke stok
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Dihitung dari rata-rata pemakaian {WINDOW_DAYS} hari terakhir.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Bahan</th>
            <th className="text-right">Rata/hari</th>
            <th className="text-right">Stok kini</th>
            <th className="text-right">Kurang</th>
            <th className="text-right">Beli</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ingredient, perDay, projection }) => (
            <tr key={ingredient.id} className="border-b">
              <td className="py-2">{ingredient.name}</td>
              <td className="text-right">{perDay.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
              <td className="text-right">{ingredient.stock_qty.toLocaleString("id-ID")} {ingredient.unit}</td>
              <td className="text-right">{projection.neededQty.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {ingredient.unit}</td>
              <td className="text-right font-medium">
                {projection.purchaseUnits > 0
                  ? `${projection.purchaseUnits} ${ingredient.purchase_unit || "unit"}`
                  : "-"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-gray-500">Belum ada bahan baku untuk diproyeksikan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
