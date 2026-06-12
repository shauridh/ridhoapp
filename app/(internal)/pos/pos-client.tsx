"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Receipt, Bookmark, Bell, History } from "lucide-react"
import type { ProductRow } from "@/lib/data/products"
import type { VariantRow } from "@/lib/data/products"
import { createClient } from "@/lib/supabase/client"
import { createCart, addItem, removeItem, updateQty, cartTotal } from "@/lib/domain/cart"
import type { Cart, CartVariant } from "@/lib/domain/cart"
import type { GridSetting } from "@/lib/domain/grid"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import { SlideOver } from "@/components/ui/slide-over"
import { checkout } from "./actions"
import { holdOrder } from "./held-actions"
import { ProductGrid } from "./product-grid"
import { CartView } from "./cart"
import { VariantPicker } from "./variant-picker"
import { PaymentModal } from "./payment-modal"
import { Receipt as ReceiptModal } from "./receipt"
import { OnlineOrders } from "./online-orders"
import { HeldOrders } from "./held-orders"
import { ShiftPanel } from "./shift-panel"
import { useOnlineOrders } from "./use-online-orders"

type Panel = "held" | "online" | "shift" | null

interface ReceiptState {
  id: string
  total: number
  payment_method: string
  created_at: string
  items: { name: string; qty: number; price: number }[]
  paid?: number
  change?: number
}

interface Props {
  shiftId: string
  openingBalance: number
  qrisImageUrl?: string
}

export function PosClient({ shiftId, openingBalance, qrisImageUrl }: Props) {
  const [cart, setCart] = useState<Cart>(createCart())
  const [products, setProducts] = useState<ProductRow[]>([])
  const [variants, setVariants] = useState<Record<string, VariantRow[]>>({})
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [cols, setCols] = useState<GridSetting>("auto")
  const [showSearch, setShowSearch] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [heldRefresh, setHeldRefresh] = useState(0)
  const online = useOnlineOrders()
  const toast = useToast()
  const dialog = useDialog()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts(data ?? []))
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("pos.gridCols")
    if (saved === "3" || saved === "4" || saved === "5") {
      setCols(Number(saved) as GridSetting)
    } else if (saved === "auto") {
      setCols("auto")
    }
    setShowSearch(localStorage.getItem("pos.showSearch") === "true")
    setShowPrint(localStorage.getItem("pos.showPrint") === "true")
  }, [])

  const cartQty: Record<string, number> = {}
  for (const item of cart) {
    cartQty[item.productId] = (cartQty[item.productId] ?? 0) + item.qty
  }

  const handleSelectProduct = async (product: ProductRow) => {
    const supabase = createClient()
    const { data: vars } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true)

    if (vars && vars.length > 0) {
      setVariants((prev) => ({ ...prev, [product.id]: vars }))
      setPendingProduct(product)
    } else {
      setCart((prev) =>
        addItem(prev, {
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: Number(product.base_price),
          variants: [],
        })
      )
    }
  }

  const handleVariantConfirm = (chosen: CartVariant[]) => {
    if (!pendingProduct) return
    setCart((prev) =>
      addItem(prev, {
        productId: pendingProduct.id,
        name: pendingProduct.name,
        qty: 1,
        unitPrice: Number(pendingProduct.base_price),
        variants: chosen,
      })
    )
    setPendingProduct(null)
  }

  // Simpan cart sebagai pesanan tersimpan, lalu kosongkan kasir.
  const handleHold = async () => {
    if (cart.length === 0) return
    const label = await dialog.prompt(
      "Nama/nomor pesanan (mis. Meja 3 / Budi):",
      "Simpan Pesanan",
    )
    if (label === null) return
    const result = await holdOrder(label, cart)
    if (result.ok) {
      setCart(createCart())
      setHeldRefresh((k) => k + 1)
      toast.show("Pesanan disimpan", "success")
    } else {
      toast.show(result.error, "error")
    }
  }

  // Lanjutkan pesanan tersimpan ke keranjang aktif.
  const handleResume = (saved: Cart) => {
    setCart((prev) => (prev.length === 0 ? saved : [...prev, ...saved]))
  }

  const handleCheckout = async (
    method: "cash" | "qris",
    paid: number,
    change: number,
  ) => {
    if (cart.length === 0) return
    setLoading(true)
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
      })
      if (result.ok) {
        toast.show("Transaksi berhasil", "success")
        setReceipt({
          ...result.order,
          paid,
          change,
          items: cart.map((item) => ({
            name: item.name,
            qty: item.qty,
            price:
              item.unitPrice +
              item.variants.reduce((s, v) => s + v.priceDelta, 0),
          })),
        })
        setCart(createCart())
        setShowPayment(false)
      } else {
        toast.show(result.error, "error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col">
      <div className="mb-2 flex items-center justify-end gap-2">
        <HeaderIcon
          icon={Bookmark}
          label="Tersimpan"
          onClick={() => setPanel("held")}
        />
        <HeaderIcon
          icon={Bell}
          label="Online"
          badge={online.pendingCount}
          onClick={() => setPanel("online")}
        />
        <Link
          href="/pos/history"
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface active:scale-95"
        >
          <History size={18} className="text-brand" />
          <span className="hidden sm:inline">Riwayat</span>
        </Link>
        <button
          onClick={() => setPanel("shift")}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface active:scale-95"
        >
          <span className="flex h-2 w-2 rounded-full bg-success" />
          <Receipt size={18} className="text-brand" />
          <span className="hidden sm:inline">Kelola Shift</span>
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4">
          <ProductGrid
            products={products}
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

        <div className="flex w-80 flex-col border-l border-hairline pl-4">
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
        <SlideOver
          title="Pesanan Tersimpan"
          icon={Bookmark}
          onClose={() => setPanel(null)}
        >
          <HeldOrders
            refreshKey={heldRefresh}
            onResume={(saved) => {
              handleResume(saved)
              setPanel(null)
            }}
          />
        </SlideOver>
      )}

      {panel === "online" && (
        <SlideOver
          title="Pesanan Online"
          icon={Bell}
          onClose={() => setPanel(null)}
        >
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
  )
}

function HeaderIcon({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof Bookmark
  label: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface active:scale-95"
    >
      <Icon size={18} className="text-brand" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
