-- Kategori produk dengan urutan tampil (untuk reorder di kasir & menu).
-- products.category tetap menyimpan NAMA kategori (string) agar data lama aman.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_categories_order on public.categories(sort_order, name);

alter table public.categories enable row level security;

create policy "internal full access categories"
  on public.categories for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

-- Seed dari kategori yang sudah ada di products (jika ada).
insert into public.categories (name, sort_order)
select distinct category, row_number() over (order by category) * 10
from public.products
where coalesce(trim(category), '') <> ''
on conflict (name) do nothing;
