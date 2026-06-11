"use client"

import { useState, useTransition } from "react"
import { restock, adjustStock } from "./actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

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
      <Card>
        <form
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = await restock(formData)
              if (!result.ok) setError(result.error)
            })
          }}
          className="space-y-2"
        >
          <h3 className="font-semibold text-ink">Restock (pembelian)</h3>
          <Select name="ingredientId" required>
            <option value="">Pilih bahan...</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
            ))}
          </Select>
          <Input name="qty" type="number" step="0.0001" min="0" placeholder="Jumlah ditambah (dalam satuan pakai)" />
          <Input name="note" placeholder="Catatan (opsional)" />
          <Button type="submit" variant="primary" disabled={pending}>Tambah stok</Button>
        </form>
      </Card>

      <Card>
        <form
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = await adjustStock(formData)
              if (!result.ok) setError(result.error)
            })
          }}
          className="space-y-2"
        >
          <h3 className="font-semibold text-ink">Penyesuaian / Rusak</h3>
          <Select name="ingredientId" required>
            <option value="">Pilih bahan...</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
            ))}
          </Select>
          <Input name="delta" type="number" step="0.0001" placeholder="Selisih (- untuk kurang)" />
          <Select name="reason">
            <option value="adjustment">Penyesuaian</option>
            <option value="waste">Rusak/Buang</option>
          </Select>
          <Input name="note" placeholder="Catatan (opsional)" />
          <Button type="submit" variant="secondary" disabled={pending}>Sesuaikan</Button>
        </form>
      </Card>

      {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
    </div>
  )
}
