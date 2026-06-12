"use client"

import { useState, useTransition } from "react"
import { Upload, Plus } from "lucide-react"
import { createProduct } from "./actions"
import { uploadProductImage } from "./image-actions"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import type { CategoryRow } from "@/lib/data/categories"

export function ProductForm({ categories }: { categories: CategoryRow[] }) {
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

  const close = () => {
    setOpen(false)
    setImageUrl("")
    setError(null)
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Tambah Produk
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Produk Baru"
        size="md"
      >
        <form
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = await createProduct(formData)
              if (result.ok) close()
              else setError(result.error)
            })
          }}
          className="space-y-4"
        >
          <Input label="Nama" name="name" required />

          <Select label="Kategori" name="category" defaultValue="">
            <option value="">— Tanpa kategori —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>

          <div className="grid gap-3 sm:grid-cols-2">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Gambar
            </label>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  name="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... atau unggah"
                />
              </div>
              <label className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-sm font-semibold text-ink hover:bg-surface">
                <Upload size={18} />
                {uploading ? "..." : "Unggah"}
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
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={pending || uploading}
              className="flex-1"
            >
              {pending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Batal
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  )
}
