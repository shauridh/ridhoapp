"use client"

import { useState, useEffect } from "react"
import type { ProductRow } from "@/lib/data/products"
import type { VariantRow } from "@/lib/data/products"
import { createClient } from "@/lib/supabase/client"
import { createCart, addItem, removeItem, updateQty, cartTotal } from "@/lib/domain/cart"
import type { Cart, CartVariant } from "@/lib/domain/cart"
import { checkout } from "./actions"
import { ProductGrid } from "./product-grid"
import { CartView } from "./cart"
import { VariantPicker } from "./variant-picker"
import { Receipt } from "./receipt"

export default function PosPage() {
  const [cart, setCart] = useState<Cart>(createCart())
  const [products, setProducts] = useState<ProductRow[]>([])
  const [variants, setVariants] = useState<Record<string, VariantRow[]>>({})
  const [pendingProduct, setPendingProduct] = useState<ProductRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts(data ?? []))
  }, [])

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

  const handleCheckout = async (method: "cash" | "qris") => {
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
        setReceipt({
          ...result.order,
          items: cart.map((item) => ({
            name: item.name,
            qty: item.qty,
            price:
              item.unitPrice +
              item.variants.reduce((s, v) => s + v.priceDelta, 0),
          })),
        })
        setCart(createCart())
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-52px)] gap-4">
      <div className="flex-1 overflow-y-auto pr-4">
        <ProductGrid products={products} onSelect={handleSelectProduct} />
      </div>

      <div className="w-80 border-l pl-4">
        <CartView
          cart={cart}
          onUpdateQty={(i, q) => setCart((prev) => updateQty(prev, i, q))}
          onRemove={(i) => setCart((prev) => removeItem(prev, i))}
          onCheckout={handleCheckout}
          disabled={loading}
        />
      </div>

      {pendingProduct && (
        <VariantPicker
          product={pendingProduct}
          variants={variants[pendingProduct.id] ?? []}
          onConfirm={handleVariantConfirm}
          onCancel={() => setPendingProduct(null)}
        />
      )}

      {receipt && (
        <Receipt
          order={receipt}
          items={receipt.items ?? []}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  )
}
