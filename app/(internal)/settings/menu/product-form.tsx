"use client"

import { useState, useTransition } from "react"
import { Upload } from "lucide-react"
import { createProduct } from "./actions"
import { uploadProductImage } from "./image-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"

export function ProductForm() {
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
        <Button type="submit" variant="primary" disabled={pending || uploading}>
          {pending ? "Menyimpan..." : "Tambah"}
        </Button>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Pratinjau"
            className="h-12 w-12 rounded-lg object-cover"
          />
        )}
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
