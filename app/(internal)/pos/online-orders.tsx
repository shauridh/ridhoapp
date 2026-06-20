"use client";
import { rupiah } from "@/lib/format";

import { useState, useTransition } from "react";
import { Check, X, MapPin, MessageCircle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { OnlineOrder, OnlinePlatform } from "./use-online-orders";
import { addManualOnlineOrder } from "./online-actions";

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

function ManualOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

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
      className="space-y-2 rounded-xl border border-hairline bg-surface p-3 text-sm"
    >
      <p className="text-xs font-semibold text-ink-soft">Tambah Order Manual</p>

      <Select label="Platform" name="platform" defaultValue="gofood">
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>

      <Input label="Nama pelanggan" name="nama" required placeholder="mis. Budi" />
      <Input label="No. HP (opsional)" name="phone" placeholder="08xxxxxxxxxx" />
      <Input label="Alamat (opsional)" name="alamat" placeholder="mis. Jl. Merdeka No.1" />

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">
          Item pesanan
          <span className="ml-1 text-ink-faint">(satu per baris, contoh: Ayam Goreng x2)</span>
        </label>
        <textarea
          name="items"
          required
          rows={3}
          placeholder={"Ayam Goreng x2\nNasi Putih x1"}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <Input label="Total (Rp)" name="total" type="number" defaultValue={0} money />
      <Input label="Catatan (opsional)" name="catatan" placeholder="mis. pedas level 2" />

      <Button type="submit" icon={Plus} loading={pending} className="w-full">
        Tambah Pesanan
      </Button>
    </form>
  );
}

export function OnlineOrders({ orders, onConfirm, onMarkPaid, onMarkDone, onCancel }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      {/* Tombol tambah order manual */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-brand/30 bg-tint-red px-3 py-2 text-sm font-semibold text-brand"
      >
        <span className="flex items-center gap-2">
          <Plus size={14} /> Input Order GoFood / GrabFood / ShopeeFood
        </span>
        {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showForm && <ManualOrderForm onSuccess={() => setShowForm(false)} />}

      {/* Filter chip per platform */}
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

      {orders.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-ink-soft">Belum ada pesanan online.</p>
      )}

      {/* Daftar order */}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-hairline bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink">{o.nama}</span>
              <div className="flex items-center gap-1">
                <PlatformBadge platform={o.platform} />
                <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
              </div>
            </div>
            {o.phone !== "-" && <div className="text-xs text-ink-soft">{o.phone}</div>}
            {o.alamat && <div className="text-xs text-ink-soft">{o.alamat}</div>}
            {o.catatan && <div className="mt-1 text-xs italic text-ink-soft">“{o.catatan}”</div>}
            <ul className="my-1 text-xs text-ink">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} x{i.qty}
                </li>
              ))}
            </ul>
            <div className="font-semibold text-brand">{rupiah(o.total)}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              {o.phone !== "-" && (
                <a
                  href={waLink(o)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
                >
                  <MessageCircle size={14} /> WA
                </a>
              )}
              {o.location_url && (
                <a
                  href={o.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-ink"
                >
                  <MapPin size={14} /> Lokasi
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
                  <Check size={14} /> Selesai
                </button>
              )}
              <button
                onClick={() => onCancel(o.id)}
                className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-danger"
              >
                <X size={14} /> Batal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
