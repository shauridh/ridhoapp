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

export interface DatedSale {
  date: string // YYYY-MM-DD
  total: number
}

export interface DayTotal {
  date: string
  total: number
}

// Omzet per hari untuk rentang [start, end] inklusif (tanggal kosong diisi 0).
export function aggregateByDay(
  sales: DatedSale[],
  start: string,
  end: string,
): DayTotal[] {
  const sums = new Map<string, number>()
  for (const s of sales) {
    sums.set(s.date, (sums.get(s.date) ?? 0) + s.total)
  }

  const result: DayTotal[] = []
  const cur = new Date(start + "T00:00:00Z")
  const last = new Date(end + "T00:00:00Z")
  while (cur <= last) {
    const key = cur.toISOString().slice(0, 10)
    result.push({ date: key, total: sums.get(key) ?? 0 })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return result
}

export interface CategoryLine {
  category: string
  subtotal: number
}

export interface CategoryStat {
  category: string
  omzet: number
}

// Omzet per kategori, urut menurun. Kategori kosong -> "Lainnya".
export function aggregateByCategory(lines: CategoryLine[]): CategoryStat[] {
  const map = new Map<string, number>()
  for (const line of lines) {
    const cat = line.category?.trim() || "Lainnya"
    map.set(cat, (map.get(cat) ?? 0) + line.subtotal)
  }
  return Array.from(map.entries())
    .map(([category, omzet]) => ({ category, omzet }))
    .sort((a, b) => b.omzet - a.omzet)
}

export interface PeriodComparison {
  diff: number
  percent: number
  direction: "up" | "down" | "flat"
}

// Bandingkan nilai periode ini vs sebelumnya. Persen dibulatkan.
export function comparePeriod(
  current: number,
  previous: number,
): PeriodComparison {
  const diff = current - previous
  let percent: number
  if (previous === 0) {
    percent = current === 0 ? 0 : 100
  } else {
    percent = Math.round((diff / previous) * 100)
  }
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat"
  return { diff, percent, direction }
}
