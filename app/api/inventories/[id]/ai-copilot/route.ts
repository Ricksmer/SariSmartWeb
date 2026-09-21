import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        .select("id, name, brand, unit, selling_price, buy_price, quantity, archived, category_id, categories(name)")
        .eq("inventory_id", inventoryId),
      supabase
        .from("categories")
        .select("id, name")
        .eq("inventory_id", inventoryId),
    ]);

    const allProducts = products || [];
    const allCategories = categories || [];

    const lower = prompt.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 1. INTENT: CLEAN DATA / EXTRACT SIZES FROM NAMES
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("clean") ||
      (lower.includes("extract") && (lower.includes("size") || lower.includes("unit"))) ||
      lower.includes("format size") ||
      lower.includes("separate unit")
    ) {
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
    const priceUpdateMatch = lower.match(
      /(?:update|change|set|edit)\s+(?:the\s+)?price\s+of\s+([a-zA-Z0-9\s\.\-&]+?)\s+(?:to|as|into|=)\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i
    ) || lower.match(
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
        (p) =>
          p.name.toLowerCase().includes(targetName.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(targetName.toLowerCase()))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `I couldn't find any product matching "${targetName}". Please check the spelling or add it first.`,
          actionTaken: "none",
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
    const stockUpdateMatch = lower.match(
      /(?:update|change|set|add to|restock)\s+(?:the\s+)?(?:stock|qty|quantity)\s+of\s+([a-zA-Z0-9\s\.\-&]+?)\s+(?:to|as|into|=)\s*(\d+)/i
    ) || lower.match(
      /(?:set|update)\s+([a-zA-Z0-9\s\.\-&]+?)\s+stock\s+(?:to|=)\s*(\d+)/i
    );

    if (stockUpdateMatch) {
      const targetName = stockUpdateMatch[1].trim();
      const newQty = parseInt(stockUpdateMatch[2], 10);

      const matchedProduct = allProducts.find(
        (p) =>
          p.name.toLowerCase().includes(targetName.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(targetName.toLowerCase()))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `I couldn't find any product matching "${targetName}" to update stock.`,
          actionTaken: "none",
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
    // 4. INTENT: DELETE OR ARCHIVE PRODUCT
    // e.g. "delete this diaper brand" or "delete EQ" or "archive product Coke"
    // ─────────────────────────────────────────────────────────────
    if (lower.startsWith("delete") || lower.startsWith("alisin") || lower.startsWith("remove")) {
      const targetName = lower
        .replace(/^(delete|alisin|remove)\s+(this|the|product)?/i, "")
        .trim();

      const matchedProducts = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(targetName) ||
          (p.brand && p.brand.toLowerCase().includes(targetName))
      );

      if (matchedProducts.length === 0) {
        return NextResponse.json({
          reply: `Could not find any product matching "${targetName}" to delete.`,
          actionTaken: "none",
        });
      }

      if (matchedProducts.length === 1) {
        const item = matchedProducts[0];
        await supabase.from("products").delete().eq("id", item.id).eq("inventory_id", inventoryId);
        return NextResponse.json({
          reply: `✓ Permanently deleted ${item.name} from your store catalog.`,
          actionTaken: "delete",
          items: [item],
        });
      }

      // If multiple match, delete them or ask
      for (const item of matchedProducts) {
        await supabase.from("products").delete().eq("id", item.id).eq("inventory_id", inventoryId);
      }

      return NextResponse.json({
        reply: `✓ Deleted ${matchedProducts.length} items matching "${targetName}": ${matchedProducts.map((p) => p.name).join(", ")}.`,
        actionTaken: "delete",
        items: matchedProducts,
      });
    }

    if (lower.startsWith("archive")) {
      const targetName = lower.replace(/^archive\s+(the|product)?/i, "").trim();

      const matchedProduct = allProducts.find(
        (p) =>
          p.name.toLowerCase().includes(targetName) ||
          (p.brand && p.brand.toLowerCase().includes(targetName))
      );

      if (!matchedProduct) {
        return NextResponse.json({
          reply: `Could not find any product matching "${targetName}" to archive.`,
          actionTaken: "none",
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
    // 5. INTENT: ADD / CREATE PRODUCT
    // e.g. "add product Marlboro Red price 120 stock 20 unit pack"
    // ─────────────────────────────────────────────────────────────
    if (lower.startsWith("add") || lower.startsWith("create") || lower.startsWith("magdagdag")) {
      // Simple regex extraction for name, price, stock, unit
      const priceMatch = prompt.match(/price\s*(?:to|is|:|=)?\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i);
      const stockMatch = prompt.match(/(?:stock|qty|quantity)\s*(?:to|is|:|=)?\s*(\d+)/i);
      const unitMatch = prompt.match(/(?:unit|size)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9]+)/i);

      // Clean name by removing keyword flags
      let namePart = prompt
        .replace(/^(add|create|magdagdag)\s+(product|item)?/i, "")
        .replace(/price\s*(?:to|is|:|=)?\s*(?:₱|p)?\s*(\d+(?:\.\d+)?)/i, "")
        .replace(/(?:stock|qty|quantity)\s*(?:to|is|:|=)?\s*(\d+)/i, "")
        .replace(/(?:unit|size)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9]+)/i, "")
        .replace(/(?:category)\s*(?:to|is|:|=)?\s*([a-zA-Z0-9\s&]+)/i, "")
        .trim();

      if (!namePart) {
        return NextResponse.json({
          reply: "Please specify the name of the product you want to add. Example: *\"Add product Great Taste White price 15 stock 30 unit sachet\"*",
          actionTaken: "none",
        });
      }

      const newSellingPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
      const newQuantity = stockMatch ? parseInt(stockMatch[1], 10) : 0;
      const newUnit = unitMatch ? unitMatch[1] : null;

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
    // 6. INTENT: QUERY (STOCK / QUANTITY / PRICING / CATEGORY)
    // e.g. "tell me how many each cigarette packs are remaining"
    // e.g. "how many bear brand" or "ilan natira"
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes("how many") ||
      lower.includes("remaining") ||
      lower.includes("stock") ||
      lower.includes("ilan") ||
      lower.includes("natira") ||
      lower.includes("count") ||
      lower.includes("search") ||
      lower.includes("show") ||
      lower.includes("list") ||
      lower.includes("price of") ||
      lower.includes("magkano")
    ) {
      // Find keywords
      let searchTerms = prompt
        .toLowerCase()
        .replace(/tell me how many|how many each|how many|are remaining|remaining|packs|pack|are left|left in stock|in stock|natira|ilan pa|magkano ang|what is the price of|show me|list all/gi, "")
        .replace(/products|items|the|ng|sa/gi, "")
        .trim();

      let matchedItems = allProducts.filter((p) => !p.archived);

      if (searchTerms.length > 0) {
        matchedItems = matchedItems.filter((p: any) => {
          const catName = Array.isArray(p.categories)
            ? p.categories[0]?.name
            : p.categories?.name;
          return (
            p.name.toLowerCase().includes(searchTerms) ||
            (p.brand && p.brand.toLowerCase().includes(searchTerms)) ||
            (catName && catName.toLowerCase().includes(searchTerms))
          );
        });
      }

      // Check special filters: low stock, missing prices
      if (lower.includes("low stock") || lower.includes("mababa")) {
        matchedItems = matchedItems.filter((p) => p.quantity <= 5);
      } else if (lower.includes("missing price") || lower.includes("walang presyo")) {
        matchedItems = matchedItems.filter((p) => p.selling_price === null);
      }

      if (matchedItems.length === 0) {
        return NextResponse.json({
          reply: `I checked your catalog and found 0 items matching "${searchTerms || prompt}".`,
          actionTaken: "query",
          items: [],
        });
      }

      const totalQuantity = matchedItems.reduce((sum, p) => sum + p.quantity, 0);

      // Build summary reply
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
        totalCount: matchedItems.length,
        totalQuantity,
      });
    }

    // Default Fallback
    return NextResponse.json({
      reply: `I received: "${prompt}". Here are things I can do for you:\n• *"How many [item] are remaining?"*\n• *"Update price of [item] to [₱]"*\n• *"Set stock of [item] to [quantity]"*\n• *"Add product [name] price [₱] stock [qty]"*\n• *"Delete / Archive [item]"*\n• *"Extract sizes from product names"*`,
      actionTaken: "general",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("AI Copilot error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
