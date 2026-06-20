"use client";

import { useState, useMemo } from "react";
import { rupiah } from "@/lib/format";
import {
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import { submitOnlineOrder } from "./actions";
import { calcOrderTotal, type OnlineCartItem } from "@/lib/domain/online-order";

interface PublicProduct {
  id: string;
  name: string;
  category: string;
  base_price: number;
  image_url: string | null;
}

interface Props {
  products: PublicProduct[];
  storeName: string;
  ongkir: number;
}

// Step indicator
const STEPS = ["Menu", "Data", "Konfirmasi"] as const;
type Step = (typeof STEPS)[number];

// Kelompokkan produk per kategori
function groupByCategory(products: PublicProduct[]): [string, PublicProduct[]][] {
  const map = new Map<string, PublicProduct[]>();
  for (const p of products) {
    const cat = p.category?.trim() || "Lainnya";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) =>
    a === "Lainnya" ? 1 : b === "Lainnya" ? -1 : a.localeCompare(b, "id")
  );
}

export function OrderClient({ products, storeName, ongkir }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    // Buka semua kategori secara default
    const cats = new Set(products.map((p) => p.category?.trim() || "Lainnya"));
    return cats;
  });
  const [step, setStep] = useState<Step>("Menu");
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupByCategory(products), [products]);

  const items: OnlineCartItem[] = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ name: p.name, qty: cart[p.id], harga: p.base_price }));

  const submitItems = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, qty: cart[p.id] }));

  const { subtotal, total } = calcOrderTotal(items, ongkir);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  const setQty = (id: string, delta: number) =>
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      return { ...prev, [id]: next };
    });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocationUrl(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`);
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitOnlineOrder({
        nama,
        phone,
        alamat,
        catatan,
        items: submitItems,
        locationUrl,
      });
      if (result.ok) setDone(true);
      else setError(result.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tint-green">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Pesanan Terkirim!</h1>
        <p className="mt-2 max-w-xs text-ink-soft">
          Terima kasih {nama ? nama.split(" ")[0] : ""}! Pesananmu sudah kami terima dan akan segera
          diproses. Kami akan menghubungi via WhatsApp.
        </p>
        <button
          onClick={() => {
            setDone(false);
            setCart({});
            setStep("Menu");
            setNama("");
            setPhone("");
            setAlamat("");
            setCatatan("");
          }}
          className="mt-6 rounded-xl border border-hairline px-6 py-2 text-sm font-semibold text-ink-soft"
        >
          Pesan Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header sticky */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-center text-base font-bold text-ink">{storeName}</h1>

          {/* Step tabs */}
          <div className="mt-2 flex">
            {STEPS.map((s, i) => {
              const idx = STEPS.indexOf(step);
              const done = i < idx;
              const active = s === step;
              return (
                <button
                  key={s}
                  onClick={() => {
                    if (done || active) setStep(s);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-brand text-brand"
                      : done
                        ? "border-success text-success"
                        : "border-transparent text-ink-soft"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      active
                        ? "bg-brand text-white"
                        : done
                          ? "bg-success text-white"
                          : "bg-hairline text-ink-soft"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-4">
        {/* ─── Step 1: Menu ─── */}
        {step === "Menu" && (
          <div className="space-y-3">
            {products.length === 0 && (
              <p className="py-8 text-center text-ink-soft">Menu belum tersedia.</p>
            )}

            {grouped.map(([cat, catProducts]) => {
              const isOpen = openCategories.has(cat);
              const catItemCount = catProducts.reduce((s, p) => s + (cart[p.id] ?? 0), 0);
              return (
                <div
                  key={cat}
                  className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center justify-between px-4 py-3"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{cat}</span>
                      {catItemCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                          {catItemCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-soft">
                      <span>{catProducts.length} menu</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Product list */}
                  {isOpen && (
                    <div className="divide-y divide-hairline border-t border-hairline">
                      {catProducts.map((p) => {
                        const qty = cart[p.id] ?? 0;
                        return (
                          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface">
                              {p.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl">
                                  🍗
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-semibold text-ink">{p.name}</p>
                              <p className="text-sm font-bold text-brand">{rupiah(p.base_price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => setQty(p.id, -1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline active:scale-90"
                                    aria-label="Kurangi"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-6 text-center font-bold text-ink">{qty}</span>
                                  <button
                                    onClick={() => setQty(p.id, 1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white active:scale-90"
                                    aria-label="Tambah"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setQty(p.id, 1)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand text-brand active:scale-90"
                                  aria-label="Tambah"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Step 2: Data Pemesan ─── */}
        {step === "Data" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-ink">Data Pemesan</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-soft">Nama *</label>
                  <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="mis. Budi Santoso"
                    className="w-full rounded-xl border border-hairline px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-soft">
                    No. WhatsApp *
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-xl border border-hairline px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-soft">
                    Alamat Pengiriman
                    <span className="ml-1 text-xs text-ink-faint">
                      (kosongkan jika ambil sendiri)
                    </span>
                  </label>
                  <textarea
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="mis. Jl. Merdeka No. 12, RT 3/RW 4"
                    rows={3}
                    className="w-full rounded-xl border border-hairline px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-soft">
                    Catatan
                    <span className="ml-1 text-xs text-ink-faint">(opsional)</span>
                  </label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="mis. pedas level 2, tanpa bawang"
                    rows={2}
                    className="w-full rounded-xl border border-hairline px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <button
                  onClick={captureLocation}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                    locationUrl
                      ? "border-success bg-tint-green text-success"
                      : "border-hairline text-ink-soft hover:bg-surface"
                  }`}
                >
                  <MapPin size={16} />
                  {locationUrl ? "Lokasi GPS tersimpan ✓" : "Bagikan lokasi GPS"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Konfirmasi ─── */}
        {step === "Konfirmasi" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-ink">Ringkasan Pesanan</h2>
              <ul className="divide-y divide-hairline">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">
                      {item.name} <span className="text-ink-soft">×{item.qty}</span>
                    </span>
                    <span className="font-semibold text-ink">{rupiah(item.harga * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-dashed border-hairline pt-3">
                <div className="flex justify-between text-sm text-ink-soft">
                  <span>Subtotal</span>
                  <span>{rupiah(subtotal)}</span>
                </div>
                {ongkir > 0 && (
                  <div className="flex justify-between text-sm text-ink-soft">
                    <span>Ongkir</span>
                    <span>{rupiah(ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-ink">
                  <span>Total</span>
                  <span className="text-brand">{rupiah(total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-semibold text-ink">Data Pemesan</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 text-ink-soft">Nama</dt>
                  <dd className="text-ink">{nama || "-"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 text-ink-soft">WhatsApp</dt>
                  <dd className="text-ink">{phone || "-"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 text-ink-soft">Alamat</dt>
                  <dd className="flex-1 text-ink">{alamat || "Ambil sendiri"}</dd>
                </div>
                {catatan && (
                  <div className="flex gap-2">
                    <dt className="w-24 text-ink-soft">Catatan</dt>
                    <dd className="flex-1 text-ink">{catatan}</dd>
                  </div>
                )}
                {locationUrl && (
                  <div className="flex gap-2">
                    <dt className="w-24 text-ink-soft">GPS</dt>
                    <dd className="text-success">Tersimpan ✓</dd>
                  </div>
                )}
              </dl>
              <button onClick={() => setStep("Data")} className="mt-2 text-xs text-brand underline">
                Ubah data
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-tint-red px-4 py-3 text-sm text-danger">{error}</div>
            )}
          </div>
        )}
      </main>

      {/* ─── Bottom action bar ─── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-3 shadow-lg">
        <div className="mx-auto max-w-lg space-y-2">
          {/* Mini cart summary */}
          {totalItems > 0 && step === "Menu" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{totalItems} item dipilih</span>
              <span className="font-bold text-brand">{rupiah(total)}</span>
            </div>
          )}

          {step === "Konfirmasi" && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Total</span>
              <span className="font-bold text-brand">{rupiah(total)}</span>
            </div>
          )}

          {step === "Menu" && (
            <button
              onClick={() => setStep("Data")}
              disabled={items.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
            >
              <ShoppingBag size={18} />
              Lanjut ke Data Pemesan ({totalItems} item)
            </button>
          )}

          {step === "Data" && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep("Menu")}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-hairline"
              >
                ←
              </button>
              <button
                onClick={() => {
                  if (!nama.trim() || !phone.trim()) {
                    setError("Nama dan nomor WhatsApp wajib diisi");
                    return;
                  }
                  setError(null);
                  setStep("Konfirmasi");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white active:scale-[0.98]"
              >
                Lanjut ke Konfirmasi →
              </button>
            </div>
          )}

          {step === "Konfirmasi" && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep("Data")}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-hairline"
              >
                ←
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
              >
                <ShoppingBag size={18} />
                {submitting ? "Mengirim..." : "Kirim Pesanan"}
              </button>
            </div>
          )}

          {error && step !== "Konfirmasi" && (
            <p className="text-center text-xs text-danger">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
