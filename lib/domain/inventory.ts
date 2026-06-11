export interface RecipeLine {
  ingredientId: string
  qtyUsed: number
}

export interface RecipeVersion {
  id: string
  effectiveFrom: string // ISO date YYYY-MM-DD
  lines: RecipeLine[]
}

export function selectActiveRecipe(
  recipes: RecipeVersion[],
  saleDate: string,
): RecipeVersion | null {
  const eligible = recipes
    .filter((r) => r.effectiveFrom <= saleDate)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))
  return eligible[0] ?? null
}

export interface StockDeduction {
  ingredientId: string
  changeQty: number
}

export function calcStockDeductions(
  recipe: RecipeVersion,
  qtySold: number,
): StockDeduction[] {
  return recipe.lines.map((line) => ({
    ingredientId: line.ingredientId,
    changeQty: -roundQty(line.qtyUsed * qtySold),
  }))
}

function roundQty(n: number): number {
  return Math.round(n * 10000) / 10000
}

export function avgDailyUsage(totalUsed: number, days: number): number {
  if (days <= 0) return 0
  return totalUsed / days
}

export interface ShoppingProjectionInput {
  avgPerDay: number
  daysToCover: number
  currentStock: number
  purchaseUnitQty: number
}

export interface ShoppingProjection {
  neededQty: number
  purchaseUnits: number
}

export function projectShopping(
  input: ShoppingProjectionInput,
): ShoppingProjection {
  const required = input.avgPerDay * input.daysToCover
  const deficit = Math.max(0, required - input.currentStock)
  const purchaseUnits =
    input.purchaseUnitQty > 0 ? Math.ceil(deficit / input.purchaseUnitQty) : 0
  return { neededQty: roundQty(deficit), purchaseUnits }
}
