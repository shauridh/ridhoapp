"use client"

interface ReceiptOrder {
  id: string
  total: number
  payment_method: string
  created_at: string
}

interface ReceiptItem {
  name: string
  qty: number
  price: number
}

interface Props {
  order: ReceiptOrder
  items: ReceiptItem[]
  onClose: () => void
}

export function Receipt({ order, items, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-72 rounded-xl bg-white p-4 shadow-lg text-sm">
        <h3 className="text-center font-bold">Struk Pembelian</h3>
        <p className="text-center text-xs text-gray-500">
          {new Date(order.created_at).toLocaleString("id-ID")}
        </p>
        <hr className="my-2" />
        {items.map((item, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span>
              {item.name} x{item.qty}
            </span>
            <span>
              Rp {(item.price * item.qty).toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        <hr className="my-2" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>Rp {order.total.toLocaleString("id-ID")}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Pembayaran: {order.payment_method.toUpperCase()}
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg bg-black py-1.5 text-white text-sm"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
