import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/types";

export default async function InventoryOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("inventory_id", id)
      .order("name"),
    supabase
      .from("products")
      .select("id, name, buy_price, selling_price, quantity, archived, category_id, unit")
      .eq("inventory_id", id)
      .order("name"),
  ]);

  const active = products?.filter((p) => !p.archived) ?? [];
  const archivedCount = products?.filter((p) => p.archived).length ?? 0;
  const totalProducts = active.length;
  const totalUnits = active.reduce((sum, p) => sum + p.quantity, 0);

  // Pricing & Margins
  const missingPrice = active.filter((p) => p.selling_price === null).length;
  const lowStock = active.filter((p) => p.quantity > 0 && p.quantity <= 5).length;
  const outOfStock = active.filter((p) => p.quantity === 0).length;
  const healthyStock = active.filter((p) => p.quantity > 5).length;

  const totalCost = active.reduce((sum, p) => sum + (p.buy_price ?? 0) * p.quantity, 0);
  const totalRetail = active.reduce((sum, p) => sum + (p.selling_price ?? 0) * p.quantity, 0);
  const projectedProfit = totalRetail - totalCost;
  const avgMargin = totalRetail > 0 ? (projectedProfit / totalRetail) * 100 : 0;

  // Category Distribution & Telemetry
  const categoryStats = (categories ?? [])
    .map((cat) => {
      const catProducts = active.filter((p) => p.category_id === cat.id);
      const count = catProducts.length;
      const stock = catProducts.reduce((sum, p) => sum + p.quantity, 0);
      const value = catProducts.reduce((sum, p) => sum + (p.selling_price ?? 0) * p.quantity, 0);
      return {
        id: cat.id,
        name: cat.name,
        count,
        stock,
        value,
        percentOfTotal: totalProducts > 0 ? (count / totalProducts) * 100 : 0,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const uncategorized = active.filter((p) => !p.category_id);
  if (uncategorized.length > 0) {
    const val = uncategorized.reduce((sum, p) => sum + (p.selling_price ?? 0) * p.quantity, 0);
    categoryStats.push({
      id: "uncat",
      name: "Uncategorized",
      count: uncategorized.length,
      stock: uncategorized.reduce((sum, p) => sum + p.quantity, 0),
      value: val,
      percentOfTotal: totalProducts > 0 ? (uncategorized.length / totalProducts) * 100 : 0,
    });
  }

  // Top Products by Retail Price
  const topPricedItems = [...active]
    .filter((p) => p.selling_price !== null)
    .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-[1920px] mx-auto">
      {/* 5 Financial & Inventory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active SKUs"
          value={String(totalProducts)}
          subtext={`${totalUnits} total units in stock`}
          icon={
            <svg className="w-5 h-5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          iconBg="bg-[#eaf6ee]"
          tone="default"
        />

        <StatCard
          label="Total Unit Cost"
          value={formatPrice(totalCost)}
          subtext="Capital invested in stock"
          icon={
            <svg className="w-5 h-5 text-[#145a37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-emerald-50"
          tone="default"
        />

        <StatCard
          label="Retail Value"
          value={formatPrice(totalRetail)}
          subtext="Total sell-through value"
          icon={
            <svg className="w-5 h-5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconBg="bg-emerald-100/60"
          tone="default"
        />

        <StatCard
          label="Projected Profit"
          value={formatPrice(projectedProfit)}
          subtext={`${avgMargin.toFixed(1)}% store gross margin`}
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-emerald-50"
          tone="default"
        />

        <StatCard
          label="Catalog Health"
          value={missingPrice === 0 ? "100% Priced" : `${missingPrice} Unpriced`}
          subtext={outOfStock > 0 ? `${outOfStock} out of stock` : `${lowStock} low stock`}
          icon={
            <svg className={`w-5 h-5 ${missingPrice > 0 || outOfStock > 0 ? "text-amber-600" : "text-[#1a7949]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg={missingPrice > 0 || outOfStock > 0 ? "bg-amber-50" : "bg-[#eaf6ee]"}
          tone={missingPrice > 0 ? "warning" : "default"}
        />
      </div>

      {/* Quick Operations Hub: Deep Forest Green Background with High-Contrast White Buttons */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#062414] via-[#0d4527] to-[#145a37] text-white shadow-xl border-2 border-emerald-600/30 relative overflow-hidden">
        {/* Ambient background glow accents */}
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute left-10 top-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-black text-white text-lg sm:text-xl font-heading tracking-tight">
                Quick Operations Hub
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium">
                Fast access to catalog management, aisles configuration, and price list exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* Tile 1: Manage Products */}
            <Link
              href={`/inventories/${id}/products`}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-300 transition-all text-center group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#0e4829] group-hover:bg-[#0e4829] group-hover:text-white transition-all mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-[#0e4829] transition-colors">
                Manage Products
              </span>
              <span className="text-[10px] font-bold text-stone-400 mt-0.5">
                {totalProducts} SKUs
              </span>
            </Link>

            {/* Tile 2: Categories */}
            <Link
              href={`/inventories/${id}/categories`}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-300 transition-all text-center group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#0e4829] group-hover:bg-[#0e4829] group-hover:text-white transition-all mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-[#0e4829] transition-colors">
                Aisles &amp; Categories
              </span>
              <span className="text-[10px] font-bold text-stone-400 mt-0.5">
                {(categories?.length ?? 0)} Aisles
              </span>
            </Link>

            {/* Tile 3: Print Price List (PDF) */}
            <Link
              href={`/inventories/${id}/products/export`}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-300 transition-all text-center group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#0e4829] group-hover:bg-[#0e4829] group-hover:text-white transition-all mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-[#0e4829] transition-colors">
                Print Price List
              </span>
              <span className="text-[10px] font-bold text-stone-400 mt-0.5">
                Export PDF
              </span>
            </Link>

            {/* Tile 4: Customer Menu */}
            <Link
              href={`/price-list/${id}`}
              target="_blank"
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-300 transition-all text-center group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#0e4829] group-hover:bg-[#0e4829] group-hover:text-white transition-all mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-[#0e4829] transition-colors flex items-center gap-1">
                <span>Customer Menu</span>
                <span className="text-[10px] text-stone-400">↗</span>
              </span>
              <span className="text-[10px] font-bold text-stone-400 mt-0.5">
                Public Live Link
              </span>
            </Link>

            {/* Tile 5: Store Settings */}
            <Link
              href={`/inventories/${id}/settings`}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-300 transition-all text-center group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#0e4829] group-hover:bg-[#0e4829] group-hover:text-white transition-all mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-[#0e4829] transition-colors">
                Store Settings
              </span>
              <span className="text-[10px] font-bold text-stone-400 mt-0.5">
                Staff &amp; Branch
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Telemetry & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department & Category Distribution */}
        <div className="card p-6 border-emerald-900/10 shadow-[0_4px_25px_-4px_rgba(26,121,73,0.06)] bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-stone-900 text-base font-heading">
                  Department &amp; Aisle Distribution
                </h4>
                <p className="text-xs text-stone-500 font-medium">
                  Product catalog distribution across aisles and store departments.
                </p>
              </div>
              <Link
                href={`/inventories/${id}/categories`}
                className="text-xs font-bold text-[#145a37] hover:underline"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              {categoryStats.slice(0, 7).map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">{cat.name}</span>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        ({cat.count} items)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-stone-600">
                        {cat.count} SKUs
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 w-9 text-right">
                        {cat.percentOfTotal.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#145a37] to-[#2ecc71] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(cat.percentOfTotal, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Configured Categories: <strong>{categoryStats.length}</strong></span>
            <span>Total Catalog Products: <strong className="text-[#145a37]">{totalProducts} SKUs</strong></span>
          </div>
        </div>

        {/* Stock Health & Highest Price Items */}
        <div className="space-y-6">
          {/* Stock Health Bar */}
          <div className="card p-6 border-emerald-900/10 shadow-[0_4px_25px_-4px_rgba(26,121,73,0.06)] bg-white">
            <h4 className="font-extrabold text-stone-900 text-base font-heading mb-1">
              Stock Availability Health
            </h4>
            <p className="text-xs text-stone-500 font-medium mb-4">
              Real-time shelf inventory status across all {totalProducts} items.
            </p>

            {/* Segmented Bar Meter */}
            <div className="w-full h-3 rounded-full bg-stone-100 flex overflow-hidden mb-3">
              <div
                className="bg-[#145a37] transition-all"
                style={{ width: `${totalProducts > 0 ? (healthyStock / totalProducts) * 100 : 0}%` }}
                title={`Well-Stocked: ${healthyStock} items`}
              />
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${totalProducts > 0 ? (lowStock / totalProducts) * 100 : 0}%` }}
                title={`Low Stock: ${lowStock} items`}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0}%` }}
                title={`Out of Stock: ${outOfStock} items`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-[#145a37] tracking-wider block">
                  Well-Stocked
                </span>
                <span className="text-base font-black text-[#145a37]">{healthyStock}</span>
                <span className="text-[10px] text-stone-400 block">&gt; 5 units</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  Low Stock
                </span>
                <span className="text-base font-black text-amber-800">{lowStock}</span>
                <span className="text-[10px] text-stone-400 block">1 - 5 units</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100">
                <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider block">
                  Out of Stock
                </span>
                <span className="text-base font-black text-red-800">{outOfStock}</span>
                <span className="text-[10px] text-stone-400 block">0 units</span>
              </div>
            </div>
          </div>

          {/* Highest Retail Price Catalog Items */}
          <div className="card p-6 border-emerald-900/10 shadow-[0_4px_25px_-4px_rgba(26,121,73,0.06)] bg-white">
            <h4 className="font-extrabold text-stone-900 text-base font-heading mb-1">
              Top Value Retail Items
            </h4>
            <p className="text-xs text-stone-500 font-medium mb-3">
              Highest-priced retail inventory in your catalog.
            </p>

            <div className="divide-y divide-stone-100">
              {topPricedItems.map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-[10px] font-bold text-[#145a37]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-800 truncate max-w-[220px]" title={item.name}>
                      {item.name}
                    </span>
                    {item.unit && (
                      <span className="text-[10px] font-mono text-stone-400">
                        ({item.unit})
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-[#145a37]">
                    {formatPrice(item.selling_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Health Alert Banner */}
      {(missingPrice > 0 || lowStock > 0 || outOfStock > 0) && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/95 via-amber-50/60 to-amber-100/20 p-5 shadow-xs flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-amber-950 text-sm font-heading">
              Store Catalog Attention Required
            </h4>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              {missingPrice > 0 && `${missingPrice} item${missingPrice === 1 ? "" : "s"} have no selling price set. `}
              {lowStock > 0 && `${lowStock} item${lowStock === 1 ? "" : "s"} have low stock (≤ 5 units). `}
              {outOfStock > 0 && `${outOfStock} item${outOfStock === 1 ? "" : "s"} are out of stock.`}
            </p>
            <div className="mt-3">
              <Link
                href={`/inventories/${id}/products`}
                className="text-xs font-black text-amber-900 hover:text-[#1a7949] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Fix items in Products catalog</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  iconBg,
  tone = "default",
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  tone?: "default" | "warning" | "danger";
}) {
  const valueColor =
    tone === "danger"
      ? "text-[#782d2d]"
      : tone === "warning"
      ? "text-amber-800"
      : "text-[#145a37]";

  const borderAccent =
    tone === "danger"
      ? "from-[#782d2d] to-red-400"
      : tone === "warning"
      ? "from-amber-600 to-amber-300"
      : "from-[#145a37] via-[#1a7949] to-[#2ecc71]";

  return (
    <div className="card p-5 border-emerald-900/10 hover:border-emerald-300 transition-all relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(22,29,38,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(26,121,73,0.12)] bg-white">
      {/* Top Tone Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${borderAccent}`} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black tracking-wider uppercase text-stone-400 font-heading">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110 shadow-2xs`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl sm:text-3xl font-black tracking-tight font-heading ${valueColor}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-bold text-stone-400">
        {subtext}
      </p>
    </div>
  );
}
