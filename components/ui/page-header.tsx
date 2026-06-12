import { type ReactNode } from "react"

interface PageHeaderProps {
  title: string
  // aksi di kanan (tombol, dll)
  actions?: ReactNode
}

// Header halaman konsisten: judul + area aksi. Selalu wrap di layar sempit.
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
