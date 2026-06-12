import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface Props {
  title: string
  children: React.ReactNode
}

export function SettingsSection({ title, children }: Props) {
  return (
    <div className="space-y-4 p-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Kembali ke Pengaturan
      </Link>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {children}
    </div>
  )
}
