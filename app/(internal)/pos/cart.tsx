"use client";

import type { Cart } from "@/lib/domain/cart";
import { cartTotal } from "@/lib/domain/cart";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Bookmark } from "lucide-react";

interface Props {
  cart: Cart;
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onHold: () => void;
  onPay: () => void;
  disabled: boolean;
}

export function CartView({ cart, onUpdateQty, onRemove, onClear, onHold, onPay, disabled }: Props) {
  const totalItem = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Keranjang
          {totalItem > 0 && <span className="ml-1 font-normal text-ink-soft">({totalItem})</span>}
        </h2>
        {cart.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-danger">
            <Trash2 size={12} /> Kosongkan
          </button>
        )}
      </div>

      {/* Item list — flat, tanpa card */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-soft">Belum ada item.</p>
        )}
        {cart.map((item, idx) => {
          const unitWithVariants =
            item.unitPrice + item.variants.reduce((s, v) => s + v.priceDelta, 0);
          const lineTotal = unitWithVariants * item.qty;
          return (
            <div key={idx} className="border-b border-hairline py-2 last:border-b-0">
              {/* Baris utama: nama + qty controls + harga + hapus */}
              <div className="flex items-center gap-1.5">
                {/* Nama produk */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {item.name}
                </span>

                {/* Qty controls — lebar fixed agar kolom selalu rata */}
                <div className="flex shrink-0 items-center">
                  <button
                    onClick={() => onUpdateQty(idx, item.qty - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-l border border-hairline text-sm font-bold text-ink transition hover:bg-surface active:scale-90"
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <span className="flex h-6 w-7 items-center justify-center border-y border-hairline text-sm font-bold text-ink">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(idx, item.qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-r border border-hairline text-sm font-bold text-ink transition hover:bg-surface active:scale-90"
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>

                {/* Harga subtotal */}
                <span className="shrink-0 text-right text-sm font-semibold text-ink">
                  Rp {lineTotal.toLocaleString("id-ID")}
                </span>

                {/* Tombol hapus */}
                <button
                  onClick={() => onRemove(idx)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-faint transition hover:text-danger"
                  aria-label={`Hapus ${item.name}`}
                >
                  ✕
                </button>
              </div>

              {/* Baris varian (jika ada) */}
              {item.variants.length > 0 && (
                <div className="mt-0.5 pl-0 text-xs text-ink-soft">
                  {item.variants.map((v) => v.name).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: total + tombol aksi */}
      <div className="mt-3 border-t border-hairline pt-3">
        {/* Total — lebih besar agar mudah dipindai saat transaksi ramai */}
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink-soft">Total</span>
          <span className="text-xl font-bold text-ink">
            Rp {cartTotal(cart).toLocaleString("id-ID")}
          </span>
        </div>
        {/* Item count summary */}
        {totalItem > 0 && (
          <p className="mb-3 text-xs text-ink-soft">
            {totalItem} item &middot; {cart.length} jenis produk
          </p>
        )}
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
  );
}
