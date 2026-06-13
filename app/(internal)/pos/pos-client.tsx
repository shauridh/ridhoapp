"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Receipt, Bookmark, Bell, History, ShoppingCart } from "lucide-react";
import type { ProductRow } from "@/lib/data/products";
import type { VariantRow } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/client";
import { createCart, addItem, removeItem, updateQty, cartTotal } from "@/lib/domain/cart";
import type { Cart, CartVariant } from "@/lib/domain/cart";
import type { GridSetting } from "@/lib/domain/grid";
import { useToast } from "@/components/ui/toast";
import { useDialog } from "@/components/ui/dialog";
import { SlideOver } from "@/components/ui/slide-over";
import { checkout } from "./actions";
import { holdOrder } from "./held-actions";
import { ProductGrid } from "./product-grid";
import { CartView } from "./cart";
import { VariantPicker } from "./variant-picker";
import { PaymentModal } from "./payment-modal";
import { Receipt as ReceiptModal } from "./receipt";
import { OnlineOrders } from "./online-orders";
import { HeldOrders } from "./held-orders";
import { ShiftPanel } from "./shift-panel";
import { useOnlineOrders } from "./use-online-orders";

type Panel = "held" | "online" | "shift" | null;

interface ReceiptState {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: { name: string; qty: number; price: number }[];
  paid?: number;
  change?: number;
}

interface Props {
  shiftId: string;
  openingBalance: number;
  qrisImageUrl?: string;
}

