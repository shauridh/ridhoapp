import {
  getCurrentOpenShift,
  getLastClosedShiftBalance,
} from "@/lib/data/shifts"
import { OpenShiftGate } from "./open-shift-gate"
import { PosClient } from "./pos-client"

export const dynamic = "force-dynamic"

export default async function PosPage() {
  const openShift = await getCurrentOpenShift()

  if (!openShift) {
    const lastBalance = await getLastClosedShiftBalance()
    return <OpenShiftGate lastBalance={lastBalance} />
  }

  return (
    <PosClient
      shiftId={openShift.id}
      openingBalance={Number(openShift.opening_balance)}
    />
  )
}
