"use client"

import { useState, useTransition } from "react"
import { addIngredient } from "./actions"

export function IngredientForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await addIngredient(formData)
          if (!result.ok) setError(result.error)
        })
      }}
      className="grid grid-cols-2 gap-2 rounded-lg border p-3 md:grid-cols-3"
    >
      <input name="name" required placeholder="Nama bahan" className="rounded border px-2 py-1" />
      <input name="unit" placeholder="Satuan pakai (potong/kg/liter)" className="rounded border px-2 py-1" />
      <select name="trackingType" className="rounded border px-2 py-1">
        <option value="ingredient">Bahan baku</option>
        <option value="finished">Produk jadi</option>
      </select>
      <input name="purchaseUnit" placeholder="Satuan beli (kantung/pouch)" className="rounded border px-2 py-1" />
      <input name="purchaseUnitQty" type="number" step="0.0001" defaultValue={1} placeholder="Isi per satuan beli" className="rounded border px-2 py-1" />
      <input name="lowStockThreshold" type="number" step="0.0001" defaultValue={0} placeholder="Batas menipis" className="rounded border px-2 py-1" />
      <button type="submit" disabled={pending} className="col-span-2 rounded bg-black px-3 py-1.5 text-white disabled:opacity-50 md:col-span-3">
        {pending ? "Menyimpan..." : "Tambah bahan"}
      </button>
      {error && <p className="col-span-2 text-sm text-red-600 md:col-span-3">{error}</p>}
    </form>
  )
}
