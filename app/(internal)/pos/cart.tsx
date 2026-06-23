"use client";

import type { Cart } from "@/lib/domain/cart";
import { cartTotal } from "@/lib/domain/cart";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Bookmark } from "lucide-react";

export type OrderType = "takeaway" | "dinein" | "gojek" | "grab" | "shopee";

export const ORDER_TYPE_OPTIONS: { key: OrderType; label: string; isOnline: boolean }[] = [
  { key: "takeaway", label: "Take Away", isOnline: false },
  { key: "dinein", label: "Dine In", isOnline: false },
  { key: "gojek", label: "GoFood", isOnline: true },
  { key: "grab", label: "GrabFood", isOnline: true },
  { key: "shopee", label: "ShopeeFood", isOnline: true },
];

interface Props {
  cart: Cart;
  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onHold: () => void;
  onPay: () => void;
  disabled: boolean;
}

export function CartView({
  cart,
  orderType,
  onOrderTypeChange,
  onUpdateQty,
  onRemove,
  onClear,
  onHold,
  onPay,
  disabled,
}: Props) {
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

      {/* Item list */}
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
              <div className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {item.name}
                </span>
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
                <span className="shrink-0 text-right text-sm font-semibold text-ink">
                  Rp {lineTotal.toLocaleString("id-ID")}
                </span>
                <button
                  onClick={() => onRemove(idx)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-faint transition hover:text-danger"
                  aria-label={`Hapus ${item.name}`}
                >
                  ✕
                </button>
              </div>
              {item.variants.length > 0 && (
                <div className="mt-0.5 pl-0 text-xs text-ink-soft">
                  {item.variants.map((v) => v.name).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-hairline pt-3 space-y-3">
        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink-soft">Total</span>
          <span className="text-xl font-bold text-ink">
            Rp {cartTotal(cart).toLocaleString("id-ID")}
          </span>
        </div>
        {totalItem > 0 && (
          <p className="text-xs text-ink-soft">
            {totalItem} item &middot; {cart.length} jenis produk
          </p>
        )}

        {/* Jenis Transaksi */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-soft">Jenis Transaksi</p>
          <div className="grid grid-cols-5 gap-1 overflow-hidden">
            {ORDER_TYPE_OPTIONS.map((t) => {
              const selected = orderType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onOrderTypeChange(t.key)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border py-2 text-center text-[9px] font-semibold leading-tight transition ${
                    selected
                      ? t.isOnline
                        ? "border-brand bg-tint-red text-brand"
                        : "border-info bg-tint-blue text-info"
                      : "border-hairline bg-white text-ink-soft hover:bg-surface"
                  }`}
                >
                  <span className="w-full truncate px-0.5 text-center">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tombol aksi */}
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
