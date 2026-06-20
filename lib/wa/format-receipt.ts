// Pure formatter untuk pesan struk WhatsApp.
// Tidak ada side effect — mudah ditest dan direuse.

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  orderId: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paid?: number;
  change?: number;
}

const SEPARATOR = "\u2500".repeat(22);

/** Format angka ke Rupiah tanpa simbol, contoh: 15.000 */
function rp(n: number): string {
  return n.toLocaleString("id-ID");
}

/** Format tanggal ke string lokal Indonesia */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Menghasilkan pesan struk plain-text yang WA-friendly.
 * Bold ditulis dengan *asterisk* sesuai format WA.
 */
export function formatReceiptMessage(data: ReceiptData): string {
  const lines: string[] = [];

  // Header toko
  lines.push(`*${data.storeName.toUpperCase()}*`);
  if (data.storeAddress) lines.push(data.storeAddress);
  if (data.storePhone) lines.push(`Telp: ${data.storePhone}`);
  lines.push(SEPARATOR);

  // Item-item
  for (const item of data.items) {
    const subtotal = rp(item.price * item.qty);
    const label = `${item.name} x${item.qty}`;
    lines.push(`${label}  Rp ${subtotal}`);
  }
  lines.push(SEPARATOR);

  // Total & pembayaran
  lines.push(`*TOTAL: Rp ${rp(data.total)}*`);

  if (data.paymentMethod === "cash" && typeof data.paid === "number") {
    lines.push(`Tunai  : Rp ${rp(data.paid)}`);
    lines.push(`Kembali: Rp ${rp(data.change ?? 0)}`);
  }

  lines.push(`Metode : ${data.paymentMethod.toUpperCase()}`);
  lines.push(`Tgl    : ${formatDate(data.createdAt)}`);
  lines.push(SEPARATOR);

  // Footer
  lines.push("Terima kasih! \uD83D\uDE4F");

  return lines.join("\n");
}
