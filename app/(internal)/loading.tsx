export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-ink-soft">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-brand" />
        <span className="text-sm">Memuat...</span>
      </div>
    </div>
  )
}
