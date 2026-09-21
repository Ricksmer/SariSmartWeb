import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventoryNavTabs from "@/components/inventories/InventoryNavTabs";

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
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Store Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-400">
          <Link href="/" className="hover:text-[#1a7949] transition-colors flex items-center gap-1">
            <span>Stores</span>
          </Link>
          <span>/</span>
          <span className="text-stone-700">{inventory.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf6ee] to-[#c7e9d1] text-[#1a7949] shadow-xs">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-sans">
                {inventory.name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-stone-400">Invite code:</span>
                <code className="font-mono font-bold tracking-wider text-[#1a7949] bg-[#eaf6ee] px-2 py-0.5 rounded-md border border-[#b7dec2]/60">
                  {inventory.invite_code}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Nav Tabs */}
      <InventoryNavTabs inventoryId={id} />

      {/* Main Tab Content */}
      <div className="animate-fade-in">{children}</div>
    </div>
  );
}
