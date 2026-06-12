export interface ShiftReportData {
  storeName: string
  closedAt: string // ISO
  omzet: number
  transaksi: number
  item: number
  tunai: number
  qris: number
  kasAwal: number
  kasAkhir: number
  selisih: number
  topSellers: { name: string; qty: number }[]
}

function rupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`
}

function formatTanggal(iso: string): string {
  const d = new Date(iso)
  const tgl = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${tgl}, ${jam}`
}

function selisihLabel(selisih: number): string {
  if (selisih === 0) return `${rupiah(0)} (cocok)`
  if (selisih > 0) return `${rupiah(selisih)} (lebih)`
  return `${rupiah(Math.abs(selisih))} (kurang)`
}

// Menyusun teks rekap shift untuk dikirim via WhatsApp.
export function formatShiftReport(data: ShiftReportData): string {
  const lines: string[] = []

  lines.push(`*REKAP SHIFT - ${data.storeName}*`)
  lines.push(formatTanggal(data.closedAt))
  lines.push("")
  lines.push(`Omzet      : ${rupiah(data.omzet)}`)
  lines.push(`Transaksi  : ${data.transaksi}`)
  lines.push(`Item       : ${data.item}`)
  lines.push("")
  lines.push("-- Pembayaran --")
  lines.push(`Tunai      : ${rupiah(data.tunai)}`)
  lines.push(`QRIS       : ${rupiah(data.qris)}`)
  lines.push("")
  lines.push("-- Kas Laci --")
  lines.push(`Kas Awal   : ${rupiah(data.kasAwal)}`)
  lines.push(`Kas Akhir  : ${rupiah(data.kasAkhir)}`)
  lines.push(`Selisih    : ${selisihLabel(data.selisih)}`)
  lines.push("")
  lines.push("-- Terlaris --")
  if (data.topSellers.length === 0) {
    lines.push("Belum ada penjualan")
  } else {
    data.topSellers.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.name} x${s.qty}`)
    })
  }

  return lines.join("\n")
}
