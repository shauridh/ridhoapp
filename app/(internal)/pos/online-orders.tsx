"use client";
import { rupiah } from "@/lib/format";

import { useState, useTransition, useEffect } from "react";
import { Check, X, MapPin, MessageCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { OnlineOrder, OnlinePlatform } from "./use-online-orders";
import { addManualOnlineOrder, listPaymentOptions } from "./online-actions";

interface Props {
  orders: OnlineOrder[];
  onConfirm: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkDone: (id: string) => void;
  onCancel: (id: string) => void;
}

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  pending: "accent",
  confirmed: "neutral",
  paid: "success",
};

const PLATFORM_CONFIG: Record<OnlinePlatform, { label: string; color: string }> = {
  web: { label: "Web", color: "bg-blue-100 text-blue-700" },
  gofood: { label: "GoFood", color: "bg-red-100 text-red-700" },
  grabfood: { label: "GrabFood", color: "bg-green-100 text-green-700" },
  shopeefood: { label: "ShopeeFood", color: "bg-orange-100 text-orange-700" },
  manual: { label: "Manual", color: "bg-gray-100 text-gray-600" },
};

const PLATFORMS: { value: OnlinePlatform; label: string }[] = [
  { value: "gofood", label: "GoFood" },
  { value: "grabfood", label: "GrabFood" },
  { value: "shopeefood", label: "ShopeeFood" },
  { value: "manual", label: "Manual" },
];

function PlatformBadge({ platform }: { platform: OnlinePlatform }) {
  const cfg = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.manual;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

const waLink = (o: OnlineOrder) => {
  const lines = o.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
  const msg = `Halo ${o.nama}, pesanan kamu:\n${lines}\nTotal: ${rupiah(o.total)}\nTerima kasih sudah memesan!`;
  const phone = o.phone.replace(/^0/, "62").replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

function InlineOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [pending, startTransition] = useTransition();
  const [paymentOptions, setPaymentOptions] = useState<{ id: string; name: string }[]>([]);
  const toast = useToast();

  useEffect(() => {
    listPaymentOptions().then((opts) =>
      setPaymentOptions(opts.filter((o: { is_active: boolean }) => o.is_active))
    );
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addManualOnlineOrder(fd);
      if (result.ok) {
        toast.show("Pesanan ditambahkan", "success");
        (e.target as HTMLFormElement).reset();
        onSuccess();
      } else {
        toast.show(result.error ?? "Gagal", "error");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand/20 bg-surface p-3 text-sm"
    >
      {/* Row 1: Platform + Nama */}
      <div className="flex gap-2">
        <select
          name="platform"
          defaultValue="gofood"
          className="w-32 rounded-lg border border-hairline bg-white px-2 py-2 text-xs text-ink outline-none focus:border-brand"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          name="nama"
          required
          placeholder="Nama pelanggan *"
          className="flex-1 rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Row 2: Item pesanan */}
      <textarea
        name="items"
        required
        rows={2}
        placeholder={"Item pesanan (mis: Ayam Goreng x2, Nasi x1)"}
        className="mt-2 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      {/* Row 3: Total + Metode Bayar */}
      <div className="mt-2 flex gap-2">
        <input
          name="total"
          type="number"
          min={0}
          defaultValue={0}
          placeholder="Total Rp"
          className="w-32 rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <select
          name="payment_method"
          className="flex-1 rounded-lg border border-hairline bg-white px-2 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="">Metode bayar...</option>
          {paymentOptions.map((o) => (
            <option key={o.id} value={o.name}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Row 4: Submit */}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Plus size={14} />
        {pending ? "Menyimpan..." : "Tambah Order"}
      </button>
    </form>
  );
}

export function OnlineOrders({ orders, onConfirm, onMarkPaid, onMarkDone, onCancel }: Props) {
  return (
    <div className="space-y-3">
      {/* Form inline selalu tampil di atas */}
      <InlineOrderForm onSuccess={() => {}} />

      {orders.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-soft">Belum ada pesanan online aktif.</p>
      )}

      {/* Counter per platform */}
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(PLATFORM_CONFIG)
            .filter(([p]) => orders.some((o) => o.platform === p))
            .map(([p, cfg]) => (
              <span
                key={p}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}
              >
                {cfg.label} ({orders.filter((o) => o.platform === p).length})
              </span>
            ))}
        </div>
      )}

      {/* Daftar order */}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-hairline bg-white p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-ink">{o.nama}</span>
                {o.phone !== "-" && <span className="ml-2 text-xs text-ink-soft">{o.phone}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <PlatformBadge platform={o.platform} />
                <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
              </div>
            </div>

            {o.alamat && <div className="mt-0.5 text-xs text-ink-soft">{o.alamat}</div>}
            {o.catatan && <div className="mt-0.5 text-xs italic text-ink-soft">“{o.catatan}”</div>}

            <ul className="my-1.5 text-xs text-ink">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} ×{i.qty}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              <span className="font-bold text-brand">{rupiah(o.total)}</span>
              {o.payment_method && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                  {o.payment_method}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {o.phone !== "-" && (
                <a
                  href={waLink(o)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
                >
                  <MessageCircle size={13} /> WA
                </a>
              )}
              {o.location_url && (
                <a
                  href={o.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-ink"
                >
                  <MapPin size={13} /> Lokasi
                </a>
              )}
              {o.status === "pending" && (
                <button
                  onClick={() => onConfirm(o.id)}
                  className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white"
                >
                  Konfirmasi
                </button>
              )}
              {o.status === "confirmed" && (
                <button
                  onClick={() => onMarkPaid(o.id)}
                  className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-ink"
                >
                  Sudah Bayar
                </button>
              )}
              {o.status === "paid" && (
                <button
                  onClick={() => onMarkDone(o.id)}
                  className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
                >
                  <Check size={13} /> Selesai
                </button>
              )}
              <button
                onClick={() => onCancel(o.id)}
                className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-danger"
              >
                <X size={13} /> Batal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
