"use client";

import { useState } from "react";
import { createCart, addItem, removeItem, updateQty, cartTotal } from "@/lib/domain/cart";
import type { Cart, CartVariant } from "@/lib/domain/cart";
import type { ProductRow, VariantRow } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { useDialog } from "@/components/ui/dialog";
import { holdOrder } from "../held-actions";
import { checkout, sendReceiptWa } from "../actions";

type PaymentMethod = string;

interface ReceiptState {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: { name: string; qty: number; price: number }[];
  paid?: number;
  change?: number;
  order_number?: number;
  customerPhone?: string;
}

interface StoreInfo {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
}

export function useCart(storeInfo: StoreInfo, variants: Record<string, VariantRow[]>) {
  const [cart, setCart] = useState<Cart>(createCart());
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [heldRefresh, setHeldRefresh] = useState(0);
  const [allVariants, setAllVariants] = useState<Record<string, VariantRow[]>>(variants);

  const toast = useToast();
  const dialog = useDialog();

  const cartQty: Record<string, number> = {};
  for (const item of cart) {
    cartQty[item.productId] = (cartQty[item.productId] ?? 0) + item.qty;
  }

  const handleSelectProduct = async (product: ProductRow) => {
    const prefetched = allVariants[product.id];
    if (prefetched !== undefined) {
      if (prefetched.length > 0) {
        setPendingProduct(product);
      } else {
        setCart((prev) =>
          addItem(prev, {
            productId: product.id,
            name: product.name,
            qty: 1,
            unitPrice: Number(product.base_price),
            variants: [],
          })
        );
      }
      return;
    }

    // Fallback: fetch on-demand
    const supabase = createClient();
    const { data: vars } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true);

    if (vars && vars.length > 0) {
      setAllVariants((prev) => ({ ...prev, [product.id]: vars }));
      setPendingProduct(product);
    } else {
      setAllVariants((prev) => ({ ...prev, [product.id]: [] }));
      setCart((prev) =>
        addItem(prev, {
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: Number(product.base_price),
          variants: [],
        })
      );
    }
  };

  const handleVariantConfirm = (chosen: CartVariant[]) => {
    if (!pendingProduct) return;
    setCart((prev) =>
      addItem(prev, {
        productId: pendingProduct.id,
        name: pendingProduct.name,
        qty: 1,
        unitPrice: Number(pendingProduct.base_price),
        variants: chosen,
      })
    );
    setPendingProduct(null);
  };

  const handleHold = async () => {
    if (cart.length === 0) return;
    const label = await dialog.prompt("Nama/nomor pesanan (mis. Meja 3 / Budi):", "Simpan Pesanan");
    if (label === null) return;
    const result = await holdOrder(label, cart);
    if (result.ok) {
      setCart(createCart());
      setHeldRefresh((k) => k + 1);
      toast.show("Pesanan disimpan", "success");
    } else {
      toast.show(result.error, "error");
    }
  };

  const handleResume = (saved: Cart) => {
    setCart((prev) => (prev.length === 0 ? saved : [...prev, ...saved]));
  };

  const handleCheckout = async (
    method: PaymentMethod,
    paid: number,
    change: number,
    customerPhone?: string
  ) => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const result = await checkout({
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          variants: item.variants.map((v) => ({
            variantId: v.variantId,
            variantName: v.name,
            priceDelta: v.priceDelta,
          })),
        })),
        total: cartTotal(cart),
        paymentMethod: method,
        paid,
        change,
      });
      if (result.ok) {
        toast.show("Transaksi berhasil", "success");
        const receiptItems = cart.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.unitPrice + item.variants.reduce((s, v) => s + v.priceDelta, 0),
        }));
        setReceipt({
          ...result.order,
          paid,
          change,
          items: receiptItems,
          customerPhone: customerPhone || undefined,
        });
        setCart(createCart());

        if (customerPhone) {
          sendReceiptWa(customerPhone, {
            orderId: result.order.id,
            createdAt: result.order.created_at,
            items: receiptItems,
            total: result.order.total,
            paymentMethod: method,
            paid,
            change,
            ...storeInfo,
          }).catch(() => {});
        }
      } else {
        toast.show(result.error, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    setCart,
    cartQty,
    cartTotal: () => cartTotal(cart),
    pendingProduct,
    setPendingProduct,
    loading,
    receipt,
    setReceipt,
    heldRefresh,
    allVariants,
    setAllVariants,
    handleSelectProduct,
    handleVariantConfirm,
    handleHold,
    handleResume,
    handleCheckout,
    updateQty: (i: number, q: number) => setCart((prev) => updateQty(prev, i, q)),
    removeItem: (i: number) => setCart((prev) => removeItem(prev, i)),
    clearCart: () => setCart(createCart()),
  };
}
