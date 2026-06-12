"use client"

import { useEffect, useState } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  paid?: number
  change?: number
  showPrint?: boolean
  onClose: () => void
}

const AUTO_CLOSE_SECONDS = 10

export function Receipt({
  order,
  items,
  paid,
  change,
  showPrint = false,
  onClose,
}: Props) {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS)

  // Auto-close setelah hitung mundur. Reset jika komponen dilepas.
  useEffect(() => {
    if (countdown <= 0) {
      onClose()
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-72 rounded-2xl bg-white p-4 text-sm shadow-lg">
        <div className="receipt-print">
          <h3 className="text-center font-bold text-ink">Sabana Fried Chicken</h3>
          <p className="text-center text-xs text-ink-soft">
            {new Date(order.created_at).toLocaleString("id-ID")}
          </p>
          <hr className="my-2 border-hairline" />
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5 text-ink">
              <span>
                {item.name} x{item.qty}
              </span>
              <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
            </div>
          ))}
          <hr className="my-2 border-hairline" />
          <div className="flex justify-between font-bold text-ink">
            <span>Total</span>
            <span>Rp {order.total.toLocaleString("id-ID")}</span>
          </div>
          {typeof paid === "number" && order.payment_method === "cash" && (
            <>
              <div className="flex justify-between text-ink-soft">
                <span>Tunai</span>
                <span>Rp {paid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Kembalian</span>
                <span>Rp {(change ?? 0).toLocaleString("id-ID")}</span>
              </div>
            </>
          )}
          <div className="mt-1 text-xs text-ink-soft">
            Pembayaran: {order.payment_method.toUpperCase()}
          </div>
          <p className="mt-2 text-center text-xs text-ink-soft">
            Terima kasih 🙏
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          {showPrint && (
            <Button
              variant="ghost"
              icon={Printer}
              onClick={() => window.print()}
              className="flex-1"
            >
              Cetak
            </Button>
          )}
          <Button variant="primary" onClick={onClose} className="flex-1">
            Tutup ({countdown})
          </Button>
        </div>
      </div>
    </div>
  )
}
