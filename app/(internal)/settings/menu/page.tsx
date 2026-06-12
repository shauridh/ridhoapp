import Link from "next/link"
import { listProducts } from "@/lib/data/products"
import { listCategories } from "@/lib/data/categories"
import { ProductForm } from "./product-form"
import { CategoryManager } from "./category-manager"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { UtensilsCrossed } from "lucide-react"

export default async function MenuPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ])

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
        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-soft">
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-hairline last:border-0 transition hover:bg-surface/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            🍗
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.category || "-"}</td>
                  <td className="px-4 py-3">
                    {p.type === "combo" ? (
                      <Badge tone="accent">Paket</Badge>
                    ) : (
                      <Badge tone="neutral">Satuan</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand">
                    Rp {p.base_price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <Badge tone="success">Aktif</Badge>
                    ) : (
                      <Badge tone="danger">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/settings/menu/${p.id}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      Kelola
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
