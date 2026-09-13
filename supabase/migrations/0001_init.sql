-- SariSmart initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.categories enable row level security;

create policy "categories are owned by the creating user"
  on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  brand text,
  buy_price numeric(10, 2),
  selling_price numeric(10, 2),
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products are owned by the creating user"
  on public.products
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- Helpful indexes for search/filter and the public price list.
create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));

-- Note: the public /price-list page does NOT query these tables directly
-- with RLS — it goes through /api/public-products, which uses the
-- service-role key server-side and explicitly selects only
-- (name, brand, selling_price, category name). That route is the only
-- thing that should ever expose product data without a logged-in user.
