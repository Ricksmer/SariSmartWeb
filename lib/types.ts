export type Inventory = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export type InventoryMembership = {
  inventory_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type Category = {
  id: string;
  inventory_id: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
  inventory_id: string;
  category_id: string | null;
  name: string;
  brand: string | null;
  unit: string | null;
  buy_price: number | null;
  selling_price: number | null;
  quantity: number;
  remarks: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined in from categories when fetched for display
  category?: Pick<Category, "id" | "name"> | null;
};

export type PublicProduct = {
  name: string;
  brand: string | null;
  selling_price: number | null;
  category_name: string | null;
};

export function formatPrice(value: number | null): string {
  if (value === null) return "TBD";
  return `₱${value.toFixed(2)}`;
}

export function capitalTiedUp(product: Pick<Product, "buy_price" | "quantity">): number | null {
  if (product.buy_price === null) return null;
  return product.buy_price * product.quantity;
}

// "corned beef" -> "Corned Beef". Applied to product names on save so the
// catalog and the printed price list stay visually consistent regardless
// of how someone typed it in.
export function toTitleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
