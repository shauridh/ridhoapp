import Link from "next/link";
import { Store, Globe, MessageCircle, Monitor, ChevronRight, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  {
    href: "/settings/toko",
    icon: Store,
    title: "Toko",
    desc: "Nama toko, ongkir",
  },
  {
    href: "/settings/online",
    icon: Globe,
    title: "Pesanan Online & QRIS",
    desc: "Aktifkan order online, string QRIS statis",
  },
  {
    href: "/settings/whatsapp",
    icon: MessageCircle,
    title: "WhatsApp & Rekap",
    desc: "Nomor owner, toggle rekap, template pesan",
  },
  {
    href: "/settings/tampilan",
    icon: Monitor,
    title: "Tampilan Kasir",
    desc: "Jumlah kolom produk, pencarian, cetak struk (per-perangkat)",
  },
  {
    href: "/settings/kasir",
    icon: ShoppingCart,
    title: "Fitur Kasir",
    desc: "Diskon, nomor meja, metode bayar tambahan, cetak ulang",
  },
];

export default function SettingsHub() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-ink">Pengaturan</h1>
      <p className="text-sm text-ink-soft">Pilih kategori pengaturan yang mau diubah.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card interactive className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-soft">{s.desc}</p>
                </div>
                <ChevronRight size={20} className="text-ink-soft" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
