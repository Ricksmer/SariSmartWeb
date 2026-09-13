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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleExport() {
    setError(null);
    if (selectedIds.length === 0) {
      setError("Select at least one product first.");
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
        throw new Error(body.error || "Could not generate the PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarismart-price-list-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <p className="mb-6 text-sm text-stone-500">
        Choose what to include, then generate a PDF with brand, name, price, and remarks.
      </p>

      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100/80 p-1 text-sm w-fit">
        <ModeButton current={mode} value="all" onClick={setMode}>
          All products
        </ModeButton>
        <ModeButton current={mode} value="categories" onClick={setMode}>
          By category
        </ModeButton>
        <ModeButton current={mode} value="items" onClick={setMode}>
          Specific items
        </ModeButton>
      </div>

      {mode === "categories" && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-stone-400">No categories yet.</p>
          )}
          {categories.map((c) => {
            const active = selectedCategories.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {mode === "items" && (
        <div className="mb-6">
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input mb-3 max-w-xs"
          />
          <div className="card max-h-72 overflow-y-auto">
            {filteredItems.length ? (
              filteredItems.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-stone-50 px-4 py-2.5 text-sm last:border-b-0 hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(p.id)}
                    onChange={() => toggleItem(p.id)}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span className="font-medium text-stone-800">{p.name}</span>
                  {p.brand && <span className="text-stone-400">{p.brand}</span>}
                </label>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-stone-400">No matches.</p>
            )}
          </div>
        </div>
      )}

      <div className="card p-4">
        <p className="text-sm text-stone-700">
          <span className="font-medium">{selectedIds.length}</span> product
          {selectedIds.length === 1 ? "" : "s"} selected
        </p>
        {missingPriceCount > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            {missingPriceCount} of these have no selling price yet — they'll print as "TBD".
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button onClick={handleExport} disabled={generating} className="btn btn-primary mt-4">
          {generating ? "Generating..." : "Download PDF"}
        </button>
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
      className={`rounded-lg px-3.5 py-1.5 font-medium transition ${
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
      }`}
    >
      {children}
    </button>
  );
}
