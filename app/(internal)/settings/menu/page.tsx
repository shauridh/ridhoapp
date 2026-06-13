import { listProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { ProductForm } from "./product-form";
import { ProductRowActions } from "./product-row-actions";
import { CategoryManager } from "./category-manager";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { UtensilsCrossed } from "lucide-react";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default async function MenuPage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kelola Menu"
        actions={
          <>
            <CategoryManager categories={categories} />
            <ProductForm categories={categories} />
          </>
        }
      />

      {products.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-soft">
            <UtensilsCrossed size={26} />
          </div>
          <p className="font-medium text-ink">Belum ada produk</p>
          <p className="text-sm text-ink-soft">
            Tambahkan produk pertama lewat tombol Tambah Produk.
          </p>
        </Card>
      ) : (
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
    </div>
  );
}
