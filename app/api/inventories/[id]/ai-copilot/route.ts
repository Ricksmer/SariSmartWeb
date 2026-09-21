import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function tryGeminiAnalysis(prompt: string, products: any[], categories: any[]) {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return null;

  try {
    const compactCatalog = products
      .filter((p: any) => !p.archived)
      .slice(0, 150)
      .map((p: any) => ({
        name: p.name,
        brand: p.brand || undefined,
        manufacturer: p.manufacturer || undefined,
        unit: p.unit || undefined,
        price: p.selling_price,
        stock: p.quantity,
        category:
          Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name || "Uncategorized",
      }));

    const systemPrompt = `You are SariSmart AI, an intelligent, helpful store assistant for a Philippine sari-sari store.
Answer the store owner's query accurately using the provided store catalog and category data.
Guidelines:
- Never use markdown bold asterisks (**) in your output.
- Keep answers practical, clear, concise, and friendly.
- Format prices in Philippine Pesos (₱).`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nCategories: ${categories.map((c: any) => c.name).join(", ")}\n\nCatalog (${compactCatalog.length} active items):\n${JSON.stringify(compactCatalog)}\n\nOwner Question: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return text.replace(/\*\*/g, "").trim();
    }
  } catch (err) {
    console.error("Gemini API call failed:", err);
  }
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inventoryId } = await context.params;
    const body = await req.json();
    const prompt = (body.message || "").trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Please enter a message or command." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from("inventory_members")
      .select("role")
      .eq("inventory_id", inventoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this inventory." },
        { status: 403 }
      );
    }

    // Fetch all store products & categories for context
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name)")
        .eq("inventory_id", inventoryId),
      supabase
        .from("categories")
        .select("id, name")
        .eq("inventory_id", inventoryId),
    ]);

    const allProducts = products || [];
    const allCategories = categories || [];

    const lower = prompt.toLowerCase();
    let isConfirmed = body.confirmed === true;
    let activePrompt = prompt;

    if (
      lower.startsWith("confirm ") ||
      lower.startsWith("yes ") ||
      lower.startsWith("oo ") ||
      lower === "confirm" ||
      lower === "yes" ||
      lower === "oo"
    ) {
      isConfirmed = true;
      activePrompt = prompt.replace(/^(confirm|yes|oo)\s*/i, "").trim();
    }

    const cleanLower = activePrompt.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 1. INTENT: CLEAN DATA / EXTRACT SIZES FROM NAMES
    // ─────────────────────────────────────────────────────────────
    if (
      cleanLower.includes("clean") ||
      (cleanLower.includes("extract") && (cleanLower.includes("size") || cleanLower.includes("unit"))) ||
      cleanLower.includes("format size") ||
      cleanLower.includes("separate unit")
    ) {
      if (!isConfirmed) {
        return NextResponse.json({
          reply: 'Extract and format size units from product names across your catalog? Extract and Cancel',
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "clean",
            title: "Extract size units from product names?",
            description: "Automatically separate sizes (e.g. 375ml, 1kg) into the dedicated unit column.",
            confirmLabel: "Extract",
            command: "confirm clean data",
          },
        });
      }

      let cleanedCount = 0;
      const updatedSample: string[] = [];

      for (const p of allProducts) {
        let newName = p.name;
        let newUnit = p.unit;

        // Size extraction regex (ml, g, kg, l, oz)
        const sizeMatch = newName.match(/(\d+(?:\.\d+)?\s*(?:ml|g|kg|l|oz))\b/i);
        if (sizeMatch && !p.unit) {
          newUnit = sizeMatch[1].replace(/\s+/g, "").toLowerCase();
          newName = newName.replace(sizeMatch[0], "").trim();
        }

        if (newName !== p.name || newUnit !== p.unit) {
          await supabase
            .from("products")
            .update({ name: newName, unit: newUnit })
            .eq("id", p.id)
            .eq("inventory_id", inventoryId);
          cleanedCount++;
          if (updatedSample.length < 5) {
            updatedSample.push(`"${p.name}" → "${newName}" (${newUnit})`);
          }
        }
      }

      return NextResponse.json({
        reply: cleanedCount > 0
          ? `✓ Processed catalog: Cleaned and extracted units for ${cleanedCount} product${cleanedCount === 1 ? "" : "s"}!`
          : "All product names and units are already properly separated and clean.",
        actionTaken: "clean",
        sample: updatedSample,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. INTENT: UPDATE PRICE
    // e.g. "update price of Coke to 20" or "set price of bear brand to 16"
    // ─────────────────────────────────────────────────────────────
    const priceUpdateMatch = cleanLower.match(
      /(?:update|change|set|edit)\s+(?:the\s+)?price\s+of\s+([a-zA-Z0-9\s\.\-&]+?)\s+(?:to|as|into|=)\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i
    ) || cleanLower.match(
      /(?:gawin mong|gawing|set|update)\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)\s*(?:ang\s+)?(?:presyo\s+ng|price\s+of)\s+([a-zA-Z0-9\s\.\-&]+)/i
    );

    if (priceUpdateMatch) {
      let targetName: string;
      let newPrice: number;

      if (isNaN(Number(priceUpdateMatch[1]))) {
        targetName = priceUpdateMatch[1].trim();
        newPrice = parseFloat(priceUpdateMatch[2]);
      } else {
        newPrice = parseFloat(priceUpdateMatch[1]);
        targetName = priceUpdateMatch[2].trim();
      }

      // Match product
      const matchedProduct = allProducts.find(
        (p: any) =>
          p.name.toLowerCase().includes(targetName.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(targetName.toLowerCase()))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `I couldn't find any product matching "${targetName}". Please check the spelling or add it first.`,
          actionTaken: "none",
        });
      }

      if (!isConfirmed) {
        return NextResponse.json({
          reply: `Update price of "${matchedProduct.name}" to ₱${newPrice.toFixed(2)}? Update and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "update_price",
            title: `Update price of "${matchedProduct.name}"?`,
            description: `Change price from ₱${(matchedProduct.selling_price ?? 0).toFixed(2)} to ₱${newPrice.toFixed(2)}.`,
            confirmLabel: "Update",
            command: `confirm update price of ${matchedProduct.name} to ${newPrice}`,
          },
          items: [{ ...matchedProduct, selling_price: newPrice }],
        });
      }

      await supabase
        .from("products")
        .update({ selling_price: newPrice })
        .eq("id", matchedProduct.id)
        .eq("inventory_id", inventoryId);

      return NextResponse.json({
        reply: `✓ Updated selling price of ${matchedProduct.name} to ₱${newPrice.toFixed(2)} (was ₱${(matchedProduct.selling_price ?? 0).toFixed(2)}).`,
        actionTaken: "update",
        items: [{ ...matchedProduct, selling_price: newPrice }],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. INTENT: UPDATE STOCK / QUANTITY
    // e.g. "update stock of Coke to 50" or "set quantity of bear brand to 24"
    // ─────────────────────────────────────────────────────────────
    const stockUpdateMatch = cleanLower.match(
      /(?:update|change|set|add to|restock)\s+(?:the\s+)?(?:stock|qty|quantity)\s+of\s+([a-zA-Z0-9\s\.\-&]+?)\s+(?:to|as|into|=)\s*(\d+)/i
    ) || cleanLower.match(
      /(?:set|update)\s+([a-zA-Z0-9\s\.\-&]+?)\s+stock\s+(?:to|=)\s*(\d+)/i
    );

    if (stockUpdateMatch) {
      const targetName = stockUpdateMatch[1].trim();
      const newQty = parseInt(stockUpdateMatch[2], 10);

      const matchedProduct = allProducts.find(
        (p: any) =>
          p.name.toLowerCase().includes(targetName.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(targetName.toLowerCase()))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `I couldn't find any product matching "${targetName}" to update stock.`,
          actionTaken: "none",
        });
      }

      if (!isConfirmed) {
        return NextResponse.json({
          reply: `Update stock of "${matchedProduct.name}" to ${newQty} units? Update and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "update_stock",
            title: `Update stock of "${matchedProduct.name}"?`,
            description: `Change inventory count from ${matchedProduct.quantity} to ${newQty} units.`,
            confirmLabel: "Update",
            command: `confirm update stock of ${matchedProduct.name} to ${newQty}`,
          },
          items: [{ ...matchedProduct, quantity: newQty }],
        });
      }

      await supabase
        .from("products")
        .update({ quantity: newQty })
        .eq("id", matchedProduct.id)
        .eq("inventory_id", inventoryId);

      return NextResponse.json({
        reply: `✓ Updated stock for ${matchedProduct.name}: Now ${newQty} in stock (was ${matchedProduct.quantity}).`,
        actionTaken: "update",
        items: [{ ...matchedProduct, quantity: newQty }],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. INTENT: DELETE CATEGORY
    // e.g. "delete category Biscuits", "remove category snacks"
    // ─────────────────────────────────────────────────────────────
    if (
      cleanLower.startsWith("delete category") ||
      cleanLower.startsWith("remove category") ||
      cleanLower.startsWith("alisin ang category")
    ) {
      const targetCatName = cleanLower
        .replace(/^(delete|remove|alisin ang)\s+category\s+/i, "")
        .trim();

      const matchedCat = allCategories.find((c: any) =>
        c.name.toLowerCase().includes(targetCatName)
      );

      if (!matchedCat) {
        return NextResponse.json({
          reply: `Could not find any category matching "${targetCatName}" to delete.`,
          actionTaken: "none",
        });
      }

      if (!isConfirmed) {
        return NextResponse.json({
          reply: `Delete category "${matchedCat.name}"? Delete and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "delete_category",
            title: `Delete category "${matchedCat.name}"?`,
            description: `Products in "${matchedCat.name}" will become Uncategorized.`,
            confirmLabel: "Delete",
            command: `confirm delete category ${matchedCat.name}`,
          },
        });
      }

      await supabase
        .from("categories")
        .delete()
        .eq("id", matchedCat.id)
        .eq("inventory_id", inventoryId);

      return NextResponse.json({
        reply: `✓ Successfully deleted category "${matchedCat.name}". Any linked products are now Uncategorized.`,
        actionTaken: "delete",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. INTENT: DELETE OR ARCHIVE PRODUCT
    // e.g. "delete this diaper brand" or "delete EQ" or "archive product Coke"
    // ─────────────────────────────────────────────────────────────
    if (cleanLower.startsWith("delete") || cleanLower.startsWith("alisin") || cleanLower.startsWith("remove")) {
      const targetName = cleanLower
        .replace(/^(delete|alisin|remove)\s+(this|the|product)?/i, "")
        .trim();

      const matchedProducts = allProducts.filter(
        (p: any) =>
          p.name.toLowerCase().includes(targetName) ||
          (p.brand && p.brand.toLowerCase().includes(targetName))
      );

      if (matchedProducts.length === 0) {
        return NextResponse.json({
          reply: `Could not find any product matching "${targetName}" to delete.`,
          actionTaken: "none",
        });
      }

      if (!isConfirmed) {
        const item = matchedProducts[0];
        return NextResponse.json({
          reply: `Delete product "${item.name}"? Delete and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "delete",
            title: `Delete product "${item.name}"?`,
            description: `Permanently delete "${item.name}" from your catalog. This cannot be undone.`,
            confirmLabel: "Delete",
            command: `confirm delete ${item.name}`,
          },
          items: matchedProducts,
        });
      }

      for (const item of matchedProducts) {
        await supabase.from("products").delete().eq("id", item.id).eq("inventory_id", inventoryId);
      }

      return NextResponse.json({
        reply: `✓ Deleted ${matchedProducts.length} item${matchedProducts.length === 1 ? "" : "s"} matching "${targetName}": ${matchedProducts.map((p: any) => p.name).join(", ")}.`,
        actionTaken: "delete",
        items: matchedProducts,
      });
    }

    if (cleanLower.startsWith("archive")) {
      const targetName = cleanLower.replace(/^archive\s+(the|product)?/i, "").trim();

      const matchedProduct = allProducts.find(
        (p: any) =>
          p.name.toLowerCase().includes(targetName) ||
          (p.brand && p.brand.toLowerCase().includes(targetName))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `Could not find any product matching "${targetName}" to archive.`,
          actionTaken: "none",
        });
      }

      if (!isConfirmed) {
        return NextResponse.json({
          reply: `Archive product "${matchedProduct.name}"? Archive and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "archive",
            title: `Archive product "${matchedProduct.name}"?`,
            description: `It will no longer appear in active sales or the public price list.`,
            confirmLabel: "Archive",
            command: `confirm archive ${matchedProduct.name}`,
          },
          items: [{ ...matchedProduct, archived: true }],
        });
      }

      await supabase
        .from("products")
        .update({ archived: true })
        .eq("id", matchedProduct.id)
        .eq("inventory_id", inventoryId);

      return NextResponse.json({
        reply: `✓ Successfully archived ${matchedProduct.name}. It will no longer appear in active sales or the public price list.`,
        actionTaken: "archive",
        items: [{ ...matchedProduct, archived: true }],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 6. INTENT: ADD / CREATE PRODUCT
    // e.g. "add product Marlboro Red price 120 stock 20 unit pack"
    // ─────────────────────────────────────────────────────────────
    if (cleanLower.startsWith("add") || cleanLower.startsWith("create") || cleanLower.startsWith("magdagdag")) {
      const priceMatch = activePrompt.match(/price\s*(?:to|is|:|=)?\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i);
      const stockMatch = activePrompt.match(/(?:stock|qty|quantity)\s*(?:to|is|:|=)?\s*(\d+)/i);
      const unitMatch = activePrompt.match(/(?:unit|size)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9]+)/i);

      let namePart = activePrompt
        .replace(/^(add|create|magdagdag)\s+(product|item)?/i, "")
        .replace(/price\s*(?:to|is|:|=)?\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i, "")
        .replace(/(?:stock|qty|quantity)\s*(?:to|is|:|=)?\s*(\d+)/i, "")
        .replace(/(?:unit|size)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9]+)/i, "")
        .replace(/(?:category)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9\s&]+)/i, "")
        .trim();

      if (!namePart) {
        return NextResponse.json({
          reply: 'Please specify the name of the product you want to add. Example: "Add product Great Taste White price 15 stock 30 unit sachet"',
          actionTaken: "none",
        });
      }

      const newSellingPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
      const newQuantity = stockMatch ? parseInt(stockMatch[1], 10) : 0;
      const newUnit = unitMatch ? unitMatch[1] : null;

      if (!isConfirmed) {
        return NextResponse.json({
          reply: `Add new product "${namePart}" (Price: ₱${(newSellingPrice ?? 0).toFixed(2)}, Stock: ${newQuantity}${newUnit ? ` ${newUnit}` : ""})? Add and Cancel`,
          actionTaken: "pending_confirmation",
          confirmation: {
            type: "create",
            title: `Add product "${namePart}"?`,
            description: `Selling price: ₱${(newSellingPrice ?? 0).toFixed(2)}, Initial stock: ${newQuantity} units.`,
            confirmLabel: "Add",
            command: `confirm ${activePrompt}`,
          },
        });
      }

      const { data: newProd, error: insertErr } = await supabase
        .from("products")
        .insert({
          inventory_id: inventoryId,
          name: namePart,
          selling_price: newSellingPrice,
          quantity: newQuantity,
          unit: newUnit,
          archived: false,
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({
        reply: `✓ Successfully added ${namePart} to your store inventory! Selling Price: ₱${(newSellingPrice ?? 0).toFixed(2)}, Stock: ${newQuantity} ${newUnit ? `(${newUnit})` : ""}.`,
        actionTaken: "create",
        items: [newProd],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 6. INTENT: LOW STOCK QUERY
    // e.g. "Tell me items with low stock", "low stock", "running low"
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("low stock") ||
      lower.includes("out of stock") ||
      lower.includes("mababa") ||
      lower.includes("running low") ||
      lower.includes("kaunti") ||
      lower.includes("ubos na")
    ) {
      const lowStockItems = allProducts.filter((p) => !p.archived && p.quantity <= 5);
      if (lowStockItems.length === 0) {
        return NextResponse.json({
          reply: "Great news! All products in your inventory currently have healthy stock levels (> 5 units on hand).",
          actionTaken: "query",
          items: [],
        });
      }

      let reply = `Found ${lowStockItems.length} items with low stock (5 units or less remaining):\n\n`;
      lowStockItems.slice(0, 10).forEach((p, idx) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        const priceStr = p.selling_price !== null ? `₱${p.selling_price.toFixed(2)}` : "Price TBD";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ${p.quantity} units left | ${priceStr}\n`;
      });
      if (lowStockItems.length > 10) {
        reply += `\n...and ${lowStockItems.length - 10} more low-stock items.`;
      }

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: lowStockItems.slice(0, 10),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 7. INTENT: MISSING PRICE QUERY
    // e.g. "Tell me items with missing price", "walang presyo", "unpriced"
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("missing price") ||
      lower.includes("no price") ||
      lower.includes("walang presyo") ||
      lower.includes("unpriced")
    ) {
      const unpricedItems = allProducts.filter((p) => !p.archived && p.selling_price === null);
      if (unpricedItems.length === 0) {
        return NextResponse.json({
          reply: "All active products in your store currently have selling prices configured!",
          actionTaken: "query",
          items: [],
        });
      }

      let reply = `Found ${unpricedItems.length} items missing a selling price:\n\n`;
      unpricedItems.slice(0, 10).forEach((p, idx) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ${p.quantity} in stock | Price TBD\n`;
      });

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: unpricedItems.slice(0, 10),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 8. INTENT: ALL CATEGORIES OVERVIEW & PRODUCT BREAKDOWN
    // e.g. "list all categories, and how many products in each", "categories", "how many categories"
    // ─────────────────────────────────────────────────────────────
    const isCategoryOverviewQuery =
      (lower.includes("categor") || lower.includes("kategorya")) &&
      (lower.includes("all") ||
        lower.includes("list") ||
        lower.includes("show") ||
        lower.includes("each") ||
        lower.includes("how many") ||
        lower.includes("ilan") ||
        lower.includes("what are") ||
        lower.includes("breakdown") ||
        lower.includes("summary") ||
        lower.includes("count") ||
        lower.includes("view") ||
        lower.includes("exist") ||
        lower.includes("available") ||
        lower.trim() === "categories" ||
        lower.trim() === "category" ||
        lower.trim() === "list categories" ||
        lower.trim() === "all categories");

    // Check if user specifically named an individual category
    const specificCategoryTarget = allCategories.find((cat: any) => {
      const catLower = (cat.name || "").toLowerCase();
      return catLower.length > 2 && lower.includes(catLower);
    });

    const isExplicitlyGeneral =
      lower.includes("each") ||
      lower.includes("all categories") ||
      lower.includes("list all categories") ||
      lower.includes("how many products in each") ||
      lower.includes("and how many") ||
      lower.includes("breakdown") ||
      lower.includes("summary") ||
      !specificCategoryTarget;

    if (isCategoryOverviewQuery && isExplicitlyGeneral) {
      const categoryMap = new Map<string, { name: string; count: number; totalQty: number }>();
      allCategories.forEach((cat: any) => {
        categoryMap.set(cat.id, { name: cat.name, count: 0, totalQty: 0 });
      });

      let uncategorizedCount = 0;
      let uncategorizedQty = 0;
      let totalActive = 0;
      let totalUnits = 0;

      allProducts.forEach((p: any) => {
        if (p.archived) return;
        totalActive++;
        totalUnits += p.quantity || 0;

        if (p.category_id && categoryMap.has(p.category_id)) {
          const entry = categoryMap.get(p.category_id)!;
          entry.count++;
          entry.totalQty += p.quantity || 0;
        } else {
          uncategorizedCount++;
          uncategorizedQty += p.quantity || 0;
        }
      });

      const sortedCategories = Array.from(categoryMap.values()).sort(
        (a, b) => b.count - a.count
      );

      let reply = `Here is the breakdown of all store categories and product counts:\n\n`;
      sortedCategories.forEach((cat, idx) => {
        reply += `${idx + 1}. ${cat.name} — ${cat.count} product${cat.count === 1 ? "" : "s"} (${cat.totalQty} units in stock)\n`;
      });

      if (uncategorizedCount > 0) {
        reply += `• Uncategorized — ${uncategorizedCount} product${uncategorizedCount === 1 ? "" : "s"} (${uncategorizedQty} units in stock)\n`;
      }

      reply += `\nTotal: ${allCategories.length} categories | ${totalActive} active products (${totalUnits} total units in stock).`;

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: [],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 9. INTENT: STORE INVENTORY OVERVIEW / SUMMARY
    // e.g. "inventory summary", "store summary", "total products", "total stock", "store stats"
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("inventory summary") ||
      lower.includes("store summary") ||
      lower.includes("total products") ||
      lower.includes("total items") ||
      lower.includes("total stock") ||
      lower.includes("total inventory") ||
      lower.includes("total value") ||
      lower.includes("store stats") ||
      lower.includes("how many products in total") ||
      lower.includes("how many items in total") ||
      lower.includes("kabuuang produkto")
    ) {
      const activeProds = allProducts.filter((p: any) => !p.archived);
      const totalStock = activeProds.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
      const totalRetailVal = activeProds.reduce(
        (sum: number, p: any) => sum + (p.quantity || 0) * (p.selling_price || 0),
        0
      );
      const lowStockCount = activeProds.filter((p: any) => (p.quantity || 0) <= 5).length;
      const outOfStockCount = activeProds.filter((p: any) => (p.quantity || 0) === 0).length;
      const unpricedCount = activeProds.filter((p: any) => p.selling_price === null).length;

      let reply = `Store Inventory Summary:\n\n`;
      reply += `• Active Products: ${activeProds.length} items\n`;
      reply += `• Total Stock on Hand: ${totalStock} units\n`;
      reply += `• Estimated Catalog Value: ₱${totalRetailVal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      reply += `• Categories: ${allCategories.length} categories configured\n`;
      if (outOfStockCount > 0) reply += `• Out of Stock: ${outOfStockCount} items (0 units left)\n`;
      if (lowStockCount > 0) reply += `• Low Stock Alert: ${lowStockCount} items (5 or fewer units)\n`;
      if (unpricedCount > 0) reply += `• Missing Prices: ${unpricedCount} items missing selling price\n`;

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: activeProds.slice(0, 5),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 10. INTENT: PRICE & STOCK EXTREMES (MOST EXPENSIVE, CHEAPEST, HIGHEST STOCK)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("most expensive") ||
      lower.includes("highest price") ||
      lower.includes("pinakamahal")
    ) {
      const priced = allProducts
        .filter((p: any) => !p.archived && p.selling_price !== null)
        .sort((a: any, b: any) => (b.selling_price || 0) - (a.selling_price || 0));

      if (priced.length === 0) {
        return NextResponse.json({
          reply: "No priced products found in inventory.",
          actionTaken: "query",
          items: [],
        });
      }

      let reply = `Top most expensive products in your store:\n\n`;
      priced.slice(0, 5).forEach((p: any, idx: number) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ₱${(p.selling_price || 0).toFixed(2)} (${p.quantity} in stock)\n`;
      });

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: priced.slice(0, 5),
      });
    }

    if (
      lower.includes("cheapest") ||
      lower.includes("lowest price") ||
      lower.includes("pinakamura")
    ) {
      const priced = allProducts
        .filter((p: any) => !p.archived && p.selling_price !== null && p.selling_price > 0)
        .sort((a: any, b: any) => (a.selling_price || 0) - (b.selling_price || 0));

      if (priced.length === 0) {
        return NextResponse.json({
          reply: "No priced products found in inventory.",
          actionTaken: "query",
          items: [],
        });
      }

      let reply = `Cheapest products in your store:\n\n`;
      priced.slice(0, 5).forEach((p: any, idx: number) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ₱${(p.selling_price || 0).toFixed(2)} (${p.quantity} in stock)\n`;
      });

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: priced.slice(0, 5),
      });
    }

    if (
      lower.includes("most stock") ||
      lower.includes("highest stock") ||
      lower.includes("highest quantity") ||
      lower.includes("pinakamarami")
    ) {
      const sortedStock = allProducts
        .filter((p: any) => !p.archived)
        .sort((a: any, b: any) => (b.quantity || 0) - (a.quantity || 0));

      let reply = `Products with the highest stock on hand:\n\n`;
      sortedStock.slice(0, 5).forEach((p: any, idx: number) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        const priceStr = p.selling_price !== null ? `₱${p.selling_price.toFixed(2)}` : "Price TBD";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ${p.quantity} units | ${priceStr}\n`;
      });

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: sortedStock.slice(0, 5),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 11. INTENT: SPECIFIC SINGLE CATEGORY QUERY
    // e.g. "Show me all Canned Goods", "list beverages", "what candy items do we have"
    // ─────────────────────────────────────────────────────────────
    const matchedCategory = specificCategoryTarget || allCategories.find((cat: any) => {
      const catLower = (cat.name || "").toLowerCase();
      if (lower.includes(catLower)) return true;
      const words = catLower.split(/[\s&,/]+/).filter((w: string) => w.length > 2);
      return words.some((w: string) => lower.includes(w));
    });

    if (
      matchedCategory &&
      (lower.includes("show") ||
        lower.includes("list") ||
        lower.includes("category") ||
        lower.includes("all") ||
        lower.includes("canned") ||
        lower.includes("beverage") ||
        lower.includes("drinks") ||
        lower.includes("goods") ||
        lower.includes("what") ||
        lower.includes("anong") ||
        lower.includes("products") ||
        lower.includes("items"))
    ) {
      const categoryProducts = allProducts.filter(
        (p: any) => !p.archived && p.category_id === matchedCategory.id
      );

      if (categoryProducts.length === 0) {
        return NextResponse.json({
          reply: `There are currently no products under "${matchedCategory.name}".`,
          actionTaken: "query",
          items: [],
        });
      }

      let reply = `Found ${categoryProducts.length} items in ${matchedCategory.name}:\n\n`;
      categoryProducts.slice(0, 12).forEach((p: any, idx: number) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        const priceStr = p.selling_price !== null ? `₱${p.selling_price.toFixed(2)}` : "Price TBD";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ${p.quantity} in stock | ${priceStr}\n`;
      });
      if (categoryProducts.length > 12) {
        reply += `\n...and ${categoryProducts.length - 12} more items in this category.`;
      }

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: categoryProducts.slice(0, 12),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 12. INTENT: SPECIFIC PRODUCT / BRAND STOCK & PRICE INQUIRY
    // e.g. "how many bear brand are remaining?", "price of coke", "ilan ang marlboro"
    // ─────────────────────────────────────────────────────────────
    // Clean query keywords
    let cleanQuery = prompt
      .toLowerCase()
      .replace(/^(can you\s+)?(tell me|show me|check|what is the|what's the|how many|magkano ang|ilan ang|meron bang|do you have|do we have|is there|list all|find)\s+/i, "")
      .replace(/\s+(are remaining|remaining|left in stock|in stock|are left|available|on hand|natira|ba|pa|all|items|products)\b/gi, "")
      .replace(/\b(of|the|ng|sa|ang|for|about|in)\b/gi, "")
      .trim();

    if (!cleanQuery) cleanQuery = prompt.trim().toLowerCase();
    const tokens = cleanQuery.split(/\s+/).filter((t: string) => t.length > 1);

    const matchedItems = allProducts.filter((p: any) => {
      if (p.archived) return false;
      const nameLower = (p.name || "").toLowerCase();
      const brandLower = p.brand ? p.brand.toLowerCase() : "";
      const mfrLower = p.manufacturer ? p.manufacturer.toLowerCase() : "";
      const catName = (
        Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name
      )?.toLowerCase() || "";

      if (
        nameLower.includes(cleanQuery) ||
        brandLower.includes(cleanQuery) ||
        mfrLower.includes(cleanQuery) ||
        catName.includes(cleanQuery)
      ) {
        return true;
      }
      if (tokens.length > 1) {
        return tokens.every(
          (tok: string) =>
            nameLower.includes(tok) ||
            brandLower.includes(tok) ||
            mfrLower.includes(tok) ||
            catName.includes(tok)
        );
      }
      return false;
    });

    if (matchedItems.length > 0) {
      const totalQuantity = matchedItems.reduce((sum, p) => sum + p.quantity, 0);
      let reply = `Found ${matchedItems.length} matching item${matchedItems.length === 1 ? "" : "s"} (${totalQuantity} total units in stock):\n\n`;
      matchedItems.slice(0, 10).forEach((p, idx) => {
        const brandStr = p.brand ? `[${p.brand}] ` : "";
        const unitStr = p.unit ? ` (${p.unit})` : "";
        const priceStr = p.selling_price !== null ? `₱${p.selling_price.toFixed(2)}` : "Price TBD";
        reply += `${idx + 1}. ${brandStr}${p.name}${unitStr} — ${p.quantity} units | ${priceStr}\n`;
      });
      if (matchedItems.length > 10) {
        reply += `\n...and ${matchedItems.length - 10} more items.`;
      }

      return NextResponse.json({
        reply,
        actionTaken: "query",
        items: matchedItems.slice(0, 10),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 13. GEMINI AI FALLBACK (IF API KEY CONFIGURED)
    // ─────────────────────────────────────────────────────────────
    const geminiReply = await tryGeminiAnalysis(prompt, allProducts, allCategories);
    if (geminiReply) {
      return NextResponse.json({
        reply: geminiReply,
        actionTaken: "query",
        items: [],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 14. DYNAMIC CONTEXTUAL FALLBACK
    // ─────────────────────────────────────────────────────────────
    const activeCount = allProducts.filter((p: any) => !p.archived).length;
    const categorySample = allCategories.slice(0, 4).map((c: any) => c.name).join(", ");

    return NextResponse.json({
      reply: `I couldn't find any products or actions matching "${cleanQuery}".\n\nYour store currently has ${activeCount} products across ${allCategories.length} categories${categorySample ? ` (such as ${categorySample})` : ""}.\n\nTry asking me:\n• "List all categories, and how many products in each"\n• "Tell me items with low stock"\n• "Inventory summary"\n• "Show most expensive items"\n• "Update price of Coke Mismo to 20"\n• "Add product Marlboro Red price 120 stock 10 unit pack"`,
      actionTaken: "general",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("AI Copilot error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
