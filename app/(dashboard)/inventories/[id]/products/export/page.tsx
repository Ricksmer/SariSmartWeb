import { createClient } from "@/lib/supabase/server";
import ExportSelector from "@/components/products/ExportSelector";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(id, name)")
      .eq("inventory_id", id)
      .eq("archived", false)
      .order("name"),
    supabase.from("categories").select("id, inventory_id, name, created_at").eq("inventory_id", id).order("name"),
  ]);

  return <ExportSelector inventoryId={id} products={products ?? []} categories={categories ?? []} />;
}
