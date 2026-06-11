import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ShoppingPage from "./page"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/lib/data/inventory", () => ({
  listIngredients: vi.fn(async () => [
    {
      id: "ayam",
      name: "Ayam",
      tracking_type: "ingredient",
      stock_qty: 5,
      unit: "potong",
      purchase_unit: "ekor",
      purchase_unit_qty: 4,
      low_stock_threshold: 2,
      created_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "nasi",
      name: "Nasi matang",
      tracking_type: "finished",
      stock_qty: 10,
      unit: "porsi",
      purchase_unit: "unit",
      purchase_unit_qty: 1,
      low_stock_threshold: 0,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ]),
  usageSince: vi.fn(async () => [{ ingredient_id: "ayam", total_used: 14 }]),
}))

describe("ShoppingPage", () => {
  it("lists weekly purchase suggestions for raw ingredients only", async () => {
    render(await ShoppingPage())

    expect(screen.getByRole("heading", { name: "Saran Belanja (7 hari)" })).toBeInTheDocument()
    expect(screen.getByText("Ayam")).toBeInTheDocument()
    expect(screen.queryByText("Nasi matang")).not.toBeInTheDocument()
    expect(screen.getByText("3 ekor")).toBeInTheDocument()
  })
})
