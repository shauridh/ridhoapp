"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { saveWhatsappSettings } from "../app-settings-actions"

interface Props {
  ownerWa: string
  waReportEnabled: string
  waTemplate: string
}

export function WhatsappForm({ ownerWa, waReportEnabled, waTemplate }: Props) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveWhatsappSettings(fd)
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
        <Input
          name="owner_wa"
          label="Nomor WA Owner"
          defaultValue={ownerWa}
          placeholder="62812xxxxxxx"
          inputMode="numeric"
        />
        <p className="mt-1 text-xs text-ink-faint">
          Format internasional tanpa tanda +, contoh: 62812xxxxxxx.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="wa_report_enabled"
          id="wa_report_enabled"
          value="true"
          defaultChecked={waReportEnabled === "true"}
          className="h-5 w-5 rounded accent-brand"
        />
        <label
          htmlFor="wa_report_enabled"
          className="text-sm font-medium text-ink"
        >
          Kirim rekap shift ke WA saat tutup shift
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Template Pesan WA
        </label>
        <textarea
          name="wa_template"
          rows={10}
          defaultValue={waTemplate}
          placeholder="Kosongkan untuk pakai format bawaan"
          className="w-full rounded-xl border border-hairline px-3 py-2 font-mono text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <div className="mt-1 text-xs text-ink-faint">
          <p>Kosongkan untuk format bawaan. Placeholder tersedia:</p>
          <p className="mt-1 font-mono">
            {"{toko} {tanggal} {omzet} {transaksi} {item} {tunai} {qris} {kasAwal} {kasAkhir} {selisih} {terlaris}"}
          </p>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
