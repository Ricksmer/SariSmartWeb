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

  const { data: products } = await supabase
    .from("products")
    .select("selling_price, buy_price, quantity, archived")
    .eq("inventory_id", id);

  const active = products?.filter((p) => !p.archived) ?? [];
  const archivedCount = products?.filter((p) => p.archived).length ?? 0;
  const totalProducts = active.length;
  const missingPrice = active.filter((p) => p.selling_price === null).length;
  const lowStock = active.filter((p) => p.quantity <= 5).length;
  const capital = active.reduce((sum, p) => sum + (p.buy_price ?? 0) * p.quantity, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Products"
          value={String(totalProducts)}
          subtext={`${archivedCount} archived items`}
          icon={
            <svg className="w-5 h-5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          iconBg="bg-[#eaf6ee]"
          tone="default"
        />

        <StatCard
          label="Missing Prices"
          value={String(missingPrice)}
          subtext={missingPrice === 0 ? "All items priced" : "Requires attention"}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          iconBg="bg-amber-50"
          tone={missingPrice > 0 ? "warning" : "default"}
        />

        <StatCard
          label="Low Stock Items"
          value={String(lowStock)}
          subtext="Quantity ≤ 5 units"
          icon={
            <svg className="w-5 h-5 text-[#782d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-red-50"
          tone={lowStock > 0 ? "danger" : "default"}
        />

        <StatCard
          label="Capital Tied Up"
          value={formatPrice(capital)}
          subtext="Estimated cost value"
          icon={
            <svg className="w-5 h-5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-[#eaf6ee]"
          tone="default"
        />
      </div>

      {/* Quick Operations Strip */}
      <div className="card p-6 border-emerald-200/80 shadow-[0_8px_30px_-6px_rgba(26,121,73,0.08)] bg-gradient-to-br from-white via-[#f8fbf9] to-[#eef8f2] relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-emerald-100/50 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-stone-900 text-base font-heading">Quick Operations Hub</h3>
              <p className="text-xs text-stone-500 font-medium">Frequently accessed retail tools and catalog exports.</p>
            </div>
            <Link
              href={`/price-list/${id}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#145a37] shadow-2xs hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View Customer Menu ↗</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/inventories/${id}/products`}
              className="btn btn-primary btn-shimmer shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Manage Products</span>
            </Link>
            <Link
              href={`/inventories/${id}/products/export`}
              className="btn btn-secondary shadow-xs hover:border-emerald-300 hover:text-[#1a7949]"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print 5-Page PDF</span>
            </Link>
            <Link
              href={`/inventories/${id}/categories`}
              className="btn btn-secondary shadow-xs hover:border-emerald-300 hover:text-[#1a7949]"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Categories</span>
            </Link>
            <Link
              href={`/price-list/${id}`}
              target="_blank"
              className="btn btn-secondary shadow-xs sm:hidden hover:border-emerald-300 hover:text-[#1a7949]"
            >
              <span>Customer Menu ↗</span>
            </Link>
            <Link
              href={`/inventories/${id}/settings`}
              className="btn btn-ghost hover:bg-emerald-50 hover:text-[#1a7949]"
            >
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Invite Staff</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Health Alert Banner */}
      {(missingPrice > 0 || lowStock > 0) && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/95 via-amber-50/60 to-amber-100/20 p-5 shadow-xs flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-amber-950 text-sm font-heading">Store Catalog Attention Required</h4>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              {missingPrice > 0 && `${missingPrice} item${missingPrice === 1 ? "" : "s"} have no selling price set. `}
              {lowStock > 0 && `${lowStock} item${lowStock === 1 ? "" : "s"} are low or out of stock (≤ 5 units).`}
            </p>
            <div className="mt-3">
              <Link
                href={`/inventories/${id}/products`}
                className="text-xs font-black text-amber-900 hover:text-[#1a7949] transition-colors inline-flex items-center gap-1"
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
