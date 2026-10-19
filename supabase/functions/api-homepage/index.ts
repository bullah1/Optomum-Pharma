import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ═══════════════════════════════════════════════════════
// ⚡ IN-MEMORY CACHE — 50K concurrent users hit this, not DB
// ═══════════════════════════════════════════════════════
let cachedResponse: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 120_000; // 2 minutes — DB gets hit max 30 times/hour
let cacheRefreshing = false;

// Rate limiter with auto-cleanup
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

const CATEGORY_BAND_NAMES = ["Medicine", "Women's Hygiene", "Baby & Mom Care", "Diapers & Pants", "Herbal", "Supplement", "Nutrition", "Healthcare", "Home Care"];

async function buildHomepageData(): Promise<string> {
  const start = performance.now();

  // ── ALL queries in a single parallel batch — zero sequential queries ──
  const [settingsRes, bannersRes, categoriesRes, sectionsRes, bandProductsRes, promoCardsRes, flashSaleRes, healthTipsRes, reviewsRes, topBrandsRes, statsRes] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("banners").select("id, title, subtitle, highlight, cta_text, cta_link, image_url, sort_order").eq("active", true).order("sort_order"),
    supabase.from("categories").select("id, name, icon, image_url, sort_order, featured").eq("is_active", true).order("sort_order"),
    supabase.from("homepage_sections").select("id, section_type, title, subtitle, config, sort_order, active").eq("active", true).order("sort_order"),
    supabase.rpc("get_category_band_products", { cat_names: CATEGORY_BAND_NAMES }),
    supabase.from("promo_cards").select("id, title, detail, highlight, icon, bg_class, action_text, action_link, sort_order").eq("active", true).order("sort_order"),
    supabase.from("flash_sale_products").select("id, discount_percent, sale_price, starts_at, ends_at, medicines(id, name, price, original_price, image_url, slug, stock, category_id)").eq("active", true).order("created_at", { ascending: false }),
    supabase.from("health_tips").select("id, title, description, icon").eq("active", true).order("sort_order").limit(4),
    supabase.from("reviews").select("id, rating, comment, profiles(name)").gte("rating", 4).not("comment", "is", null).order("created_at", { ascending: false }).limit(6),
    supabase.rpc("get_top_brands", { lim: 10 }),
    supabase.rpc("get_homepage_stats"),
  ]);

  const settings: Record<string, string> = {};
  settingsRes.data?.forEach((s: any) => { settings[s.key] = s.value ?? ""; });

  // ── Category bands: group RPC results by category ──
  const bandProducts = bandProductsRes.data || [];
  const categoryBandMap: any[] = [];
  const seenCats = new Map<string, any>();
  for (const p of bandProducts) {
    if (!seenCats.has(p.category_id)) {
      const entry = { categoryId: p.category_id, categoryName: p.category_name, products: [] as any[] };
      seenCats.set(p.category_id, entry);
      categoryBandMap.push(entry);
    }
    seenCats.get(p.category_id)!.products.push({
      id: p.product_id, name: p.name, price: p.price, original_price: p.original_price,
      b2b_price: p.b2b_price, image_url: p.image_url, company: p.company,
      requires_prescription: p.requires_prescription, stock: p.stock, slug: p.slug,
      category_id: p.category_id,
    });
  }

  const topBrands = (topBrandsRes.data || []).map((b: any) => ({
    name: b.name,
    count: Number(b.count),
  }));

  const stats = statsRes.data || {};
  const activeCategoryIds = new Set((categoriesRes.data ?? []).map((c: any) => c.id));

  const duration = (performance.now() - start).toFixed(1);
  if (Number(duration) > SLOW_THRESHOLD) {
    console.warn(`[api-homepage] DB refresh took ${duration}ms`);
  }

  return JSON.stringify({
    settings,
    banners: bannersRes.data ?? [],
    categories: categoriesRes.data ?? [],
    sections: sectionsRes.data ?? [],
    categoryBands: categoryBandMap,
    promoCards: promoCardsRes.data ?? [],
    flashSale: (flashSaleRes.data ?? []).filter((f: any) => {
      const catId = f.medicines?.category_id;
      return !catId || activeCategoryIds.has(catId);
    }),
    healthTips: healthTipsRes.data ?? [],
    testimonials: reviewsRes.data ?? [],
    topBrands,
    stats,
    _cached_at: new Date().toISOString(),
  });
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

  try {
    // ⚡ Serve from in-memory cache if fresh
    if (cachedResponse && now < cacheExpiry) {
      return new Response(cachedResponse, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
          "X-Cache": "HIT",
          "X-Cache-Age": `${Math.round((now - (cacheExpiry - CACHE_TTL)) / 1000)}s`,
        },
      });
    }

    // Prevent thundering herd — only one refresh at a time
    if (cacheRefreshing && cachedResponse) {
      // Serve stale while another request is refreshing
      return new Response(cachedResponse, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
          "X-Cache": "STALE",
        },
      });
    }

    cacheRefreshing = true;
    const data = await buildHomepageData();
    cachedResponse = data;
    cacheExpiry = Date.now() + CACHE_TTL;
    cacheRefreshing = false;

    return new Response(data, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    cacheRefreshing = false;
    console.error(`[api-homepage] ERROR:`, (err as Error).message);

    // Serve stale cache on error rather than failing
    if (cachedResponse) {
      return new Response(cachedResponse, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "ERROR-FALLBACK",
        },
      });
    }

    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
