import { notFound } from "next/navigation"
import Link from "next/link"
import { getProduct, listVariants } from "@/lib/data/products"
import { VariantForm } from "./variant-form"

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
      <Link href="/settings/menu" className="text-sm text-blue-600 underline">
        &larr; Kembali ke menu
      </Link>
      <h1 className="text-lg font-semibold">{product.name}</h1>
      <p className="text-sm text-gray-600">
        {product.category} &middot;{" "}
        {product.type === "combo" ? "Paket" : "Satuan"} &middot; Rp{" "}
        {product.base_price.toLocaleString("id-ID")}
      </p>

      <section className="space-y-2">
        <h2 className="font-medium">Varian & Topping</h2>
        <VariantForm productId={id} />
        <ul className="divide-y rounded-lg border">
          {variants.map((v) => (
            <li key={v.id} className="flex justify-between px-3 py-2 text-sm">
              <span>
                {v.name}{" "}
                <span className="text-gray-500">
                  ({v.type}
                  {v.is_required ? ", wajib" : ""})
                </span>
              </span>
              <span>
                Rp {v.price_delta.toLocaleString("id-ID")}{" "}
                {!v.is_active && (
                  <span className="text-red-500">(nonaktif)</span>
                )}
              </span>
            </li>
          ))}
          {variants.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">
              Belum ada varian.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
