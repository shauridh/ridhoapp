"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Bookmark, Bell } from "lucide-react";
import type { GridSetting } from "@/lib/domain/grid";
import type { SortSetting } from "@/lib/domain/product-filter";
import { cartTotal } from "@/lib/domain/cart";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { SlideOver } from "@/components/ui/slide-over";
import { ProductGrid } from "./product-grid";
import { CartView } from "./cart";
import { VariantPicker } from "./variant-picker";
import { PaymentModal } from "./payment-modal";
import { Receipt as ReceiptModal } from "./receipt";
import { OnlineOrders } from "./online-orders";
import { HeldOrders } from "./held-orders";
import { ShiftPanel } from "./shift-panel";
import { useOnlineOrders } from "./use-online-orders";
import { useProducts } from "./hooks/use-products";
import { useCart } from "./hooks/use-cart";

type Panel = "held" | "online" | "shift" | null;
type PaymentMethod = string;

interface Props {
  shiftId: string;
  openingBalance: number;
  qrisImageUrl?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  enableDiscount?: boolean;
  enableReprint?: boolean;
  enableTableNumber?: boolean;
  categoryOrder?: string[];
}

interface PaymentOption {
  id: string;
  name: string;
  is_active: boolean;
  is_offline: boolean;
  sort_order: number;
}

export function PosClient({
  shiftId,
  openingBalance,
  qrisImageUrl,
  storeName,
  storeAddress,
  storePhone,
  receiptFooter,
  enableDiscount = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enableReprint = true,
  enableTableNumber = false,
  categoryOrder = [],
}: Props) {
  // ── Display preferences (persisted per device) ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cols, _setCols] = useState<GridSetting>(() => {
    if (typeof window === "undefined") return "auto";
    const saved = localStorage.getItem("pos.gridCols");
    if (saved === "3" || saved === "4" || saved === "5") return Number(saved) as GridSetting;
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
  const [sort, setSort] = useState<SortSetting>(() => {
    if (typeof window === "undefined") return "name";
    const saved = localStorage.getItem("pos.sort");
    if (
      saved === "name" ||
      saved === "price_asc" ||
      saved === "price_desc" ||
      saved === "best_seller"
    )
      return saved;
    return "name";
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleTogglePrint = () => {
    setShowPrint((prev) => {
      const next = !prev;
      localStorage.setItem("pos.showPrint", String(next));
      return next;
    });
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleToggleSearch = () => {
    setShowSearch((prev) => {
      const next = !prev;
      localStorage.setItem("pos.showSearch", String(next));
      return next;
    });
  };
  const handleSortChange = (s: SortSetting) => {
    setSort(s);
    localStorage.setItem("pos.sort", s);
  };

  // ── UI state ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [panel, setPanel] = useState<Panel>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search).get("panel") as Panel;
    if (p === "held" || p === "online" || p === "shift") return p;
    return null;
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_heldCount, setHeldCount] = useState(0);

  // ── External state listeners ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const p = (e as CustomEvent<string>).detail as Panel;
      if (p === "held" || p === "online" || p === "shift") setPanel(p);
    };
    window.addEventListener("pos:open-panel", handler);
    return () => window.removeEventListener("pos:open-panel", handler);
  }, []);

  useEffect(() => {
    const onSearch = (e: Event) => setShowSearch((e as CustomEvent<boolean>).detail);
    const onPrint = (e: Event) => setShowPrint((e as CustomEvent<boolean>).detail);
    window.addEventListener("pos:toggle-search", onSearch);
    window.addEventListener("pos:toggle-print", onPrint);
    return () => {
      window.removeEventListener("pos:toggle-search", onSearch);
      window.removeEventListener("pos:toggle-print", onPrint);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toast = useToast();

  useEffect(() => {
    const supabase = createClient();
    const loadCount = () => {
      supabase
        .from("held_orders")
        .select("id", { count: "exact", head: true })
        .then(({ count }: { count: number | null }) => setHeldCount(count ?? 0));
    };
    loadCount();
    const channel = supabase
      .channel("held-orders-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, loadCount)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [offlinePaymentOptions, setOfflinePaymentOptions] = useState<PaymentOption[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("payment_options")
      .select("*")
      .eq("is_offline", true)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setOfflinePaymentOptions(data ?? []));
  }, []);

  // ── Custom hooks ──────────────────────────────────────────────────────────
  const {
    products,
    loading: productsLoading,
    variants,
    bestSellerIds,
    outOfStockIds,
  } = useProducts();
  const online = useOnlineOrders();
  const {
    cart,
    cartQty,
    pendingProduct,
    setPendingProduct,
    loading,
    receipt,
    setReceipt,
    heldRefresh,
    handleSelectProduct,
    handleVariantConfirm,
    handleHold,
    handleResume,
    handleCheckout,
    updateQty,
    removeItem,
    clearCart,
  } = useCart({ storeName, storeAddress, storePhone, receiptFooter }, variants);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-2rem)]">
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
            sort={sort}
            onSortChange={handleSortChange}
            bestSellerIds={bestSellerIds}
            outOfStockIds={outOfStockIds}
            categoryOrder={categoryOrder}
          />
        </div>

        <div className="hidden w-80 flex-col border-l border-hairline pl-4 lg:flex">
          <CartView
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onClear={clearCart}
            onHold={handleHold}
            onPay={() => setShowPayment(true)}
            disabled={loading}
          />
        </div>
      </div>

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
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onClear={clearCart}
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
          onConfirm={(method: PaymentMethod, paid: number, change: number, phone?: string) => {
            handleCheckout(method, paid, change, phone);
            setShowPayment(false);
          }}
          onClose={() => setShowPayment(false)}
          enableDiscount={enableDiscount}
          enableTableNumber={enableTableNumber}
          offlinePaymentOptions={offlinePaymentOptions}
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
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          orderNumber={receipt.order_number}
          customerPhone={receipt.customerPhone}
          receiptFooter={receiptFooter}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
