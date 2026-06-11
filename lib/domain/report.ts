export interface SaleLine {
  name: string
  qty: number
  subtotal: number
  hour: number
}

// Omzet per jam (24 slot, index = jam 0-23).
export function aggregateByHour(lines: SaleLine[]): number[] {
  const hours = new Array(24).fill(0)
  for (const line of lines) {
    if (line.hour >= 0 && line.hour < 24) {
      hours[line.hour] += line.subtotal
    }
  }
  return hours
}

export interface SellerStat {
  name: string
  qty: number
  omzet: number
}

// Produk terlaris berdasar qty, urut menurun, dibatasi limit.
export function topSellers(lines: SaleLine[], limit: number): SellerStat[] {
  const map = new Map<string, SellerStat>()
  for (const line of lines) {
    const cur = map.get(line.name) ?? { name: line.name, qty: 0, omzet: 0 }
    cur.qty += line.qty
    cur.omzet += line.subtotal
    map.set(line.name, cur)
  }
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}
