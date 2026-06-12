import Link from "next/link"
import { listIngredients, usageSince } from "@/lib/data/inventory"
import { avgDailyUsage } from "@/lib/domain/inventory"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { StockActionsPanel } from "./stock-actions-panel"
import { IngredientForm } from "./ingredient-form"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
} from "lucide-react"

const WINDOW_DAYS = 7

const fmt = (n: number, max = 2) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: max })

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Stok Bahan</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory/shopping"
            className="flex items-center gap-1 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20"
          >
            <ShoppingCart size={16} /> Saran Belanja
          </Link>
          <StockActionsPanel ingredients={opts} />
          <IngredientForm />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Bahan"
          tone="blue"
          icon={Package}
          value={String(ingredients.length)}
        />
        <StatCard
          label="Menipis"
          tone={lowCount > 0 ? "red" : "green"}
          icon={AlertTriangle}
          value={String(lowCount)}
        />
        <StatCard
          label="Periode Pantau"
          tone="amber"
          icon={TrendingDown}
          value={`${WINDOW_DAYS} hari`}
        />
      </div>

      {ingredients.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-soft">
            <Package size={26} />
          </div>
          <p className="font-medium text-ink">Belum ada bahan</p>
          <p className="text-sm text-ink-soft">
            Tambah bahan pertama lewat tombol Tambah Bahan.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((i) => {
            const totalUsed = usageMap.get(i.id) ?? 0
            const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS)
            const low = i.stock_qty <= i.low_stock_threshold
            // Estimasi sisa hari berdasar pemakaian rata-rata.
            const daysLeft =
              perDay > 0 ? Math.floor(i.stock_qty / perDay) : null
            // Rasio stok terhadap 2x batas menipis (untuk bar visual).
            const ratioMax = Math.max(i.low_stock_threshold * 2, 1)
            const pct = Math.min(100, (i.stock_qty / ratioMax) * 100)
            const barColor = low
              ? "bg-danger"
              : daysLeft !== null && daysLeft <= 3
                ? "bg-accent"
                : "bg-success"

            return (
              <Card key={i.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-ink">{i.name}</h3>
                    <p className="text-xs text-ink-soft">
                      Batas menipis: {fmt(i.low_stock_threshold)} {i.unit}
                    </p>
                  </div>
                  {low ? (
                    <Badge tone="danger">Menipis</Badge>
                  ) : daysLeft !== null && daysLeft <= 3 ? (
                    <Badge tone="accent">Hampir habis</Badge>
                  ) : (
                    <Badge tone="success">Aman</Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-ink">
                      {fmt(i.stock_qty)}
                    </span>
                    <span className="text-sm text-ink-soft">{i.unit}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full ${barColor} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-sm">
                  <div>
                    <p className="text-xs text-ink-soft">Pakai/hari</p>
                    <p className="font-semibold text-ink">
                      {fmt(perDay)} {i.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft">Sisa</p>
                    <p className="font-semibold text-ink">
                      {daysLeft === null ? (
                        <span className="text-ink-faint">—</span>
                      ) : daysLeft === 0 ? (
                        <span className="text-danger">Habis hari ini</span>
                      ) : (
                        `± ${daysLeft} hari`
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
