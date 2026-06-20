import { listProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { ProductForm } from "./product-form";
import { CategoryManager } from "./category-manager";
import { MenuGrid } from "./menu-grid";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { UtensilsCrossed } from "lucide-react";

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
        <MenuGrid products={products} categories={categories} />
      )}
    </div>
  );
}
