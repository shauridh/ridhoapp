"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OnlinePlatform } from "./use-online-orders";

type OnlineStatus = "confirmed" | "paid" | "done" | "cancelled";

async function setStatus(orderId: string, status: OnlineStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase
    .from("online_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pos");
  return { ok: true as const };
}

export async function confirmOnlineOrder(orderId: string) {
  return setStatus(orderId, "confirmed");
}

export async function markOnlinePaid(orderId: string) {
  return setStatus(orderId, "paid");
}

export async function markOnlineDone(orderId: string) {
  return setStatus(orderId, "done");
}

export async function cancelOnlineOrder(orderId: string) {
  return setStatus(orderId, "cancelled");
}

// Tambah order manual dari platform ojol (GoFood, GrabFood, ShopeeFood)
export async function addManualOnlineOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const nama = String(formData.get("nama") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const alamat = String(formData.get("alamat") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();
  const platform = String(formData.get("platform") ?? "manual") as OnlinePlatform;
  const totalRaw = Number(formData.get("total") ?? 0);
  const itemsRaw = String(formData.get("items") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      // Format: "Nama Produk x2" atau "Nama Produk"
      const match = line.match(/^(.+?)\s*[xX](\d+)\s*$/);
      if (match) return { name: match[1].trim(), qty: Number(match[2]), harga: 0 };
      return { name: line, qty: 1, harga: 0 };
    });

  if (!nama) return { ok: false as const, error: "Nama pelanggan wajib diisi" };
  if (itemsRaw.length === 0) return { ok: false as const, error: "Item pesanan wajib diisi" };

  const { error } = await supabase.from("online_orders").insert({
    nama,
    phone: phone || "-",
    alamat: alamat || null,
    catatan: catatan || null,
    items: itemsRaw,
    subtotal: totalRaw,
    ongkir: 0,
    total: totalRaw,
    status: "pending",
    platform,
    confirm_token: crypto.randomUUID(),
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pos");
  return { ok: true as const };
}
