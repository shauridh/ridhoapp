"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { saveOnlineSettings } from "../app-settings-actions"

interface Props {
  qrisString: string
  onlineEnabled: string
}

export function OnlineForm({ qrisString, onlineEnabled }: Props) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

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
          QRIS Static String
        </label>
        <textarea
          name="qris_string"
          rows={3}
          defaultValue={qrisString}
          placeholder="00020101021126660016ID.CO.SHOP..."
          className="w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <p className="mt-1 text-xs text-ink-faint">
          String QRIS statis dari payment provider. Untuk QR dinamis, kosongkan
          saja string ini — aplikasi akan generate otomatis berdasarkan nominal.
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

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
