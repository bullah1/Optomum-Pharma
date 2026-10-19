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
// ⚡ IN-MEMORY CACHE — reduces DB hits by 90%+
// ═══════════════════════════════════════════════════════
const listCache = new Map<string, { data: string; expiry: number }>();
const LIST_CACHE_TTL = 60_000; // 1 min for listings
const SINGLE_CACHE_TTL = 120_000; // 2 min for single product
const MAX_CACHE_SIZE = 200;

function getCached(key: string): string | null {
  const entry = listCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    listCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: string, ttl: number) {
  // Evict oldest if too large
  if (listCache.size >= MAX_CACHE_SIZE) {
    const firstKey = listCache.keys().next().value;
    if (firstKey) listCache.delete(firstKey);
  }
  listCache.set(key, { data, expiry: Date.now() + ttl });
}

// Rate limiter with auto-cleanup
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 80;
const RATE_WINDOW = 60_000;
const SLOW_THRESHOLD = 200;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.reset) rateMap.delete(ip);
  }
  // Also clean expired cache entries
  for (const [key, entry] of listCache) {
    if (now > entry.expiry) listCache.delete(key);
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

function sanitizeSearch(raw: string): string | null {
  const cleaned = raw.replace(/[%_\\'";\0]/g, "").trim();
  return cleaned.length >= 2 ? cleaned.slice(0, 100) : null;
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

  const start = performance.now();

  try {
    const supabase = getClient();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const category = url.searchParams.get("category");
    const rawSearch = url.searchParams.get("q");
    const search = rawSearch ? sanitizeSearch(rawSearch) : null;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const cacheControl = id
      ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      : "public, max-age=120, s-maxage=600, stale-while-revalidate=1800";

    // ── Single product by ID ──
    if (id) {
      const cacheKey = `product:${id}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "HIT" },
        });
      }

      const { data, error } = await supabase
        .from("medicines")
        .select("id,name,name_bn,price,original_price,image_url,company,stock,requires_prescription,delivery_time,description,category_id,categories(name,icon)")
        .eq("id", id)
        .single();
      if (error) throw error;

      const body = JSON.stringify({ data });
      setCache(cacheKey, body, SINGLE_CACHE_TTL);

      const duration = (performance.now() - start).toFixed(1);
      if (Number(duration) > SLOW_THRESHOLD) {
        console.warn(`[SLOW api-products] single id=${id} ${duration}ms`);
      }

      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "MISS", "X-Response-Time": `${duration}ms` },
      });
    }

    // ── Search ──
    if (search) {
      const cacheKey = `search:${search}:${category || ""}:${page}:${limit}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "HIT" },
        });
      }

      // Run search and count in parallel
      let countQuery = supabase
        .from("medicines")
        .select("id", { count: "exact", head: true })
        .or(`name.ilike.%${search}%,name_bn.ilike.%${search}%,company.ilike.%${search}%`);
      if (category) countQuery = countQuery.eq("category_id", category);

      const [searchRes, countRes] = await Promise.all([
        supabase.rpc("search_medicines", {
          q: search,
          cat_id: category || null,
          lim: limit,
          off: offset,
        }),
        countQuery,
      ]);

      if (searchRes.error) throw searchRes.error;
      const totalCount = countRes.count;

      const body = JSON.stringify({
        data: searchRes.data,
        pagination: { page, limit, total: totalCount, totalPages: Math.ceil((totalCount || 0) / limit) },
      });
      setCache(cacheKey, body, LIST_CACHE_TTL);

      const duration = (performance.now() - start).toFixed(1);
      if (Number(duration) > SLOW_THRESHOLD) {
        console.warn(`[SLOW api-products] search q=${search} ${duration}ms`);
      }

      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "MISS", "X-Response-Time": `${duration}ms` },
      });
    }

    // ── List products ──
    const cacheKey = `list:${category || "all"}:${page}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "HIT" },
      });
    }

    let query = supabase
      .from("medicines")
      .select("id,name,name_bn,price,original_price,image_url,company,stock,requires_prescription,delivery_time,category_id", { count: "exact" });

    if (category) query = query.eq("category_id", category);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const body = JSON.stringify({
      data,
      pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) },
    });
    setCache(cacheKey, body, LIST_CACHE_TTL);

    const duration = (performance.now() - start).toFixed(1);
    if (Number(duration) > SLOW_THRESHOLD) {
      console.warn(`[SLOW api-products] list p=${page} ${duration}ms | ${count} total`);
    }

    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cacheControl, "X-Cache": "MISS", "X-Response-Time": `${duration}ms` },
    });
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.error(`[api-products] ERROR ${duration}ms:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
