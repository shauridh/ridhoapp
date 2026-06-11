-- Sesi buka-tutup kasir
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  opening_balance numeric(14,2) not null default 0,
  expected_cash numeric(14,2) not null default 0,
  counted_cash numeric(14,2),
  cash_difference numeric(14,2),
  owner_withdrawal numeric(14,2),
  closing_balance numeric(14,2),
  qris_total numeric(14,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed'))
);

-- Cash in/out manual selama shift
create table public.cash_drawer_movements (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  amount numeric(14,2) not null check (amount > 0),
  reason text not null default '',
  category_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Cashflow dasar dipakai oleh shift close dan cash out.
create table public.cashflow_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income','opex','capex','capital','withdrawal')),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.cashflow_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  direction text not null check (direction in ('in','out')),
  amount numeric(14,2) not null check (amount >= 0),
  category_id uuid references public.cashflow_categories(id),
  kind text not null check (kind in ('income','opex','capex','capital','withdrawal')),
  source text not null default 'manual' check (source in ('sale','drawer','manual')),
  ref_id uuid,
  created_by uuid references public.profiles(id),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index idx_shifts_status on public.shifts(status, opened_at desc);
create index idx_cash_drawer_movements_shift on public.cash_drawer_movements(shift_id);
create index idx_cashflow_entries_date on public.cashflow_entries(entry_date desc);
create index idx_cashflow_entries_kind on public.cashflow_entries(kind);

alter table public.shifts enable row level security;
alter table public.cash_drawer_movements enable row level security;
alter table public.cashflow_categories enable row level security;
alter table public.cashflow_entries enable row level security;

create policy "internal full access shifts"
  on public.shifts for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access cash_drawer_movements"
  on public.cash_drawer_movements for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access cashflow_categories"
  on public.cashflow_categories for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access cashflow_entries"
  on public.cashflow_entries for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

insert into public.cashflow_categories (name, kind, is_system) values
  ('Penjualan', 'income', true),
  ('Pengeluaran Drawer', 'opex', true),
  ('Belanja Modal', 'capex', true),
  ('Modal Owner', 'capital', true),
  ('Tarik Dana Owner', 'withdrawal', true);
