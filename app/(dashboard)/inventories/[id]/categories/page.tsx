import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "../../../actions";

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

  const countByCat = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.category_id) {
      countByCat.set(p.category_id, (countByCat.get(p.category_id) || 0) + 1);
    }
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-stone-900 font-sans">Product Categories</h2>
        <p className="text-xs text-stone-500 mt-1">
          Organize your retail inventory into distinct aisles and groupings for printed price lists.
        </p>
      </div>

      {/* Add Category Card */}
      <div className="card p-5 border-stone-200/90 shadow-sm bg-gradient-to-r from-white to-[#f8faf8]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
          Create New Category
        </h3>
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            if (name?.trim()) await createCategory(id, name);
          }}
          className="flex gap-2.5"
        >
          <input
            name="name"
            placeholder="e.g. Beverages, Canned Goods, Snacks, Personal Care"
            required
            className="input flex-1"
          />
          <button className="btn btn-primary shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Category</span>
          </button>
        </form>
      </div>

      {/* Category List Card */}
      <div className="card overflow-hidden border-stone-200/90 shadow-sm bg-white">
        <div className="border-b border-stone-100 bg-[#fbfcfb] px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
          <span>Active Categories ({categories?.length ?? 0})</span>
          <span>Linked Products</span>
        </div>

        <ul className="divide-y divide-stone-100/80">
          {categories?.length ? (
            categories.map((c) => {
              const productCount = countByCat.get(c.id) || 0;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8faf8] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf6ee] text-[#1a7949] text-xs font-bold">
                      #
                    </span>
                    <span className="text-sm font-bold text-stone-800 group-hover:text-[#1a7949] transition-colors">
                      {c.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="badge badge-mint font-mono text-[10px]">
                      {productCount} {productCount === 1 ? "item" : "items"}
                    </span>

                    <form
                      action={async () => {
                        "use server";
                        await deleteCategory(id, c.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-stone-300 hover:text-[#782d2d] hover:bg-red-50 transition-all text-xs"
                        title="Delete category"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="px-5 py-12 text-center text-xs text-stone-400">
              No categories yet &mdash; add your first category above to group your products.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
