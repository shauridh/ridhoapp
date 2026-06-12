import { redirect } from "next/navigation"

// Shift kini terintegrasi di halaman Kasir (/pos). Arahkan ulang bookmark lama.
export default function ShiftPageRedirect() {
  redirect("/pos")
}
