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
  kasRilOwner: number; // closing_balance setelah owner_withdrawal (sisa di laci)
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
  lines.push(`Kas Owner  : ${rupiah(data.kasRilOwner)}`);
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
Kas Owner  : {kasRilOwner}

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
    kasRilOwner: rupiah(data.kasRilOwner),
    terlaris: formatTopSellers(data.topSellers),
  };
  return template.replace(/\{(\w+)\}/g, (whole, key) => (key in map ? map[key] : whole));
}
