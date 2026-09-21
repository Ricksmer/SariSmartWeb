"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";

type Mode = "all" | "categories" | "items";

export default function ExportSelector({
  inventoryId,
  products,
  categories,
}: {
  inventoryId: string;
  products: Product[];
  categories: Category[];
}) {
  const [mode, setMode] = useState<Mode>("all");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const selectedIds = useMemo(() => {
    if (mode === "all") return products.map((p) => p.id);
    if (mode === "categories")
      return products
        .filter((p) => p.category_id && selectedCategories.has(p.category_id))
        .map((p) => p.id);
    return Array.from(selectedItems);
  }, [mode, products, selectedCategories, selectedItems]);

  const missingPriceCount = useMemo(
    () => products.filter((p) => selectedIds.includes(p.id) && p.selling_price === null).length,
    [products, selectedIds]
  );

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleExport() {
    setError(null);
    if (selectedIds.length === 0) {
      setError("Please select at least one product before exporting.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, productIds: selectedIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate the PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarismart-pricelist-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 font-sans">Print &amp; Export Price List</h2>
          <p className="text-xs text-stone-500 mt-1">
            Generate a high-resolution, multi-page PDF catalog with retail prices and units.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-1.5 rounded-2xl bg-stone-100/90 p-1.5 text-xs font-bold border border-stone-200/60 shadow-xs w-fit">
          <ModeButton current={mode} value="all" onClick={setMode}>
            All Store Products
          </ModeButton>
          <ModeButton current={mode} value="categories" onClick={setMode}>
            By Category
          </ModeButton>
          <ModeButton current={mode} value="items" onClick={setMode}>
            Select Specific Items
          </ModeButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Area (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Selection Filter */}
          {mode === "categories" && (
            <div className="card p-6 border-stone-200/90 shadow-sm bg-white animate-fade-in space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Select categories to include:
              </p>
              {categories.length === 0 ? (
                <p className="text-xs text-stone-400">No categories found in this store.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = selectedCategories.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                          active
                            ? "border-[#1a7949] bg-[#1a7949] text-white shadow-xs"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                      >
                        {active ? `✓ ${c.name}` : `+ ${c.name}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Individual Item Selection */}
          {mode === "items" && (
            <div className="card p-6 border-stone-200/90 shadow-sm bg-white animate-fade-in space-y-3">
              <input
                placeholder="Search products to select..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input text-xs"
              />
              <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200/70">
                {filteredItems.length ? (
                  filteredItems.map((p) => {
                    const checked = selectedItems.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-stone-50 ${
                          checked ? "bg-[#eaf6ee]/40 font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(p.id)}
                            className="h-4 w-4 rounded-md accent-[#1a7949] cursor-pointer"
                          />
                          <span className="text-stone-800 font-medium">{p.name}</span>
                          {p.unit && <span className="text-[11px] text-stone-400 font-mono">({p.unit})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#145a37]">
                            {p.selling_price !== null ? `₱${p.selling_price.toFixed(2)}` : "TBD"}
                          </span>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="px-4 py-8 text-center text-xs text-stone-400">No matching products found.</p>
                )}
              </div>
            </div>
          )}

          {mode === "all" && (
            <div className="card p-6 border-stone-200/90 shadow-sm bg-white animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#1a7949]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Complete Catalog Selected</h3>
                  <p className="text-xs text-stone-500">
                    All {products.length} active products will be exported grouped by category into clean A4 printable pages.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary & Download Action Card (Spans 1 col on lg) */}
        <div className="lg:col-span-1">
          <div className="card p-6 border-stone-200/90 shadow-md bg-gradient-to-br from-white to-[#f4faf6] space-y-4">
            <div>
              <div className="text-sm font-bold text-stone-800">
                <span className="text-2xl text-[#1a7949] font-black">{selectedIds.length}</span>{" "}
                {selectedIds.length === 1 ? "Product" : "Products"} Selected
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Ready to compile formatted A4 multi-page document
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={generating || selectedIds.length === 0}
              className="btn btn-primary w-full py-3.5 px-6 text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling PDF...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PDF Catalog</span>
                </>
              )}
            </button>

            {missingPriceCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  {missingPriceCount} of the selected items currently have no selling price and will display as &quot;TBD&quot;.
                </span>
              </div>
            )}

            {error && <p className="text-xs font-semibold text-[#782d2d]">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  current,
  value,
  onClick,
  children,
}: {
  current: Mode;
  value: Mode;
  onClick: (v: Mode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-xl px-3.5 py-1.5 font-bold transition-all duration-200 ${
        active
          ? "bg-white text-[#1a7949] shadow-sm border border-stone-200/50"
          : "text-stone-500 hover:text-stone-900 hover:bg-white/60"
      }`}
    >
      {children}
    </button>
  );
}
