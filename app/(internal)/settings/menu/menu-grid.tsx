"use client";

import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gridStyle } from "@/lib/domain/grid";
import type { ProductRow } from "@/lib/data/products";
import type { CategoryRow } from "@/lib/data/categories";
import { ProductRowActions } from "./product-row-actions";

type ViewMode = "list" | "grid";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

interface Props {
  products: ProductRow[];
  categories: CategoryRow[];
}

export function MenuGrid({ products, categories }: Props) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("settings.menuView") as ViewMode) ?? "grid";
  });

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("settings.menuView", v);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar: jumlah produk + toggle tampilan */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{products.length} produk</p>
        <div className="flex items-center gap-1 rounded-lg border border-hairline bg-white p-1">
          <button
            onClick={() => handleViewChange("list")}
            title="Tampilan daftar"
            aria-label="Tampilan daftar"
            className={`rounded p-1.5 transition ${
              view === "list" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => handleViewChange("grid")}
            title="Tampilan grid kecil"
            aria-label="Tampilan grid kecil"
            className={`rounded p-1.5 transition ${
              view === "grid" ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* List view — card besar dengan detail lengkap */}
      {view === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-[4/3] bg-surface">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">🍗</div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">{p.name}</h3>
                    <p className="text-sm text-ink-soft">{p.category || "Tanpa kategori"}</p>
                  </div>
                  <ProductRowActions product={p} categories={categories} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={p.type === "combo" ? "accent" : "neutral"}>
                    {p.type === "combo" ? "Paket" : "Satuan"}
                  </Badge>
                  <Badge tone={p.is_active ? "success" : "danger"}>
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-hairline pt-3">
                  <span className="text-sm text-ink-soft">Harga</span>
                  <span className="font-bold text-brand">{rupiah(p.base_price)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Grid view — card kecil mirip tampilan kasir */}
      {view === "grid" && (
        <div className="grid gap-3" style={gridStyle("auto")}>
          {products.map((p) => (
            <div
              key={p.id}
              className="relative overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm"
            >
              {/* Badge status */}
              {!p.is_active && (
                <span className="absolute left-2 top-2 z-10 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Nonaktif
                </span>
              )}

              {/* Gambar */}
              <div className="aspect-square bg-surface">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🍗</div>
                )}
              </div>

              {/* Info + action icons di bawah harga */}
              <div className="p-2">
                <div className="truncate text-center text-sm font-bold text-ink">{p.name}</div>
                <div className="text-center text-sm font-bold text-brand">
                  {rupiah(p.base_price)}
                </div>
                <div
                  className="mt-1.5 flex justify-center border-t border-hairline pt-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProductRowActions product={p} categories={categories} compact />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
