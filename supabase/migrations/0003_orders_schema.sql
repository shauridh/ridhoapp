-- Satu transaksi kasir
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid,
  total numeric(14,2) not null default 0,
  payment_method text not null check (payment_method in ('cash','qris')),
  source text not null default 'cashier',
  status text not null default 'completed' check (status in ('completed','voided')),
  void_reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Baris item dalam transaksi
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  qty integer not null default 1 check (qty > 0),
  unit_price numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0
);

-- Varian / topping yang dipilih per item
create table public.order_item_variants (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  variant_name text not null,
  price_delta numeric(14,2) not null default 0
);

-- Audit trail edit/void
create table public.order_edits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  edited_by uuid references public.profiles(id),
  edited_at timestamptz not null default now(),
  action text not null check (action in ('void','edit')),
  reason text not null default '',
  before_snapshot jsonb,
  after_snapshot jsonb
);

create index idx_order_items_order on public.order_items(order_id);
create index idx_order_item_variants_item on public.order_item_variants(order_item_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_variants enable row level security;
alter table public.order_edits enable row level security;

create policy "internal full access orders"
  on public.orders for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access order_items"
  on public.order_items for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access order_item_variants"
  on public.order_item_variants for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access order_edits"
  on public.order_edits for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
