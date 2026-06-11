"use client"

import { useState } from "react"
import { Banknote, QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  calcChange,
  isPaymentSufficient,
  quickNominals,
} from "@/lib/domain/payment"

interface Props {
  total: number
  loading: boolean
  onConfirm: (method: "cash" | "qris", paid: number, change: number) => void
  onClose: () => void
}

export function PaymentModal({ total, loading, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<"cash" | "qris">("cash")
  const [paid, setPaid] = useState<number>(0)

  const nominals = quickNominals(total)
  const change = calcChange(total, paid)
  const cashOk = method === "cash" ? isPaymentSufficient(total, paid) : true

  const handleConfirm = () => {
    if (method === "cash") {
      onConfirm("cash", paid, change)
    } else {
      onConfirm("qris", total, 0)
    }
  }

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
          <div className="text-3xl font-bold text-brand">
            Rp {total.toLocaleString("id-ID")}
          </div>
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
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
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
              <label className="mb-1 block text-sm text-ink-soft">
                Uang diterima
              </label>
              <input
                type="number"
                value={paid || ""}
                onChange={(e) => setPaid(Number(e.target.value))}
                className="w-full rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between rounded-lg bg-surface px-3 py-2">
              <span className="text-ink-soft">Kembalian</span>
              <span className="font-bold text-ink">
                Rp {change.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}

        {method === "qris" && (
          <p className="mb-4 rounded-lg bg-surface px-3 py-3 text-center text-sm text-ink-soft">
            Tunjukkan QRIS ke pelanggan. Setelah pembayaran diterima, klik
            konfirmasi.
          </p>
        )}

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
  )
}
