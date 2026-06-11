"use client"

import { useState, useTransition } from "react"
import { createProduct } from "./actions"

export function ProductForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await createProduct(formData)
          if (!result.ok) setError(result.error)
        })
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Nama</label>
        <input name="name" required className="rounded border px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Kategori</label>
        <input name="category" className="rounded border px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tipe</label>
        <select name="type" className="rounded border px-2 py-1">
          <option value="single">Satuan</option>
          <option value="combo">Paket</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Harga</label>
        <input
          name="basePrice"
          type="number"
          min="0"
          defaultValue={0}
          className="w-28 rounded border px-2 py-1"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}
