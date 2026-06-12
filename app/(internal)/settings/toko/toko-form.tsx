"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { saveTokoSettings } from "../app-settings-actions"

interface Props {
  storeName: string
  ongkir: string
}

export function TokoForm({ storeName, ongkir }: Props) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveTokoSettings(fd)
      if (result.ok) toast.show("Tersimpan", "success")
      else toast.show(result.error, "error")
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Input
        name="store_name"
        label="Nama Toko"
        defaultValue={storeName}
        required
      />
      <Input
        name="ongkir"
        label="Ongkir (Rp)"
        type="number"
        min={0}
        defaultValue={ongkir}
        required
      />
      <p className="text-xs text-ink-faint">
        Ongkir dipakai sebagai default untuk pesanan online.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
