export interface ShiftReportData {
  storeName: string;
  closedAt: string; // ISO
  omzet: number;
  transaksi: number;
  item: number;
  tunai: number;
  qris: number;
  transfer: number;
  gojek: number;
  grab: number;
  shopee: number;
  lainnya: number;
  kasAwal: number;
  kasAkhir: number;
  cashOut: number;
  ownerWithdrawal: number;
  selisih: number;
  sisaLaci: number;
  // Cashflow bisnis hari ini
  cfPemasukan: number;
  cfOpex: number;
  cfCapex: number;
  cfWithdrawal: number;
  saldoRil: number;
  cfEntries: Array<{
    direction: "in" | "out";
    kind: string;
    amount: number;
    note: string;
  }>;
  topSellers: { name: string; qty: number }[];
}

function rupiah(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${tgl}, ${jam}`;
}

function selisihLabel(selisih: number): string {
  if (selisih === 0) return `${rupiah(0)} (cocok)`;
  if (selisih > 0) return `${rupiah(selisih)} (lebih)`;
  return `${rupiah(Math.abs(selisih))} (kurang)`;
}

// Menyusun teks rekap shift untuk dikirim via WhatsApp.
export function formatShiftReport(data: ShiftReportData): string {
  const lines: string[] = [];

  lines.push(`*REKAP SHIFT - ${data.storeName}*`);
  lines.push(formatTanggal(data.closedAt));
  lines.push("");
  lines.push(`Omzet      : ${rupiah(data.omzet)}`);
  lines.push(`Transaksi  : ${data.transaksi}`);
  lines.push(`Item       : ${data.item}`);
  lines.push("");
  lines.push("-- Pembayaran --");
  lines.push(`Tunai      : ${rupiah(data.tunai)}`);
  lines.push(`QRIS       : ${rupiah(data.qris)}`);
  if (data.transfer > 0) lines.push(`Transfer   : ${rupiah(data.transfer)}`);
  if (data.gojek > 0) lines.push(`GoFood     : ${rupiah(data.gojek)}`);
  if (data.grab > 0) lines.push(`GrabFood   : ${rupiah(data.grab)}`);
  if (data.shopee > 0) lines.push(`ShopeeFood : ${rupiah(data.shopee)}`);
  if (data.lainnya > 0) lines.push(`Lainnya    : ${rupiah(data.lainnya)}`);
  lines.push("");
  lines.push("-- Kas Laci --");
  lines.push(`Kas Awal   : ${rupiah(data.kasAwal)}`);
  lines.push(`Kas Akhir  : ${rupiah(data.kasAkhir)}`);
  if (data.cashOut > 0) lines.push(`Cash Out   : ${rupiah(data.cashOut)}`);
  lines.push(`Ambil Owner: ${rupiah(data.ownerWithdrawal)}`);
  lines.push(`Selisih    : ${selisihLabel(data.selisih)}`);
  lines.push(`Sisa Laci  : ${rupiah(data.sisaLaci)}`);
  if (data.cfPemasukan > 0 || data.cfOpex > 0 || data.cfCapex > 0 || data.cfWithdrawal > 0) {
    lines.push("");
    lines.push("-- Cashflow Bisnis --");
    if (data.cfPemasukan > 0) lines.push(`Pemasukan  : ${rupiah(data.cfPemasukan)}`);
    if (data.cfOpex > 0) lines.push(`Pengeluaran: ${rupiah(data.cfOpex)}`);
    if (data.cfCapex > 0) lines.push(`Blj Modal  : ${rupiah(data.cfCapex)}`);
    if (data.cfWithdrawal > 0) lines.push(`Tarik Owner: ${rupiah(data.cfWithdrawal)}`);
    // Detail entries
    const details = data.cfEntries.filter((e) => e.note);
    if (details.length > 0) {
      lines.push("");
      lines.push("Detail:");
      for (const e of details) {
        const sign = e.direction === "in" ? "+" : "-";
        lines.push(`${sign} ${e.note}: ${rupiah(e.amount)}`);
      }
    }
    lines.push(`Saldo Ril  : ${rupiah(data.saldoRil)}`);
  }
  lines.push("");
  lines.push("-- Terlaris --");
  lines.push(formatTopSellers(data.topSellers));

  return lines.join("\n");
}

function formatTopSellers(topSellers: { name: string; qty: number }[]): string {
  if (topSellers.length === 0) return "Belum ada penjualan";
  return topSellers.map((s, i) => `${i + 1}. ${s.name} x${s.qty}`).join("\n");
}

// Template default memakai placeholder yang sama dengan formatShiftReport.
export const DEFAULT_SHIFT_TEMPLATE = `*REKAP SHIFT - {toko}*
{tanggal}

Omzet      : {omzet}
Transaksi  : {transaksi}
Item       : {item}

-- Pembayaran --
Tunai      : {tunai}
QRIS       : {qris}
Transfer   : {transfer}
GoFood     : {gojek}
GrabFood   : {grab}
ShopeeFood : {shopee}
Lainnya    : {lainnya}

-- Kas Laci --
Kas Awal   : {kasAwal}
Kas Akhir  : {kasAkhir}
Cash Out   : {cashOut}
Ambil Owner: {ownerWithdrawal}
Selisih    : {selisih}
Sisa Laci  : {sisaLaci}

-- Cashflow Bisnis --
Pemasukan  : {cfPemasukan}
Pengeluaran: {cfOpex}
Blj Modal  : {cfCapex}
Tarik Owner: {cfWithdrawal}
Saldo Ril  : {saldoRil}

-- Terlaris --
{terlaris}`;

// Render template pesan WA dengan placeholder {nama}.
// Placeholder tak dikenal dibiarkan apa adanya.
export function renderShiftTemplate(template: string, data: ShiftReportData): string {
  const map: Record<string, string> = {
    toko: data.storeName,
    tanggal: formatTanggal(data.closedAt),
    omzet: rupiah(data.omzet),
    transaksi: String(data.transaksi),
    item: String(data.item),
    tunai: rupiah(data.tunai),
    qris: rupiah(data.qris),
    transfer: rupiah(data.transfer),
    gojek: rupiah(data.gojek),
    grab: rupiah(data.grab),
    shopee: rupiah(data.shopee),
    lainnya: rupiah(data.lainnya),
    kasAwal: rupiah(data.kasAwal),
    kasAkhir: rupiah(data.kasAkhir),
    cashOut: rupiah(data.cashOut),
    ownerWithdrawal: rupiah(data.ownerWithdrawal),
    selisih: selisihLabel(data.selisih),
    sisaLaci: rupiah(data.sisaLaci),
    cfPemasukan: rupiah(data.cfPemasukan),
    cfOpex: rupiah(data.cfOpex),
    cfCapex: rupiah(data.cfCapex),
    cfWithdrawal: rupiah(data.cfWithdrawal),
    saldoRil: rupiah(data.saldoRil),
    terlaris: formatTopSellers(data.topSellers),
  };
  return template.replace(/\{(\w+)\}/g, (whole, key) => (key in map ? map[key] : whole));
}
