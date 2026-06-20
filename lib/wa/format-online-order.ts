// Formatter pesan WA untuk order online.
// Dua format: notif ke owner (lengkap) dan konfirmasi ke pelanggan (ringkas).

const SEP = "─".repeat(22);
const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export interface OnlineOrderNotifData {
  storeName: string;
  orderId: string;
  nama: string;
  phone: string;
  alamat?: string | null;
  catatan?: string | null;
  items: { name: string; qty: number; harga?: number }[];
  subtotal?: number;
  ongkir?: number;
  total: number;
  createdAt: string;
}

/**
 * Notif ke OWNER saat order baru masuk.
 * Berisi semua detail agar kasir bisa langsung proses.
 */
export function formatNewOrderOwnerNotif(data: OnlineOrderNotifData): string {
  const lines: string[] = [];

  lines.push(`🔔 *ORDER BARU — ${data.storeName.toUpperCase()}*`);
  lines.push(SEP);
  lines.push(`👤 *${data.nama}*`);
  lines.push(`📱 ${data.phone}`);
  if (data.alamat) lines.push(`📍 ${data.alamat}`);
  lines.push(SEP);

  for (const item of data.items) {
    const sub = item.harga ? `  ${rp(item.harga * item.qty)}` : "";
    lines.push(`• ${item.name} ×${item.qty}${sub}`);
  }
  lines.push(SEP);

  if (data.subtotal !== undefined && data.ongkir) {
    lines.push(`Subtotal : ${rp(data.subtotal)}`);
    lines.push(`Ongkir   : ${rp(data.ongkir)}`);
  }
  lines.push(`*TOTAL   : ${rp(data.total)}*`);

  if (data.catatan) lines.push(`\n📝 Catatan: ${data.catatan}`);

  const tgl = new Date(data.createdAt).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  lines.push(`\n🕒 ${tgl}`);

  return lines.join("\n");
}

/**
 * Konfirmasi ke PELANGGAN saat order dikonfirmasi kasir.
 */
export function formatOrderConfirmedCustomer(
  data: Pick<OnlineOrderNotifData, "storeName" | "nama" | "items" | "total">,
  estimasiMenit = 30
): string {
  const lines: string[] = [];

  lines.push(`✅ *Pesanan Dikonfirmasi!*`);
  lines.push(
    `Halo ${data.nama.split(" ")[0]}, pesananmu di *${data.storeName}* sudah kami konfirmasi.`
  );
  lines.push(SEP);

  for (const item of data.items) {
    lines.push(`• ${item.name} ×${item.qty}`);
  }
  lines.push(SEP);
  lines.push(`*Total: ${rp(data.total)}*`);
  lines.push(`\n⏱ Estimasi siap: *${estimasiMenit} menit*`);
  lines.push(`\nTerima kasih sudah memesan! 🙏`);

  return lines.join("\n");
}

/**
 * Notif ke PELANGGAN saat order selesai / siap diambil.
 */
export function formatOrderDoneCustomer(
  data: Pick<OnlineOrderNotifData, "storeName" | "nama" | "total">
): string {
  const lines: string[] = [];

  lines.push(`🍽️ *Pesanan Siap!*`);
  lines.push(`Halo ${data.nama.split(" ")[0]}, pesananmu di *${data.storeName}* sudah siap.`);
  lines.push(`\nTotal: *${rp(data.total)}*`);
  lines.push(`\nSilakan diambil atau tunggu kurir kami. Terima kasih! 🙏`);

  return lines.join("\n");
}
