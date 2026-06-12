/* eslint-disable @typescript-eslint/no-explicit-any */
// Fake Supabase client in-memory untuk integration test server actions.
// Mendukung subset query-builder yang dipakai app: from().select().eq().maybeSingle()/single(),
// insert().select().single(), update().eq(), delete().eq(), serta auth.getUser().
// Tujuannya menguji LOGIKA alur (stok berkurang, kas terhitung), bukan SQL Postgres asli.

type Row = Record<string, any>;

let idCounter = 1;
function genId() {
  return `id-${idCounter++}`;
}

class QueryBuilder<T extends Row = Row> {
  private filters: { col: string; val: any }[] = [];
  private op: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private wantSelect = false;

  constructor(
    private db: Record<string, Row[]>,
    private table: string
  ) {}

  select(_cols?: string) {
    if (this.op === "select") this.op = "select";
    this.wantSelect = true;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    this.wantSelect = false;
    return this;
  }

  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order() {
    return this;
  }
  limit() {
    return this;
  }
  in(col: string, vals: any[]) {
    this.filters.push({ col, val: { __in: vals } });
    return this;
  }

  private match(row: Row) {
    return this.filters.every((f) => {
      if (f.val && typeof f.val === "object" && "__in" in f.val) {
        return f.val.__in.includes(row[f.col]);
      }
      return row[f.col] === f.val;
    });
  }

  private run(): { data: any; error: any } {
    const tableRows = (this.db[this.table] ??= []);

    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const inserted = items.map((it) => {
        const row = { id: it.id ?? genId(), ...it };
        tableRows.push(row);
        return row;
      });
      return { data: this.wantSelect ? inserted : null, error: null };
    }

    if (this.op === "update") {
      const updated: Row[] = [];
      for (const row of tableRows) {
        if (this.match(row)) {
          Object.assign(row, this.payload);
          updated.push(row);
        }
      }
      return { data: this.wantSelect ? updated : null, error: null };
    }

    if (this.op === "delete") {
      const kept = tableRows.filter((r) => !this.match(r));
      this.db[this.table] = kept;
      return { data: null, error: null };
    }

    // select
    const matched = tableRows.filter((r) => this.match(r));
    return { data: matched, error: null };
  }

  maybeSingle() {
    const { data, error } = this.run();
    const arr = Array.isArray(data) ? data : data ? [data] : [];
    return Promise.resolve({ data: arr[0] ?? null, error });
  }

  single() {
    const { data, error } = this.run();
    const arr = Array.isArray(data) ? data : data ? [data] : [];
    if (arr.length === 0) {
      return Promise.resolve({
        data: null,
        error: { message: "No rows" },
      });
    }
    return Promise.resolve({ data: arr[0], error });
  }

  // thenable: untuk query tanpa single()/maybeSingle()
  then(resolve: (v: { data: any; error: any }) => void) {
    const { data, error } = this.run();
    resolve({ data, error });
  }
}

export interface FakeDbSeed {
  [table: string]: Row[];
}

