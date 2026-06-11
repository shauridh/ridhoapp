"use client"

import type { ProductRow } from "@/lib/data/products"
import { gridStyle, type GridSetting } from "@/lib/domain/grid"

interface Props {
  products: ProductRow[]
  onSelect: (product: ProductRow) => void
  cols: GridSetting
  onColsChange: (cols: GridSetting) => void
}

const options: GridSetting[] = ["auto", 3, 4, 5]

export function ProductGrid({ products, onSelect, cols, onColsChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={String(o)}
            onClick={() => onColsChange(o)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              cols === o
                ? "bg-brand text-white"
                : "bg-white text-ink border border-hairline"
            }`}
          >
            {o === "auto" ? "Auto" : `${o} kolom`}
          </button>
        ))}
      </div>
      <div className="grid gap-3" style={gridStyle(cols)}>
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="overflow-hidden rounded-2xl border border-hairline bg-white text-center shadow-sm transition hover:shadow-lg active:scale-[0.97]"
          >
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
        ))}
        {products.length === 0 && (
          <p className="col-span-full py-8 text-center text-ink-soft">
            Belum ada produk aktif.
          </p>
        )}
      </div>
    </div>
  )
}
