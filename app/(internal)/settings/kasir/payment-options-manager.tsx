"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  listPaymentOptions,
  addPaymentOption,
  togglePaymentOption,
  deletePaymentOption,
  setPaymentOptionOffline,
} from "@/app/(internal)/pos/online-actions";

interface PaymentOption {
  id: string;
  name: string;
  is_active: boolean;
  is_offline: boolean;
  sort_order: number;
}

export function PaymentOptionsManager() {
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const load = () => {
    listPaymentOptions().then((data) => setOptions(data as PaymentOption[]));
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    const result = await fn();
    if (result.ok) {
      toast.show(msg, "success");
      load();
    } else {
      toast.show(result.error ?? "Gagal", "error");
    }
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await run(() => addPaymentOption(fd), "Opsi ditambahkan");
      (e.target as HTMLFormElement).reset();
    });
  };

  const handleToggleOffline = (id: string, isOffline: boolean) => {
    startTransition(() => {
      run(() => setPaymentOptionOffline(id, isOffline), "Diperbarui");
    });
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">Metode Pembayaran</h2>
        <p className="text-xs text-ink-soft">
          Kelola opsi pembayaran untuk POS (offline) dan order online. Aktifkan serta pilih tipe
          sesuai kebutuhan.
        </p>
      </div>

      <div className="flex gap-2 text-xs">
        <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">POS</span>
        <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-ink">Online</span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="mis. Tunai, QRIS, Transfer, Kartu Debit, OVO"
          className="flex-1 rounded-xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <Button type="submit" icon={Plus} loading={pending}>
          Tambah
        </Button>
      </form>

      <ul className="divide-y divide-hairline rounded-xl border border-hairline">
        {options.map((o) => (
          <li
            key={o.id}
            className={`flex items-center justify-between px-3 py-2.5 text-sm ${
              !o.is_active ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {o.is_offline && (
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  POS
                </span>
              )}
              <span className="text-ink">{o.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleOffline(o.id, !o.is_offline)}
                className={`rounded p-1 transition ${
                  o.is_offline ? "text-brand hover:bg-tint-red" : "text-ink-soft hover:bg-surface"
                }`}
                aria-label={o.is_offline ? "Nonaktifkan untuk POS" : "Aktifkan untuk POS"}
                title={o.is_offline ? "Untuk POS" : "Untuk Online"}
              >
                {o.is_offline ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
              </button>
              <button
                onClick={() =>
                  startTransition(() =>
                    run(() => togglePaymentOption(o.id, !o.is_active), "Diperbarui")
                  )
                }
                className={`rounded p-1 transition ${
                  o.is_active ? "text-brand hover:bg-tint-red" : "text-ink-soft hover:bg-surface"
                }`}
                aria-label={o.is_active ? "Nonaktifkan" : "Aktifkan"}
              >
                {o.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus "${o.name}"?`)) {
                    startTransition(() => run(() => deletePaymentOption(o.id), "Dihapus"));
                  }
                }}
                className="rounded p-1 text-ink-soft transition hover:text-danger"
                aria-label={`Hapus ${o.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
        {options.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-ink-soft">
            Belum ada opsi pembayaran.
          </li>
        )}
      </ul>
    </Card>
  );
}
