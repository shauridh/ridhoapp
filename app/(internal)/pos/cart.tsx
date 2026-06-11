"use client"

import type { Cart } from "@/lib/domain/cart"
import { cartTotal } from "@/lib/domain/cart"
import { Button } from "@/components/ui/button"

interface Props {
  cart: Cart
  onUpdateQty: (index: number, qty: number) => void
  onRemove: (index: number) => void
  onCheckout: (method: "cash" | "qris") => void
  disabled: boolean
}

export function CartView({
  cart,
  onUpdateQty,
  onRemove,
  onCheckout,
  disabled,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-2 font-semibold text-ink">Keranjang</h2>
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
                    className="h-8 w-8 rounded-lg border border-hairline text-center text-ink"
                  >
                    −
                  </button>
                  <span className="font-semibold text-ink">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(idx, item.qty + 1)}
                    className="h-8 w-8 rounded-lg border border-hairline text-center text-ink"
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="success"
            size="lg"
            onClick={() => onCheckout("cash")}
            disabled={disabled || cart.length === 0}
          >
            Tunai
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onCheckout("qris")}
            disabled={disabled || cart.length === 0}
          >
            QRIS
          </Button>
        </div>
      </div>
    </div>
  )
}

