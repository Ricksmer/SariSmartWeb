"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { joinInventory } from "@/app/(dashboard)/actions";

export default function JoinByCodePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "joining" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setStatus("joining");
    const result = await joinInventory(params.code);
    if (result.error || !result.inventory) {
      setStatus("error");
      setError(result.error ?? "Could not join that inventory.");
      return;
    }
    router.push(`/inventories/${result.inventory.id}`);
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold text-stone-900">Join inventory</h1>
        <p className="mb-1 text-sm text-stone-500">You were invited using this code:</p>
        <code className="mb-5 inline-block rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-mono text-sm font-semibold tracking-widest text-stone-800">
          {params.code}
        </code>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={status === "joining"}
          className="btn btn-primary w-full"
        >
          {status === "joining" ? "Joining..." : "Join this inventory"}
        </button>
      </div>
    </div>
  );
}
