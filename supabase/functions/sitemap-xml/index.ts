// Dynamic sitemap.xml generator — includes all products, categories, companies, health tips
// Cached for 1 hour for performance
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://optimumpharmahlb.com";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/categories", priority: "0.9", changefreq: "weekly" },
  { loc: "/companies", priority: "0.8", changefreq: "weekly" },
  { loc: "/offers", priority: "0.8", changefreq: "daily" },
  { loc: "/health-tips", priority: "0.7", changefreq: "weekly" },
  { loc: "/about", priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/faq", priority: "0.6", changefreq: "monthly" },
  { loc: "/shipping-info", priority: "0.4", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
];

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>
    <loc>${escapeXml(BASE_URL + loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];
    const urls: string[] = [];

    // 1. Static pages
    STATIC_PAGES.forEach((p) => urls.push(urlEntry(p.loc, today, p.changefreq, p.priority)));

    // 2. All in-stock products in active categories (use slug if available, else id)
    const { data: categories } = await supabase.from("categories").select("id").eq("is_active", true);
    const activeCats = new Set((categories ?? []).map((c: any) => c.id));
    const { data: allProducts } = await supabase
      .from("medicines")
      .select("id, slug, updated_at, category_id")
      .gt("stock", 0)
      .limit(5000);
    const products = (allProducts ?? []).filter((p: any) => !p.category_id || activeCats.has(p.category_id));

    products?.forEach((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
      urls.push(urlEntry(`/product/${p.slug || p.id}`, lastmod, "weekly", "0.7"));
    });

    // 3. All categories
    categories?.forEach((c: any) => urls.push(urlEntry(`/category/${c.id}`, today, "weekly", "0.7")));

    // 4. All active companies
    const { data: companies } = await supabase
      .from("companies")
      .select("slug, name, updated_at")
      .eq("active", true);
    companies?.forEach((c: any) => {
      const slug = c.slug || encodeURIComponent(c.name);
      const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split("T")[0] : today;
      urls.push(urlEntry(`/company/${slug}`, lastmod, "monthly", "0.6"));
    });

    // 6. Blog index + all published posts
    urls.push(urlEntry("/blog", today, "daily", "0.8"));
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(2000);
    posts?.forEach((p: any) => {
      const lastmod = (p.updated_at || p.published_at)
        ? new Date(p.updated_at || p.published_at).toISOString().split("T")[0]
        : today;
      urls.push(urlEntry(`/blog/${p.slug}`, lastmod, "weekly", "0.7"));
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
  }
});
