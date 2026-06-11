-- Extension untuk UUID
create extension if not exists "pgcrypto";

-- Profiles: ekstensi auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- User terautentikasi boleh baca semua profil
create policy "authenticated can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- User boleh update profilnya sendiri
create policy "user can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger: buat profile otomatis saat user baru daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: cek apakah pemanggil adalah staff internal aktif
create or replace function public.is_internal_user()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- Produk
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'single' check (type in ('single','combo')),
  base_price numeric(12,2) not null default 0,
  category text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Varian / topping
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  is_required boolean not null default false,
  price_delta numeric(12,2) not null default 0,
  type text not null default 'option' check (type in ('option','addon')),
  is_active boolean not null default true
);

-- Isi paket combo
create table public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_product_id uuid not null references public.products(id) on delete cascade,
  child_product_id uuid not null references public.products(id) on delete restrict,
  qty integer not null default 1 check (qty > 0)
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.combo_items enable row level security;

create policy "internal full access products"
  on public.products for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

create policy "internal full access variants"
  on public.product_variants for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

create policy "internal full access combo_items"
  on public.combo_items for all
  to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());
