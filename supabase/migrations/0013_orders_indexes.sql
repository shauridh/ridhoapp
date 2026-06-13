create index if not exists idx_orders_created_at
  on public.orders (created_at desc);

create index if not exists idx_orders_shift_status
  on public.orders (shift_id, status);

create index if not exists idx_orders_status_created
  on public.orders (status, created_at desc);

create index if not exists idx_online_orders_token
  on public.online_orders (confirm_token);
