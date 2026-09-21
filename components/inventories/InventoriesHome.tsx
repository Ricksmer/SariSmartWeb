"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createInventory, joinInventory } from "@/app/(dashboard)/actions";

type InventoryCard = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  role: "owner" | "member";
};

export default function InventoriesHome({ inventories }: { inventories: InventoryCard[] }) {
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "create" | "join">("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for securely revealing invite codes per store
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function toggleReveal(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopy(code: string, id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please give your inventory a name.");
      return;
    }
    setLoading(true);
    const result = await createInventory(name);
    setLoading(false);
    if (result.error || !result.inventory) {
      setError(result.error ?? "Could not create the inventory.");
      return;
    }
    router.push(`/inventories/${result.inventory.id}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Enter an 8-character inventory code.");
      return;
    }
    setLoading(true);
    const result = await joinInventory(code);
    setLoading(false);
    if (result.error || !result.inventory) {
      setError(result.error ?? "Could not join that inventory.");
      return;
    }
    router.push(`/inventories/${result.inventory.id}`);
  }

  // Separate owned vs member-only stores
  const ownedStores = inventories.filter((inv) => inv.role === "owner");
  const memberStores = inventories.filter((inv) => inv.role === "member");

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Rich Emerald Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#082a17] via-[#104b2b] to-[#1a7949] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-emerald-700/30">
        <div className="pointer-events-none absolute inset-0 bg-stripes-emerald-dark opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse-glow" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Multi-Branch Management &bull; {inventories.length} {inventories.length === 1 ? "Active Store" : "Active Stores"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-heading">
              Store Hub &amp; Inventories
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Manage retail branches, switch live product catalogs, print 5-page price lists, and collaborate with staff.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setPanel(panel === "join" ? "none" : "join");
                setError(null);
              }}
              className="btn bg-white/15 text-white hover:bg-white/25 border border-white/25 text-xs sm:text-sm font-bold backdrop-blur-md shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Join with Code</span>
            </button>
            <button
              onClick={() => {
                setPanel(panel === "create" ? "none" : "create");
                setError(null);
              }}
              className="btn bg-white text-[#0f472b] hover:bg-emerald-50 hover:text-[#0b3822] text-xs sm:text-sm font-black shadow-md border-0 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>+ New Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Action Drawers */}
      {panel === "create" && (
        <div className="card p-6 bg-gradient-to-br from-white via-[#f7fbf8] to-[#eef7f2] border-emerald-300 shadow-xl animate-scale-up max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a7949] text-white text-sm font-bold shadow-xs">
                +
              </span>
              Create New Store Inventory
            </h3>
            <button
              onClick={() => setPanel("none")}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold px-2 py-1 rounded-md hover:bg-stone-100"
            >
              Close ✕
            </button>
          </div>
          <p className="mb-4 text-xs text-stone-600 font-medium">
            Give your store a descriptive title (e.g., &ldquo;Cabatingan Sari-Sari Store&rdquo;, &ldquo;Branch 2 - Poblacion&rdquo;).
          </p>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Nena's Sari-Sari Store"
              className="input flex-1 font-medium"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
              {loading ? "Creating Store..." : "Create Store"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-bold text-[#782d2d]">{error}</p>}
        </div>
      )}

      {panel === "join" && (
        <div className="card p-6 bg-gradient-to-br from-white via-[#f7fbf8] to-[#eef7f2] border-emerald-300 shadow-xl animate-scale-up max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a7949] text-white text-sm font-bold shadow-xs">
                #
              </span>
              Join Store by Secret Invite Code
            </h3>
            <button
              onClick={() => setPanel("none")}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold px-2 py-1 rounded-md hover:bg-stone-100"
            >
              Close ✕
            </button>
          </div>
          <p className="mb-4 text-xs text-stone-600 font-medium">
            Enter the 8-character invite code provided by the store owner to access their catalog.
          </p>
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FE40CF1E"
              className="input font-mono tracking-widest text-center uppercase font-black sm:max-w-[200px]"
              maxLength={8}
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0 flex-1">
              {loading ? "Joining..." : "Join Inventory"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-bold text-[#782d2d]">{error}</p>}
        </div>
      )}

      {/* SECTION 1: MY INVENTORIES (OWNER) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[#1a7949] text-xs font-bold shadow-2xs">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900 font-heading">
                  My Store Inventories
                </h2>
                <span className="badge badge-mint font-bold text-xs">
                  {ownedStores.length} {ownedStores.length === 1 ? "Store" : "Stores"} Owned
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Stores where you are the registered owner with full administrative control.
              </p>
            </div>
          </div>
        </div>
        <div className="green-divider-bar w-20 -mt-2" />

        {ownedStores.length === 0 ? (
          <div className="card p-8 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-2xl">
            <p className="text-sm font-semibold text-stone-600">You haven&apos;t created any store inventories yet.</p>
            <p className="text-xs text-stone-400 mt-1">Create your first store to begin adding products and tracking prices.</p>
            <button onClick={() => setPanel("create")} className="btn btn-primary mt-4 text-xs font-bold">
              + Create Store Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ownedStores.map((inv) => {
              const isRevealed = revealedIds.has(inv.id);
              const isCopied = copiedId === inv.id;

              return (
                <Link
                  key={inv.id}
                  href={`/inventories/${inv.id}`}
                  className="card card-hover group flex flex-col justify-between p-6 border-emerald-900/10 hover:border-emerald-400 relative overflow-hidden bg-white shadow-[0_4px_20px_-4px_rgba(22,29,38,0.05)] hover:shadow-[0_12px_30px_-5px_rgba(26,121,73,0.14)]"
                >
                  {/* Top emerald accent indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]" />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#eaf6ee] to-[#c8ebd1] text-[#1a7949] font-black shadow-xs group-hover:scale-105 transition-transform">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-stone-900 group-hover:text-[#1a7949] transition-colors text-base line-clamp-1 font-heading">
                            {inv.name}
                          </h3>
                          <p className="text-[11px] font-medium text-stone-400">
                            Created {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="badge badge-mint font-extrabold flex items-center gap-1">
                        <span className="text-amber-500">★</span> Owner
                      </span>
                    </div>

                    {/* Masked / Protected Invite Code Strip */}
                    <div className="mt-4 rounded-xl bg-stone-50 border border-stone-200/80 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Invite Code:</span>
                        <code className="font-mono font-black text-stone-800 tracking-wider">
                          {isRevealed ? inv.invite_code : "••••••••"}
                        </code>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Toggle Reveal */}
                        <button
                          type="button"
                          onClick={(e) => toggleReveal(inv.id, e)}
                          className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                          title={isRevealed ? "Hide code" : "Reveal code"}
                        >
                          {isRevealed ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>

                        {/* Copy Code */}
                        <button
                          type="button"
                          onClick={(e) => handleCopy(inv.invite_code, inv.id, e)}
                          className="rounded-lg p-1 text-stone-400 hover:text-[#1a7949] hover:bg-emerald-50 transition-colors"
                          title="Copy invite code"
                        >
                          {isCopied ? (
                            <span className="text-[10px] font-extrabold text-[#1a7949] px-1">✓ Copied</span>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1a7949]">
                    <span>Manage store catalog</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: SHARED INVENTORIES (MEMBER ONLY) */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 text-xs">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900 font-heading">
                  Shared Stores &amp; Collaborations
                </h2>
                <span className="badge badge-slate font-bold text-xs">
                  {memberStores.length} {memberStores.length === 1 ? "Collaboration" : "Collaborations"}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Stores you have joined as staff or catalog manager using an invite code.
              </p>
            </div>
          </div>
        </div>
        <div className="green-divider-bar w-20 -mt-2" />

        {memberStores.length === 0 ? (
          <div className="card p-6 border border-stone-200/80 bg-gradient-to-r from-stone-50 to-[#f4faf6] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#1a7949]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">Collaborating with another store?</p>
                <p className="text-xs text-stone-500 font-medium">
                  Ask the store owner for their 8-character invite code, then click &ldquo;Join with Code&rdquo; above to manage inventory together.
                </p>
              </div>
            </div>
            <button onClick={() => setPanel("join")} className="btn btn-secondary shrink-0 text-xs font-bold">
              Join Store with Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memberStores.map((inv) => (
              <Link
                key={inv.id}
                href={`/inventories/${inv.id}`}
                className="card card-hover group flex flex-col justify-between p-6 border-stone-200 hover:border-[#1a7949]/50 relative overflow-hidden bg-white shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold group-hover:bg-emerald-50 group-hover:text-[#1a7949] transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-stone-900 group-hover:text-[#1a7949] transition-colors text-base line-clamp-1 font-heading">
                          {inv.name}
                        </h3>
                        <p className="text-[11px] font-medium text-stone-400">
                          Joined {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span className="badge badge-slate font-bold">Member</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-stone-50 border border-stone-100 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-stone-400">Store Access</span>
                    <span className="text-xs font-bold text-stone-700">Catalog &amp; Stock Editor</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1a7949]">
                  <span>Open store catalog</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
