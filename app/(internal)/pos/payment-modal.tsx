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

  // Tunai & QRIS selalu tampil; sisanya di balik "Lainnya"
  const PRIMARY_KEYWORDS = ["tunai", "cash", "qris"];
  const primaryMethods = allMethods.filter((m) =>
    PRIMARY_KEYWORDS.some((k) => m.toLowerCase().includes(k))
  );
  const otherMethods = allMethods.filter(
    (m) => !PRIMARY_KEYWORDS.some((k) => m.toLowerCase().includes(k))
  );

  const [method, setMethod] = useState<string>(allMethods[0] ?? "Tunai");
  const [showOthers, setShowOthers] = useState(false);
  const [paid, setPaid] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showWa, setShowWa] = useState(false);

  const visibleMethods = showOthers
    ? allMethods
    : primaryMethods.length > 0
      ? primaryMethods
      : allMethods;

  const discountAmount = enableDiscount
    ? discountType === "percent"
      ? Math.round((total * discountValue) / 100)
      : discountValue
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const nominals = quickNominals(finalTotal);
  const change = calcChange(finalTotal, paid);

  const isCashMethod = method.toLowerCase().includes("tunai") || method.toLowerCase() === "cash";
  const isQrisMethod = method.toLowerCase().includes("qris");
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
        className="flex w-full max-w-sm flex-col rounded-2xl bg-white shadow-lg"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — tetap di atas */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-ink">Pembayaran</h3>
          <button onClick={onClose} aria-label="Tutup" className="text-ink-soft">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 space-y-3">
          {/* Diskon */}
          {enableDiscount && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-soft">Diskon</p>
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-hairline overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`px-2.5 py-1 text-xs font-semibold transition ${
                      discountType === "fixed" ? "bg-brand text-white" : "bg-white text-ink-soft"
                    }`}
                  >
                    <Minus size={11} className="inline" /> Rp
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2.5 py-1 text-xs font-semibold transition ${
                      discountType === "percent" ? "bg-brand text-white" : "bg-white text-ink-soft"
                    }`}
                  >
                    <Percent size={11} className="inline" /> %
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={discountType === "percent" ? 100 : total}
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 rounded-lg border border-hairline px-3 py-1 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
          )}

          {/* Total */}
          <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
            <div className="text-xs text-ink-soft">Total</div>
            {discountAmount > 0 && (
              <div className="text-xs text-ink-soft line-through">
                Rp {total.toLocaleString("id-ID")}
              </div>
            )}
            <div className="text-2xl font-bold text-brand">
              Rp {finalTotal.toLocaleString("id-ID")}
            </div>
            {discountAmount > 0 && (
              <div className="text-xs text-success">
                Hemat Rp {discountAmount.toLocaleString("id-ID")}
              </div>
            )}
          </div>

          {/* Nomor meja */}
          {enableTableNumber && (
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Nomor / Nama Meja</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="mis. Meja 3 / Take Away"
                className="w-full rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
          )}

          {/* Metode bayar */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.min(visibleMethods.length, 4)}, 1fr)` }}
          >
            {visibleMethods.map((m) => {
              const ml = m.toLowerCase();
              const Icon =
                ml.includes("tunai") || ml === "cash"
                  ? Banknote
                  : ml.includes("qris")
                    ? QrCode
                    : CreditCard;
              const isSelected = method === m;
              const isCashLike = ml.includes("tunai") || ml === "cash";
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition ${
                    isSelected
                      ? isCashLike
                        ? "border-success bg-tint-green text-success"
                        : "border-brand bg-tint-red text-brand"
                      : "border-hairline bg-white text-ink hover:bg-surface"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[11px] font-semibold leading-tight">{m}</span>
                </button>
              );
            })}
          </div>
          {otherMethods.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOthers((v) => !v)}
              className="text-xs text-brand hover:underline"
            >
              {showOthers
                ? "Sembunyikan metode lain"
                : `Lihat metode lain (${otherMethods.length})`}
            </button>
          )}

          {/* Detail tunai */}
          {isCashMethod && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {nominals.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPaid(n)}
                    className={`min-h-[36px] rounded-lg border px-1 py-1 text-xs font-semibold transition ${
                      paid === n
                        ? "border-brand bg-tint-red text-brand"
                        : "border-hairline bg-white text-ink hover:bg-surface"
                    }`}
                  >
                    {n === finalTotal ? "Pas" : `Rp ${n.toLocaleString("id-ID")}`}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPaid(Math.max(0, paid - 1000))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline text-sm text-ink-soft hover:bg-surface"
                  aria-label="Kurangi 1.000"
                >
                  ▼
                </button>
                <input
                  type="number"
                  value={paid || ""}
                  onChange={(e) => setPaid(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  placeholder="Uang diterima"
                />
                <button
                  type="button"
                  onClick={() => setPaid(paid + 1000)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline text-sm text-ink-soft hover:bg-surface"
                  aria-label="Tambah 1.000"
                >
                  ▲
                </button>
              </div>
              {cashOk && (
                <div className="rounded-xl bg-tint-green px-3 py-2 text-center">
                  <div className="text-xs font-medium text-success">Kembalian</div>
                  <div className="text-xl font-bold tracking-tight text-success">
                    Rp {change.toLocaleString("id-ID")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QRIS */}
          {isQrisMethod && (
            <div>
              {qrisImageUrl ? (
                <div className="flex flex-col items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisImageUrl}
                    alt="QRIS"
                    className="h-36 w-36 rounded-xl border border-hairline object-contain"
                  />
                  <p className="text-center text-xs text-ink-soft">
                    Scan QRIS di atas lalu klik konfirmasi.
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-surface px-3 py-2 text-center text-xs text-ink-soft">
                  Tunjukkan QRIS ke pelanggan, klik konfirmasi setelah bayar.
                  <br />
                  <span className="text-ink-faint">(Unggah di Pengaturan → Online & QRIS)</span>
                </p>
              )}
            </div>
          )}

          {/* Metode lain — pesan singkat */}
          {!isCashMethod && !isQrisMethod && (
            <p className="rounded-lg bg-surface px-3 py-2 text-center text-xs text-ink-soft">
              Konfirmasi setelah pembayaran {method} diterima.
            </p>
          )}

          {/* WA collapsible */}
          <div className="pb-2">
            <button
              type="button"
              onClick={() => setShowWa((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
            >
              <MessageCircle size={13} />
              {showWa ? "Sembunyikan nomor WA" : "Kirim struk via WA (opsional)"}
            </button>
            {showWa && (
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                placeholder="08xxxxxxxxxx"
              />
            )}
          </div>
        </div>

        {/* Footer sticky — tombol konfirmasi selalu terlihat */}
        <div className="shrink-0 border-t border-hairline px-4 py-3">
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!cashOk}
            onClick={handleConfirm}
            className="w-full"
          >
            {isCashMethod && !cashOk ? "Uang kurang" : "Konfirmasi Bayar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
