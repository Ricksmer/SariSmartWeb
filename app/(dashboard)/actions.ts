"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toTitleCase } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ── Inventories ─────────────────────────────────────────────

export async function createInventory(name: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("create_inventory", { p_name: name });
  if (error) return { error: error.message, inventory: null };
  revalidatePath("/");
  return { error: null, inventory: data?.[0] ?? null };
}

export async function joinInventory(code: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("join_inventory_by_code", { p_code: code });
  if (error) return { error: error.message, inventory: null };
  revalidatePath("/");
  return { error: null, inventory: data?.[0] ?? null };
}

export async function leaveInventory(inventoryId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("inventory_members")
    .delete()
    .eq("inventory_id", inventoryId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect("/");
}

export async function renameInventory(inventoryId: string, name: string) {
  const { supabase } = await requireUser();
  if (!name.trim()) return { error: "Name is required." };
  const { error } = await supabase
    .from("inventories")
    .update({ name: name.trim() })
    .eq("id", inventoryId);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}`);
  revalidatePath(`/inventories/${inventoryId}/settings`);
  return { error: null };
}

// ── Categories ──────────────────────────────────────────────

export async function createCategory(inventoryId: string, name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .insert({ name: toTitleCase(name), inventory_id: inventoryId });
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/categories`);
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function deleteCategory(inventoryId: string, id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/categories`);
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

// ── Products ────────────────────────────────────────────────

export type ProductInput = {
  name: string;
  brand: string | null;
  unit: string | null;
  category_id: string | null;
  buy_price: number | null;
  selling_price: number | null;
  quantity: number;
  remarks: string | null;
};

export async function createProduct(inventoryId: string, input: ProductInput) {
  const { supabase } = await requireUser();
  if (!input.name.trim()) return { error: "Product name is required." };

  const { error } = await supabase.from("products").insert({
    ...input,
    name: toTitleCase(input.name),
    inventory_id: inventoryId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function updateProduct(inventoryId: string, id: string, input: ProductInput) {
  const { supabase } = await requireUser();
  if (!input.name.trim()) return { error: "Product name is required." };

  const { error } = await supabase
    .from("products")
    .update({ ...input, name: toTitleCase(input.name) })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function deleteProduct(inventoryId: string, id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function setProductArchived(inventoryId: string, id: string, archived: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("products").update({ archived }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
