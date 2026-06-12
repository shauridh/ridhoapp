// Tipe & konstanta yang aman dipakai di client maupun server.
export type ChartType = "stat" | "line" | "bar" | "donut" | "radar" | "rank"

export interface WidgetRow {
  id: string
  title: string
  chart_type: ChartType
  metric: string
  x: number
  y: number
  w: number
  h: number
  sort_order: number
}

// Daftar metrik yang tersedia untuk dijadikan widget.
// `kinds` membatasi chart_type yang masuk akal untuk metrik tsb.
export const METRICS: Record<string, { label: string; kinds: ChartType[] }> = {
  omzet: { label: "Omzet", kinds: ["stat"] },
  transaksi: { label: "Jumlah Transaksi", kinds: ["stat"] },
  rata_transaksi: { label: "Rata-rata per Transaksi", kinds: ["stat"] },
  item_terjual: { label: "Item Terjual", kinds: ["stat"] },
  penjualan_harian: { label: "Penjualan Harian (7 hari)", kinds: ["line", "bar"] },
  penjualan_per_jam: { label: "Penjualan per Jam", kinds: ["bar", "line"] },
  metode_bayar: { label: "Metode Pembayaran", kinds: ["donut", "rank"] },
  omzet_kategori: { label: "Omzet per Kategori", kinds: ["rank", "bar", "donut"] },
  produk_terlaris: { label: "Produk Terlaris", kinds: ["radar", "rank", "bar"] },
}
