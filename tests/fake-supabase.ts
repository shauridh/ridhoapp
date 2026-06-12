/* eslint-disable @typescript-eslint/no-explicit-any */
// Fake Supabase client in-memory untuk integration test server actions.
// Mendukung subset query-builder yang dipakai app: from().select().eq().maybeSingle()/single(),
// insert().select().single(), update().eq(), delete().eq(), serta auth.getUser().
// Tujuannya menguji LOGIKA alur (stok berkurang, kas terhitung), bukan SQL Postgres asli.

type Row = Record<string, any>

let idCounter = 1
function genId() {
  return `id-${idCounter++}`
}

class QueryBuilder<T extends Row = Row> {
  private filters: { col: string; val: any }[] = []
  private op: "select" | "insert" | "update" | "delete" = "select"
  private payload: Row | Row[] | null = null
  private wantSelect = false

  constructor(
    private db: Record<string, Row[]>,
    private table: string,
  ) {}

  select(_cols?: string) {
    if (this.op === "select") this.op = "select"
    this.wantSelect = true
    return this
  }

  insert(payload: Row | Row[]) {
    this.op = "insert"
    this.payload = payload
    this.wantSelect = false
    return this
  }

  update(payload: Row) {
    this.op = "update"
    this.payload = payload
    return this
  }

  delete() {
    this.op = "delete"
    return this
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val })
    return this
  }

  order() {
    return this
  }
  limit() {
    return this
  }
  in(col: string, vals: any[]) {
    this.filters.push({ col, val: { __in: vals } })
    return this
  }

  private match(row: Row) {
    return this.filters.every((f) => {
      if (f.val && typeof f.val === "object" && "__in" in f.val) {
        return f.val.__in.includes(row[f.col])
      }
      return row[f.col] === f.val
    })
  }

  private run(): { data: any; error: any } {
    const tableRows = (this.db[this.table] ??= [])

    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!]
      const inserted = items.map((it) => {
        const row = { id: it.id ?? genId(), ...it }
        tableRows.push(row)
        return row
      })
      return { data: this.wantSelect ? inserted : null, error: null }
    }

    if (this.op === "update") {
      const updated: Row[] = []
      for (const row of tableRows) {
        if (this.match(row)) {
          Object.assign(row, this.payload)
          updated.push(row)
        }
      }
      return { data: this.wantSelect ? updated : null, error: null }
    }

    if (this.op === "delete") {
      const kept = tableRows.filter((r) => !this.match(r))
      this.db[this.table] = kept
      return { data: null, error: null }
    }

    // select
    const matched = tableRows.filter((r) => this.match(r))
    return { data: matched, error: null }
  }

  maybeSingle() {
    const { data, error } = this.run()
    const arr = Array.isArray(data) ? data : data ? [data] : []
    return Promise.resolve({ data: arr[0] ?? null, error })
  }

  single() {
    const { data, error } = this.run()
    const arr = Array.isArray(data) ? data : data ? [data] : []
    if (arr.length === 0) {
      return Promise.resolve({
        data: null,
        error: { message: "No rows" },
      })
    }
    return Promise.resolve({ data: arr[0], error })
  }

  // thenable: untuk query tanpa single()/maybeSingle()
  then(resolve: (v: { data: any; error: any }) => void) {
    const { data, error } = this.run()
    resolve({ data, error })
  }
}

export interface FakeDbSeed {
  [table: string]: Row[]
}

export function createFakeSupabase(
  seed: FakeDbSeed = {},
  user: { id: string } | null = { id: "user-1" },
) {
  const db: Record<string, Row[]> = {}
  for (const [table, rows] of Object.entries(seed)) {
    db[table] = rows.map((r) => ({ ...r }))
  }

  return {
    __db: db, // akses untuk assertion di test
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from(table: string) {
      return new QueryBuilder(db, table)
    },
    rpc() {
      return Promise.resolve({ data: null, error: null })
    },
  }
}
