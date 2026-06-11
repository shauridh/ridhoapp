-- Bahan baku & produk-jadi sederhana
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tracking_type text not null default 'ingredient'
    check (tracking_type in ('ingredient','finished')),
  stock_qty numeric(14,4) not null default 0,
  unit text not null default 'pcs',
  purchase_unit text not null default '',
  purchase_unit_qty numeric(14,4) not null default 1,
  low_stock_threshold numeric(14,4) not null default 0,
  created_at timestamptz not null default now()
);

-- Resep berversi: satu produk bisa punya banyak versi, dipilih per tanggal
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  effective_from date not null default current_date,
  created_by uuid references public.profiles(id),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Baris resep: bahan yang dipakai per 1 porsi produk
create table public.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  qty_used numeric(14,4) not null check (qty_used >= 0)
);

-- Pergerakan stok (audit)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  change_qty numeric(14,4) not null,
  reason text not null check (reason in ('sale','purchase','adjustment','waste')),
  ref_id uuid,
  note text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_recipes_product on public.recipes(product_id, effective_from desc);
create index idx_recipe_lines_recipe on public.recipe_lines(recipe_id);
create index idx_stock_movements_ingredient on public.stock_movements(ingredient_id, created_at desc);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.stock_movements enable row level security;

create policy "internal full access ingredients"
  on public.ingredients for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access recipes"
  on public.recipes for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access recipe_lines"
  on public.recipe_lines for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access stock_movements"
  on public.stock_movements for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
