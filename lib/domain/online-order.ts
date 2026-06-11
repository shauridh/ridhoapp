export interface OnlineCartItem {
  name: string
  qty: number
  harga: number
}

export interface OrderTotal {
  subtotal: number
  total: number
}

export function calcOrderTotal(
  items: OnlineCartItem[],
  ongkir: number,
): OrderTotal {
  const subtotal = items.reduce((sum, i) => sum + i.harga * i.qty, 0)
  return { subtotal, total: subtotal + ongkir }
}
