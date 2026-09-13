"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameInventory, leaveInventory } from "@/app/(dashboard)/actions";

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
};

export default function InventorySettingsClient({
  inventory,
  members,
  currentUserId,
  isOwner,
}: {
  inventory: { id: string; name: string; invite_code: string; owner_id: string };
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(inventory.name);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPriceList, setCopiedPriceList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inventory.invite_code}`
      : `/join/${inventory.invite_code}`;

  const priceListLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/price-list/${inventory.id}`
      : `/price-list/${inventory.id}`;

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await renameInventory(inventory.id, name);
    setSaving(false);
    if (result.error) setError(result.error);
  }

  function copy(text: string, which: "code" | "link" | "priceList") {
    navigator.clipboard.writeText(text);
    if (which === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } else if (which === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } else {
      setCopiedPriceList(true);
      setTimeout(() => setCopiedPriceList(false), 1500);
    }
  }

  async function handleLeave() {
    if (!confirm("Leave this inventory? You'll need the invite code to rejoin.")) return;
    await leaveInventory(inventory.id);
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    `Join "${inventory.name}" on SariSmart`
  )}&body=${encodeURIComponent(
    `I'd like to invite you to our SariSmart inventory "${inventory.name}".\n\nJoin here: ${joinLink}\n\nOr enter this code manually: ${inventory.invite_code}`
  )}`;

  return (
    <div className="max-w-2xl space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-stone-900">Invite people</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-stone-500">Inventory code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center font-mono text-sm font-semibold tracking-widest text-stone-800">
                {inventory.invite_code}
              </code>
              <button onClick={() => copy(inventory.invite_code, "code")} className="btn btn-secondary shrink-0">
                {copiedCode ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-stone-500">Shareable link</p>
            <div className="flex items-center gap-2">
              <button onClick={() => copy(joinLink, "link")} className="btn btn-secondary flex-1">
                {copiedLink ? "Link copied!" : "Copy join link"}
              </button>
              <a href={mailtoHref} className="btn btn-secondary shrink-0">
                Email invite
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-stone-400">
          Anyone with this code or link gets full access to add, edit, and remove products in this
          inventory.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-stone-900">Public price list</h2>
        <p className="mb-3 text-xs text-stone-500">
          A read-only page anyone can open — no login required. Shows only name, brand, and price.
        </p>
        <div className="flex gap-2">
          <button onClick={() => copy(priceListLink, "priceList")} className="btn btn-secondary flex-1">
            {copiedPriceList ? "Link copied!" : "Copy price list link"}
          </button>
          <a href={priceListLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary shrink-0">
            Open
          </a>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-stone-900">Members ({members.length})</h2>
        <ul className="divide-y divide-stone-100">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-stone-700">
                {m.email}
                {m.user_id === currentUserId && (
                  <span className="ml-2 text-xs text-stone-400">(you)</span>
                )}
              </span>
              {m.role === "owner" && <span className="badge bg-teal-50 text-teal-800">Owner</span>}
            </li>
          ))}
        </ul>
      </section>

      {isOwner ? (
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-stone-900">Rename inventory</h2>
          <form onSubmit={handleRename} className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            <button type="submit" disabled={saving} className="btn btn-primary shrink-0">
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      ) : (
        <section className="card p-5">
          <h2 className="mb-2 font-semibold text-stone-900">Leave inventory</h2>
          <p className="mb-4 text-sm text-stone-500">
            You'll lose access unless someone invites you back.
          </p>
          <button onClick={handleLeave} className="btn btn-danger">
            Leave this inventory
          </button>
        </section>
      )}
    </div>
  );
}
