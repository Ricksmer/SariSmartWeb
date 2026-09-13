"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { PublicProduct } from "@/lib/types";
import { formatPrice } from "@/lib/types";

export default function PriceListPage() {
  const { inventoryId } = useParams<{ inventoryId: string }>();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetch(`/api/public-products/${inventoryId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load the price list.");
        return res.json();
      })
      .then((body) => setProducts(body.products))
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [inventoryId]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category_name).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchesCategory = !category || p.category_name === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">Price list</h1>
        <p className="mb-6 text-sm text-stone-500">Search for an item to see its price.</p>

        <input
          placeholder="Search name or brand..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input mb-3"
        />

        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                category === ""
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-300 bg-white text-stone-600"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  category === c
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-stone-300 bg-white text-stone-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-stone-400">Loading...</p>}
        {error && <p className="py-10 text-center text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <ul className="card divide-y divide-stone-100">
            {filtered.length ? (
              filtered.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.name}</p>
                    {p.brand && <p className="text-xs text-stone-400">{p.brand}</p>}
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {formatPrice(p.selling_price)}
                  </p>
                </li>
              ))
            ) : (
              <li className="px-4 py-10 text-center text-sm text-stone-400">
                No items match your search.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
