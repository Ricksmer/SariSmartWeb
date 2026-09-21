"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import {
  formatPrice,
  totalUnitCost,
  unitProfit,
  totalProfit,
  profitMargin,
} from "@/lib/types";
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
  const [isMaximized, setIsMaximized] = useState(false);

  const archivedCount = useMemo(() => products.filter((p) => p.archived).length, [products]);
  const activeCount = useMemo(() => products.filter((p) => !p.archived).length, [products]);

  // Overall Financial KPIs for active inventory
  const financialStats = useMemo(() => {
    const activeItems = products.filter((p) => !p.archived);
    let totalStock = 0;
    let totalCost = 0;
    let totalProjectedProfit = 0;

    for (const p of activeItems) {
      totalStock += p.quantity;
      if (p.buy_price !== null) {
        totalCost += p.buy_price * p.quantity;
      }
      if (p.selling_price !== null && p.buy_price !== null) {
        totalProjectedProfit += (p.selling_price - p.buy_price) * p.quantity;
      }
    }

    return {
      totalSKUs: activeItems.length,
      totalStock,
      totalCost,
      totalProjectedProfit,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (view === "active" && p.archived) return false;
      if (view === "archived" && !p.archived) return false;
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
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

      {/* Financial KPIs & Store Summary Bar */}
      {view === "active" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-3.5 bg-white border-emerald-900/10 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Active SKUs</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-stone-900 font-sans">{financialStats.totalSKUs}</span>
              <span className="text-[11px] text-stone-400 font-medium">products listed</span>
            </div>
          </div>

          <div className="card p-3.5 bg-white border-emerald-900/10 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Inventory Stock</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-[#145a37] font-sans">{financialStats.totalStock}</span>
              <span className="text-[11px] text-stone-400 font-medium">units on shelf</span>
            </div>
          </div>

          <div className="card p-3.5 bg-white border-emerald-900/10 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Unit Cost</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-stone-800 font-mono">
                ₱{financialStats.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-stone-400 font-medium">invested</span>
            </div>
          </div>

          <div className="card p-3.5 bg-gradient-to-br from-emerald-50 via-[#f3f9f5] to-emerald-100/50 border-emerald-300/80 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#145a37] uppercase tracking-wider">Projected Total Profit</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-[#0f4e2b] font-mono">
                ₱{financialStats.totalProjectedProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">gross potential</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-has-icon-left text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Dropdown (Clean, properly padded with custom SVG chevron) */}
        <div className="relative w-full sm:w-60">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-stone-200/90 bg-white px-4 py-2.5 pr-10 text-xs sm:text-sm font-bold text-stone-800 shadow-2xs hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer transition-all"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* View Toggle: Minimize (Screen Size + Slider) vs Maximize (Full Page) */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              isMaximized
                ? "border-emerald-700 bg-[#0e4829] text-white hover:bg-[#145a37]"
                : "border-stone-300/80 bg-white text-stone-700 hover:border-emerald-500 hover:text-[#1a7949]"
            }`}
            title={
              isMaximized
                ? "Minimize View: fit within screen height with right scroll slider"
                : "Maximize View: expand full page without container scrolling"
            }
          >
            {isMaximized ? (
              <>
                <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Minimize View</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m0 0l-5-5" />
                </svg>
                <span>Maximize View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Luxury Products Table */}
      <div className={`rounded-2xl ${isMaximized ? "overflow-visible border-0 bg-transparent shadow-none" : "overflow-hidden border border-emerald-900/10 shadow-[0_8px_30px_-6px_rgba(26,121,73,0.06)] bg-white"} relative transition-all`}>
        {/* Top Hairline only for minimized view */}
        {!isMaximized && (
          <div className="h-1 bg-gradient-to-r from-[#0e4829] via-[#145a37] to-[#2ecc71] w-full" />
        )}

        <div className={`overflow-x-auto ${isMaximized ? "overflow-y-visible" : "max-h-[calc(100vh-280px)] min-h-[460px] overflow-y-auto custom-scrollbar"}`}>
          <table className="w-full text-left text-sm border-separate border-spacing-0 bg-white rounded-2xl overflow-hidden border border-emerald-900/10 shadow-sm">
            <thead className={`sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white shadow-md transition-all`}>
              <tr className="text-[11px] font-black uppercase tracking-wider text-white font-heading">
                <th className={`px-5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Product Name</th>
                <th className={`px-3 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Size / Unit</th>
                <th className={`px-3.5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Category</th>
                <th className={`px-3.5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Unit Cost</th>
                <th className={`px-4 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#145a37] text-emerald-100 font-black border-x border-[#1a7949] border-b border-emerald-950`}>
                  Retail Price (₱)
                </th>
                <th className={`px-3 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Profit</th>
                <th className={`px-3.5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Stock</th>
                <th className={`px-3.5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Total Unit Cost</th>
                <th className={`px-3.5 py-3.5 sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-emerald-200 border-b border-emerald-950`}>Total Profit</th>
                <th className={`px-5 py-3.5 text-right sticky ${isMaximized ? "top-[61px]" : "top-0"} z-20 bg-[#0e4829] text-white border-b border-emerald-950`}>Actions</th>
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

                    {/* Size formatted in parentheses */}
                    <td className="px-3 py-3.5">
                      {p.unit ? (
                        <span className="badge badge-mint font-mono text-[11px]">
                          ({p.unit})
                        </span>
                      ) : (
                        <span className="text-stone-300">&mdash;</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3.5 py-3.5">
                      {p.category?.name ? (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 px-2 py-0.5 rounded-lg shadow-2xs">
                          {p.category.name}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs italic">Uncategorized</span>
                      )}
                    </td>

                    {/* Unit Cost (formerly Buy Price) */}
                    <td className="px-3.5 py-3.5 font-mono text-stone-500 text-xs">
                      {formatPrice(p.buy_price)}
                    </td>

                    {/* Retail Price (Green Column, formerly Selling Price) */}
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

                    {/* Profit per Unit */}
                    <td className="px-3 py-3.5 font-mono text-xs">
                      {(() => {
                        const pfit = unitProfit(p);
                        if (pfit === null) return <span className="text-stone-300">&mdash;</span>;
                        const margin = profitMargin(p.buy_price, p.selling_price);
                        return (
                          <div className="flex flex-col">
                            <span className={pfit >= 0 ? "text-[#145a37] font-bold" : "text-rose-600 font-bold"}>
                              {formatPrice(pfit)}
                            </span>
                            {margin !== null && (
                              <span className="text-[10px] text-stone-400 font-sans font-normal">
                                {margin.toFixed(0)}% margin
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Quantity & Stock Badge */}
                    <td className="px-3.5 py-3.5 border-r border-emerald-100/80">
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

                    {/* Total Unit Cost (formerly Capital) */}
                    <td className="px-3.5 py-3.5 font-mono text-stone-500 text-xs">
                      {formatPrice(totalUnitCost(p))}
                    </td>

                    {/* Total Profit */}
                    <td className="px-3.5 py-3.5 font-mono text-xs font-black text-[#145a37]">
                      {formatPrice(totalProfit(p))}
                    </td>

                    {/* Actions (Icon-only buttons with tooltips) */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs font-semibold">
                      {view === "active" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg border border-emerald-300/90 bg-emerald-50/90 text-[#145a37] shadow-2xs hover:bg-emerald-100 hover:border-emerald-500 transition-all cursor-pointer"
                            title="Edit product details"
                            aria-label="Edit product details"
                          >
                            <svg className="w-4 h-4 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingArchiveProduct(p)}
                            className="p-1.5 rounded-lg border border-stone-300/80 bg-stone-50 text-stone-600 shadow-2xs hover:bg-stone-100 hover:border-stone-400 hover:text-stone-800 transition-all cursor-pointer"
                            title="Archive product"
                            aria-label="Archive product"
                          >
                            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteProduct(p)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-[#782d2d] shadow-2xs hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
                            title="Permanently delete product"
                            aria-label="Permanently delete product"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPendingRestoreProduct(p)}
                            className="p-1.5 rounded-lg border border-emerald-400 bg-emerald-100/80 text-[#0f4e2b] shadow-2xs hover:bg-emerald-200 transition-all cursor-pointer"
                            title="Restore product to active"
                            aria-label="Restore product to active"
                          >
                            <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteProduct(p)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-[#782d2d] shadow-2xs hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer"
                            title="Permanently delete product"
                            aria-label="Permanently delete product"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
