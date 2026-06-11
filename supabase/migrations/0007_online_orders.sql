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

-- CATATAN KEAMANAN: anon TIDAK diberi policy insert/select langsung.
-- Pembuatan pesanan publik hanya lewat RPC security definer di bawah,
-- yang menghitung harga & total dari tabel products (otoritatif),
-- memaksa status='pending', dan membuat confirm_token di server.
-- Ini mencegah pemalsuan status 'paid', total, atau token via anon key.
create or replace function public.create_online_order(
  p_nama text,
  p_phone text,
  p_alamat text,
  p_catatan text,
  p_items jsonb,
  p_location_url text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal numeric(14,2) := 0;
  v_ongkir numeric(14,2) := 0;
  v_built jsonb := '[]'::jsonb;
  v_order_id uuid;
begin
  if coalesce(trim(p_nama), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'Nama dan nomor HP wajib diisi';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  -- Ongkir diambil dari setting toko, bukan dari klien.
  select coalesce(value, '0')::numeric into v_ongkir
  from public.app_settings where key = 'ongkir';
  v_ongkir := coalesce(v_ongkir, 0);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item->>'qty')::int, 0));
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and is_active = true;
    if not found then
      continue;
    end if;
    v_subtotal := v_subtotal + v_product.base_price * v_qty;
    v_built := v_built || jsonb_build_object(
      'name', v_product.name,
      'qty', v_qty,
      'harga', v_product.base_price
    );
  end loop;

  if jsonb_array_length(v_built) = 0 then
    raise exception 'Tidak ada item valid';
  end if;

  insert into public.online_orders (
    nama, phone, alamat, catatan, items, subtotal, ongkir, total,
    status, confirm_token, location_url
  ) values (
    trim(p_nama), trim(p_phone), nullif(trim(coalesce(p_alamat,'')), ''),
    nullif(trim(coalesce(p_catatan,'')), ''), v_built, v_subtotal, v_ongkir,
    v_subtotal + v_ongkir, 'pending', gen_random_uuid()::text,
    nullif(trim(coalesce(p_location_url,'')), '')
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.create_online_order(
  text, text, text, text, jsonb, text
) to anon;

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
