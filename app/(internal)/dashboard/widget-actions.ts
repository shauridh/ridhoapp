"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ChartType } from "@/lib/domain/dashboard-widgets"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function addWidget(input: {
  title: string
  chartType: ChartType
  metric: string
}) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  // Default ukuran: stat kecil, chart lebih besar.
  const isStat = input.chartType === "stat"
  const { data: last } = await supabase
    .from("dashboard_widgets")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("dashboard_widgets").insert({
    title: input.title.trim(),
    chart_type: input.chartType,
    metric: input.metric,
    x: 0,
    y: 9999, // taruh di bawah, biar grid auto-compact
    w: isStat ? 3 : 6,
    h: isStat ? 2 : 5,
    sort_order: nextOrder,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/dashboard")
  return { ok: true as const }
}

export async function deleteWidget(id: string) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  const { error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/dashboard")
  return { ok: true as const }
}

// Simpan posisi & ukuran semua widget (dari react-grid-layout).
export async function saveLayout(
  layout: { id: string; x: number; y: number; w: number; h: number }[],
) {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  for (const l of layout) {
    await supabase
      .from("dashboard_widgets")
      .update({ x: l.x, y: l.y, w: l.w, h: l.h })
      .eq("id", l.id)
  }
  revalidatePath("/dashboard")
  return { ok: true as const }
}
