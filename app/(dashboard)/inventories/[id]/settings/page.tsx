import { createClient } from "@/lib/supabase/server";
import InventorySettingsClient from "@/components/inventories/InventorySettingsClient";

export default async function InventorySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: inventory }, { data: members }, { data: emails }] = await Promise.all([
    supabase.from("inventories").select("id, name, invite_code, owner_id").eq("id", id).single(),
    supabase
      .from("inventory_members")
      .select("user_id, role, joined_at")
      .eq("inventory_id", id)
      .order("joined_at"),
    supabase.rpc("get_inventory_member_emails", { p_inventory_id: id }),
  ]);

  const emailByUserId = new Map(
    (emails ?? []).map((e: { user_id: string; email: string }) => [e.user_id, e.email])
  );
  const membersWithEmail = (members ?? []).map((m) => ({
    ...m,
    email: emailByUserId.get(m.user_id) ?? m.user_id,
  }));

  const isOwner = inventory?.owner_id === user?.id;

  return (
    <InventorySettingsClient
      inventory={inventory!}
      members={membersWithEmail}
      currentUserId={user!.id}
      isOwner={isOwner}
    />
  );
}
