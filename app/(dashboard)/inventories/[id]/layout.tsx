import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventoryNavTabs from "@/components/inventories/InventoryNavTabs";
import MaskedInviteBadge from "@/components/ui/MaskedInviteBadge";
import AICopilotDrawer from "@/components/ai/AICopilotDrawer";

export default async function InventoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inventory } = await supabase
    .from("inventories")
    .select("id, name, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!inventory) notFound();

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Top Store Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#072a16] via-[#0f4d2c] to-[#1a7949] p-6 text-white relative overflow-hidden shadow-lg border border-emerald-700/30">
        <div className="pointer-events-none absolute inset-0 bg-stripes-emerald-dark opacity-40" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-emerald-200 shadow-md border border-white/20 backdrop-blur-md">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Active Store Branch
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
                {inventory.name}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <MaskedInviteBadge code={inventory.invite_code} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn bg-white/15 text-white hover:bg-white/25 border border-white/25 text-xs font-extrabold py-2 px-4 rounded-xl shadow-2xs backdrop-blur-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Inventories</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Luxury Nav Tabs */}
      <InventoryNavTabs inventoryId={id} />

      {/* Main Tab Content */}
      <div className="animate-fade-in">{children}</div>

      {/* Floating AI Copilot Assistant */}
      <AICopilotDrawer inventoryId={id} />
    </div>
  );
}
