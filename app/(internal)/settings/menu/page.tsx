import Link from "next/link"
import { listProducts } from "@/lib/data/products"
import { ProductForm } from "./product-form"

export default async function MenuPage() {
  const products = await listProducts()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Kelola Menu</h1>
      <ProductForm />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Kategori</th>
            <th>Tipe</th>
            <th className="text-right">Harga</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td>{p.category}</td>
              <td>{p.type === "combo" ? "Paket" : "Satuan"}</td>
              <td className="text-right">
                Rp {p.base_price.toLocaleString("id-ID")}
              </td>
              <td>{p.is_active ? "Aktif" : "Nonaktif"}</td>
              <td className="text-right">
                <Link
                  href={`/settings/menu/${p.id}`}
                  className="text-blue-600 underline"
                >
                  Kelola
                </Link>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                Belum ada produk.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
