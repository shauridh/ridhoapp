"use client"

import { useMemo } from "react"
import { Search } from "lucide-react"
import type { ProductRow } from "@/lib/data/products"
import { gridStyle, type GridSetting } from "@/lib/domain/grid"
import {
  filterProducts,
  extractCategories,
} from "@/lib/domain/product-filter"
import { CategoryChips } from "./category-chips"

interface Props {
  products: ProductRow[]
  loading?: boolean
  onSelect: (product: ProductRow) => void
  cols: GridSetting
  cartQty: Record<string, number>
  showSearch: boolean
  query: string
  onQueryChange: (q: string) => void
  category: string | null
  onCategoryChange: (c: string | null) => void
}

export function ProductGrid({
  products,
  loading = false,
  onSelect,
  cols,
  cartQty,
  showSearch,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: Props) {
  const categories = useMemo(() => extractCategories(products), [products])
  const visible = useMemo(
    () => filterProducts(products, query, category),
    [products, query, category],
  )

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 space-y-2 bg-surface pb-2">
        {showSearch && (
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Cari produk..."
              className="w-full rounded-xl border border-hairline bg-white py-2 pl-10 pr-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
        )}

        <CategoryChips
          categories={categories}
          active={category}
          onChange={onCategoryChange}
        />
      </div>

      <div className="grid gap-3" style={gridStyle(cols)}>
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="overflow-hidden rounded-2xl border border-hairline bg-white"
            >
              <div className="aspect-square animate-pulse bg-surface" />
              <div className="space-y-1 p-2">
                <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-surface" />
                <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-surface" />
              </div>
            </div>
          ))}
        {!loading &&
          visible.map((p) => {
          const qty = cartQty[p.id] ?? 0
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="relative overflow-hidden rounded-2xl border border-hairline bg-white text-center shadow-sm transition hover:shadow-lg active:scale-[0.97]"
            >
              {qty > 0 && (
                <span className="absolute right-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-1.5 text-sm font-bold text-white shadow">
                  {qty}
                </span>
              )}
              <div className="aspect-square bg-surface">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    🍗
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-bold text-ink">{p.name}</div>
                <div className="text-sm font-bold text-brand">
                  Rp {p.base_price.toLocaleString("id-ID")}
                </div>
              </div>
            </button>
          )
        })}
        {!loading && visible.length === 0 && (
          <p className="col-span-full py-8 text-center text-ink-soft">
            {products.length === 0
              ? "Belum ada produk aktif."
              : "Produk tidak ditemukan."}
          </p>
        )}
      </div>
    </div>
  )
}