export function createFakeSupabase(
  seed: FakeDbSeed = {},
  user: { id: string } | null = { id: "user-1" }
) {
  const db: Record<string, Row[]> = {};
  for (const [table, rows] of Object.entries(seed)) {
    db[table] = rows.map((r) => ({ ...r }));
  }

  const api = {
    __db: db, // akses untuk assertion di test
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from(table: string) {
      return new QueryBuilder(db, table);
    },
    rpc(name: string, args: Row = {}) {
      try {
        if (name === "create_order")
          return Promise.resolve({ data: rpcCreateOrder(db, user, args), error: null });
        if (name === "void_order")
          return Promise.resolve({ data: rpcVoidOrder(db, user, args), error: null });
        if (name === "close_shift")
          return Promise.resolve({ data: rpcCloseShift(db, user, args), error: null });
      } catch (e: any) {
        return Promise.resolve({ data: null, error: { message: e.message } });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
  return api;
}

// --- Implementasi RPC meniru logika SQL (untuk integration test) ---

function activeRecipeId(db: Record<string, Row[]>, productId: string, date: string) {
  const recipes = (db.recipes ?? [])
    .filter((r) => r.product_id === productId && r.effective_from <= date)
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  return recipes[0]?.id ?? null;
}

function rpcCreateOrder(db: Record<string, Row[]>, user: { id: string } | null, args: Row) {
  if (!user) throw new Error("Tidak terautentikasi");
  const items = args.p_items as any[];
  if (!items || items.length === 0) throw new Error("Keranjang kosong");
  const today = new Date().toISOString().slice(0, 10);
  const shift = (db.shifts ??= []).find((s) => s.status === "open");

  const order: Row = {
    id: genId(),
    shift_id: shift?.id ?? null,
    total: args.p_total,
    payment_method: args.p_payment_method,
    source: "cashier",
    status: "completed",
    created_by: user.id,
  };
  (db.orders ??= []).push(order);

  for (const it of items) {
    const variantSum = (it.variants ?? []).reduce(
      (s: number, v: any) => s + Number(v.priceDelta),
      0
    );
    const oi: Row = {
      id: genId(),
      order_id: order.id,
      product_id: it.productId,
      product_name: it.productName,
      qty: it.qty,
      unit_price: it.unitPrice,
      subtotal: (Number(it.unitPrice) + variantSum) * it.qty,
    };
    (db.order_items ??= []).push(oi);
    for (const v of it.variants ?? []) {
      (db.order_item_variants ??= []).push({
        id: genId(),
        order_item_id: oi.id,
        variant_id: v.variantId,
        variant_name: v.variantName,
        price_delta: v.priceDelta,
      });
    }

    const recipeId = activeRecipeId(db, it.productId, today);
    if (recipeId) {
      const lines = (db.recipe_lines ?? []).filter((l) => l.recipe_id === recipeId);
      for (const line of lines) {
        const ing = (db.ingredients ?? []).find((i) => i.id === line.ingredient_id);
        if (ing) ing.stock_qty = Number(ing.stock_qty) - line.qty_used * it.qty;
        (db.stock_movements ??= []).push({
          id: genId(),
          ingredient_id: line.ingredient_id,
          change_qty: -(line.qty_used * it.qty),
          reason: "sale",
          ref_id: order.id,
          created_by: user.id,
        });
      }
    }
  }
  return order;
}

function rpcVoidOrder(db: Record<string, Row[]>, user: { id: string } | null, args: Row) {
  if (!user) throw new Error("Tidak terautentikasi");
  if (!String(args.p_reason ?? "").trim()) throw new Error("Alasan wajib diisi");
  const order = (db.orders ?? []).find((o) => o.id === args.p_order_id);
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.status === "voided") throw new Error("Order sudah dibatalkan");
  order.status = "voided";
  order.void_reason = args.p_reason;

  const today = new Date().toISOString().slice(0, 10);
  const byProduct = new Map<string, number>();
  for (const oi of (db.order_items ?? []).filter((i) => i.order_id === order.id)) {
    byProduct.set(oi.product_id, (byProduct.get(oi.product_id) ?? 0) + oi.qty);
  }
  for (const [productId, qty] of byProduct) {
    const recipeId = activeRecipeId(db, productId, today);
    if (!recipeId) continue;
    const lines = (db.recipe_lines ?? []).filter((l) => l.recipe_id === recipeId);
    for (const line of lines) {
      const ing = (db.ingredients ?? []).find((i) => i.id === line.ingredient_id);
      if (ing) ing.stock_qty = Number(ing.stock_qty) + line.qty_used * qty;
      (db.stock_movements ??= []).push({
        id: genId(),
        ingredient_id: line.ingredient_id,
        change_qty: line.qty_used * qty,
        reason: "adjustment",
        ref_id: order.id,
        created_by: user.id,
      });
    }
  }
  (db.order_edits ??= []).push({
    id: genId(),
    order_id: order.id,
    edited_by: user.id,
    action: "void",
    reason: args.p_reason,
  });
  return null;
}

function rpcCloseShift(db: Record<string, Row[]>, user: { id: string } | null, args: Row) {
  if (!user) throw new Error("Tidak terautentikasi");
  const shift = (db.shifts ?? []).find((s) => s.id === args.p_shift_id);
  if (!shift) throw new Error("Shift tidak ditemukan");
  if (shift.status === "closed") throw new Error("Shift sudah ditutup");

  const completed = (db.orders ?? []).filter(
    (o) => o.shift_id === args.p_shift_id && o.status === "completed"
  );
  const cash = completed
    .filter((o) => o.payment_method === "cash")
    .reduce((s, o) => s + Number(o.total), 0);
  const qris = completed
    .filter((o) => o.payment_method === "qris")
    .reduce((s, o) => s + Number(o.total), 0);
  const cashout = (db.cash_drawer_movements ?? [])
    .filter((m) => m.shift_id === args.p_shift_id && m.direction === "out")
    .reduce((s, m) => s + Number(m.amount), 0);

  const expected = Number(shift.opening_balance) + cash - cashout;
  const diff = Number(args.p_counted_cash) - expected;
  const closing = Number(args.p_counted_cash) - Number(args.p_owner_withdrawal);

  Object.assign(shift, {
    closed_by: user.id,
    closed_at: new Date().toISOString(),
    expected_cash: expected,
    counted_cash: args.p_counted_cash,
    cash_difference: diff,
    owner_withdrawal: args.p_owner_withdrawal,
    closing_balance: closing,
    qris_total: qris,
    status: "closed",
  });

  const income = cash + qris;
  if (income > 0) {
    (db.cashflow_entries ??= []).push({
      id: genId(),
      entry_date: new Date().toISOString().slice(0, 10),
      direction: "in",
      amount: income,
      kind: "income",
      source: "sale",
      ref_id: args.p_shift_id,
      created_by: user.id,
    });
  }

  return {
    cashSales: cash,
    qrisTotal: qris,
    openingBalance: Number(shift.opening_balance),
    closingBalance: closing,
    cashDiff: diff,
  };
}
