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
            Organize retail products into Philippine sari-sari aisles for automated 5-page PDF grouping.
          </p>
        </div>
      </div>
      <div className="green-divider-bar w-24 -mt-4" />

      {/* Full Width 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Category (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-emerald-900/10 shadow-md bg-white relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 font-heading mb-1.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a7949] text-white text-xs font-bold shadow-xs">
                +
              </span>
              Create Category
            </h3>
            <p className="text-xs text-stone-500 font-medium mb-4">
              Add a new aisle (e.g. Beverages, Canned Goods, Cigarettes &amp; Tobacco).
            </p>

            <form
              action={async (formData) => {
                "use server";
                const name = formData.get("name") as string;
                if (name?.trim()) await createCategory(id, name);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  name="name"
                  placeholder="e.g. Candy & Sweets"
                  required
                  className="input font-medium"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-shimmer w-full py-2.5 text-xs font-bold shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Category</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Category List (8 cols) */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden border-emerald-900/10 shadow-md bg-white">
            <div className="border-b border-stone-200/80 bg-gradient-to-r from-emerald-50/70 via-stone-50 to-white px-6 py-3.5 text-xs font-black text-stone-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Active Categories</span>
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-[#145a37]">
                  {categories?.length ?? 0}
                </span>
              </span>
              <span>Linked In-Stock Items</span>
            </div>

            <ul className="divide-y divide-stone-100">
              {categories?.length ? (
                categories.map((c) => {
                  const productCount = countByCat.get(c.id) || 0;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-emerald-50/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/90 text-[#1a7949] text-xs font-black shadow-2xs group-hover:scale-105 transition-transform">
                          #
                        </span>
                        <div>
                          <span className="text-sm font-extrabold text-stone-900 group-hover:text-[#1a7949] transition-colors">
                            {c.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="badge badge-mint font-mono font-bold text-xs py-1 px-2.5">
                          {productCount} {productCount === 1 ? "product" : "products"}
                        </span>

                        <form
                          action={async () => {
                            "use server";
                            await deleteCategory(id, c.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[#782d2d] hover:bg-red-100 hover:border-red-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Delete category"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="px-6 py-12 text-center text-xs text-stone-400 font-medium">
                  No categories yet &mdash; add your first category above to group your products.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
