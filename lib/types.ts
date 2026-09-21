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
  manufacturer?: string | null;
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
  manufacturer?: string | null;
  unit: string | null;
  selling_price: number | null;
  category_name: string | null;
};

export function formatPrice(value: number | null): string {
  if (value === null) return "TBD";
  return `₱${value.toFixed(2)}`;
}

// Total Unit Cost (formerly Capital Tied Up)
export function totalUnitCost(product: Pick<Product, "buy_price" | "quantity">): number | null {
  if (product.buy_price === null) return null;
  return product.buy_price * product.quantity;
}

// Alias for backwards compatibility
export const capitalTiedUp = totalUnitCost;

// Profit per unit (Retail Price - Unit Cost)
export function unitProfit(product: Pick<Product, "buy_price" | "selling_price">): number | null {
  if (product.selling_price === null || product.buy_price === null) return null;
  return product.selling_price - product.buy_price;
}

// Total Profit across remaining stock (Profit per unit * Quantity)
export function totalProfit(product: Pick<Product, "buy_price" | "selling_price" | "quantity">): number | null {
  const profit = unitProfit(product);
  if (profit === null) return null;
  return profit * product.quantity;
}

// Profit Margin percentage: ((Retail Price - Unit Cost) / Retail Price) * 100
export function profitMargin(buyPrice: number | null, sellingPrice: number | null): number | null {
  if (buyPrice === null || sellingPrice === null || sellingPrice <= 0) return null;
  return ((sellingPrice - buyPrice) / sellingPrice) * 100;
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
