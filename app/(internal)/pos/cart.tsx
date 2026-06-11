"use client"

import type { Cart, CartItem } from "@/lib/domain/cart"
import { cartTotal } from "@/lib/domain/cart"

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
      <h2 className="mb-2 font-semibold">Keranjang</h2>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {cart.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500">
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
              className="rounded-lg border p-2 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-red-500"
                >
                  x
                </button>
              </div>
              {item.variants.length > 0 && (
                <div className="text-xs text-gray-500">
                  {item.variants.map((v) => v.name).join(", ")}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(idx, item.qty - 1)}
                    className="w-6 rounded border text-center"
                  >
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(idx, item.qty + 1)}
                    className="w-6 rounded border text-center"
                  >
                    +
                  </button>
                </div>
                <span className="font-medium">
                  Rp {lineTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t pt-3">
        <div className="mb-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>Rp {cartTotal(cart).toLocaleString("id-ID")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onCheckout("cash")}
            disabled={disabled || cart.length === 0}
            className="rounded-lg bg-green-600 py-2 text-white disabled:opacity-50"
          >
            Tunai
          </button>
          <button
            onClick={() => onCheckout("qris")}
            disabled={disabled || cart.length === 0}
            className="rounded-lg bg-blue-600 py-2 text-white disabled:opacity-50"
          >
            QRIS
          </button>
        </div>
      </div>
    </div>
  )
}
