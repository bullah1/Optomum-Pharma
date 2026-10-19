import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    // Verify admin
    const supabase = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only");

    // Fetch last 30 days data
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const prevStart = new Date(Date.now() - 60 * 86400000).toISOString();

    const [visitsRes, eventsRes, ordersRes, spendRes, prevOrdersRes] = await Promise.all([
      supabase.from("marketing_visits").select("utm_source, device_type, created_at").gte("created_at", since),
      supabase.from("marketing_events").select("event_type, event_data, created_at").gte("created_at", since),
      supabase.from("orders").select("id, total_amount, utm_source, user_id, created_at, delivery_charge").gte("created_at", since),
      supabase.from("ad_spend").select("amount, clicks, impressions").gte("created_at", since),
      supabase.from("orders").select("id, total_amount, created_at").gte("created_at", prevStart).lt("created_at", since),
    ]);

    const visits = visitsRes.data || [];
    const events = eventsRes.data || [];
    const orders = ordersRes.data || [];
    const spends = spendRes.data || [];
    const prevOrders = prevOrdersRes.data || [];

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
    const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const totalSpend = spends.reduce((s, r) => s + Number(r.amount), 0);
    const totalClicks = spends.reduce((s, r) => s + (r.clicks || 0), 0);
    const totalImpressions = spends.reduce((s, r) => s + (r.impressions || 0), 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Event counts
    const eventCounts: Record<string, number> = {};
    events.forEach(e => { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1; });

    // Source breakdown
    const sourceMap: Record<string, { visits: number; orders: number; revenue: number }> = {};
    visits.forEach(v => {
      const k = v.utm_source || "direct";
      if (!sourceMap[k]) sourceMap[k] = { visits: 0, orders: 0, revenue: 0 };
      sourceMap[k].visits++;
    });
    orders.forEach(o => {
      const k = o.utm_source || "direct";
      if (!sourceMap[k]) sourceMap[k] = { visits: 0, orders: 0, revenue: 0 };
      sourceMap[k].orders++;
      sourceMap[k].revenue += Number(o.total_amount);
    });

    // Repeat customers
    const customerOrders: Record<string, number> = {};
    orders.forEach(o => { customerOrders[o.user_id] = (customerOrders[o.user_id] || 0) + 1; });
    const repeatCustomers = Object.values(customerOrders).filter(c => c > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;

    // Top products
    const productViews: Record<string, { name: string; views: number; carts: number }> = {};
    events.forEach(e => {
      const d = e.event_data as any;
      if (!d?.product_id) return;
      if (!productViews[d.product_id]) productViews[d.product_id] = { name: d.product_name || "", views: 0, carts: 0 };
      if (e.event_type === "product_view") productViews[d.product_id].views++;
      if (e.event_type === "add_to_cart") productViews[d.product_id].carts++;
    });

    const topProducts = Object.entries(productViews)
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 5)
      .map(([id, d]) => ({ id, ...d }));

    // Build prompt
    const prompt = `You are a marketing analytics expert for a Bangladeshi e-pharmacy/healthcare e-commerce business. Analyze the following data from the last 30 days and provide actionable business recommendations IN BENGALI (বাংলা).

DATA:
- Revenue: ৳${totalRevenue.toLocaleString()} (Previous 30 days: ৳${prevRevenue.toLocaleString()})
- Orders: ${orders.length} (Previous: ${prevOrders.length})
- AOV: ৳${aov.toFixed(0)}
- Total Visits: ${visits.length}
- Ad Spend: ৳${totalSpend.toLocaleString()}
- ROAS: ${totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "N/A"}x
- CTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
- Conversion Rate (Visit→Order): ${visits.length > 0 ? ((orders.length / visits.length) * 100).toFixed(2) : 0}%
- Product Views: ${eventCounts["product_view"] || 0}
- Add to Cart: ${eventCounts["add_to_cart"] || 0}
- Cart→Order rate: ${(eventCounts["add_to_cart"] || 0) > 0 ? ((orders.length / (eventCounts["add_to_cart"] || 1)) * 100).toFixed(1) : 0}%
- Total Customers: ${totalCustomers}, Repeat: ${repeatCustomers} (${totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
- Top Sources: ${Object.entries(sourceMap).slice(0, 5).map(([s, d]) => `${s}: ${d.visits} visits, ${d.orders} orders, ৳${d.revenue.toLocaleString()}`).join("; ")}
- Top Products: ${topProducts.map(p => `${p.name}: ${p.views} views, ${p.carts} carts`).join("; ")}

Provide EXACTLY 5 insights in this JSON format (respond with ONLY the JSON array, no markdown):
[
  {
    "title": "Short title in Bengali",
    "insight": "2-3 sentence analysis in Bengali",
    "action": "Specific actionable step in Bengali",
    "priority": "high" | "medium" | "low",
    "category": "revenue" | "acquisition" | "retention" | "optimization" | "growth"
  }
]

Focus on:
1. Revenue growth opportunities
2. Customer acquisition optimization  
3. Retention & repeat purchase improvement
4. Ad spend optimization (ROAS improvement)
5. Conversion funnel improvements`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle potential markdown wrapping)
    let insights = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) insights = JSON.parse(jsonMatch[0]);
    } catch {
      insights = [{ title: "Analysis Error", insight: content, action: "Please try again", priority: "medium", category: "optimization" }];
    }

    return new Response(JSON.stringify({
      insights,
      summary: {
        revenue: totalRevenue,
        prevRevenue,
        orders: orders.length,
        prevOrders: prevOrders.length,
        aov,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
        totalCustomers,
        repeatCustomers,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
