-- Pesanan online (delivery / pickup) dari halaman publik
create table public.online_orders (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  phone text not null,
  alamat text,
  items jsonb not null default '[]'::jsonb,
  catatan text,
  subtotal numeric(14,2) not null default 0,
  ongkir numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','confirmed','paid','done','cancelled')),
  qris_string text,
  confirm_token text not null,
  location_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_online_orders_status on public.online_orders(status, created_at desc);

-- Pengaturan toko (key-value). Untuk store_name, ongkir, qris_string, online_enabled, dll.
create table public.app_settings (
  key text primary key,
  value text not null default ''
);

alter table public.online_orders enable row level security;
alter table public.app_settings enable row level security;

-- Internal: akses penuh.
create policy "internal full access online_orders"
  on public.online_orders for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access app_settings"
  on public.app_settings for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

-- Publik (anon): boleh BUAT pesanan online (insert), tidak boleh baca pesanan lain.
create policy "public can create online orders"
  on public.online_orders for insert to anon
  with check (true);

-- RPC whitelist setting publik (hanya field non-sensitif untuk halaman /order).
create or replace function public.get_public_settings()
returns table(key text, value text)
language sql
security definer set search_path = public
stable
as $$
  select key, value from public.app_settings
  where key in ('store_name', 'ongkir', 'online_enabled')
$$;

grant execute on function public.get_public_settings() to anon;

-- Seed default settings
insert into public.app_settings (key, value) values
  ('store_name', 'Sabana Fried Chicken'),
  ('ongkir', '0'),
  ('online_enabled', 'true')
on conflict (key) do nothing;
