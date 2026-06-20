// Konfigurasi dashboard: visibility, urutan, dan label widget.
// Disimpan per-perangkat di localStorage.

export type WidgetId = "hourly" | "top_products" | "daily" | "category" | "payment_method";

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  visible: boolean;
}

const DEFAULTS: WidgetConfig[] = [
  { id: "hourly", title: "Omzet per Jam", visible: true },
  { id: "top_products", title: "Produk Terlaris", visible: true },
  { id: "daily", title: "Tren Omzet Harian", visible: true },
  { id: "category", title: "Omzet per Kategori", visible: true },
  { id: "payment_method", title: "Metode Pembayaran", visible: true },
];

const STORAGE_KEY = "dashboard.widgets";

export function loadDashboardConfig(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved: WidgetConfig[] = JSON.parse(raw);
    // Merge: tambahkan widget baru dari DEFAULTS kalau belum ada
    const ids = new Set(saved.map((w) => w.id));
    const merged = [...saved, ...DEFAULTS.filter((d) => !ids.has(d.id))];
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export function saveDashboardConfig(config: WidgetConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getDefaultTitle(id: WidgetId): string {
  return DEFAULTS.find((d) => d.id === id)?.title ?? id;
}
