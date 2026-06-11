import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { ToastProvider } from "@/components/ui/toast"
import { DialogProvider } from "@/components/ui/dialog"

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
    <ToastProvider>
      <DialogProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden p-4 pb-20 md:pb-4">{children}</main>
          <BottomNav />
        </div>
      </DialogProvider>
    </ToastProvider>
  )
}
