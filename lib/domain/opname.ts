export function calcOpnameDelta(systemQty: number, physicalQty: number): number {
  return physicalQty - systemQty
}

export interface BulkIngredientRow {
  name: string
  unit: string
  purchaseUnit: string
  purchaseUnitQty: number
  lowStockThreshold: number
}

// Parse CSV sederhana: nama,satuan_pakai,satuan_beli,isi_per_satuan_beli,batas_menipis
export function parseBulkIngredients(input: string): BulkIngredientRow[] {
  const rows: BulkIngredientRow[] = []
  for (const rawLine of input.split("\n")) {
    const line = rawLine.trim()
    if (line.length === 0) continue

    const cols = line.split(",").map((c) => c.trim())
    const name = cols[0] ?? ""
    if (name.length === 0) continue

    rows.push({
      name,
      unit: cols[1] ?? "",
      purchaseUnit: cols[2] ?? "",
      purchaseUnitQty: cols[3] ? Number(cols[3]) || 1 : 1,
      lowStockThreshold: cols[4] ? Number(cols[4]) || 0 : 0,
    })
  }
  return rows
}
