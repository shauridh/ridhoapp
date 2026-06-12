"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import {
  confirmOnlineOrder,
  markOnlinePaid,
  markOnlineDone,
  cancelOnlineOrder,
} from "./online-actions"

export interface OnlineOrder {
  id: string
  nama: string
  phone: string
  alamat: string | null
  items: { name: string; qty: number; harga: number }[]
  catatan: string | null
  total: number
  status: string
  location_url: string | null
  created_at: string
}

// Mengelola data pesanan online + realtime + aksi. Dipakai always-mounted di
// kasir agar badge tetap hidup walau panel tertutup.
export function useOnlineOrders() {
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const toast = useToast()

  const load = useCallback(() => {
    const supabase = createClient()
    supabase
      .from("online_orders")
      .select("*")
      .in("status", ["pending", "confirmed", "paid"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as OnlineOrder[]) ?? []))
  }, [])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel("online_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_orders" },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const act = useCallback(
    async (
      fn: () => Promise<{ ok: boolean; error?: string }>,
      okMsg: string,
    ) => {
      const result = await fn()
      if (result.ok) {
        toast.show(okMsg, "success")
        load()
      } else {
        toast.show(result.error ?? "Gagal", "error")
      }
    },
    [load, toast],
  )

  const pendingCount = orders.filter((o) => o.status === "pending").length

  return {
    orders,
    pendingCount,
    confirm: (id: string) => act(() => confirmOnlineOrder(id), "Dikonfirmasi"),
    markPaid: (id: string) => act(() => markOnlinePaid(id), "Ditandai lunas"),
    markDone: (id: string) => act(() => markOnlineDone(id), "Selesai"),
    cancel: (id: string) => act(() => cancelOnlineOrder(id), "Dibatalkan"),
  }
}
