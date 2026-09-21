import { createClient } from "@/lib/supabase/server";
import CategoriesClient from "@/components/categories/CategoriesClient";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("inventory_id", id)
      .order("name"),
    supabase
      .from("products")
      .select("category_id")
      .eq("inventory_id", id),
  ]);

  const productCounts: Record<string, number> = {};
  for (const p of products ?? []) {
    if (p.category_id) {
      productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
    }
  }

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-900/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
              Store Product Departments
            </h2>
            <span className="badge badge-mint font-bold text-xs">
              {categories?.length ?? 0} {categories?.length === 1 ? "Category" : "Categories"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            Organize retail products into Philippine sari-sari aisles for structured price lists and catalog grouping.
          </p>
        </div>
      </div>
      <div className="green-divider-bar w-24 -mt-4" />

      {/* Interactive Categories Client with Confirmation Dialogs */}
      <CategoriesClient
        inventoryId={id}
        categories={categories ?? []}
        productCounts={productCounts}
      />
    </div>
  );
}
