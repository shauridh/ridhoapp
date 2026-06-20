"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { saveKasirSettings } from "../app-settings-actions";

interface Props {
  enableDiscount: boolean;
  enableReprint: boolean;
  extraPaymentMethods: string[]; // e.g. ['transfer','debit']
  enableTableNumber: boolean;
}

function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-soft">{description}</p>
      </div>
      <div className="relative shrink-0">
        <input
          type="checkbox"
          name={name}
          value="true"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-hairline transition peer-checked:bg-brand" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

export function KasirForm({
  enableDiscount,
  enableReprint,
  extraPaymentMethods,
  enableTableNumber,
}: Props) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveKasirSettings(fd);
      if (result.ok) toast.show("Pengaturan disimpan", "success");
      else toast.show(result.error ?? "Gagal menyimpan", "error");
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="divide-y divide-hairline">
        <Toggle
          name="enable_discount"
          label="Aktifkan Diskon"
          description="Tambahkan input diskon (nominal atau persen) di layar pembayaran."
          defaultChecked={enableDiscount}
        />
        <Toggle
          name="enable_reprint"
          label="Cetak Ulang dari Riwayat"
          description="Tampilkan tombol cetak ulang dan kirim WA di halaman riwayat transaksi."
          defaultChecked={enableReprint}
        />
        <Toggle
          name="enable_table_number"
          label="Nomor Meja"
          description="Tampilkan input nomor/nama meja sebelum konfirmasi pembayaran."
          defaultChecked={enableTableNumber}
        />

        <div className="py-3">
          <p className="mb-2 font-semibold text-ink">Metode Bayar Tambahan</p>
          <p className="mb-3 text-xs text-ink-soft">
            Selain Cash dan QRIS, aktifkan metode bayar berikut.
          </p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: "transfer", label: "Transfer Bank" },
                { value: "debit", label: "Kartu Debit / EDC" },
              ] as const
            ).map((m) => (
              <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="extra_payment_methods"
                  value={m.value}
                  defaultChecked={extraPaymentMethods.includes(m.value)}
                  className="h-4 w-4 rounded border-hairline accent-brand"
                />
                <span className="text-sm text-ink">{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Button type="submit" loading={pending}>
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}
