import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import ProductPriceListPDF from "@/components/pdf/ProductPriceListPDF";

// Body: { inventoryId: string, productIds: string[] } — an explicit id
// list, whether the caller selected "all", a set of categories, or
// individual items. This route only fetches products the logged-in user
// can see — RLS still applies (this is the regular server client, not the
// service-role one), so it can only ever return products from inventories
// the caller is a member of, regardless of what inventoryId is passed.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { inventoryId, productIds } = (await request.json()) as {
    inventoryId?: string;
    productIds: string[];
  };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "No products selected" }, { status: 400 });
  }

  let storeName = "SariSmart Store";
  if (inventoryId) {
    const { data: inv } = await supabase
      .from("inventories")
      .select("name")
      .eq("id", inventoryId)
      .maybeSingle();
    if (inv?.name) storeName = inv.name;
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .in("id", productIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (products ?? []).map((p) => ({
    name: p.name,
    brand: p.brand,
    manufacturer: (p as unknown as { manufacturer?: string | null }).manufacturer ?? null,
    unit: p.unit,
    selling_price: p.selling_price,
    remarks: p.remarks,
    category_name: (p.category as unknown as { name: string } | null)?.name ?? null,
  }));

  const buffer = await renderToBuffer(
    <ProductPriceListPDF rows={rows} storeName={storeName} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sarismart-price-list-${Date.now()}.pdf"`,
    },
  });
}
