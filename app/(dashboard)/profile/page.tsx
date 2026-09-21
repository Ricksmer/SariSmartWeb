import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/profile/ProfileClient";

export const metadata = {
  title: "My Profile & Store Identity | SariSmart",
  description: "Manage your SariSmart store identity, operator profile, and catalog sharing.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's inventories
  const { data: memberships } = await supabase
    .from("inventory_members")
    .select("role, inventory:inventories(id, name, invite_code, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const inventories = (memberships ?? [])
    .filter((m) => m.inventory)
    .map((m) => ({
      ...(m.inventory as unknown as {
        id: string;
        name: string;
        invite_code: string;
        created_at: string;
      }),
      role: m.role as "owner" | "member",
    }));

  const inventoryIds = inventories.map((inv) => inv.id);

  let totalProducts = 0;
  let activeProducts = 0;
  let totalStockUnits = 0;
  let lowStockProducts = 0;
  let categoriesCount = 0;
  let categoryBreakdown: { name: string; count: number }[] = [];

  if (inventoryIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, quantity, archived, inventory_id, category:categories(name)")
      .in("inventory_id", inventoryIds);

    if (products) {
      totalProducts = products.length;
      const activeList = products.filter((p) => !p.archived);
      activeProducts = activeList.length;
      totalStockUnits = activeList.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
      lowStockProducts = activeList.filter((p) => Number(p.quantity) <= 5).length;

      const catMap = new Map<string, number>();
      for (const p of activeList) {
        const catName =
          (p.category as unknown as { name: string } | null)?.name || "Uncategorized";
        catMap.set(catName, (catMap.get(catName) || 0) + 1);
      }
      categoriesCount = catMap.size;
      categoryBreakdown = Array.from(catMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }
  }

  const initialProfile = {
    fullName: (user.user_metadata?.full_name as string) || "",
    phone: (user.user_metadata?.phone as string) || "",
    storeName:
      (user.user_metadata?.store_name as string) ||
      (inventories[0]?.name ?? "My Sari-Sari Store"),
    location: (user.user_metadata?.location as string) || "",
    bio: (user.user_metadata?.bio as string) || "",
    email: user.email || "",
  };

  return (
    <ProfileClient
      user={initialProfile}
      inventories={inventories}
      stats={{
        totalProducts,
        activeProducts,
        totalStockUnits,
        lowStockProducts,
        categoriesCount,
        categoryBreakdown,
      }}
    />
  );
}
