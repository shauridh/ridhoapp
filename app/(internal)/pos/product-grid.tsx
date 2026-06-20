"use client";

import { useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import type { ProductRow } from "@/lib/data/products";
import { gridStyle, type GridSetting } from "@/lib/domain/grid";
import {
  filterProducts,
  extractCategories,
  sortProducts,
  type SortSetting,
} from "@/lib/domain/product-filter";
import { CategoryChips } from "./category-chips";

const SORT_OPTIONS: { value: SortSetting; label: string }[] = [
  { value: "name", label: "A–Z" },
  { value: "price_asc", label: "Harga ↑" },
  { value: "price_desc", label: "Harga ↓" },
  { value: "best_seller", label: "Terlaku" },
];

interface Props {
  products: ProductRow[];
  loading?: boolean;
  onSelect: (product: ProductRow) => void;
  cols: GridSetting;
  cartQty: Record<string, number>;
  showSearch: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  category: string | null;
  onCategoryChange: (c: string | null) => void;
  sort: SortSetting;
  onSortChange: (s: SortSetting) => void;
  bestSellerIds: string[];
  outOfStockIds?: Set<string>;
  categoryOrder?: string[];
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
  sort,
  onSortChange,
  bestSellerIds,
  outOfStockIds = new Set(),
  categoryOrder = [],
}: Props) {
  const categories = useMemo(() => {
    const fromProducts = extractCategories(products); // set of active categories
    if (categoryOrder.length === 0) return fromProducts;
    // Urutkan berdasarkan categoryOrder dari server, sisanya append di belakang
    const ordered = categoryOrder.filter((c) => fromProducts.includes(c));
    const rest = fromProducts.filter((c) => !categoryOrder.includes(c));
    return [...ordered, ...rest];
  }, [products, categoryOrder]);
  const visible = useMemo(
    () => sortProducts(filterProducts(products, query, category), sort, bestSellerIds),
    [products, query, category, sort, bestSellerIds]
  );

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

        {/* Sort toggle bar */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="shrink-0 text-ink-soft" />
          <div className="flex gap-1 overflow-x-auto">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  sort === opt.value
                    ? "bg-brand text-white"
                    : "bg-surface text-ink-soft hover:bg-brand/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <CategoryChips categories={categories} active={category} onChange={onCategoryChange} />
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
            const qty = cartQty[p.id] ?? 0;
            const inCart = qty > 0;
            const isOos = outOfStockIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                disabled={isOos}
                aria-label={`${p.name} — Rp ${p.base_price.toLocaleString("id-ID")}${
                  isOos ? " (stok habis)" : inCart ? `, ${qty} di keranjang` : ""
                }`}
                className={`relative overflow-hidden rounded-2xl border text-center shadow-sm transition ${
                  isOos
                    ? "cursor-not-allowed border-hairline bg-surface opacity-60"
                    : inCart
                      ? "border-brand ring-2 ring-brand/20 bg-white active:scale-[0.97] hover:shadow-lg"
                      : "border-hairline bg-white active:scale-[0.97] hover:shadow-lg"
                }`}
              >
                {/* Badge stok habis */}
                {isOos && (
                  <span className="absolute left-0 right-0 top-2 z-10 mx-auto w-fit rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    Habis
                  </span>
                )}
                {/* Badge qty di keranjang */}
                {inCart && !isOos && (
                  <span className="absolute right-2 top-2 z-10 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-brand px-1.5 text-sm font-bold text-white shadow">
                    {qty}
                  </span>
                )}
                {/* Gambar produk */}
                <div className="aspect-square bg-surface">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      🍗
                    </div>
                  )}
                </div>
                {/* Info produk */}
                <div className="p-2">
                  <div className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                    {p.name}
                  </div>
                  <div
                    className={`mt-0.5 text-sm font-bold ${isOos ? "text-ink-soft" : "text-brand"}`}
                  >
                    Rp {p.base_price.toLocaleString("id-ID")}
                  </div>
                </div>
              </button>
            );
          })}
        {!loading && visible.length === 0 && (
          <p className="col-span-full py-8 text-center text-ink-soft">
            {products.length === 0 ? "Belum ada produk aktif." : "Produk tidak ditemukan."}
          </p>
        )}
      </div>
    </div>
  );
}
