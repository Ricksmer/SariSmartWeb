"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { formatPrice, capitalTiedUp } from "@/lib/types";
import { deleteProduct, setProductArchived } from "@/app/(dashboard)/actions";
import ProductForm from "./ProductForm";

export default function ProductsClient({
  inventoryId,
  products,
  categories,
}: {
  inventoryId: string;
  products: Product[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>(undefined);

  const archivedCount = useMemo(() => products.filter((p) => p.archived).length, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (view === "active" && p.archived) return false;
      if (view === "archived" && !p.archived) return false;
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || p.category_id === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, categoryFilter, view]);

  function openAdd() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Permanently delete "${p.name}"? This can't be undone.`)) return;
    await deleteProduct(inventoryId, p.id);
  }

  async function handleArchive(p: Product) {
    await setProductArchived(inventoryId, p.id, true);
  }

  async function handleRestore(p: Product) {
    await setProductArchived(inventoryId, p.id, false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-stone-100/80 p-1 text-sm">
          <button
            onClick={() => setView("active")}
            className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
              view === "active" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setView("archived")}
            className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
              view === "archived" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            Archived {archivedCount > 0 && `(${archivedCount})`}
          </button>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          + Add product
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search name or brand..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input max-w-[180px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Buy price</th>
              <th className="px-4 py-3 font-medium">Selling price</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Capital</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length ? (
              filtered.map((p) => (
                <tr key={p.id} className="text-stone-800 transition hover:bg-stone-50/60">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-stone-500">{p.brand || "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{p.unit || "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{formatPrice(p.buy_price)}</td>
                  <td className="px-4 py-3">
                    {p.selling_price === null ? (
                      <span className="badge bg-amber-50 text-amber-700">No price yet</span>
                    ) : (
                      formatPrice(p.selling_price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.quantity <= 5 ? (
                      <span className="badge bg-red-50 text-red-700">{p.quantity} left</span>
                    ) : (
                      p.quantity
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{formatPrice(capitalTiedUp(p))}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {view === "active" ? (
                      <>
                        <button
                          onClick={() => openEdit(p)}
                          className="mr-3 text-stone-500 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleArchive(p)}
                          className="mr-3 text-stone-400 hover:text-stone-700"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-stone-300 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(p)}
                          className="mr-3 text-teal-700 hover:text-teal-800"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-stone-300 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-stone-400">
                  {view === "archived"
                    ? "No archived products."
                    : products.length === 0
                      ? "No products yet — add your first one above."
                      : "No products match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ProductForm
          inventoryId={inventoryId}
          categories={categories}
          product={editing}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
