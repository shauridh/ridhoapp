"use client"

import { useState, useTransition } from "react"
import { addIngredient } from "./actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

export function IngredientForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await addIngredient(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="grid grid-cols-2 gap-3 md:grid-cols-3"
      >
        <Input name="name" required placeholder="Nama bahan" />
        <Input name="unit" placeholder="Satuan pakai (potong/kg/liter)" />
        <Select name="trackingType">
          <option value="ingredient">Bahan baku</option>
          <option value="finished">Produk jadi</option>
        </Select>
        <Input name="purchaseUnit" placeholder="Satuan beli (kantung/pouch)" />
        <Input name="purchaseUnitQty" type="number" step="0.0001" defaultValue={1} placeholder="Isi per satuan beli" />
        <Input name="lowStockThreshold" type="number" step="0.0001" defaultValue={0} placeholder="Batas menipis" />
        <Button type="submit" variant="primary" disabled={pending} className="col-span-2 md:col-span-3">
          {pending ? "Menyimpan..." : "Tambah bahan"}
        </Button>
        {error && <p className="col-span-2 text-sm text-danger md:col-span-3">{error}</p>}
      </form>
    </Card>
  )
}
