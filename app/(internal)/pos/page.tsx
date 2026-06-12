import {
  getCurrentOpenShift,
  getLastClosedShiftBalance,
} from "@/lib/data/shifts"
import { createClient } from "@/lib/supabase/server"
import { OpenShiftGate } from "./open-shift-gate"
import { PosClient } from "./pos-client"

export const dynamic = "force-dynamic"

export default async function PosPage() {
  const openShift = await getCurrentOpenShift()

  if (!openShift) {
    const lastBalance = await getLastClosedShiftBalance()
    return <OpenShiftGate lastBalance={lastBalance} />
  }

  const supabase = await createClient()
  const { data: qrisRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "qris_image")
    .maybeSingle()

  return (
    <PosClient
      shiftId={openShift.id}
      openingBalance={Number(openShift.opening_balance)}
      qrisImageUrl={qrisRow?.value || undefined}
    />
  )
}
