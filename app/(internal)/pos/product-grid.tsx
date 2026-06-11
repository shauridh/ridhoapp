"use client"

import type { ProductRow } from "@/lib/data/products"

interface Props {
  products: ProductRow[]
  onSelect: (product: ProductRow) => void
}

export function ProductGrid({ products, onSelect }: Props) {
  const grouped = products.reduce<Record<string, ProductRow[]>>((acc, p) => {
    const cat = p.category || "Lainnya"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-1 text-sm font-medium text-gray-600">{category}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="rounded-lg border p-3 text-left hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">
                  Rp {p.base_price.toLocaleString("id-ID")}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {products.length === 0 && (
        <p className="py-8 text-center text-gray-500">Belum ada produk aktif.</p>
      )}
    </div>
  )
}
