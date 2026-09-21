"use client";

import { useState } from "react";
import type { Category, Product } from "@/lib/types";
import { createProduct, updateProduct, type ProductInput } from "@/app/(dashboard)/actions";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  const [manufacturer, setManufacturer] = useState(product?.manufacturer ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [buyPrice, setBuyPrice] = useState(product?.buy_price?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price?.toString() ?? "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "0");
  const [remarks, setRemarks] = useState(product?.remarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  const noSellingPrice = sellingPrice.trim() === "";

  function getProductInput(): ProductInput {
    return {
      name: name.trim(),
      brand: brand.trim() || null,
      manufacturer: manufacturer.trim() || null,
      unit: unit.trim() || null,
      category_id: categoryId || null,
      buy_price: buyPrice.trim() === "" ? null : Number(buyPrice),
      selling_price: sellingPrice.trim() === "" ? null : Number(sellingPrice),
      quantity: quantity.trim() === "" ? 0 : Number(quantity),
      remarks: remarks.trim() || null,
    };
  }

  async function executeSave() {
    const input = getProductInput();
    setSaving(true);
    const result = product
      ? await updateProduct(inventoryId, product.id, input)
      : await createProduct(inventoryId, input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setShowConfirmUpdate(false);
      return;
    }
    setShowConfirmUpdate(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (product) {
      // Require confirmation for updating existing record
      setShowConfirmUpdate(true);
      return;
    }

    await executeSave();
  }

  // Derived financial calculation for preview
  const numBuy = buyPrice.trim() !== "" ? Number(buyPrice) : null;
  const numSell = sellingPrice.trim() !== "" ? Number(sellingPrice) : null;
  const numQty = quantity.trim() !== "" ? Number(quantity) : 0;
  const calculatedProfit = numBuy !== null && numSell !== null ? numSell - numBuy : null;
  const calculatedTotalProfit = calculatedProfit !== null ? calculatedProfit * numQty : null;
  const calculatedMargin = numBuy !== null && numSell !== null && numSell > 0
    ? ((numSell - numBuy) / numSell) * 100
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-md px-4 p-4 animate-fade-in">
      <div className="card w-full max-w-lg p-0 overflow-hidden shadow-2xl border-stone-200/90 bg-white max-h-[90vh] flex flex-col">
        {/* Top Accent Line */}
        <div className="h-1.5 bg-gradient-to-r from-[#1a7949] via-[#22995d] to-[#b7dec2]" />

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-stone-900 font-sans">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {product ? "Update catalog item details" : "Register a new item to store catalog"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Product Name *" hint="Includes brand (e.g. Jack 'n Jill Chippy Barbeque)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input font-medium"
                autoFocus
                placeholder="e.g. Jack 'n Jill Chippy Barbeque, Efficascent Liniment Oil"
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Brand" hint="e.g. Chippy, Efficascent, Bear Brand">
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="input"
                  placeholder="e.g. Chippy, Piattos, Efficascent"
                />
              </Field>
              <Field label="Manufacturer / Company" hint="e.g. URC, IPI, Nestlé">
                <input
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="input"
                  placeholder="e.g. Universal Robina Corp., IPI"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Size / Unit" hint="e.g. 27g, 40g, 25ml, Sachet">
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input font-mono"
                  placeholder="e.g. 27g, 108g, 25ml, 1L"
                />
              </Field>
              <Field label="Store Category">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input cursor-pointer font-medium"
                >
                  <option value="">None (Uncategorized)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-xl bg-stone-50/80 p-3.5 border border-stone-100 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Pricing &amp; Inventory Stock
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Field label="Unit Cost (₱)" hint="Capital cost">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="input font-mono"
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Retail Price (₱)" hint="Selling price">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="input font-mono font-bold text-[#0f4e2b]"
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Quantity In Stock" hint="Remaining units">
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input font-mono"
                    placeholder="0"
                  />
                </Field>
              </div>

              {/* Real-time Profit & Margin Indicator */}
              {calculatedProfit !== null && (
                <div className="flex flex-wrap items-center justify-between rounded-lg bg-emerald-50/90 px-3 py-2 border border-emerald-200/80 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-900 font-bold">Unit Profit:</span>
                    <span className={`font-mono font-black ${calculatedProfit >= 0 ? "text-[#145a37]" : "text-rose-600"}`}>
                      ₱{calculatedProfit.toFixed(2)}
                    </span>
                    {calculatedMargin !== null && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        calculatedMargin >= 0
                          ? "bg-emerald-200/90 text-emerald-900"
                          : "bg-rose-200 text-rose-900"
                      }`}>
                        {calculatedMargin.toFixed(1)}% margin
                      </span>
                    )}
                  </div>
                  {calculatedTotalProfit !== null && numQty > 0 && (
                    <div className="text-right">
                      <span className="text-stone-500 text-[11px]">Projected Total Profit: </span>
                      <span className="font-mono font-black text-[#145a37]">
                        ₱{calculatedTotalProfit.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {noSellingPrice && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200/70 font-medium">
                  Note: If retail price is empty, item displays as &quot;Price TBD&quot;.
                </p>
              )}
            </div>

            <Field label="Remarks / Shelf Location (Optional)">
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="input text-xs"
                placeholder="e.g. Top Shelf, Chiller, Front Basket"
              />
            </Field>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary min-w-[110px]"
              >
                {saving ? "Saving..." : product ? "Update Item" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Confirmation Modal: Update Product ── */}
      <ConfirmModal
        open={showConfirmUpdate}
        title={`Update product "${name}"?`}
        description={
          <span>
            Save the updated information for <strong>&quot;{name}&quot;</strong> (retail price: {sellingPrice ? `₱${Number(sellingPrice).toFixed(2)}` : "None"}, stock: {quantity} units) to your store catalog?
          </span>
        }
        confirmLabel="Update"
        cancelLabel="Cancel"
        variant="primary"
        loading={saving}
        onConfirm={executeSave}
        onCancel={() => setShowConfirmUpdate(false)}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-xs font-bold text-stone-700">{label}</span>
        {hint && <span className="text-[10px] text-stone-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
