"use client"

import type { Cart } from "@/lib/domain/cart"
import { cartTotal } from "@/lib/domain/cart"
import { Button } from "@/components/ui/button"
import { CreditCard, Trash2, Bookmark } from "lucide-react"

interface Props {
  cart: Cart
  onUpdateQty: (index: number, qty: number) => void
  onRemove: (index: number) => void
  onClear: () => void
  onHold: () => void
  onPay: () => void
  disabled: boolean
}

export function CartView({
  cart,
  onUpdateQty,
  onRemove,
  onClear,
  onHold,
  onPay,
  disabled,
}: Props) {
  const totalItem = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-ink">
          Keranjang
          {totalItem > 0 && (
            <span className="ml-1 text-sm font-normal text-ink-soft">
              ({totalItem} item)
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-danger"
          >
            <Trash2 size={14} /> Kosongkan
          </button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {cart.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-soft">
            Belum ada item.
          </p>
        )}
        {cart.map((item, idx) => {
          const lineTotal =
            (item.unitPrice +
              item.variants.reduce((s, v) => s + v.priceDelta, 0)) *
            item.qty
          return (
            <div
              key={idx}
              className="rounded-lg border border-hairline bg-white p-2 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium text-ink">{item.name}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-danger"
                  aria-label="Hapus item"
                >
                  ✕
                </button>
              </div>
              {item.variants.length > 0 && (
                <div className="text-xs text-ink-soft">
                  {item.variants.map((v) => v.name).join(", ")}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(idx, item.qty - 1)}
                    className="h-11 w-11 rounded-lg border border-hairline text-xl text-ink active:scale-95"
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-base font-bold text-ink">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(idx, item.qty + 1)}
                    className="h-11 w-11 rounded-lg border border-hairline text-xl text-ink active:scale-95"
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>
                <span className="font-semibold text-ink">
                  Rp {lineTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <div className="mb-3 flex justify-between text-lg font-bold text-ink">
          <span>Total</span>
          <span>Rp {cartTotal(cart).toLocaleString("id-ID")}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            icon={Bookmark}
            onClick={onHold}
            disabled={disabled || cart.length === 0}
          >
            Simpan
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={CreditCard}
            onClick={onPay}
            disabled={disabled || cart.length === 0}
            className="flex-1"
          >
            Bayar{totalItem > 0 ? ` (${totalItem})` : ""}
          </Button>
        </div>
      </div>
    </div>
  )
}
