-- SariSmart: Fix infinite recursion in inventory_members RLS policy
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create a helper function with SECURITY DEFINER to check membership
-- without triggering recursive RLS evaluation on inventory_members.
create or replace function public.is_inventory_member(p_inventory_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.inventory_members
    where inventory_id = p_inventory_id
      and user_id = p_user_id
  );
$$;

grant execute on function public.is_inventory_member(uuid, uuid) to authenticated, anon;

-- 2. Fix policy on inventory_members
drop policy if exists "members can view co-members of their inventories" on public.inventory_members;

create policy "members can view co-members of their inventories"
  on public.inventory_members for select
  using (
    user_id = auth.uid() or public.is_inventory_member(inventory_id)
  );

-- 3. Optimize policies on inventories, categories, and products using the helper function
drop policy if exists "members can view their inventories" on public.inventories;

create policy "members can view their inventories"
  on public.inventories for select
  using (
    public.is_inventory_member(id)
  );

drop policy if exists "members can manage categories in their inventories" on public.categories;

create policy "members can manage categories in their inventories"
  on public.categories for all
  using (public.is_inventory_member(inventory_id))
  with check (public.is_inventory_member(inventory_id));

drop policy if exists "members can manage products in their inventories" on public.products;

create policy "members can manage products in their inventories"
  on public.products for all
  using (public.is_inventory_member(inventory_id))
  with check (public.is_inventory_member(inventory_id));
