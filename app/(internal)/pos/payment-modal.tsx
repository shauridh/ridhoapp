"use client";

import { useState } from "react";
import { Banknote, QrCode, X, MessageCircle, CreditCard, Percent, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calcChange, isPaymentSufficient, quickNominals } from "@/lib/domain/payment";

type PaymentMethod = string;

interface PaymentOption {
  id: string;
  name: string;
  is_active: boolean;
  is_offline: boolean;
  sort_order: number;
}

interface Props {
  total: number;
  loading: boolean;
  qrisImageUrl?: string;
  enableDiscount?: boolean;
  enableTableNumber?: boolean;
  offlinePaymentOptions?: PaymentOption[];
  onConfirm: (method: PaymentMethod, paid: number, change: number, customerPhone?: string) => void;
  onClose: () => void;
}

export function PaymentModal({
  total,
  loading,
  qrisImageUrl,
  enableDiscount = false,
  enableTableNumber = false,
  offlinePaymentOptions,
  onConfirm,
  onClose,
}: Props) {
  const allMethods: string[] = offlinePaymentOptions
    ?.filter((o) => o.is_active)
    .map((o) => o.name) ?? ["Tunai", "QRIS"];
  const [method, setMethod] = useState<string>(allMethods[0] ?? "Tunai");
  const [paid, setPaid] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const discountAmount = enableDiscount
    ? discountType === "percent"
      ? Math.round((total * discountValue) / 100)
      : discountValue
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const nominals = quickNominals(finalTotal);
  const change = calcChange(finalTotal, paid);

  const isCashMethod = method.toLowerCase().includes("tunai") || method.toLowerCase() === "cash";
  const cashOk = isCashMethod ? isPaymentSufficient(finalTotal, paid) : true;

  const handleConfirm = () => {
    const phone = customerPhone.trim() || undefined;
    const paidAmt = isCashMethod ? paid : finalTotal;
    const changeAmt = isCashMethod ? change : 0;
    onConfirm(method, paidAmt, changeAmt, phone);
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

        {/* Diskon (opsional) */}
        {enableDiscount && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-ink-soft">Diskon</p>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-hairline overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    discountType === "fixed" ? "bg-brand text-white" : "bg-white text-ink-soft"
                  }`}
                >
                  <Minus size={12} className="inline" /> Rp
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    discountType === "percent" ? "bg-brand text-white" : "bg-white text-ink-soft"
                  }`}
                >
                  <Percent size={12} className="inline" /> %
                </button>
              </div>
              <input
                type="number"
                min={0}
                max={discountType === "percent" ? 100 : total}
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="0"
                className="flex-1 rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
        )}

        <div className="mb-4 rounded-xl bg-surface p-4 text-center">
          <div className="text-sm text-ink-soft">Total</div>
          {discountAmount > 0 && (
            <div className="text-xs text-ink-soft line-through">
              Rp {total.toLocaleString("id-ID")}
            </div>
          )}
          <div className="text-3xl font-bold text-brand">
            Rp {finalTotal.toLocaleString("id-ID")}
          </div>
          {discountAmount > 0 && (
            <div className="text-xs text-success">
              Hemat Rp {discountAmount.toLocaleString("id-ID")}
            </div>
          )}
        </div>

        {/* Nomor meja (opsional) */}
        {enableTableNumber && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-ink-soft">Nomor / Nama Meja</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="mis. Meja 3 / Take Away"
              className="w-full rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
        )}

        {/* Metode bayar */}
        <div className={`mb-4 grid gap-2 grid-cols-${Math.min(allMethods.length, 4)}`}>
          {allMethods.map((m) => {
            const methodLower = m.toLowerCase();
            const Icon =
              methodLower.includes("tunai") || methodLower.includes("cash")
                ? Banknote
                : methodLower.includes("qris")
                  ? QrCode
                  : CreditCard;
            const isSelected = method === m;
            const isCashLike = methodLower.includes("tunai") || methodLower.includes("cash");
            return (
              <Button
                key={m}
                variant={isSelected ? (isCashLike ? "success" : "secondary") : "ghost"}
                icon={Icon}
                onClick={() => setMethod(m)}
              >
                {m}
              </Button>
            );
          })}
        </div>

        {isCashMethod && (
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
                  {n === finalTotal ? "Uang pas" : `Rp ${n.toLocaleString("id-ID")}`}
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

        {method.toLowerCase().includes("qris") && (
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

        {method.toLowerCase().includes("transfer") && !method.toLowerCase().includes("qris") && (
          <div className="mb-4 rounded-xl bg-surface px-4 py-3 text-center">
            <p className="text-sm text-ink-soft">Konfirmasi setelah transfer diterima.</p>
          </div>
        )}

        {method.toLowerCase().includes("debit") && !method.toLowerCase().includes("kredit") && (
          <div className="mb-4 rounded-xl bg-surface px-4 py-3 text-center">
            <p className="text-sm text-ink-soft">Gesek kartu, konfirmasi setelah approved.</p>
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
          {isCashMethod && !cashOk ? "Uang kurang" : "Konfirmasi Bayar"}
        </Button>
      </div>
    </div>
  );
}
