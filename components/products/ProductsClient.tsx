"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { formatPrice, capitalTiedUp } from "@/lib/types";
import { deleteProduct, setProductArchived } from "@/app/(dashboard)/actions";
import ProductForm from "./ProductForm";
import ConfirmModal from "@/components/ui/ConfirmModal";

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

  // Confirmation dialog states
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [pendingArchiveProduct, setPendingArchiveProduct] = useState<Product | null>(null);
  const [pendingRestoreProduct, setPendingRestoreProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function confirmDelete() {
    if (!pendingDeleteProduct) return;
    setActionLoading(true);
    await deleteProduct(inventoryId, pendingDeleteProduct.id);
    setActionLoading(false);
    setPendingDeleteProduct(null);
  }

  async function confirmArchive() {
    if (!pendingArchiveProduct) return;
    setActionLoading(true);
    await setProductArchived(inventoryId, pendingArchiveProduct.id, true);
    setActionLoading(false);
    setPendingArchiveProduct(null);
  }

  async function confirmRestore() {
    if (!pendingRestoreProduct) return;
    setActionLoading(true);
    await setProductArchived(inventoryId, pendingRestoreProduct.id, false);
    setActionLoading(false);
    setPendingRestoreProduct(null);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/90 p-1.5 text-xs font-bold border border-emerald-900/10 shadow-2xs w-fit">
          <button
            onClick={() => setView("active")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-200 cursor-pointer ${
              view === "active"
                ? "bg-gradient-to-r from-emerald-50 via-[#f0f8f3] to-emerald-100/60 text-[#145a37] shadow-xs border border-emerald-300/80 font-black"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Active Products</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              view === "active" ? "bg-[#1a7949] text-white" : "bg-stone-200 text-stone-600"
            }`}>
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setView("archived")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-200 cursor-pointer ${
              view === "archived"
                ? "bg-stone-900 text-white shadow-xs font-black"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>Archived</span>
            {archivedCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                view === "archived" ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-600"
              }`}>
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        <button onClick={openAdd} className="btn btn-primary btn-shimmer self-start sm:self-auto shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            placeholder="Search by product name or brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-has-icon-left text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600"
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
            className="input text-sm cursor-pointer pr-8 font-semibold text-stone-700"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-center text-xs font-bold text-stone-400 ml-auto">
          Showing {filtered.length} of {view === "active" ? activeCount : archivedCount} items
        </div>
      </div>

      {/* Luxury Products Table */}
      <div className="card overflow-hidden border-emerald-900/10 shadow-[0_8px_30px_-6px_rgba(26,121,73,0.06)] bg-white relative">
        {/* Top Hairline */}
        <div className="h-1 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71] w-full" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-900/10 bg-gradient-to-r from-[#eef7f2] via-[#f7faf8] to-white text-[11px] font-black uppercase tracking-wider text-[#145a37] font-heading">
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Brand</th>
                <th className="px-4 py-3.5">Size / Unit</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Cost (Buy)</th>
                <th className="px-4 py-3.5 bg-emerald-100/70 text-[#0f4e2b] font-black border-x border-emerald-200/80">
                  Selling Price (₱)
                </th>
                <th className="px-4 py-3.5 border-r border-emerald-100/80">Stock</th>
                <th className="px-4 py-3.5">Capital</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/80">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="text-stone-800 transition-colors duration-150 hover:bg-[#f3f9f5] group"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5 border-l-4 border-transparent group-hover:border-l-[#1a7949] transition-all">
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
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg shadow-2xs">
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

                    {/* Selling Price (Green Column) */}
                    <td className="px-4 py-3.5 font-mono font-black bg-emerald-50/80 border-x border-emerald-200/60 shadow-2xs">
                      {p.selling_price === null ? (
                        <span className="badge badge-amber text-[10px]">
                          Price TBD
                        </span>
                      ) : (
                        <span className="text-[#0f4e2b] text-sm">
                          {formatPrice(p.selling_price)}
                        </span>
                      )}
                    </td>

                    {/* Quantity & Stock Badge */}
                    <td className="px-4 py-3.5 border-r border-emerald-100/80">
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/90 bg-emerald-50/90 px-2.5 py-1 text-xs font-bold text-[#145a37] shadow-2xs hover:bg-emerald-100 hover:border-emerald-500 transition-all cursor-pointer"
                            title="Edit product details"
                          >
                            <svg className="w-3.5 h-3.5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setPendingArchiveProduct(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300/80 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-600 shadow-2xs hover:bg-stone-100 hover:border-stone-400 hover:text-stone-800 transition-all cursor-pointer"
                            title="Archive product"
                          >
                            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span>Archive</span>
                          </button>
                          <button
                            onClick={() => setPendingDeleteProduct(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-[#782d2d] shadow-2xs hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
                            title="Permanently delete product"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPendingRestoreProduct(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400 bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-[#0f4e2b] shadow-2xs hover:bg-emerald-200 transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => setPendingDeleteProduct(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-[#782d2d] shadow-2xs hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
                            title="Permanently delete product"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
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

      {/* ── Confirmation Modal: Delete Product ── */}
      <ConfirmModal
        open={Boolean(pendingDeleteProduct)}
        title={`Delete product "${pendingDeleteProduct?.name}"?`}
        description={
          <span>
            Are you sure you want to permanently delete{" "}
            <strong>&quot;{pendingDeleteProduct?.name}&quot;</strong> from your catalog? This will remove all associated stock and pricing data and cannot be undone.
          </span>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteProduct(null)}
      />

      {/* ── Confirmation Modal: Archive Product ── */}
      <ConfirmModal
        open={Boolean(pendingArchiveProduct)}
        title={`Archive product "${pendingArchiveProduct?.name}"?`}
        description={
          <span>
            This will hide <strong>&quot;{pendingArchiveProduct?.name}&quot;</strong> from active sales and your public customer price list. You can restore it anytime from the Archived tab.
          </span>
        }
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="warning"
        loading={actionLoading}
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchiveProduct(null)}
      />

      {/* ── Confirmation Modal: Restore Product ── */}
      <ConfirmModal
        open={Boolean(pendingRestoreProduct)}
        title={`Restore product "${pendingRestoreProduct?.name}"?`}
        description={
          <span>
            Restore <strong>&quot;{pendingRestoreProduct?.name}&quot;</strong> back to active store inventory and make it visible on the public price list?
          </span>
        }
        confirmLabel="Restore"
        cancelLabel="Cancel"
        variant="primary"
        loading={actionLoading}
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestoreProduct(null)}
      />
    </div>
  );
}
