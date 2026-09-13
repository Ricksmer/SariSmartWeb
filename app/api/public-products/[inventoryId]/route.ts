import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Public, unauthenticated endpoint for /price-list/[inventoryId]. Uses the
// service-role key (bypasses RLS) since visitors aren't logged in — but the
// select() below is the actual security boundary: it must never be widened
// beyond these four columns, and it must always filter to the requested
// inventory, since this route has no auth check at all.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  const { inventoryId } = await params;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("products")
    .select("name, brand, selling_price, category:categories(name)")
    .eq("inventory_id", inventoryId)
    .eq("archived", false)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((p) => ({
    name: p.name,
    brand: p.brand,
    selling_price: p.selling_price,
    category_name: (p.category as unknown as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({ products: rows });
}
