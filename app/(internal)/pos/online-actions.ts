"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type OnlineStatus = "confirmed" | "paid" | "done" | "cancelled"

async function setStatus(orderId: string, status: OnlineStatus) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { error } = await supabase
    .from("online_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/pos")
  return { ok: true as const }
}

export async function confirmOnlineOrder(orderId: string) {
  return setStatus(orderId, "confirmed")
}

export async function markOnlinePaid(orderId: string) {
  return setStatus(orderId, "paid")
}

export async function markOnlineDone(orderId: string) {
  return setStatus(orderId, "done")
}

export async function cancelOnlineOrder(orderId: string) {
  return setStatus(orderId, "cancelled")
}
