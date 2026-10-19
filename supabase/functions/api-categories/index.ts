import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
  }
  return _supabase;
}

// ═══════════════════════════════════════════════════════
// ⚡ IN-MEMORY CACHE — categories rarely change
// ═══════════════════════════════════════════════════════
let cachedResponse: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 300_000; // 5 minutes — categories change very rarely

// Rate limiter
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;
const SLOW_THRESHOLD = 200;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.reset) rateMap.delete(ip);
  }
}, 60_000);

function getClientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const now = Date.now();

  // ⚡ Serve from in-memory cache
  if (cachedResponse && now < cacheExpiry) {
    return new Response(cachedResponse, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
        "X-Cache": "HIT",
      },
    });
  }

  const start = performance.now();

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, icon, featured, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;

    const body = JSON.stringify({ data });
    cachedResponse = body;
    cacheExpiry = Date.now() + CACHE_TTL;

    const duration = (performance.now() - start).toFixed(1);
    if (Number(duration) > SLOW_THRESHOLD) {
      console.warn(`[SLOW api-categories] ${duration}ms | ${data?.length || 0} categories`);
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
        "X-Cache": "MISS",
        "X-Response-Time": `${duration}ms`,
      },
    });
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.error(`[api-categories] ERROR ${duration}ms:`, err.message);

    // Serve stale on error
    if (cachedResponse) {
      return new Response(cachedResponse, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "ERROR-FALLBACK" },
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
