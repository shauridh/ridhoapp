import { notFound } from "next/navigation"
import Link from "next/link"
import { getProduct, listVariants } from "@/lib/data/products"
import { VariantForm } from "./variant-form"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const variants = await listVariants(id)

  return (
    <div className="space-y-4">
      <Link href="/settings/menu" className="text-sm text-brand">
        &larr; Kembali ke menu
      </Link>
      <h1 className="text-xl font-bold text-ink">{product.name}</h1>
      <p className="text-sm text-ink-soft">
        {product.category} &middot;{" "}
        {product.type === "combo" ? "Paket" : "Satuan"} &middot; Rp{" "}
        {product.base_price.toLocaleString("id-ID")}
      </p>

      <Card className="space-y-3">
        <h2 className="font-semibold text-ink">Varian & Topping</h2>
        <VariantForm productId={id} />
        <ul className="divide-y divide-hairline rounded-lg border border-hairline">
          {variants.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between px-3 py-2 text-sm text-ink"
            >
              <span className="flex items-center gap-2">
                {v.name}
                <Badge tone="neutral">{v.type}</Badge>
                {v.is_required && (
                  <span className="text-ink-soft">wajib</span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-ink">
                  Rp {v.price_delta.toLocaleString("id-ID")}
                </span>
                {!v.is_active && <Badge tone="danger">nonaktif</Badge>}
              </span>
            </li>
          ))}
          {variants.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-soft">
              Belum ada varian.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
