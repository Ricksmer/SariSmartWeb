"use client";

import { useState } from "react";
import { renameInventory, leaveInventory } from "@/app/(dashboard)/actions";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  const [name, setName] = useState(inventory.name);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPriceList, setCopiedPriceList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRename, setShowConfirmRename] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const joinLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inventory.invite_code}`
      : `/join/${inventory.invite_code}`;

  const priceListLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/price-list/${inventory.id}`
      : `/price-list/${inventory.id}`;

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (name.trim() === inventory.name) return;
    setShowConfirmRename(true);
  }

  async function confirmRename() {
    setSaving(true);
    const result = await renameInventory(inventory.id, name);
    setSaving(false);
    setShowConfirmRename(false);
    if (result.error) setError(result.error);
  }

  async function confirmLeave() {
    setLeaving(true);
    await leaveInventory(inventory.id);
    setLeaving(false);
    setShowConfirmLeave(false);
  }

  function copy(text: string, which: "code" | "link" | "priceList") {
    navigator.clipboard.writeText(text);
    if (which === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } else if (which === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } else {
      setCopiedPriceList(true);
      setTimeout(() => setCopiedPriceList(false), 1800);
    }
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    `Join "${inventory.name}" on SariSmart`
  )}&body=${encodeURIComponent(
    `Hello,\n\nYou have been invited to collaborate on our SariSmart store inventory "${inventory.name}".\n\nJoin automatically here: ${joinLink}\n\nOr enter this code manually in your dashboard: ${inventory.invite_code}`
  )}`;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Invite Collaborators Card */}
      <section className="card p-6 border-stone-200/90 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf6ee] text-[#1a7949]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Invite &amp; Team Collaboration</h2>
            <p className="text-xs text-stone-400">Grant store staff access to update stock levels and prices.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Inventory Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-stone-800 shadow-2xs">
                {inventory.invite_code}
              </code>
              <button
                onClick={() => copy(inventory.invite_code, "code")}
                className={`btn shrink-0 ${copiedCode ? "btn-primary" : "btn-secondary"} text-xs py-2`}
              >
                {copiedCode ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Direct Join Link</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(joinLink, "link")}
                className={`btn flex-1 ${copiedLink ? "btn-primary" : "btn-secondary"} text-xs py-2`}
              >
                {copiedLink ? "✓ Link Copied!" : "Copy Link"}
              </button>
              <a
                href={mailtoHref}
                className="btn btn-secondary shrink-0 text-xs py-2"
                title="Email invite to staff"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-stone-400 leading-relaxed">
          Anyone with this code or link has permission to view, add, edit, and update items in this store.
        </p>
      </section>

      {/* Public Price List Card */}
      <section className="card p-6 border-stone-200/90 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Public Customer Price List</h2>
            <p className="text-xs text-stone-400">A read-only catalog for customers &mdash; no login required.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <input
            readOnly
            value={priceListLink}
            className="input font-mono text-xs bg-stone-50/80 text-stone-600 flex-1"
          />
          <button
            onClick={() => copy(priceListLink, "priceList")}
            className={`btn ${copiedPriceList ? "btn-primary" : "btn-secondary"} shrink-0 text-xs`}
          >
            {copiedPriceList ? "✓ Copied!" : "Copy Customer Link"}
          </button>
          <a
            href={priceListLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary shrink-0 text-xs"
          >
            Open Live &rarr;
          </a>
        </div>
      </section>

      {/* Member Roster Card */}
      <section className="card p-6 border-stone-200/90 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-stone-900">Team Members ({members.length})</h2>
          <span className="badge badge-mint text-xs font-mono">{members.length} Active</span>
        </div>

        <ul className="divide-y divide-stone-100">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf6ee] text-[#1a7949] font-bold text-xs">
                  {m.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-800">
                    {m.email}
                  </span>
                  {m.user_id === currentUserId && (
                    <span className="ml-2 text-[11px] font-medium text-stone-400">(you)</span>
                  )}
                  <p className="text-[11px] text-stone-400">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                </div>
              </div>

              <span
                className={`badge text-xs ${
                  m.role === "owner" ? "badge-mint" : "badge-slate"
                }`}
              >
                {m.role === "owner" ? "Store Owner" : "Staff Member"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Danger & Administrative Zone */}
      {isOwner ? (
        <section className="card p-6 border-stone-200/90 shadow-sm bg-white">
          <h2 className="text-base font-bold text-stone-900 mb-1">Rename Store Inventory</h2>
          <p className="text-xs text-stone-400 mb-4">Change the display name of this retail location.</p>
          <form onSubmit={handleRenameSubmit} className="flex gap-2.5 max-w-md">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input font-medium"
              required
            />
            <button type="submit" disabled={saving || name.trim() === inventory.name} className="btn btn-primary shrink-0">
              {saving ? "Saving..." : "Save Name"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-semibold text-[#782d2d]">{error}</p>}
        </section>
      ) : (
        <section className="card p-6 border-red-200/60 bg-red-50/30 shadow-sm">
          <h2 className="text-base font-bold text-[#782d2d] mb-1">Leave Store Inventory</h2>
          <p className="text-xs text-stone-500 mb-4">
            You will forfeit access to this store&apos;s records unless an owner invites you again.
          </p>
          <button onClick={() => setShowConfirmLeave(true)} className="btn btn-danger">
            Leave this Inventory
          </button>
        </section>
      )}

      {/* ── Confirmation Modal: Rename Inventory ── */}
      <ConfirmModal
        open={showConfirmRename}
        title={`Update store name to "${name}"?`}
        description={
          <span>
            Are you sure you want to rename this store from{" "}
            <strong>&quot;{inventory.name}&quot;</strong> to <strong>&quot;{name}&quot;</strong>? This will be visible to all collaborators and customer price list viewers.
          </span>
        }
        confirmLabel="Update"
        cancelLabel="Cancel"
        variant="primary"
        loading={saving}
        onConfirm={confirmRename}
        onCancel={() => setShowConfirmRename(false)}
      />

      {/* ── Confirmation Modal: Leave Inventory ── */}
      <ConfirmModal
        open={showConfirmLeave}
        title={`Leave "${inventory.name}"?`}
        description="Are you sure you want to leave this store inventory? You will forfeit access to its records and will need an invite code to rejoin."
        confirmLabel="Leave Store"
        cancelLabel="Cancel"
        variant="danger"
        loading={leaving}
        onConfirm={confirmLeave}
        onCancel={() => setShowConfirmLeave(false)}
      />
    </div>
  );
}
