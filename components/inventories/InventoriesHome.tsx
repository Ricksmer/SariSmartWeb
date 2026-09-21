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
      setError("Give your inventory a name.");
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
      setError("Enter an inventory code.");
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
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">My inventories</h1>
          <p className="mt-1 text-sm text-stone-500">
            Create a new store inventory, or join one someone shared with you.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPanel(panel === "join" ? "none" : "join");
              setError(null);
            }}
            className="btn btn-secondary"
          >
            Join with code
          </button>
          <button
            onClick={() => {
              setPanel(panel === "create" ? "none" : "create");
              setError(null);
            }}
            className="btn btn-primary"
          >
            + New inventory
          </button>
        </div>
      </div>

      {panel === "create" && (
        <form onSubmit={handleCreate} className="card mb-8 max-w-md p-5">
          <label className="mb-1 block text-sm font-medium text-stone-700">Inventory name</label>
          <p className="mb-3 text-xs text-stone-500">
            e.g. &ldquo;Aling Nena&apos;s Store&rdquo;, &ldquo;Main Branch&rdquo;
          </p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inventory name"
              className="input"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      {panel === "join" && (
        <form onSubmit={handleJoin} className="card mb-8 max-w-md p-5">
          <label className="mb-1 block text-sm font-medium text-stone-700">Inventory code</label>
          <p className="mb-3 text-xs text-stone-500">
            Ask the inventory owner for their 8-character invite code.
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              className="input font-mono tracking-widest"
              maxLength={8}
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      {inventories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-stone-500">
            You don&apos;t have any inventories yet &mdash; create one or join with a code to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventories.map((inv) => (
            <Link
              key={inv.id}
              href={`/inventories/${inv.id}`}
              className="card card-hover flex flex-col justify-between p-5"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">{inv.name}</h2>
                  {inv.role === "owner" && (
                    <span className="badge bg-teal-50 text-teal-800">Owner</span>
                  )}
                </div>
                <p className="text-xs text-stone-400">
                  Created {new Date(inv.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-4 text-sm font-medium text-teal-700">Open →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
