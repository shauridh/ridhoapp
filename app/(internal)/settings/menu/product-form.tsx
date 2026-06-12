"use client"

import { useState, useTransition } from "react"
import { Upload, Plus, X } from "lucide-react"
import { createProduct } from "./actions"
import { uploadProductImage } from "./image-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

export function ProductForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadProductImage(fd)
      if (result.ok) setImageUrl(result.url)
      else setError(result.error)
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Tambah Produk
      </Button>
    )
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Produk Baru</h2>
        <button
          onClick={() => setOpen(false)}
          aria-label="Tutup"
          className="text-ink-soft"
        >
          <X size={20} />
        </button>
      </div>
      <form
        action={(formData) => {
          setError(null)
          startTransition(async () => {
            const result = await createProduct(formData)
            if (result.ok) {
              setOpen(false)
              setImageUrl("")
            } else {
              setError(result.error)
            }
          })
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nama" name="name" required />
          <Input label="Kategori" name="category" placeholder="mis. Ayam" />
          <Select label="Tipe" name="type">
            <option value="single">Satuan</option>
            <option value="combo">Paket</option>
          </Select>
          <Input
            label="Harga"
            name="basePrice"
            type="number"
            min="0"
            defaultValue={0}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="URL Gambar"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... atau unggah"
            />
          </div>
          <label className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-sm font-semibold text-ink hover:bg-surface">
            <Upload size={18} />
            {uploading ? "Mengunggah..." : "Unggah"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Pratinjau"
              className="h-11 w-11 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={pending || uploading}>
            {pending ? "Menyimpan..." : "Simpan Produk"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
