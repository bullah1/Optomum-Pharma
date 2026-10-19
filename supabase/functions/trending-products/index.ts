import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get recent orders to find trending products
    const { data: recentOrderItems } = await supabase
      .from("order_items")
      .select("medicine_id, quantity")
      .order("created_at", { ascending: false })
      .limit(200);

    // Get available products
    const { data: products, error: dbError } = await supabase
      .from("medicines")
      .select("id, name, company, category_id, dosage_form, price, original_price, image_url, slug, stock")
      .gt("stock", 0)
      .limit(100);

    if (dbError) throw dbError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ trending: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build order frequency map
    const orderFreq: Record<string, number> = {};
    if (recentOrderItems) {
      for (const item of recentOrderItems) {
        orderFreq[item.medicine_id] = (orderFreq[item.medicine_id] || 0) + item.quantity;
      }
    }

    // Compact product list with order counts
    const productList = products.map((p, i) => {
      const orders = orderFreq[p.id] || 0;
      return `${i}|${p.name}|${p.company || ""}|${p.dosage_form || ""}|orders:${orders}`;
    }).join("\n");

    const prompt = `You are a pharmacy trending products curator for Bangladesh. From the product list below, select 8-10 products that should be featured as "Trending Now" on the homepage. 

Consider:
- Products with higher recent order counts are more popular
- Include a mix of categories (medicine, supplements, personal care)
- Prefer products with discounts (original_price > price)
- Pick products customers commonly need

Product list (index|name|company|form|recent_orders):
${productList}

Return ONLY a JSON array of indices like [2,5,11,3,7,15,0,9]. No explanation.`;
    // DB fallback helper
    const dbFallback = () => {
      const sorted = [...products].sort((a, b) => (orderFreq[b.id] || 0) - (orderFreq[a.id] || 0));
      return sorted.slice(0, 10).map(p => ({
        id: p.id, name: p.name, price: p.price, original_price: p.original_price,
        image_url: p.image_url, slug: p.slug, company: p.company, stock: p.stock,
      }));
    };

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ trending: dbFallback() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a product curation engine. Return only valid JSON arrays of integer indices. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.warn(`AI unavailable (${aiResponse.status}), using fallback`);
      return new Response(JSON.stringify({ trending: dbFallback() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim() || "[]";

    let indices: number[] = [];
    try {
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      indices = JSON.parse(cleaned);
      if (!Array.isArray(indices)) indices = [];
    } catch {
      const matches = content.match(/\d+/g);
      indices = matches ? matches.map(Number) : [];
    }

    const trending = indices
      .filter(i => i >= 0 && i < products.length)
      .slice(0, 10)
      .map(i => ({
        id: products[i].id,
        name: products[i].name,
        price: products[i].price,
        original_price: products[i].original_price,
        image_url: products[i].image_url,
        slug: products[i].slug,
        company: products[i].company,
        stock: products[i].stock,
      }));

    return new Response(JSON.stringify({ trending }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Trending error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
