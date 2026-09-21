"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateUserProfile } from "@/app/(dashboard)/actions";

export type ProfileData = {
  fullName: string;
  phone: string;
  storeName: string;
  location: string;
  bio: string;
  email: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  role: "owner" | "member";
};

export type StoreStats = {
  totalProducts: number;
  activeProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  categoriesCount: number;
  categoryBreakdown: { name: string; count: number }[];
};

export default function ProfileClient({
  user,
  inventories,
  stats,
}: {
  user: ProfileData;
  inventories: InventoryItem[];
  stats: StoreStats;
}) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    storeName: user.storeName || "",
    location: user.location || "",
    bio: user.bio || "",
  });

  const [selectedInventoryId, setSelectedInventoryId] = useState(
    inventories[0]?.id || ""
  );

  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedInventory = inventories.find((inv) => inv.id === selectedInventoryId) || inventories[0];

  function getInitials(name: string, fallback: string) {
    const clean = name.trim();
    if (!clean) return fallback.charAt(0).toUpperCase() || "S";
    const parts = clean.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("idle");
    setErrorMessage("");

    startTransition(async () => {
      const res = await updateUserProfile(form);
      if (res?.error) {
        setSaveStatus("error");
        setErrorMessage(res.error);
      } else {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 4000);
      }
    });
  }

  function getShareUrl() {
    if (typeof window === "undefined") return "";
    const base = window.location.origin;
    return `${base}/price-list/${selectedInventory?.id || ""}`;
  }

  async function handleShare() {
    const shareUrl = getShareUrl();
    const shareTitle = `${form.storeName || "SariSmart Store"} - Live Price List`;
    const shareText = `🏪 ${form.storeName || "Sari-Sari Store"}
👤 Owner: ${form.fullName || "Store Owner"}
${form.phone ? `📞 Contact: ${form.phone}\n` : ""}${form.location ? `📍 Location: ${form.location}\n` : ""}📦 In-Stock Catalog: ${stats.activeProducts} items available

Check our live retail prices and inventory catalog here:
${shareUrl}

Powered by SariSmart OS 🌿`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share was canceled or not permitted
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      // Ignored
    }
  }

  async function handleCopyLink() {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignored
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-900/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1.5">
            <Link href="/" className="hover:underline flex items-center gap-1 text-stone-500 hover:text-[#1a7949]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Store Hub</span>
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[#1a7949]">Store Profile &amp; Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-heading">
            My Profile &amp; Store Identity
          </h1>
          <p className="mt-1 text-sm text-stone-500 font-medium">
            Manage your store operator credentials, public presence, and inventory overview.
          </p>
        </div>

        {/* Quick Hub Return */}
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-secondary text-xs sm:text-sm py-2 px-3.5">
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Switch Store</span>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Operator Profile Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 sm:p-8 bg-white border-emerald-900/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-[#1a7949] flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-heading">
                  Operator Credentials
                </h2>
                <p className="text-xs text-stone-500">
                  Information displayed on customer digital receipts &amp; public price menus.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 relative z-10">
              {/* Notification Banner */}
              {saveStatus === "success" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-[#0f472b] flex items-center gap-2.5 animate-fade-in shadow-xs">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">Profile details saved successfully!</span>
                </div>
              )}

              {saveStatus === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-[#782d2d] flex items-center gap-2.5 animate-fade-in shadow-xs">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{errorMessage || "Failed to update profile."}</span>
                </div>
              )}

              {/* Full Name & Store Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Owner Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. Maria Santos"
                      className="input input-has-icon-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Official Store Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      placeholder="e.g. Maria's Sari-Sari Store"
                      className="input input-has-icon-left font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Contact / GCash Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. 0917-890-1234"
                      className="input input-has-icon-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Login Email (Verified)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input input-has-icon-left bg-stone-100/70 text-stone-500 cursor-not-allowed border-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Store Location / Barangay / City
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Purok 3, Brgy. San Jose, Cebu City"
                    className="input input-has-icon-left"
                  />
                </div>
              </div>

              {/* Bio & Operating Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Operating Hours &amp; Customer Notes
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. Open daily from 6:00 AM to 10:00 PM. GCash accepted. Cold softdrinks and ice always available!"
                  className="input py-2.5 resize-none text-stone-700"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary px-6 py-2.5 text-sm shadow-md font-bold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving Profile...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Profile</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Store Review Card & Sharing (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity & Inventory Review Card */}
          <div className="card bg-gradient-to-b from-white to-[#f7faf8] border-emerald-900/15 p-6 shadow-md relative overflow-hidden">
            {/* Top Emerald Header Accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]" />

            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a7949] to-[#0d4025] flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-emerald-300/40">
                  {getInitials(form.storeName || form.fullName, user.email)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 tracking-tight leading-snug">
                    {form.storeName || "My Sari-Sari Store"}
                  </h3>
                  <p className="text-xs font-bold text-emerald-800">
                    {form.fullName || "Proprietor"}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[200px]">
                    {form.location || "Store Location not set"}
                  </p>
                </div>
              </div>

              <span className="badge badge-mint shrink-0 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            {/* Inventory Branch Picker (if multiple stores) */}
            {inventories.length > 1 && (
              <div className="mb-5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3">
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                  Select Catalog to Review &amp; Share:
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  className="w-full text-xs font-bold text-stone-800 bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a7949]"
                >
                  {inventories.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.role === "owner" ? "Owner" : "Member"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Key Telemetry Stats Grid */}
            <div className="border-t border-b border-stone-200/70 py-4 my-4">
              <h4 className="text-[11px] font-black text-stone-500 uppercase tracking-wider mb-3">
                Store Inventory Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-white border border-stone-200 p-3 shadow-xs">
                  <div className="text-xl font-black text-[#1a7949] font-mono">
                    {stats.activeProducts}
                  </div>
                  <div className="text-[11px] font-bold text-stone-600">Active SKUs</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-medium">In live catalog</div>
                </div>

                <div className="rounded-xl bg-white border border-stone-200 p-3 shadow-xs">
                  <div className="text-xl font-black text-stone-800 font-mono">
                    {stats.totalStockUnits}
                  </div>
                  <div className="text-[11px] font-bold text-stone-600">Total Units</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-medium">Stock on shelf</div>
                </div>

                <div className="rounded-xl bg-white border border-stone-200 p-3 shadow-xs">
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    {stats.categoriesCount}
                  </div>
                  <div className="text-[11px] font-bold text-stone-600">Categories</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-medium">Sari categories</div>
                </div>

                <div className="rounded-xl bg-white border border-stone-200 p-3 shadow-xs">
                  <div className={`text-xl font-black font-mono ${stats.lowStockProducts > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {stats.lowStockProducts}
                  </div>
                  <div className="text-[11px] font-bold text-stone-600">Low Stock SKUs</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-medium">{"\u2264"} 5 units remaining</div>
                </div>
              </div>
            </div>

            {/* Top Categories Pill Breakdown */}
            {stats.categoryBreakdown.length > 0 && (
              <div className="mb-5">
                <h5 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Top Retail Categories
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {stats.categoryBreakdown.slice(0, 8).map((cat) => (
                    <span
                      key={cat.name}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2 py-1 text-[11px] font-medium text-[#135a34]"
                    >
                      <span>{cat.name}</span>
                      <span className="rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[10px] font-bold">
                        {cat.count}
                      </span>
                    </span>
                  ))}
                  {stats.categoryBreakdown.length > 8 && (
                    <span className="inline-flex items-center rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-500">
                      +{stats.categoryBreakdown.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sharing Action Hub */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleShare}
                className="btn btn-primary w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{copiedShare ? "Summary Copied to Clipboard!" : "Share Store & Price List"}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-secondary text-xs py-2 px-2.5 flex items-center justify-center gap-1.5 font-bold"
                  title="Copy Customer Price List Link"
                >
                  <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                </button>

                {selectedInventory && (
                  <Link
                    href={`/price-list/${selectedInventory.id}`}
                    target="_blank"
                    className="btn btn-secondary text-xs py-2 px-2.5 flex items-center justify-center gap-1.5 font-bold hover:text-[#1a7949]"
                  >
                    <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Preview Menu</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Help text */}
            <p className="mt-3 text-[11px] text-center text-stone-400 font-medium">
              Customers can view your real-time prices on any phone or browser without logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
