"use client"

import { useState, useTransition } from "react"
import { addVariant } from "./variant-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

export function VariantForm({ productId }: { productId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await addVariant(productId, formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[8rem]">
          <Input label="Nama varian" name="name" required />
        </div>
        <div className="w-32">
          <Input
            label="Tambahan harga"
            name="priceDelta"
            type="number"
            defaultValue={0}
          />
        </div>
        <div className="flex-1 min-w-[8rem]">
          <Select label="Tipe" name="type">
            <option value="addon">Tambahan (addon)</option>
            <option value="option">Pilihan (option)</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 py-2 text-sm text-ink">
          <input name="isRequired" type="checkbox" /> Wajib
        </label>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Menyimpan..." : "Tambah varian"}
        </Button>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
