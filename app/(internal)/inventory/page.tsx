import Link from "next/link";
import { listIngredients, usageSince } from "@/lib/data/inventory";
import { avgDailyUsage } from "@/lib/domain/inventory";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { StockActionsPanel } from "./stock-actions-panel";
import { IngredientForm } from "./ingredient-form";
import { IngredientRowActions } from "./ingredient-row-actions";
import { Package, AlertTriangle, XCircle, ShoppingCart } from "lucide-react";

const WINDOW_DAYS = 7;

const fmt = (n: number, max = 2) => n.toLocaleString("id-ID", { maximumFractionDigits: max });

export default async function InventoryPage() {
  const ingredients = await listIngredients();
  const since = new Date(new Date().getTime() - WINDOW_DAYS * 86400000).toISOString();
  const usage = await usageSince(since);
  const usageMap = new Map(usage.map((u) => [u.ingredient_id, u.total_used]));

  const lowCount = ingredients.filter(
    (i) => i.stock_qty > 0 && i.stock_qty <= i.low_stock_threshold
  ).length;
  const emptyCount = ingredients.filter((i) => i.stock_qty <= 0).length;
  const opts = ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stok Bahan"
        actions={
          <>
            <Link
              href="/inventory/shopping"
              className="flex min-h-[44px] items-center gap-1 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <ShoppingCart size={16} /> Saran Belanja
            </Link>
            <StockActionsPanel ingredients={opts} />
            <IngredientForm />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Bahan"
          tone="blue"
          icon={Package}
          value={String(ingredients.length)}
        />
        <StatCard
          label="Stok Menipis"
          tone={lowCount > 0 ? "amber" : "green"}
          icon={AlertTriangle}
          value={String(lowCount)}
        />
        <StatCard
          label="Stok Habis"
          tone={emptyCount > 0 ? "red" : "green"}
          icon={XCircle}
          value={String(emptyCount)}
        />
      </div>

      {ingredients.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-soft">
            <Package size={26} />
          </div>
          <p className="font-medium text-ink">Belum ada bahan</p>
          <p className="text-sm text-ink-soft">Tambah bahan pertama lewat tombol Tambah Bahan.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-soft">
                <th className="px-4 py-3">Bahan</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">Batas Menipis</th>
                <th className="hidden px-4 py-3 text-right lg:table-cell">Pakai/Hari</th>
                <th className="px-4 py-3 text-right">Estimasi Sisa</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((i) => {
                const totalUsed = usageMap.get(i.id) ?? 0;
                const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS);
                const empty = i.stock_qty <= 0;
                const low = !empty && i.stock_qty <= i.low_stock_threshold;
                const daysLeft = perDay > 0 ? Math.floor(i.stock_qty / perDay) : null;

                return (
                  <tr
                    key={i.id}
                    className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
                  >
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold">{fmt(i.stock_qty)}</span>{" "}
                      <span className="text-xs text-ink-soft">{i.unit}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-ink-soft md:table-cell">
                      {fmt(i.low_stock_threshold)} {i.unit}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-ink-soft lg:table-cell">
                      {perDay > 0 ? `${fmt(perDay)} ${i.unit}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {daysLeft === null ? (
                        <span className="text-ink-faint">—</span>
                      ) : daysLeft === 0 ? (
                        <span className="font-semibold text-danger">Habis hari ini</span>
                      ) : (
                        <span className={daysLeft <= 3 ? "font-semibold text-accent" : ""}>
                          ± {daysLeft} hari
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {empty ? (
                        <Badge tone="danger">Habis</Badge>
                      ) : low ? (
                        <Badge tone="accent">Menipis</Badge>
                      ) : (
                        <Badge tone="success">Aman</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IngredientRowActions ingredient={i} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
