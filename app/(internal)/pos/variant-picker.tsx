"use client"

import { useState } from "react"
import type { VariantRow } from "@/lib/data/products"
import type { CartVariant } from "@/lib/domain/cart"

interface Props {
  product: { id: string; name: string; base_price: number }
  variants: VariantRow[]
  onConfirm: (variants: CartVariant[]) => void
  onCancel: () => void
}

export function VariantPicker({ product, variants, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleConfirm = () => {
    const chosen: CartVariant[] = variants
      .filter((v) => v.is_active && selected[v.id])
      .map((v) => ({
        variantId: v.id,
        name: v.name,
        priceDelta: Number(v.price_delta),
      }))
    onConfirm(chosen)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded-xl bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-semibold">{product.name}</h3>
        {variants.filter((v) => v.is_active).length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada varian.</p>
        ) : (
          <div className="space-y-1">
            {variants
              .filter((v) => v.is_active)
              .map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!selected[v.id]}
                    onChange={() => toggle(v.id)}
                  />
                  {v.name}
                  {Number(v.price_delta) > 0 && (
                    <span className="text-gray-500">
                      (+Rp {Number(v.price_delta).toLocaleString("id-ID")})
                    </span>
                  )}
                </label>
              ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border py-1.5"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-black py-1.5 text-white"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>
  )
}
