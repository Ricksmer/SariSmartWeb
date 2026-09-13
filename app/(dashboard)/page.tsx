import { createClient } from "@/lib/supabase/server";
import InventoriesHome from "@/components/inventories/InventoriesHome";

export default async function InventoriesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("inventory_members")
    .select("role, inventory:inventories(id, name, invite_code, created_at)")
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: false });

  const inventories = (memberships ?? [])
    .filter((m) => m.inventory)
    .map((m) => ({
      ...(m.inventory as unknown as { id: string; name: string; invite_code: string; created_at: string }),
      role: m.role as "owner" | "member",
    }));

  return <InventoriesHome inventories={inventories} />;
}
