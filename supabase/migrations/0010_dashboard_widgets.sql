-- Widget dashboard yang bisa diatur sendiri (jenis chart, data, posisi, ukuran).
-- Layout dipakai bersama semua perangkat (1 layout global untuk toko).
create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  chart_type text not null
    check (chart_type in ('stat','line','bar','donut','radar','rank')),
  metric text not null,
  -- posisi & ukuran grid (react-grid-layout, 12 kolom)
  x integer not null default 0,
  y integer not null default 0,
  w integer not null default 4,
  h integer not null default 4,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.dashboard_widgets enable row level security;

create policy "internal full access dashboard_widgets"
  on public.dashboard_widgets for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
