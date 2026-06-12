"use client"

import { useState, useTransition } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { saveOnlineSettings } from "../app-settings-actions"
import { uploadProductImage } from "../menu/image-actions"

interface Props {
  qrisString: string
  qrisImage: string
  onlineEnabled: string
}

export function OnlineForm({ qrisString, qrisImage, onlineEnabled }: Props) {
  const [pending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState(qrisImage)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadProductImage(fd)
      if (result.ok) {
        setImageUrl(result.url)
        toast.show("Gambar QRIS terunggah", "success")
      } else {
        toast.show(result.error, "error")
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveOnlineSettings(fd)
      if (result.ok) toast.show("Tersimpan", "success")
      else toast.show(result.error, "error")
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Gambar QRIS
        </label>
        <input type="hidden" name="qris_image" value={imageUrl} />
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="QRIS"
              className="h-28 w-28 rounded-xl border border-hairline object-contain"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-hairline text-xs text-ink-faint">
              Belum ada
            </div>
          )}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface">
              <Upload size={18} />
              {uploading ? "Mengunggah..." : "Unggah Gambar"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-xs text-danger"
              >
                Hapus gambar
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Gambar QRIS ini akan ditampilkan di layar pembayaran kasir.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          QRIS Static String (opsional)
        </label>
        <textarea
          name="qris_string"
          rows={3}
          defaultValue={qrisString}
          placeholder="00020101021126660016ID.CO.SHOP..."
          className="w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <p className="mt-1 text-xs text-ink-faint">
          Untuk QR dinamis (generate otomatis berdasar nominal). Boleh dikosongkan
          jika sudah pakai gambar QRIS di atas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="online_enabled"
          id="online_enabled"
          value="true"
          defaultChecked={onlineEnabled === "true"}
          className="h-5 w-5 rounded accent-brand"
        />
        <label htmlFor="online_enabled" className="text-sm font-medium text-ink">
          Aktifkan pesanan online
        </label>
      </div>

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