export function PosClient({ shiftId, openingBalance, qrisImageUrl }: Props) {
  const [cart, setCart] = useState<Cart>(createCart());
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [variants, setVariants] = useState<Record<string, VariantRow[]>>({});
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [cols, setCols] = useState<GridSetting>(() => {
    if (typeof window === "undefined") return "auto";
    const saved = localStorage.getItem("pos.gridCols");
    if (saved === "3" || saved === "4" || saved === "5") {
      return Number(saved) as GridSetting;
    }
    return "auto";
  });
  const [showSearch, setShowSearch] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pos.showSearch") === "true";
  });
  const [showPrint, setShowPrint] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pos.showPrint") === "true";
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [heldRefresh, setHeldRefresh] = useState(0);
  const online = useOnlineOrders();
  const toast = useToast();
  const dialog = useDialog();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.show("Gagal memuat produk", "error");
        setProducts(data ?? []);
        setProductsLoading(false);
      });
  }, [toast]);

  const cartQty: Record<string, number> = {};
  for (const item of cart) {
    cartQty[item.productId] = (cartQty[item.productId] ?? 0) + item.qty;
  }

  const handleSelectProduct = async (product: ProductRow) => {
    const supabase = createClient();
    const { data: vars } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true);

    if (vars && vars.length > 0) {
      setVariants((prev) => ({ ...prev, [product.id]: vars }));
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

  // Simpan cart sebagai pesanan tersimpan, lalu kosongkan kasir.
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

  // Lanjutkan pesanan tersimpan ke keranjang aktif.
  const handleResume = (saved: Cart) => {
    setCart((prev) => (prev.length === 0 ? saved : [...prev, ...saved]));
  };

  const handleCheckout = async (method: "cash" | "qris", paid: number, change: number) => {
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
      });
      if (result.ok) {
        toast.show("Transaksi berhasil", "success");
        setReceipt({
          ...result.order,
          paid,
          change,
          items: cart.map((item) => ({
            name: item.name,
            qty: item.qty,
            price: item.unitPrice + item.variants.reduce((s, v) => s + v.priceDelta, 0),
          })),
        });
        setCart(createCart());
        setShowPayment(false);
      } else {
        toast.show(result.error, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:h-[calc(100vh-2rem)]">
      {/* Action toolbar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanel("held")}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-brand hover:text-white active:scale-95"
          >
            <Bookmark size={16} />
            <span className="hidden sm:inline">Tersimpan</span>
          </button>
          <button
            onClick={() => setPanel("online")}
            className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-brand hover:text-white active:scale-95"
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Online</span>
            {online.pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-2xs font-bold text-white">
                {online.pendingCount}
              </span>
            )}
          </button>
          <Link
            href="/pos/history"
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-brand hover:text-white active:scale-95"
          >
            <History size={16} />
            <span className="hidden sm:inline">Riwayat</span>
          </Link>
        </div>
        <button
          onClick={() => setPanel("shift")}
          className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 active:scale-95"
        >
          <span className="h-2 w-2 rounded-full bg-success" />
          <Receipt size={16} />
          <span className="hidden sm:inline">Kelola Shift</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1 overflow-y-auto lg:pr-4">
          <ProductGrid
            products={products}
            loading={productsLoading}
            onSelect={handleSelectProduct}
            cols={cols}
            cartQty={cartQty}
            showSearch={showSearch}
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
          />
        </div>

        {/* Cart sidebar: hanya tampil di layar lebar (lg+) */}
        <div className="hidden w-80 flex-col border-l border-hairline pl-4 lg:flex">
          <CartView
            cart={cart}
            onUpdateQty={(i, q) => setCart((prev) => updateQty(prev, i, q))}
            onRemove={(i) => setCart((prev) => removeItem(prev, i))}
            onClear={() => setCart(createCart())}
            onHold={handleHold}
            onPay={() => setShowPayment(true)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Bar keranjang melayang (HP/tablet sempit) */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartSheet(true)}
          className="fixed inset-x-3 bottom-20 z-30 flex items-center justify-between rounded-2xl bg-brand px-4 py-3 text-white shadow-lg active:scale-[0.99] lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={18} />
            {cart.reduce((s, i) => s + i.qty, 0)} item
          </span>
          <span className="font-bold">Rp {cartTotal(cart).toLocaleString("id-ID")}</span>
        </button>
      )}

      {/* Cart sebagai bottom-sheet di HP/tablet sempit */}
      {showCartSheet && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
          onClick={() => setShowCartSheet(false)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-hairline" />
            <CartView
              cart={cart}
              onUpdateQty={(i, q) => setCart((prev) => updateQty(prev, i, q))}
              onRemove={(i) => setCart((prev) => removeItem(prev, i))}
              onClear={() => setCart(createCart())}
              onHold={handleHold}
              onPay={() => {
                setShowCartSheet(false);
                setShowPayment(true);
              }}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {pendingProduct && (
        <VariantPicker
          product={pendingProduct}
          variants={variants[pendingProduct.id] ?? []}
          onConfirm={handleVariantConfirm}
          onCancel={() => setPendingProduct(null)}
        />
      )}

      {showPayment && (
        <PaymentModal
          total={cartTotal(cart)}
          loading={loading}
          qrisImageUrl={qrisImageUrl}
          onConfirm={handleCheckout}
          onClose={() => setShowPayment(false)}
        />
      )}

      {panel === "held" && (
        <SlideOver title="Pesanan Tersimpan" icon={Bookmark} onClose={() => setPanel(null)}>
          <HeldOrders
            refreshKey={heldRefresh}
            onResume={(saved) => {
              handleResume(saved);
              setPanel(null);
            }}
          />
        </SlideOver>
      )}

      {panel === "online" && (
        <SlideOver title="Pesanan Online" icon={Bell} onClose={() => setPanel(null)}>
          <OnlineOrders
            orders={online.orders}
            onConfirm={online.confirm}
            onMarkPaid={online.markPaid}
            onMarkDone={online.markDone}
            onCancel={online.cancel}
          />
        </SlideOver>
      )}

      {panel === "shift" && (
        <ShiftPanel
          shiftId={shiftId}
          openingBalance={openingBalance}
          onClose={() => setPanel(null)}
        />
      )}

      {receipt && (
        <ReceiptModal
          order={receipt}
          items={receipt.items ?? []}
          paid={receipt.paid}
          change={receipt.change}
          showPrint={showPrint}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
