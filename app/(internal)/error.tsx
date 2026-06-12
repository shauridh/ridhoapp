"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tint-red text-danger">
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-lg font-bold text-ink">Terjadi kesalahan</h2>
        <p className="text-sm text-ink-soft">
          {error.message || "Gagal memuat halaman. Coba muat ulang."}
        </p>
        <Button variant="primary" onClick={reset}>
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
