-- SariSmart: multi-user shared inventories (NON-DESTRUCTIVE)
-- Run in the Supabase SQL editor AFTER 0001_init.sql.
--
-- Safe to run on a project that already has product/category data —
-- every existing row is automatically migrated into a new personal
-- inventory owned by whoever created it. Nothing is dropped or lost.

-- Safe to re-run: clean up anything a previous failed attempt may have
-- partially created (e.g. `inventories` existing without its policies).
drop table if exists public.inventory_members cascade;
drop table if exists public.inventories cascade;

-- ─────────────────────────────────────────────────────────────
-- Tables first (both, before any policies — a policy on `inventories`
-- needs to reference `inventory_members` in its USING clause, so that
-- table has to exist first or the CREATE POLICY fails).
-- ─────────────────────────────────────────────────────────────
create table public.inventories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.inventory_members (
  inventory_id uuid not null references public.inventories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (inventory_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Now enable RLS and add policies for both tables
-- ─────────────────────────────────────────────────────────────
alter table public.inventories enable row level security;

create policy "members can view their inventories"
  on public.inventories for select
  using (
    id in (select inventory_id from public.inventory_members where user_id = auth.uid())
  );

create policy "owner can rename their inventory"
  on public.inventories for update
  using (owner_id = auth.uid());

create policy "owner can delete their inventory"
  on public.inventories for delete
  using (owner_id = auth.uid());

alter table public.inventory_members enable row level security;

create policy "members can view co-members of their inventories"
  on public.inventory_members for select
  using (
    inventory_id in (
      select im.inventory_id from public.inventory_members im where im.user_id = auth.uid()
    )
  );

create policy "a member can remove themselves"
  on public.inventory_members for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Add inventory_id to existing tables (nullable for now — backfilled below)
-- Also add the new product fields: unit/size, remarks, archived
-- ─────────────────────────────────────────────────────────────
alter table public.products add column if not exists inventory_id uuid references public.inventories (id) on delete cascade;
alter table public.categories add column if not exists inventory_id uuid references public.inventories (id) on delete cascade;

alter table public.products add column if not exists unit text;
alter table public.products add column if not exists remarks text;
alter table public.products add column if not exists archived boolean not null default false;

-- ─────────────────────────────────────────────────────────────
-- Backfill: give every existing user their own inventory containing
-- whatever products/categories they already had.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  r record;
  v_inv_id uuid;
  v_code text;
begin
  for r in (
    select user_id from public.products
    union
    select user_id from public.categories
  ) loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    insert into public.inventories (name, invite_code, owner_id)
    values ('My Inventory', v_code, r.user_id)
    returning id into v_inv_id;

    insert into public.inventory_members (inventory_id, user_id, role)
    values (v_inv_id, r.user_id, 'owner');

    update public.products set inventory_id = v_inv_id where user_id = r.user_id;
    update public.categories set inventory_id = v_inv_id where user_id = r.user_id;
  end loop;
end $$;

-- Now that every row has an inventory, make it required.
alter table public.products alter column inventory_id set not null;
alter table public.categories alter column inventory_id set not null;

-- ─────────────────────────────────────────────────────────────
-- Swap old user_id-based policies for inventory-membership-based ones
-- ─────────────────────────────────────────────────────────────
drop policy if exists "categories are owned by the creating user" on public.categories;
drop policy if exists "products are owned by the creating user" on public.products;

alter table public.categories drop constraint if exists categories_user_id_name_key;
alter table public.categories add constraint categories_inventory_id_name_key unique (inventory_id, name);

alter table public.categories drop column if exists user_id;
alter table public.products drop column if exists user_id;

create policy "members can manage categories in their inventories"
  on public.categories for all
  using (inventory_id in (select inventory_id from public.inventory_members where user_id = auth.uid()))
  with check (inventory_id in (select inventory_id from public.inventory_members where user_id = auth.uid()));

create policy "members can manage products in their inventories"
  on public.products for all
  using (inventory_id in (select inventory_id from public.inventory_members where user_id = auth.uid()))
  with check (inventory_id in (select inventory_id from public.inventory_members where user_id = auth.uid()));

drop index if exists products_user_id_idx;
create index if not exists products_inventory_id_idx on public.products (inventory_id);
create index if not exists categories_inventory_id_idx on public.categories (inventory_id);

-- ─────────────────────────────────────────────────────────────
-- RPC: create_inventory — makes the inventory AND the creator's
-- owner-membership row atomically, then returns the new invite code.
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_inventory(p_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
begin
  if p_name is null or trim(p_name) = '' then
    raise exception 'Inventory name is required';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.inventories (name, invite_code, owner_id)
  values (trim(p_name), v_code, auth.uid())
  returning inventories.id into v_id;

  insert into public.inventory_members (inventory_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return query select v_id, trim(p_name), v_code;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: join_inventory_by_code
-- ─────────────────────────────────────────────────────────────
create or replace function public.join_inventory_by_code(p_code text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory_id uuid;
  v_inventory_name text;
begin
  select inv.id, inv.name into v_inventory_id, v_inventory_name
  from public.inventories inv
  where inv.invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Invalid invite code';
  end if;

  insert into public.inventory_members (inventory_id, user_id, role)
  values (v_inventory_id, auth.uid(), 'member')
  on conflict (inventory_id, user_id) do nothing;

  return query select v_inventory_id, v_inventory_name;
end;
$$;

grant execute on function public.create_inventory(text) to authenticated;
grant execute on function public.join_inventory_by_code(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_inventory_member_emails — the Settings page needs to show
-- who's in an inventory by email, but auth.users isn't directly
-- queryable by regular clients. This exposes just (id, email), and
-- only for inventories the caller is themselves a member of.
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_inventory_member_emails(p_inventory_id uuid)
returns table (user_id uuid, email text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email
  from auth.users u
  join public.inventory_members im on im.user_id = u.id
  where im.inventory_id = p_inventory_id
    and exists (
      select 1 from public.inventory_members me
      where me.inventory_id = p_inventory_id and me.user_id = auth.uid()
    );
$$;

grant execute on function public.get_inventory_member_emails(uuid) to authenticated;
