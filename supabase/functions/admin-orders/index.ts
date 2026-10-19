import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_CODE = "990990";

// Rate limiting
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
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

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key);
  }
}, 300_000);

async function logAudit(supabase: any, action: string, recordId: string | null, oldData: any, newData: any, ip: string, ua: string) {
  try {
    await supabase.from("audit_logs").insert({
      action, table_name: "orders", record_id: recordId,
      old_data: oldData, new_data: newData, ip_address: ip, user_agent: ua,
    });
  } catch (_) {}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").replace(/[^a-fA-F0-9.:,]/g, "").slice(0, 45);
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);

  if (!checkRateLimit(`admin-orders:${ip}`)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { admin_code, action, id, ids, status, tracking, order_id, rider_id, user_id, name, phone } = body;

    if (admin_code !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ORDER_STATUSES = new Set(["pending", "processing", "payment", "confirmed", "packing", "packed", "shipped", "delivered", "cancelled"]);
    let result;

    switch (action) {
      case "update_status": {
        const nextStatus = typeof status === "string" ? status.trim() : "";
        const { data: oldData } = await supabase.from("orders").select("status").eq("id", id).single();
        const { error } = await supabase.from("orders").update({ status: nextStatus, tracking_status: nextStatus }).eq("id", id);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "update_status", id, oldData, { status: nextStatus }, ip, ua);
        break;
      }
      case "update_tracking": {
        const nextTracking = typeof tracking === "string" ? tracking.trim() : "";
        const updatePayload: { tracking_status: string | null; status?: string } = { tracking_status: nextTracking || null };
        if (ORDER_STATUSES.has(nextTracking)) updatePayload.status = nextTracking;
        const { error } = await supabase.from("orders").update(updatePayload).eq("id", id);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "update_tracking", id, null, updatePayload, ip, ua);
        break;
      }
      case "bulk_update_status": {
        const nextStatus = typeof status === "string" ? status.trim() : "";
        const { error } = await supabase.from("orders").update({ status: nextStatus, tracking_status: nextStatus }).in("id", ids);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "bulk_update_status", null, { ids }, { status: nextStatus }, ip, ua);
        break;
      }
      case "assign_rider": {
        const { error } = await supabase.from("rider_assignments").upsert(
          { order_id, rider_id, status: "assigned" },
          { onConflict: "order_id" }
        );
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "assign_rider", order_id, null, { rider_id }, ip, ua);
        break;
      }
      case "update_customer": {
        if (!user_id) throw new Error("user_id required");
        const updatePayload: Record<string, string> = {};
        if (typeof name === "string") updatePayload.name = name.trim();
        if (typeof phone === "string") updatePayload.phone = phone.trim();
        if (Object.keys(updatePayload).length === 0) throw new Error("No fields to update");
        const { data: oldData } = await supabase.from("profiles").select("name, phone").eq("id", user_id).single();
        const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user_id);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "update_customer", user_id, oldData, updatePayload, ip, ua);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
