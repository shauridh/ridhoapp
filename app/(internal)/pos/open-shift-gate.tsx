"use client";
import { rupiah } from "@/lib/format";

import { useState, useTransition } from "react";
import { Drumstick } from "lucide-react";
import { openShift } from "./shift/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  lastBalance: number;
}

// Gerbang buka shift: tampil di /pos saat belum ada shift terbuka.
// Saldo awal = saldo laci kemarin + tambahan modal opsional.
export function OpenShiftGate({ lastBalance }: Props) {
  const [tambahan, setTambahan] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = lastBalance + (Number(tambahan) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await openShift(total);
      if (!result.ok) setError(result.error);
      // sukses: revalidatePath di action akan menampilkan kasir
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Drumstick size={24} />
          </div>
          <h2 className="mt-2 text-lg font-bold text-ink">Buka Shift</h2>
          <p className="text-sm text-ink-soft">Mulai shift dulu sebelum berjualan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Saldo Drawer Kemarin</label>
            <div className="rounded-xl bg-surface px-3 py-2 font-semibold text-ink">
              {rupiah(lastBalance)}
            </div>
          </div>

          <Input
            type="number"
            label="Tambahan Modal (opsional)"
            value={tambahan}
            onChange={(e) => setTambahan(e.target.value)}
            inputMode="numeric"
          />

          <div className="flex items-center justify-between rounded-xl bg-brand/5 px-3 py-2">
            <span className="text-sm text-ink-soft">Saldo Awal Shift</span>
            <span className="font-bold text-brand">{rupiah(total)}</span>
          </div>

          <Button type="submit" variant="primary" loading={pending} className="w-full">
            Buka Shift &amp; Mulai Jualan
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </div>
    </div>
  );
}
