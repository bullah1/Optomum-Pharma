import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, category, company, dosage_form, strength } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Product name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const productContext = [
      `Product: ${name}`,
      category && `Category: ${category}`,
      company && `Brand/Company: ${company}`,
      dosage_form && `Dosage Form: ${dosage_form}`,
      strength && `Strength: ${strength}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are an SEO expert for Optimum Pharmaceuticals HLB, an online pharmacy in Dhaka, Bangladesh. 
Generate SEO-optimized content in English with occasional Bangla keywords for local SEO.
Target audience: Bangladeshi consumers searching for medicines and healthcare products online.
Always respond with valid JSON only, no markdown.`;

    const userPrompt = `Generate SEO content for this product:
${productContext}

Return a JSON object with exactly these fields:
{
  "meta_title": "SEO title under 60 characters, include product name + key benefit + 'Buy Online Bangladesh'",
  "meta_description": "Under 150 characters. Include product name, use case, and call-to-action. Mix English + Bangla naturally.",
  "description": "Product description ~400 words in HTML format. Structure: opening paragraph about the product, then h3 sections for Uses/Benefits, How to Use, Side Effects, Storage. Use <p>, <h3>, <ul>, <li>, <strong> tags. Mix English with Bangla terms naturally for local SEO. Include keywords like 'Optimum Pharmaceuticals HLB', 'বাংলাদেশ', 'অনলাইন ফার্মেসি', 'হোম ডেলিভারি'. End with a call-to-action about ordering from Optimum Pharmaceuticals HLB."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_seo_content",
              description: "Return SEO-optimized product content",
              parameters: {
                type: "object",
                properties: {
                  meta_title: { type: "string", description: "SEO title under 60 chars" },
                  meta_description: { type: "string", description: "Meta description under 150 chars" },
                  description: { type: "string", description: "HTML product description ~400 words" },
                },
                required: ["meta_title", "meta_description", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_seo_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    let seoContent;
    if (toolCall?.function?.arguments) {
      seoContent = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing from content
      const content = result.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    // Enforce limits
    if (seoContent.meta_title?.length > 60) {
      seoContent.meta_title = seoContent.meta_title.slice(0, 57) + "...";
    }
    if (seoContent.meta_description?.length > 160) {
      seoContent.meta_description = seoContent.meta_description.slice(0, 157) + "...";
    }

    return new Response(JSON.stringify(seoContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-seo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
