"use client";

import { useState } from "react";
import { Banknote, QrCode, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calcChange, isPaymentSufficient, quickNominals } from "@/lib/domain/payment";

interface Props {
  total: number;
  loading: boolean;
  qrisImageUrl?: string;
  onConfirm: (
    method: "cash" | "qris",
    paid: number,
    change: number,
    customerPhone?: string
  ) => void;
  onClose: () => void;
}

export function PaymentModal({ total, loading, qrisImageUrl, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<"cash" | "qris">("cash");
  const [paid, setPaid] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState("");

  const nominals = quickNominals(total);
  const change = calcChange(total, paid);
  const cashOk = method === "cash" ? isPaymentSufficient(total, paid) : true;

  const handleConfirm = () => {
    const phone = customerPhone.trim() || undefined;
    if (method === "cash") {
      onConfirm("cash", paid, change, phone);
    } else {
      onConfirm("qris", total, 0, phone);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Pembayaran</h3>
          <button onClick={onClose} aria-label="Tutup" className="text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-surface p-4 text-center">
          <div className="text-sm text-ink-soft">Total</div>
          <div className="text-3xl font-bold text-brand">Rp {total.toLocaleString("id-ID")}</div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            variant={method === "cash" ? "success" : "ghost"}
            icon={Banknote}
            onClick={() => setMethod("cash")}
          >
            Tunai
          </Button>
          <Button
            variant={method === "qris" ? "secondary" : "ghost"}
            icon={QrCode}
            onClick={() => setMethod("qris")}
          >
            QRIS
          </Button>
        </div>

        {method === "cash" && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {nominals.map((n) => (
                <button
                  key={n}
                  onClick={() => setPaid(n)}
                  className={`min-h-[44px] rounded-lg border px-2 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                    paid === n
                      ? "border-brand bg-tint-red text-brand"
                      : "border-hairline bg-white text-ink hover:bg-surface"
                  }`}
                >
                  {n === total ? "Uang pas" : `Rp ${n.toLocaleString("id-ID")}`}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-soft">Uang diterima</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPaid(Math.max(0, paid - 1000))}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline text-base text-ink-soft transition hover:bg-surface active:scale-90"
                  aria-label="Kurangi 1.000"
                >
                  ▼
                </button>
                <input
                  type="number"
                  value={paid || ""}
                  onChange={(e) => setPaid(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setPaid(paid + 1000)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline text-base text-ink-soft transition hover:bg-surface active:scale-90"
                  aria-label="Tambah 1.000"
                >
                  ▲
                </button>
              </div>
            </div>

            {/* Kembalian — highlight besar di tengah */}
            {cashOk && (
              <div className="rounded-xl bg-tint-green px-4 py-3 text-center">
                <div className="text-xs font-medium text-success">Kembalian</div>
                <div className="text-3xl font-bold tracking-tight text-success">
                  Rp {change.toLocaleString("id-ID")}
                </div>
              </div>
            )}
          </div>
        )}

        {method === "qris" && (
          <div className="mb-4 space-y-3">
            {qrisImageUrl ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrisImageUrl}
                  alt="QRIS"
                  className="h-60 w-60 rounded-xl border border-hairline object-contain"
                />
                <p className="text-center text-sm text-ink-soft">
                  Scan QRIS di atas. Setelah bayar diterima, klik konfirmasi.
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-surface px-3 py-3 text-center text-sm text-ink-soft">
                Tunjukkan QRIS ke pelanggan. Setelah pembayaran diterima, klik konfirmasi.
                <br />
                <span className="text-xs text-ink-faint">
                  (Unggah gambar QRIS di Pengaturan → Online & QRIS)
                </span>
              </p>
            )}
          </div>
        )}

        {/* Input nomor WA pelanggan — opsional */}
        <div className="mb-4">
          <label className="mb-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <MessageCircle size={14} />
            No. WA Pelanggan
            <span className="text-xs text-ink-faint">(opsional, untuk kirim struk)</span>
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!cashOk}
          onClick={handleConfirm}
          className="w-full"
        >
          {method === "cash" && !cashOk ? "Uang kurang" : "Konfirmasi Bayar"}
        </Button>
      </div>
    </div>
  );
}
