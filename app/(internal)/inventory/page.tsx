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

  // Sortir: stok habis dan menipis ke atas, sisanya alfabetis
  const sortedIngredients = [...ingredients].sort((a, b) => {
    const rankA = a.stock_qty <= 0 ? 0 : a.stock_qty <= a.low_stock_threshold ? 1 : 2;
    const rankB = b.stock_qty <= 0 ? 0 : b.stock_qty <= b.low_stock_threshold ? 1 : 2;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name, "id");
  });

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
              {sortedIngredients.map((i) => {
                const totalUsed = usageMap.get(i.id) ?? 0;
                const perDay = avgDailyUsage(totalUsed, WINDOW_DAYS);
                const empty = i.stock_qty <= 0;
                const low = !empty && i.stock_qty <= i.low_stock_threshold;
                // Fast moving: pakai > 0 dan sisa kurang dari 3 hari
                const daysLeft = perDay > 0 ? Math.floor(i.stock_qty / perDay) : null;
                const fastMoving =
                  !empty && !low && perDay > 0 && daysLeft !== null && daysLeft <= 7;

                // Warna baris: kritis paling mencolok
                const rowClass = empty
                  ? "border-b border-hairline last:border-0 bg-tint-red/30 text-ink transition hover:bg-tint-red/40"
                  : low
                    ? "border-b border-hairline last:border-0 bg-tint-amber/30 text-ink transition hover:bg-tint-amber/40"
                    : "border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50";

                return (
                  <tr key={i.id} className={rowClass}>
                    <td className="px-4 py-3">
                      <span className={`font-medium${empty || low ? " font-semibold" : ""}`}>
                        {i.name}
                      </span>
                      {fastMoving && !empty && !low && (
                        <span className="ml-2 inline-block rounded-full bg-tint-blue px-1.5 py-0.5 text-2xs font-semibold text-info">
                          cepat habis
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold${empty ? " text-danger" : low ? " text-accent" : ""}`}
                      >
                        {fmt(i.stock_qty)}
                      </span>{" "}
                      <span className="text-xs text-ink-soft">{i.unit}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-ink-soft md:table-cell">
                      {fmt(i.low_stock_threshold)} {i.unit}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-ink-soft lg:table-cell">
                      {perDay > 0 ? `${fmt(perDay)} ${i.unit}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {daysLeft === null ? (
                        <span className="text-ink-faint">\u2014</span>
                      ) : daysLeft === 0 ? (
                        <span className="font-bold text-danger">Habis hari ini</span>
                      ) : daysLeft <= 3 ? (
                        <span className="font-semibold text-danger">\u00b1 {daysLeft} hari</span>
                      ) : daysLeft <= 7 ? (
                        <span className="font-semibold text-accent">\u00b1 {daysLeft} hari</span>
                      ) : (
                        <span className="text-ink-soft">\u00b1 {daysLeft} hari</span>
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
