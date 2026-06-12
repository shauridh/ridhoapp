// Satuan umum untuk bahan baku.
// Dipisah jadi "satuan pakai" (dipakai di resep) dan "satuan beli" (dari supplier).
export const USAGE_UNITS = [
  "pcs",
  "potong",
  "porsi",
  "buah",
  "biji",
  "lembar",
  "ikat",
  "papan",
  "kg",
  "gram",
  "ons",
  "liter",
  "ml",
  "sdm",
  "sdt",
] as const

export const PURCHASE_UNITS = [
  "kantung",
  "sak",
  "karung",
  "pack",
  "dus",
  "krat",
  "botol",
  "jerigen",
  "galon",
  "ekor",
  "ikat",
  "kg",
  "liter",
] as const

export type UsageUnit = (typeof USAGE_UNITS)[number]
export type PurchaseUnit = (typeof PURCHASE_UNITS)[number]
