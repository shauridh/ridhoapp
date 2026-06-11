export type ProductType = "single" | "combo"

export interface ProductInput {
  name: string
  type: ProductType
  basePrice: number
  category: string
}

export type ValidationResult = { ok: true } | { ok: false; error: string }

export function validateProductInput(input: ProductInput): ValidationResult {
  if (input.name.trim().length === 0) {
    return { ok: false, error: "Nama produk wajib diisi" }
  }
  if (input.basePrice < 0) {
    return { ok: false, error: "Harga tidak boleh negatif" }
  }
  return { ok: true }
}

export function calcLinePrice(basePrice: number, variantDeltas: number[]): number {
  return variantDeltas.reduce((sum, delta) => sum + delta, basePrice)
}
