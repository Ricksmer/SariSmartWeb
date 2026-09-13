import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS only returns this row if the current user is a member — a
  // non-member (or a bad id) simply gets an empty result.
  const { data: inventory } = await supabase
    .from("inventories")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!inventory) notFound();

  const tabs = [
    { href: `/inventories/${id}`, label: "Overview" },
    { href: `/inventories/${id}/products`, label: "Products" },
    { href: `/inventories/${id}/categories`, label: "Categories" },
    { href: `/inventories/${id}/products/export`, label: "Print / export" },
    { href: `/inventories/${id}/settings`, label: "Settings" },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-sm text-stone-400">
        <Link href="/" className="hover:text-stone-600">
          My inventories
        </Link>
        <span>/</span>
      </div>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight text-stone-900">
        {inventory.name}
      </h1>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-stone-100/80 p-1 text-sm w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="whitespace-nowrap rounded-lg px-3.5 py-1.5 font-medium text-stone-600 transition hover:bg-white hover:text-stone-900 hover:shadow-sm"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
