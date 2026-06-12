-- Pesanan tersimpan (held / parkir): cart yang belum dibayar.
-- Disimpan di DB agar tahan refresh/crash dan bisa dilanjutkan kapan saja.
create table public.held_orders (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  cart jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_held_orders_created on public.held_orders(created_at desc);

alter table public.held_orders enable row level security;

create policy "internal full access held_orders"
  on public.held_orders for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
