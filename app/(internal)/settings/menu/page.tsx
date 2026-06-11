import Link from "next/link"
import { listProducts } from "@/lib/data/products"
import { ProductForm } from "./product-form"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function MenuPage() {
  const products = await listProducts()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Kelola Menu</h1>
      <ProductForm />
      <Card className="p-0 overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Tipe</th>
              <th className="px-3 py-2 text-right">Harga</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-hairline text-ink">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.category}</td>
                <td className="px-3 py-2">
                  {p.type === "combo" ? (
                    <Badge tone="accent">Paket</Badge>
                  ) : (
                    <Badge tone="neutral">Satuan</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-bold text-brand">
                  Rp {p.base_price.toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-2">
                  {p.is_active ? (
                    <Badge tone="success">Aktif</Badge>
                  ) : (
                    <Badge tone="danger">Nonaktif</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/settings/menu/${p.id}`}
                    className="text-brand"
                  >
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-ink-soft">
                  Belum ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
