"use client"

import { useState, useTransition } from "react"
import { restock, adjustStock } from "./actions"

interface Option {
  id: string
  name: string
  unit: string
}

export function StockActionsForm({ ingredients }: { ingredients: Option[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await restock(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <h3 className="font-medium">Restock (pembelian)</h3>
        <select name="ingredientId" required className="w-full rounded border px-2 py-1">
          <option value="">Pilih bahan...</option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </select>
        <input name="qty" type="number" step="0.0001" min="0" placeholder="Jumlah ditambah (dalam satuan pakai)" className="w-full rounded border px-2 py-1" />
        <input name="note" placeholder="Catatan (opsional)" className="w-full rounded border px-2 py-1" />
        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">Tambah stok</button>
      </form>

      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await adjustStock(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <h3 className="font-medium">Penyesuaian / Rusak</h3>
        <select name="ingredientId" required className="w-full rounded border px-2 py-1">
          <option value="">Pilih bahan...</option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
          ))}
        </select>
        <input name="delta" type="number" step="0.0001" placeholder="Selisih (- untuk kurang)" className="w-full rounded border px-2 py-1" />
        <select name="reason" className="w-full rounded border px-2 py-1">
          <option value="adjustment">Penyesuaian</option>
          <option value="waste">Rusak/Buang</option>
        </select>
        <input name="note" placeholder="Catatan (opsional)" className="w-full rounded border px-2 py-1" />
        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">Sesuaikan</button>
      </form>

      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
    </div>
  )
}
