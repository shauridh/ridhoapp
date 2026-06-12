import { createClient } from "@/lib/supabase/server"
import type { WidgetRow } from "@/lib/domain/dashboard-widgets"

export type { ChartType, WidgetRow } from "@/lib/domain/dashboard-widgets"
export { METRICS } from "@/lib/domain/dashboard-widgets"

export async function listDashboardWidgets(): Promise<WidgetRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
