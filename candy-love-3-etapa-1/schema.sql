-- Candy Love 3.0: execute uma vez no SQL Editor de um projeto Supabase novo.
create extension if not exists pgcrypto;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  preview_path text,
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (status <> 'approved' or paid_at is not null)
);

create table public.order_items (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  price_cents integer not null check (price_cents >= 0),
  primary key (order_id, product_id)
);

create table public.purchases (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id),
  order_id uuid not null references public.orders(id),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index purchases_user_idx on public.purchases (user_id);
create index products_active_created_idx on public.products (active, created_at desc);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.purchases enable row level security;

create policy "Ver produtos publicados"
on public.products for select to anon, authenticated
using (active = true);

create policy "Ver os próprios pedidos"
on public.orders for select to authenticated
using (user_id = (select auth.uid()));

create policy "Ver itens dos próprios pedidos"
on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and o.user_id = (select auth.uid())
));

create policy "Ver as próprias compras"
on public.purchases for select to authenticated
using (user_id = (select auth.uid()));

-- O servidor usa a chave de serviço para cadastrar produtos e registrar
-- pagamentos. Clientes não recebem permissões de escrita nessas tabelas.
