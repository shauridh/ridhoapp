import { login } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Masuk Kasir</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-black px-3 py-2 text-white"
        >
          Masuk
        </button>
      </form>
    </main>
  )
}
