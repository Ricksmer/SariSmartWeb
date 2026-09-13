"use client";

import { useState } from "react";
import type { Category, Product } from "@/lib/types";
import { createProduct, updateProduct, type ProductInput } from "@/app/(dashboard)/actions";

export default function ProductForm({
  inventoryId,
  categories,
  product,
  onClose,
}: {
  inventoryId: string;
  categories: Category[];
  product?: Product;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [buyPrice, setBuyPrice] = useState(product?.buy_price?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price?.toString() ?? "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "0");
  const [remarks, setRemarks] = useState(product?.remarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const noSellingPrice = sellingPrice.trim() === "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    const input: ProductInput = {
      name,
      brand: brand.trim() || null,
      unit: unit.trim() || null,
      category_id: categoryId || null,
      buy_price: buyPrice.trim() === "" ? null : Number(buyPrice),
      selling_price: sellingPrice.trim() === "" ? null : Number(sellingPrice),
      quantity: quantity.trim() === "" ? 0 : Number(quantity),
      remarks: remarks.trim() || null,
    };

    setSaving(true);
    const result = product
      ? await updateProduct(inventoryId, product.id, input)
      : await createProduct(inventoryId, input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">
          {product ? "Edit product" : "Add product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              autoFocus
              placeholder="e.g. corned beef"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input" />
            </Field>
            <Field label="Size / unit">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input"
                placeholder="e.g. 500ml, 12g"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Buy price">
              <input
                type="number"
                step="0.01"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="input"
                placeholder="—"
              />
            </Field>
            <Field label="Selling price">
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="input"
                placeholder="—"
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                step="1"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Remarks (optional)">
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input"
              placeholder="e.g. on promo, near expiry"
            />
          </Field>

          {noSellingPrice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No selling price yet — this product will show as "TBD" until you set one.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}
