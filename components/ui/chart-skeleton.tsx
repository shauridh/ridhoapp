export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm animate-pulse">
      <div className="mb-4 h-4 w-32 bg-gray-200 rounded"></div>
      <div className="space-y-3">
        <div className="h-6 bg-gray-100 rounded"></div>
        <div className="h-6 bg-gray-100 rounded w-5/6"></div>
        <div className="h-6 bg-gray-100 rounded w-4/6"></div>
        <div className="h-6 bg-gray-100 rounded w-3/6"></div>
        <div className="h-6 bg-gray-100 rounded w-5/6"></div>
        <div className="h-6 bg-gray-100 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function ChartEmptyState({
  message = "Tidak ada data untuk ditampilkan",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-ink-soft">{message}</p>
        <p className="mt-1 text-xs text-ink-faint">Coba pilih rentang waktu yang berbeda</p>
      </div>
    </div>
  );
}
