export interface FilterableProduct {
  id: string;
  name: string;
  category: string;
  base_price?: number;
}

export type SortSetting = "name" | "price_asc" | "price_desc" | "best_seller";

const LAINNYA = "Lainnya";

// Daftar kategori unik dari produk, terurut. Kategori kosong -> "Lainnya" di akhir.
export function extractCategories<T extends FilterableProduct>(products: T[]): string[] {
  const set = new Set<string>();
  let hasEmpty = false;
  for (const p of products) {
    const cat = p.category?.trim();
    if (cat) set.add(cat);
    else hasEmpty = true;
  }
  const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  if (hasEmpty) sorted.push(LAINNYA);
  return sorted;
}

// Filter produk berdasar query nama (case-insensitive) dan kategori.
// category null/"" berarti semua kategori.
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  query: string,
  category: string | null
): T[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    const cat = p.category?.trim() || LAINNYA;
    if (category && cat !== category) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Urutkan produk berdasar SortSetting.
// bestSellerIds: array product_id diurutkan dari paling laku (untuk mode best_seller)
export function sortProducts<T extends FilterableProduct>(
  products: T[],
  sort: SortSetting,
  bestSellerIds: string[] = []
): T[] {
  const arr = [...products];
  switch (sort) {
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name, "id"));
    case "price_asc":
      return arr.sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0));
    case "price_desc":
      return arr.sort((a, b) => (b.base_price ?? 0) - (a.base_price ?? 0));
    case "best_seller": {
      const rank = new Map(bestSellerIds.map((id, i) => [id, i]));
      return arr.sort((a, b) => {
        const ra = rank.get(a.id) ?? Infinity;
        const rb = rank.get(b.id) ?? Infinity;
        if (ra !== rb) return ra - rb;
        // fallback: nama untuk produk yang belum pernah terjual
        return a.name.localeCompare(b.name, "id");
      });
    }
    default:
      return arr;
  }
}
