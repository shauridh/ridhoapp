export interface FilterableProduct {
  id: string
  name: string
  category: string
}

const LAINNYA = "Lainnya"

// Daftar kategori unik dari produk, terurut. Kategori kosong -> "Lainnya" di akhir.
export function extractCategories<T extends FilterableProduct>(
  products: T[],
): string[] {
  const set = new Set<string>()
  let hasEmpty = false
  for (const p of products) {
    const cat = p.category?.trim()
    if (cat) set.add(cat)
    else hasEmpty = true
  }
  const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, "id"))
  if (hasEmpty) sorted.push(LAINNYA)
  return sorted
}

// Filter produk berdasar query nama (case-insensitive) dan kategori.
// category null/"" berarti semua kategori.
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  query: string,
  category: string | null,
): T[] {
  const q = query.trim().toLowerCase()
  return products.filter((p) => {
    const cat = p.category?.trim() || LAINNYA
    if (category && cat !== category) return false
    if (q && !p.name.toLowerCase().includes(q)) return false
    return true
  })
}
