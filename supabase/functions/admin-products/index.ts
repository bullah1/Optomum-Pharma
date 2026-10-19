import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_CODE = "990990";

// Rate limiting: IP + endpoint
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // 30 requests per minute for admin endpoints
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// Cleanup stale entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key);
  }
}, 300_000);

async function logAudit(
  supabase: any,
  action: string,
  recordId: string | null,
  oldData: any,
  newData: any,
  ip: string,
  userAgent: string
) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      table_name: "medicines",
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (_) { /* don't fail on audit log errors */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").replace(/[^a-fA-F0-9.:,]/g, "").slice(0, 45);
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 200);

  if (!checkRateLimit(`admin-products:${ip}`)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { admin_code, action, payload, id, ids } = body;

    if (admin_code !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "insert": {
        const { data, error } = await supabase.from("medicines").insert(payload).select().single();
        if (error) throw error;
        result = data;
        await logAudit(supabase, "insert", data?.id, null, payload, ip, userAgent);
        break;
      }
      case "update": {
        // Get old data for audit
        const { data: oldData } = await supabase.from("medicines").select("*").eq("id", id).single();
        const { data, error } = await supabase.from("medicines").update(payload).eq("id", id).select().single();
        if (error) throw error;
        result = data;
        await logAudit(supabase, "update", id, oldData, payload, ip, userAgent);
        break;
      }
      case "delete": {
        const { data: oldData } = await supabase.from("medicines").select("name,price").eq("id", id).single();
        const { error } = await supabase.from("medicines").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "delete", id, oldData, null, ip, userAgent);
        break;
      }
      case "bulk_delete": {
        const { error } = await supabase.from("medicines").delete().in("id", ids);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "bulk_delete", null, { ids }, null, ip, userAgent);
        break;
      }
      case "bulk_update": {
        const { error } = await supabase.from("medicines").update(payload).in("id", ids);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "bulk_update", null, { ids }, payload, ip, userAgent);
        break;
      }
      case "bulk_insert": {
        const items = body.items as any[];
        if (!items || !Array.isArray(items) || items.length === 0) throw new Error("No items provided");
        if (items.length > 500) throw new Error("Max 500 items per import");
        const { data, error } = await supabase.from("medicines").upsert(items, { onConflict: "slug", ignoreDuplicates: false }).select("id");
        if (error) throw error;
        result = { success: true, count: data?.length || 0 };
        await logAudit(supabase, "bulk_insert", null, null, { count: data?.length }, ip, userAgent);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
