"use client"

import { useState, useTransition } from "react"
import { createProduct } from "./actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

export function ProductForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await createProduct(formData)
            if (!result.ok) setError(result.error)
          })
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[8rem]">
          <Input label="Nama" name="name" required />
        </div>
        <div className="flex-1 min-w-[8rem]">
          <Input label="Kategori" name="category" />
        </div>
        <div className="flex-1 min-w-[8rem]">
          <Select label="Tipe" name="type">
            <option value="single">Satuan</option>
            <option value="combo">Paket</option>
          </Select>
        </div>
        <div className="w-32">
          <Input
            label="Harga"
            name="basePrice"
            type="number"
            min="0"
            defaultValue={0}
          />
        </div>
        <div className="w-56">
          <Input
            label="URL Gambar"
            name="imageUrl"
            placeholder="https://... (opsional)"
          />
        </div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Menyimpan..." : "Tambah"}
        </Button>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
