import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_id, product_name, category, company, dosage_form } = await req.json();

    if (!product_id || !product_name) {
      return new Response(JSON.stringify({ error: "product_id and product_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch available products (exclude current product, limit pool)
    const { data: products, error: dbError } = await supabase
      .from("medicines")
      .select("id, name, company, category_id, dosage_form, price, original_price, image_url, slug, stock")
      .neq("id", product_id)
      .gt("stock", 0)
      .limit(200);

    if (dbError) throw dbError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact product list for AI
    const productList = products.map((p, i) => `${i}|${p.name}|${p.company || ""}|${p.dosage_form || ""}`).join("\n");

    const prompt = `Given this medicine/product: "${product_name}" (Category: ${category || "N/A"}, Brand: ${company || "N/A"}, Form: ${dosage_form || "N/A"}).

From the list below, pick 6-8 products that a customer buying this product would also likely want. Consider: same therapeutic use, complementary products, same brand alternatives, or commonly bought together.

Product list (index|name|company|form):
${productList}

Return ONLY a JSON array of indices like [2,5,11,3,7,15]. No explanation.`;

    // Helper: DB-only fallback recommendations (same category/company)
    const dbFallback = () => {
      const scored = products.map(p => {
        let score = 0;
        if (category && p.category_id === category) score += 3;
        if (company && p.company === company) score += 2;
        if (dosage_form && p.dosage_form === dosage_form) score += 1;
        return { ...p, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 8).map(p => ({
        id: p.id, name: p.name, price: p.price, original_price: p.original_price,
        image_url: p.image_url, slug: p.slug, company: p.company,
      }));
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // No API key — use DB fallback
      return new Response(JSON.stringify({ recommendations: dbFallback() }), {
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
          { role: "system", content: "You are a pharmacy product recommendation engine. Return only valid JSON arrays of integer indices. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      // On 402/429 or any AI error, gracefully fall back to DB recommendations
      console.warn(`AI gateway returned ${aiResponse.status}, using DB fallback`);
      return new Response(JSON.stringify({ recommendations: dbFallback() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim() || "[]";
    
    // Parse indices from AI response
    let indices: number[] = [];
    try {
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      indices = JSON.parse(cleaned);
      if (!Array.isArray(indices)) indices = [];
    } catch {
      // Try extracting numbers
      const matches = content.match(/\d+/g);
      indices = matches ? matches.map(Number) : [];
    }

    // Map indices to actual products
    const recommended = indices
      .filter(i => i >= 0 && i < products.length)
      .slice(0, 8)
      .map(i => ({
        id: products[i].id,
        name: products[i].name,
        price: products[i].price,
        original_price: products[i].original_price,
        image_url: products[i].image_url,
        slug: products[i].slug,
        company: products[i].company,
      }));

    return new Response(JSON.stringify({ recommendations: recommended }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Recommendation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
