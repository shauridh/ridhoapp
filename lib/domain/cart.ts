export interface CartVariant {
  variantId: string
  name: string
  priceDelta: number
}

export interface CartItem {
  productId: string
  name: string
  qty: number
  unitPrice: number
  variants: CartVariant[]
}

export type Cart = CartItem[]

export function createCart(): Cart {
  return []
}

export function addItem(cart: Cart, item: CartItem): Cart {
  const key = cart.findIndex(
    (c) =>
      c.productId === item.productId &&
      JSON.stringify(c.variants) === JSON.stringify(item.variants),
  )
  if (key >= 0) {
    const updated = [...cart]
    updated[key] = { ...updated[key], qty: updated[key].qty + item.qty }
    return updated
  }
  return [...cart, item]
}

export function removeItem(cart: Cart, index: number): Cart {
  return cart.filter((_, i) => i !== index)
}

export function updateQty(cart: Cart, index: number, qty: number): Cart {
  if (qty <= 0) return removeItem(cart, index)
  const updated = [...cart]
  updated[index] = { ...updated[index], qty }
  return updated
}

export function cartTotal(cart: Cart): number {
  return cart.reduce(
    (sum, item) =>
      sum +
      (item.unitPrice +
        item.variants.reduce((s, v) => s + v.priceDelta, 0)) *
        item.qty,
    0,
  )
}
