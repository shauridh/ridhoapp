-- Akun penyimpanan uang (bank / e-wallet / kas fisik)
create table public.akun (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('bank','ewallet','kas_fisik')),
  saldo_awal numeric(14,2) not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pengeluaran operasional berulang (opex)
create table public.opex (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nominal numeric(14,2) not null default 0,
  frekuensi text not null default 'bulanan'
    check (frekuensi in ('harian','mingguan','bulanan')),
  jatuh_tempo integer,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Hutang & piutang dengan tenor, cicilan, bunga
create table public.piutang (
  id uuid primary key default gen_random_uuid(),
  pihak text not null,
  nominal numeric(14,2) not null default 0,
  tipe text not null check (tipe in ('hutang','piutang')),
  keterangan text not null default '',
  status text not null default 'belum' check (status in ('belum','lunas')),
  jatuh_tempo date,
  tenor integer,
  cicilan numeric(14,2),
  bunga numeric(6,2),
  created_at timestamptz not null default now()
);

create index idx_opex_aktif on public.opex(aktif);
create index idx_piutang_status on public.piutang(status);

alter table public.akun enable row level security;
alter table public.opex enable row level security;
alter table public.piutang enable row level security;

create policy "internal full access akun"
  on public.akun for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access opex"
  on public.opex for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal full access piutang"
  on public.piutang for all to authenticated
  using (public.is_internal_user()) with check (public.is_internal_user());
