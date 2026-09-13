import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/types";

export default async function InventoryOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("selling_price, buy_price, quantity, archived")
    .eq("inventory_id", id);

  const active = products?.filter((p) => !p.archived) ?? [];
  const archivedCount = products?.filter((p) => p.archived).length ?? 0;
  const totalProducts = active.length;
  const missingPrice = active.filter((p) => p.selling_price === null).length;
  const lowStock = active.filter((p) => p.quantity <= 5).length;
  const capital = active.reduce((sum, p) => sum + (p.buy_price ?? 0) * p.quantity, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Products" value={String(totalProducts)} />
        <SummaryCard
          label="Missing price"
          value={String(missingPrice)}
          tone={missingPrice > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Low stock (≤5)"
          value={String(lowStock)}
          tone={lowStock > 0 ? "warning" : "default"}
        />
        <SummaryCard label="Capital tied up" value={formatPrice(capital)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/inventories/${id}/products`} className="btn btn-primary">
          Manage products
        </Link>
        <Link href={`/inventories/${id}/products/export`} className="btn btn-secondary">
          Print / export price list
        </Link>
        <Link href={`/inventories/${id}/settings`} className="btn btn-ghost">
          Invite others
        </Link>
      </div>

      {archivedCount > 0 && (
        <p className="mt-6 text-xs text-stone-400">
          {archivedCount} archived product{archivedCount === 1 ? "" : "s"} hidden from these
          numbers — view them in the{" "}
          <Link href={`/inventories/${id}/products`} className="underline hover:text-stone-600">
            Products
          </Link>{" "}
          tab.
        </p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          tone === "warning" ? "text-amber-700" : "text-stone-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
