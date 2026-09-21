"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/(dashboard)/actions";
import ConfirmModal from "@/components/ui/ConfirmModal";

type CategoryItem = {
  id: string;
  name: string;
};

export default function CategoriesClient({
  inventoryId,
  categories,
  productCounts,
}: {
  inventoryId: string;
  categories: CategoryItem[];
  productCounts: Record<string, number>;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit State
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingUpdateCat, setPendingUpdateCat] = useState<{ id: string; oldName: string; newName: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [pendingDeleteCat, setPendingDeleteCat] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await createCategory(inventoryId, newCatName.trim());
    setCreating(false);
    if (res?.error) {
      setCreateError(res.error);
    } else {
      setNewCatName("");
    }
  }

  function startEdit(c: CategoryItem) {
    setEditingCategory(c);
    setEditName(c.name);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    if (editName.trim() === editingCategory.name) {
      setEditingCategory(null);
      return;
    }
    // Open confirmation modal for updating
    setPendingUpdateCat({
      id: editingCategory.id,
      oldName: editingCategory.name,
      newName: editName.trim(),
    });
  }

  async function confirmUpdate() {
    if (!pendingUpdateCat) return;
    setUpdating(true);
    await updateCategory(inventoryId, pendingUpdateCat.id, pendingUpdateCat.newName);
    setUpdating(false);
    setPendingUpdateCat(null);
    setEditingCategory(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteCat) return;
    setDeleting(true);
    await deleteCategory(inventoryId, pendingDeleteCat.id);
    setDeleting(false);
    setPendingDeleteCat(null);
  }

  return (
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

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category Name
              </label>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Candy & Sweets"
                required
                className="input font-medium"
                disabled={creating}
              />
              {createError && (
                <p className="text-xs text-red-600 font-bold mt-1.5">{createError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={creating || !newCatName.trim()}
              className="btn btn-primary btn-shimmer w-full py-2.5 text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{creating ? "Adding..." : "Add Category"}</span>
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
                {categories.length}
              </span>
            </span>
            <span>Linked In-Stock Items</span>
          </div>

          <ul className="divide-y divide-stone-100">
            {categories.length ? (
              categories.map((c) => {
                const productCount = productCounts[c.id] || 0;
                const isEditing = editingCategory?.id === c.id;

                return (
                  <li
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-emerald-50/40 transition-colors group"
                  >
                    {isEditing ? (
                      <form onSubmit={submitEdit} className="flex-1 flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input py-1.5 px-3 text-xs font-bold flex-1"
                          autoFocus
                          required
                        />
                        <button
                          type="submit"
                          className="btn btn-primary px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="btn btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
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
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-3">
                        <span className="badge badge-mint font-mono font-bold text-xs py-1 px-2.5">
                          {productCount} {productCount === 1 ? "product" : "products"}
                        </span>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Edit category name"
                        >
                          <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setPendingDeleteCat(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[#782d2d] hover:bg-red-100 hover:border-red-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Delete category"
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
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

      {/* ── Confirmation Modal: Delete Category ── */}
      <ConfirmModal
        open={Boolean(pendingDeleteCat)}
        title={`Delete category "${pendingDeleteCat?.name}"?`}
        description={
          pendingDeleteCat ? (
            <span>
              Are you sure you want to delete this category?{" "}
              {productCounts[pendingDeleteCat.id] ? (
                <span className="text-red-600 font-bold">
                  {productCounts[pendingDeleteCat.id]} product
                  {productCounts[pendingDeleteCat.id] === 1 ? "" : "s"} currently assigned to
                  this category will become Uncategorized.
                </span>
              ) : (
                "No products are currently assigned to this category."
              )}
            </span>
          ) : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteCat(null)}
      />

      {/* ── Confirmation Modal: Update Category ── */}
      <ConfirmModal
        open={Boolean(pendingUpdateCat)}
        title={`Update category to "${pendingUpdateCat?.newName}"?`}
        description={`This will rename the category from "${pendingUpdateCat?.oldName}" to "${pendingUpdateCat?.newName}" across all assigned products and price lists.`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        variant="primary"
        loading={updating}
        onConfirm={confirmUpdate}
        onCancel={() => setPendingUpdateCat(null)}
      />
    </div>
  );
}
