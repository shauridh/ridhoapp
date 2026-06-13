import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, listVariants } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { getLatestRecipe } from "@/lib/data/recipes";
import { listIngredients } from "@/lib/data/inventory";
import { ProductForm } from "../product-form";
import { VariantForm } from "./variant-form";
import { VariantRowActions } from "./variant-row-actions";
import { RecipeEditor } from "./recipe-editor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const variants = await listVariants(id);
  const recipe = await getLatestRecipe(id);
  const ingredients = await listIngredients();
  const categories = await listCategories();

  return (
    <div className="space-y-4">
      <Link href="/settings/menu" className="text-sm text-brand">
        &larr; Kembali ke menu
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{product.name}</h1>
          <p className="text-sm text-ink-soft">
            {product.category} &middot; {product.type === "combo" ? "Paket" : "Satuan"} &middot; Rp{" "}
            {product.base_price.toLocaleString("id-ID")}
          </p>
        </div>
        <ProductForm categories={categories} product={product} />
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold text-ink">Varian & Topping</h2>
        <VariantForm productId={id} />
        <ul className="divide-y divide-hairline rounded-lg border border-hairline">
          {variants.map((v) => (
            <li key={v.id} className="flex items-center justify-between px-3 py-2 text-sm text-ink">
              <span className="flex items-center gap-2">
                {v.name}
                <Badge tone="neutral">{v.type}</Badge>
                {v.is_required && <span className="text-ink-soft">wajib</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-ink">Rp {v.price_delta.toLocaleString("id-ID")}</span>
                {!v.is_active && <Badge tone="danger">nonaktif</Badge>}
                <VariantRowActions productId={id} variant={v} />
              </span>
            </li>
          ))}
          {variants.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-soft">Belum ada varian.</li>
          )}
        </ul>
      </Card>

      <Card>
        <RecipeEditor
          productId={id}
          ingredients={ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
          }))}
          lines={recipe?.lines ?? []}
          effectiveFrom={recipe?.effective_from ?? null}
        />
      </Card>
    </div>
  );
}
