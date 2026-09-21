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

export async function updateCategory(inventoryId: string, id: string, name: string) {
  const { supabase } = await requireUser();
  if (!name.trim()) return { error: "Category name cannot be empty." };
  const { error } = await supabase
    .from("categories")
    .update({ name: toTitleCase(name) })
    .eq("id", id)
    .eq("inventory_id", inventoryId);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/categories`);
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

export async function deleteCategory(inventoryId: string, id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("inventory_id", inventoryId);
  if (error) return { error: error.message };
  revalidatePath(`/inventories/${inventoryId}/categories`);
  revalidatePath(`/inventories/${inventoryId}/products`);
  return { error: null };
}

// ── Products ────────────────────────────────────────────────

export type ProductInput = {
  name: string;
  brand?: string | null;
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
    name: toTitleCase(input.name),
    brand: input.brand?.trim() || null,
    unit: input.unit?.trim() || null,
    category_id: input.category_id || null,
    buy_price: input.buy_price ?? null,
    selling_price: input.selling_price ?? null,
    quantity: input.quantity ?? 0,
    remarks: input.remarks?.trim() || null,
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
    .update({
      name: toTitleCase(input.name),
      brand: input.brand?.trim() || null,
      unit: input.unit?.trim() || null,
      category_id: input.category_id || null,
      buy_price: input.buy_price ?? null,
      selling_price: input.selling_price ?? null,
      quantity: input.quantity ?? 0,
      remarks: input.remarks?.trim() || null,
    })
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

export async function updateUserProfile(data: {
  fullName: string;
  phone: string;
  storeName: string;
  location: string;
  bio: string;
}) {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: data.fullName,
      phone: data.phone,
      store_name: data.storeName,
      location: data.location,
      bio: data.bio,
    },
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
