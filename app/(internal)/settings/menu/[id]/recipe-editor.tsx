"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { IconButton } from "@/components/ui/icon-button"
import { useToast } from "@/components/ui/toast"
import { addRecipeLine, removeRecipeLine } from "./recipe-actions"

interface IngredientOption {
  id: string
  name: string
  unit: string
}

interface RecipeLine {
  id: string
  ingredient_name: string
  qty_used: number
  unit: string
}

interface Props {
  productId: string
  ingredients: IngredientOption[]
  lines: RecipeLine[]
  effectiveFrom: string | null
}

export function RecipeEditor({ productId, ingredients, lines, effectiveFrom }: Props) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      const result = await addRecipeLine(formData)
      if (result.ok) toast.show("Bahan resep ditambahkan", "success")
      else toast.show(result.error, "error")
    })
  }

  const handleRemove = (lineId: string) => {
    startTransition(async () => {
      const result = await removeRecipeLine(lineId, productId)
      if (result.ok) toast.show("Bahan resep dihapus", "success")
      else toast.show(result.error, "error")
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Resep (Bahan per porsi)</h2>
        {effectiveFrom && (
          <span className="text-xs text-ink-soft">
            Berlaku sejak {new Date(effectiveFrom).toLocaleDateString("id-ID")}
          </span>
        )}
      </div>
      <p className="text-xs text-ink-soft">
        Bahan di sini otomatis dikurangi dari stok setiap produk ini terjual.
      </p>

      <form action={handleAdd} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="productId" value={productId} />
        <div className="min-w-40 flex-1">
          <Select name="ingredientId" required label="Bahan">
            <option value="">Pilih bahan...</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Input
            name="qtyUsed"
            type="number"
            step="0.0001"
            label="Qty per porsi"
            placeholder="0"
          />
        </div>
        <Button type="submit" loading={pending} icon={Plus}>
          Tambah
        </Button>
      </form>

      <ul className="divide-y divide-hairline rounded-lg border border-hairline">
        {lines.map((l) => (
          <li
            key={l.id}
            className="flex items-center justify-between px-3 py-2 text-sm text-ink"
          >
            <span>{l.ingredient_name}</span>
            <span className="flex items-center gap-3">
              <span className="text-ink-soft">
                {l.qty_used.toLocaleString("id-ID", { maximumFractionDigits: 4 })}{" "}
                {l.unit}
              </span>
              <IconButton
                icon={Trash2}
                label="Hapus bahan"
                onClick={() => handleRemove(l.id)}
              />
            </span>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="px-3 py-2 text-sm text-ink-soft">
            Belum ada bahan resep. Produk ini tidak mengurangi stok saat terjual.
          </li>
        )}
      </ul>
    </div>
  )
}
