"use client"

import { useTransition } from "react"
import { useToast } from "@/components/ui/toast"
import { saveAppSettings } from "./app-settings-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  storeName: string
  ongkir: string
  qrisString: string
  onlineEnabled: string
  ownerWa: string
  waReportEnabled: string
  waTemplate: string
}

export function AppSettingsManager({
  storeName,
  ongkir,
  qrisString,
  onlineEnabled,
  ownerWa,
  waReportEnabled,
  waTemplate,
}: Props) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveAppSettings(fd)
      if (result.ok) {
        toast.show("Pengaturan tersimpan", "success")
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
          Toko
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nama Toko
            </label>
            <Input name="store_name" defaultValue={storeName} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Ongkir (Rp)
            </label>
            <Input
              name="ongkir"
              type="number"
              min={0}
              defaultValue={ongkir}
              required
            />
          </div>
        </div>
      </section>

      <hr className="border-hairline" />

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
          Pesanan Online & QRIS
        </h2>
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
            saja string ini — aplikasi akan generate otomatis berdasarkan nominal
            transaksi.
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
      </section>

      <hr className="border-hairline" />

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
          WhatsApp & Rekap
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Nomor WA Owner
          </label>
          <Input
            name="owner_wa"
            defaultValue={ownerWa}
            placeholder="62812xxxxxxx"
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Format internasional tanpa tanda +, contoh: 62812xxxxxxx. Rekap shift
            akan dikirim ke nomor ini.
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
            <p>Kosongkan untuk pakai format bawaan. Placeholder tersedia:</p>
            <p className="mt-1 font-mono">
              {"{toko} {tanggal} {omzet} {transaksi} {item} {tunai} {qris} {kasAwal} {kasAkhir} {selisih} {terlaris}"}
            </p>
          </div>
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
