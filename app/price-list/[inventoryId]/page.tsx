"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { PublicProduct } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import Logo from "@/components/ui/Logo";

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
        if (!res.ok) throw new Error("Could not load the store price list.");
        return res.json();
      })
      .then((body) => setProducts(body.products || []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load catalog."))
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
    <div className="min-h-screen bg-[#f8faf8] bg-mesh-pattern px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg animate-fade-in">
        {/* Customer Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="md" variant="full" className="mb-2" />
          <h1 className="text-xl font-black tracking-tight text-stone-900 font-sans">
            Store Price List
          </h1>
          <p className="mt-1 text-xs text-stone-500 font-medium">
            Live prices for in-stock retail goods &bull; Updated daily
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            placeholder="Search items, drinks, snacks, canned goods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10 text-sm shadow-xs bg-white"
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

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory("")}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                category === ""
                  ? "bg-[#1a7949] text-white shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  category === c
                    ? "bg-[#1a7949] text-white shadow-xs"
                    : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* State Indicators */}
        {loading && (
          <div className="card py-16 text-center text-stone-400 flex flex-col items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-[#1a7949] mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">Loading store prices...</span>
          </div>
        )}

        {error && (
          <div className="card py-12 px-6 text-center border-red-200 bg-red-50/50">
            <p className="text-xs font-semibold text-[#782d2d]">{error}</p>
          </div>
        )}

        {/* Product Price Cards */}
        {!loading && !error && (
          <div className="card overflow-hidden border-stone-200/90 shadow-sm bg-white divide-y divide-stone-100">
            {filtered.length > 0 ? (
              filtered.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-[#fcfdfc] transition-colors"
                >
                  <div className="pr-4">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {p.brand && (
                        <span className="text-xs font-bold text-[#1a7949]">
                          {p.brand} &bull;
                        </span>
                      )}
                      <span className="text-sm font-bold text-stone-900">
                        {p.name}
                      </span>
                      {p.unit && (
                        <span className="badge badge-mint font-mono text-[10px] py-0">
                          ({p.unit})
                        </span>
                      )}
                    </div>
                    {p.category_name && (
                      <p className="text-[11px] font-medium text-stone-400 mt-0.5">
                        {p.category_name}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-black text-[#0f472b]">
                      {formatPrice(p.selling_price)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-14 px-4 text-center">
                <p className="text-sm font-bold text-stone-700">No items match your search</p>
                <p className="text-xs text-stone-400 mt-1">Try typing a different item or brand name.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-[11px] text-stone-400">
          Powered by <span className="font-bold text-[#1a7949]">SariSmart</span> Retail Operations
        </div>
      </div>
    </div>
  );
}
