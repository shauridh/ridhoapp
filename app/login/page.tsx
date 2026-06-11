import { login } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-sm"
      >
        <div className="text-center">
          <div className="text-3xl">🍗</div>
          <h1 className="mt-1 text-xl font-bold text-ink">Sabana POS</h1>
          <p className="text-sm text-ink-soft">Masuk untuk mulai berjualan</p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-lg border border-hairline px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          className="min-h-[48px] w-full rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark"
        >
          Masuk
        </button>
      </form>
    </main>
  )
}
