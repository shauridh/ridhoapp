import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/lib/domain/auth"

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">POS Fried Chicken</span>
        <nav className="flex gap-4 text-sm">
          <a href="/pos" className="hover:underline">
            Kasir
          </a>
          <a href="/settings/menu" className="hover:underline">
            Menu
          </a>
          <a href="/inventory" className="hover:underline">
            Stok
          </a>
          <a href="/pos/shift" className="hover:underline">
            Shift
          </a>
        </nav>
        <form action={logout}>
          <button className="text-sm text-gray-600 underline">Keluar</button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
