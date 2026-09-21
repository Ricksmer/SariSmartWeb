"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for securely revealing invite codes per store
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    if (modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [modalOpen]);

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
    setModalOpen(false);
    setName("");
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
    setModalOpen(false);
    setCode("");
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
              Manage retail branches, switch live product catalogs, print customer price lists, and collaborate with staff.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                setError(null);
                setModalOpen(true);
              }}
              className="btn bg-white text-[#0f472b] hover:bg-emerald-50 hover:text-[#0b3822] text-xs sm:text-sm font-black shadow-md border-0 cursor-pointer inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-[#1a7949]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Inventory</span>
            </button>
          </div>
        </div>
      </div>

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
            <p className="text-xs text-stone-400 mt-1">Create your first inventory to begin adding products and tracking prices.</p>
            <button
              onClick={() => {
                setActiveTab("create");
                setError(null);
                setModalOpen(true);
              }}
              className="btn btn-primary mt-4 text-xs font-bold"
            >
              + Create Inventory Now
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
            <button
              onClick={() => {
                setActiveTab("join");
                setError(null);
                setModalOpen(true);
              }}
              className="btn btn-secondary shrink-0 text-xs font-bold"
            >
              Join Inventory with Code
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

      {/* Floating Circular '+' Action Button (Bottom-Left, mirroring AI Copilot on bottom-right) */}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setModalOpen((prev) => !prev);
        }}
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0c4024] via-[#145d35] to-[#1f8c53] text-white shadow-[0_10px_30px_rgba(26,121,73,0.5)] border-2 border-emerald-300/70 transition-all duration-300 hover:scale-110 hover:shadow-[0_14px_40px_rgba(26,121,73,0.65)] active:scale-95 cursor-pointer"
        title={modalOpen ? "Close Menu" : "New Inventory or Join"}
        aria-label="New Inventory or Join"
      >
        {modalOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </button>

      {/* Segmented Popup Modal for New Inventory / Join */}
      {mounted &&
        modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
              className="absolute inset-0"
              onClick={() => {
                setModalOpen(false);
                setError(null);
              }}
            />

            <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-emerald-100 animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#1a7949]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-stone-900 font-heading">
                      {activeTab === "create" ? "New Inventory" : "Join Inventory"}
                    </h2>
                    <p className="text-xs text-stone-400">
                      {activeTab === "create"
                        ? "Create a new store catalog"
                        : "Enter code to collaborate on a catalog"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError(null);
                  }}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Animated Segmented Switcher */}
              <div className="relative mb-6 flex rounded-xl bg-stone-100 p-1.5 text-sm font-bold border border-stone-200/60 select-none">
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-lg bg-white shadow-md transition-all duration-300 ease-out border border-stone-200/80 ${
                    activeTab === "create" ? "left-1.5" : "left-[calc(50%+3px)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("create");
                    setError(null);
                  }}
                  className={`relative z-10 flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "create" ? "text-[#1a7949]" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  New Inventory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("join");
                    setError(null);
                  }}
                  className={`relative z-10 flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "join" ? "text-[#1a7949]" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Join with Code
                </button>
              </div>

              {/* Tab Form */}
              {activeTab === "create" ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Inventory Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aling Nena's Sari-Sari Store"
                      className="input w-full font-medium"
                      autoFocus
                      required
                    />
                    <p className="mt-1.5 text-[11px] text-stone-400">
                      You will be the owner with full privileges to manage stock, invite staff, and export price lists.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-[#fdf2f2] p-3 text-xs text-[#782d2d] font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        setError(null);
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="btn btn-primary text-xs font-bold py-2.5 px-5"
                    >
                      {loading ? "Creating Inventory..." : "Create Inventory"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      8-Character Invite Code
                    </label>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FE40CF1E"
                      className="input w-full font-mono tracking-widest text-center uppercase font-black text-sm"
                      maxLength={8}
                      autoFocus
                      required
                    />
                    <p className="mt-1.5 text-[11px] text-stone-400">
                      Enter the 8-character invite code provided by the inventory owner to access their catalog.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-[#fdf2f2] p-3 text-xs text-[#782d2d] font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        setError(null);
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !code.trim()}
                      className="btn btn-primary text-xs font-bold py-2.5 px-5"
                    >
                      {loading ? "Joining..." : "Join Inventory"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
