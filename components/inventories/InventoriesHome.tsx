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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-sans">
              Store Inventories
            </h1>
            <span className="badge badge-mint font-mono font-bold">
              {inventories.length} {inventories.length === 1 ? "Store" : "Stores"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-stone-500 font-medium">
            Manage your retail catalogs, inventory levels, and team access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPanel(panel === "join" ? "none" : "join");
              setError(null);
            }}
            className={`btn btn-secondary ${panel === "join" ? "border-[#1a7949] text-[#1a7949]" : ""}`}
          >
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Join with Code
          </button>
          <button
            onClick={() => {
              setPanel(panel === "create" ? "none" : "create");
              setError(null);
            }}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Store Inventory
          </button>
        </div>
      </div>

      {/* Expandable Action Drawers */}
      {panel === "create" && (
        <div className="card p-6 bg-gradient-to-br from-white to-[#f4faf6] border-[#b7dec2] shadow-lg animate-fade-in max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1a7949] text-white text-xs">
                +
              </span>
              Create New Inventory
            </h3>
            <button
              onClick={() => setPanel("none")}
              className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
          <p className="mb-4 text-xs text-stone-500">
            e.g. &ldquo;Aling Nena&apos;s Store&rdquo;, &ldquo;Main Branch - Poblacion&rdquo;
          </p>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sari-Sari Store Main"
              className="input flex-1"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
              {loading ? "Creating..." : "Create Store"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-semibold text-[#782d2d]">{error}</p>}
        </div>
      )}

      {panel === "join" && (
        <div className="card p-6 bg-gradient-to-br from-white to-[#f4faf6] border-[#b7dec2] shadow-lg animate-fade-in max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1a7949] text-white text-xs">
                #
              </span>
              Join Store by Invite Code
            </h3>
            <button
              onClick={() => setPanel("none")}
              className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
          <p className="mb-4 text-xs text-stone-500">
            Enter the 8-character code shared by the store owner.
          </p>
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2.5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FE40CF1E"
              className="input font-mono tracking-widest text-center uppercase font-bold sm:max-w-[200px]"
              maxLength={8}
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0 flex-1">
              {loading ? "Joining..." : "Join Inventory"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-semibold text-[#782d2d]">{error}</p>}
        </div>
      )}

      {/* Stores Grid */}
      {inventories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-4 text-center border-dashed border-2 border-stone-300/80 bg-white/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#1a7949] mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-stone-800">No store inventories yet</h3>
          <p className="mt-1 text-sm text-stone-500 max-w-sm">
            Create your store inventory or join an existing store with an invite code to begin.
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setPanel("create")} className="btn btn-primary">
              + Create Store
            </button>
            <button onClick={() => setPanel("join")} className="btn btn-secondary">
              Join with Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {inventories.map((inv) => (
            <Link
              key={inv.id}
              href={`/inventories/${inv.id}`}
              className="card card-hover group flex flex-col justify-between p-6 border-stone-200/90 hover:border-[#b7dec2] relative overflow-hidden bg-white"
            >
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a7949] to-[#b7dec2] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#eaf6ee] to-[#d4ecd9] text-[#1a7949] font-bold shadow-xs">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-stone-900 group-hover:text-[#1a7949] transition-colors text-base line-clamp-1">
                        {inv.name}
                      </h2>
                      <p className="text-[11px] font-medium text-stone-400">
                        Added {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      inv.role === "owner" ? "badge-mint" : "badge-slate"
                    }`}
                  >
                    {inv.role === "owner" ? "Owner" : "Member"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50/80 px-3 py-2 text-xs border border-stone-100">
                  <span className="font-medium text-stone-400">Code:</span>
                  <code className="font-mono font-bold tracking-wider text-stone-700">
                    {inv.invite_code}
                  </code>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1a7949]">
                <span>Manage catalog &amp; stock</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
