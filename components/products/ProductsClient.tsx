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
  const activeCount = useMemo(() => products.filter((p) => !p.archived).length, [products]);

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
    if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct(inventoryId, p.id);
  }

  async function handleArchive(p: Product) {
    await setProductArchived(inventoryId, p.id, true);
  }

  async function handleRestore(p: Product) {
    await setProductArchived(inventoryId, p.id, false);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-2xl bg-stone-100/90 p-1.5 text-xs font-bold border border-stone-200/60 shadow-xs w-fit">
          <button
            onClick={() => setView("active")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-200 ${
              view === "active"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Active Products</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
              view === "active" ? "bg-[#eaf6ee] text-[#1a7949]" : "bg-stone-200 text-stone-600"
            }`}>
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setView("archived")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-200 ${
              view === "archived"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Archived</span>
            {archivedCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                view === "archived" ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-600"
              }`}>
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        <button onClick={openAdd} className="btn btn-primary self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            placeholder="Search by product name or brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-9 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative sm:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input text-sm cursor-pointer pr-8 font-medium"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-center text-xs font-semibold text-stone-400 ml-auto">
          Showing {filtered.length} of {view === "active" ? activeCount : archivedCount} items
        </div>
      </div>

      {/* Luxury Products Table */}
      <div className="card overflow-hidden border-stone-200/90 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-[#fbfcfb] text-[11px] font-black uppercase tracking-wider text-stone-400">
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Brand</th>
                <th className="px-4 py-3.5">Size / Unit</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Cost (Buy)</th>
                <th className="px-4 py-3.5">Selling Price</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Capital</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/80">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="text-stone-800 transition-colors duration-150 hover:bg-[#f8faf8] group"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-stone-900 group-hover:text-[#1a7949] transition-colors">
                        {p.name}
                      </div>
                      {p.remarks && (
                        <div className="text-[11px] font-normal italic text-stone-400 mt-0.5">
                          {p.remarks}
                        </div>
                      )}
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3.5 text-stone-600 font-medium">
                      {p.brand ? (
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700 font-semibold border border-stone-200/60">
                          {p.brand}
                        </span>
                      ) : (
                        <span className="text-stone-300">&mdash;</span>
                      )}
                    </td>

                    {/* Size formatted in parentheses */}
                    <td className="px-4 py-3.5">
                      {p.unit ? (
                        <span className="badge badge-mint font-mono text-[11px]">
                          ({p.unit})
                        </span>
                      ) : (
                        <span className="text-stone-300">&mdash;</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      {p.category?.name ? (
                        <span className="text-xs font-semibold text-stone-600 bg-stone-50 border border-stone-200/70 px-2 py-0.5 rounded-lg">
                          {p.category.name}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs italic">Uncategorized</span>
                      )}
                    </td>

                    {/* Buy Price */}
                    <td className="px-4 py-3.5 font-mono text-stone-500 text-xs">
                      {formatPrice(p.buy_price)}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-3.5 font-mono font-bold">
                      {p.selling_price === null ? (
                        <span className="badge badge-amber text-[10px]">
                          Price TBD
                        </span>
                      ) : (
                        <span className="text-stone-900 text-sm">
                          {formatPrice(p.selling_price)}
                        </span>
                      )}
                    </td>

                    {/* Quantity & Stock Badge */}
                    <td className="px-4 py-3.5">
                      {p.quantity <= 5 ? (
                        <span className="badge badge-red font-bold">
                          {p.quantity} left
                        </span>
                      ) : (
                        <span className="badge badge-mint font-mono">
                          {p.quantity} in stock
                        </span>
                      )}
                    </td>

                    {/* Capital */}
                    <td className="px-4 py-3.5 font-mono text-stone-400 text-xs">
                      {formatPrice(capitalTiedUp(p))}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs font-semibold">
                      {view === "active" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg px-2.5 py-1 text-stone-600 hover:text-[#1a7949] hover:bg-[#eaf6ee] transition-all"
                            title="Edit product details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(p)}
                            className="rounded-lg px-2.5 py-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
                            title="Archive product"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-lg px-2 py-1 text-stone-300 hover:text-[#782d2d] hover:bg-red-50 transition-all"
                            title="Permanently delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(p)}
                            className="rounded-lg px-3 py-1 font-bold text-[#1a7949] hover:bg-[#eaf6ee] transition-all"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-lg px-2 py-1 text-stone-300 hover:text-[#782d2d] hover:bg-red-50 transition-all"
                            title="Permanently delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="font-bold text-stone-700 text-sm">
                        {view === "archived"
                          ? "No archived products"
                          : products.length === 0
                          ? "Your catalog is empty"
                          : "No products match your search filter"}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {products.length === 0
                          ? "Get started by clicking '+ Add Product' above."
                          : "Try clearing your search query or selecting 'All Categories'."}
                      </p>
                      {query && (
                        <button
                          onClick={() => {
                            setQuery("");
                            setCategoryFilter("");
                          }}
                          className="btn btn-secondary mt-4 text-xs py-1.5"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
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
