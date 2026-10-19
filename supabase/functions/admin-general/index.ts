import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_CODE = "990990";
const ALLOWED_TABLES = new Set(["companies", "delivery_zones", "reviews", "lab_bookings", "doctor_appointments", "team_members"]);

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

async function logAudit(supabase: any, action: string, table: string, recordId: string | null, oldData: any, newData: any, ip: string, ua: string) {
  try {
    await supabase.from("audit_logs").insert({
      action, table_name: table, record_id: recordId,
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

  if (!checkRateLimit(`admin-general:${ip}`)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { admin_code, action, table, payload, id, ids } = body;

    if (admin_code !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!table || !ALLOWED_TABLES.has(table)) {
      return new Response(JSON.stringify({ error: "Invalid table" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "insert": {
        const { data, error } = await supabase.from(table).insert(payload).select().single();
        if (error) throw error;
        result = data;
        await logAudit(supabase, "insert", table, data?.id, null, payload, ip, ua);
        break;
      }
      case "update": {
        const { data: oldData } = await supabase.from(table).select("*").eq("id", id).single();
        const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
        if (error) throw error;
        result = data;
        await logAudit(supabase, "update", table, id, oldData, payload, ip, ua);
        break;
      }
      case "delete": {
        const { data: oldData } = await supabase.from(table).select("*").eq("id", id).single();
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "delete", table, id, oldData, null, ip, ua);
        break;
      }
      case "bulk_delete": {
        const { error } = await supabase.from(table).delete().in("id", ids);
        if (error) throw error;
        result = { success: true };
        await logAudit(supabase, "bulk_delete", table, null, { ids }, null, ip, ua);
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
