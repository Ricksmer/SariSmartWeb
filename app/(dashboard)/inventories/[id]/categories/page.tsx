import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "../../../actions";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("inventory_id", id)
    .order("name");

  return (
    <div className="max-w-md">
      <form
        action={async (formData) => {
          "use server";
          const name = formData.get("name") as string;
          if (name?.trim()) await createCategory(id, name);
        }}
        className="mb-6 flex gap-2"
      >
        <input
          name="name"
          placeholder="e.g. Snacks"
          required
          className="input"
        />
        <button className="btn btn-primary shrink-0">Add</button>
      </form>

      <ul className="card divide-y divide-stone-100">
        {categories?.length ? (
          categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-stone-800">{c.name}</span>
              <form
                action={async () => {
                  "use server";
                  await deleteCategory(id, c.id);
                }}
              >
                <button className="text-sm text-stone-400 hover:text-red-600">Remove</button>
              </form>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-sm text-stone-400">
            No categories yet — add one above.
          </li>
        )}
      </ul>
    </div>
  );
}
