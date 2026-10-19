// Edge SSR for search engine bots
// Renders fully-formed HTML with meta tags, JSON-LD, breadcrumbs, and visible content
// for product, category, doctor, company, and static pages.
// Real users get the SPA; only bots are routed here via Vercel/Cloudflare rewrite.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, user-agent",
};

const BASE_URL = "https://optimumpharmahlb.com";
const SITE_NAME = "Optimum Pharmaceuticals HLB";
const DEFAULT_OG = `${BASE_URL}/og-image.png`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function fmtPrice(n: number | null | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString("en-US");
}

interface PageData {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  bodyContent: string;
  jsonLd: Record<string, any>[];
  noIndex?: boolean;
  /** Per-route cache profile key. Defaults to "default". */
  cacheProfile?: CacheProfileKey;
  /** Last-modified timestamp from DB (ISO string), used for Last-Modified header. */
  lastModified?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache profiles
// ─────────────────────────────────────────────────────────────────────────────
// browser = max-age (client cache)
// cdn     = s-maxage (Cloudflare/Vercel edge cache)
// swr     = stale-while-revalidate window
// All values are in seconds.

type CacheProfileKey =
  | "product"      // prices/stock change frequently
  | "category"     // product list shifts but slower
  | "doctor"       // very stable profile data
  | "company"      // very stable brand data
  | "home"         // featured + categories rotate
  | "static"       // about/contact/policy pages — most stable
  | "blog"         // blog post — stable but updateable
  | "bloglist"     // blog index — new posts appear
  | "notfound"     // short cache for 404s
  | "default";

const CACHE_PROFILES: Record<CacheProfileKey, { browser: number; cdn: number; swr: number }> = {
  product:  { browser: 300,    cdn: 1800,   swr: 86400 },   // 5m / 30m / 1d
  category: { browser: 600,    cdn: 3600,   swr: 86400 },   // 10m / 1h / 1d
  doctor:   { browser: 3600,   cdn: 86400,  swr: 604800 },  // 1h / 1d / 7d
  company:  { browser: 3600,   cdn: 86400,  swr: 604800 },  // 1h / 1d / 7d
  home:     { browser: 300,    cdn: 1800,   swr: 86400 },   // 5m / 30m / 1d
  static:   { browser: 3600,   cdn: 86400,  swr: 604800 },  // 1h / 1d / 7d
  blog:     { browser: 1800,   cdn: 21600,  swr: 604800 },  // 30m / 6h / 7d
  bloglist: { browser: 600,    cdn: 3600,   swr: 86400 },   // 10m / 1h / 1d
  notfound: { browser: 60,     cdn: 300,    swr: 600 },     // 1m / 5m / 10m
  default:  { browser: 600,    cdn: 3600,   swr: 86400 },   // 10m / 1h / 1d
};

function buildCacheControl(key: CacheProfileKey): string {
  const p = CACHE_PROFILES[key] ?? CACHE_PROFILES.default;
  return `public, max-age=${p.browser}, s-maxage=${p.cdn}, stale-while-revalidate=${p.swr}`;
}

// Weak ETag of the response body — SHA-1 hex, 16 chars is plenty for collision avoidance here.
async function computeEtag(body: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `W/"${hex.slice(0, 16)}"`;
}

function renderHtml(d: PageData): string {
  const title = `${d.title} | ${SITE_NAME}`;
  const ogImage = d.ogImage || DEFAULT_OG;
  const ogType = d.ogType || "website";

  const jsonLdScripts = d.jsonLd
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(d.description)}" />
  <link rel="canonical" href="${escapeHtml(d.canonical)}" />
  ${d.noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />'}

  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(d.description)}" />
  <meta property="og:url" content="${escapeHtml(d.canonical)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="bn_BD" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(d.description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  ${jsonLdScripts}
</head>
<body>
  ${d.bodyContent}
  <p style="margin-top:40px;font-size:12px;color:#666">
    This is a server-rendered page for search engines. Visit
    <a href="${escapeHtml(d.canonical)}">${escapeHtml(d.canonical)}</a> for the full interactive experience.
  </p>
</body>
</html>`;
}

function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE_URL}${it.url}`,
    })),
  };
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderers
// ─────────────────────────────────────────────────────────────────────────────

async function renderProduct(slugOrId: string): Promise<PageData | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const cols = "id, name, name_bn, slug, description, price, original_price, image_url, company, stock, requires_prescription, dosage_form, strength, meta_title, meta_description, category_id, updated_at";

  let p: any = null;
  if (isUuid) {
    ({ data: p } = await supabase.from("medicines").select(cols).eq("id", slugOrId).maybeSingle());
  } else {
    ({ data: p } = await supabase.from("medicines").select(cols).eq("slug", slugOrId).maybeSingle());
  }

  if (!p) return null;

  const { data: cat } = p.category_id
    ? await supabase.from("categories").select("id, name, is_active").eq("id", p.category_id).maybeSingle()
    : { data: null };
  if (cat && cat.is_active === false) return null; // hidden (non-pharma) category

  const url = `${BASE_URL}/product/${p.slug || p.id}`;
  const title = p.meta_title || `${p.name}${p.strength ? ` ${p.strength}` : ""}${p.company ? ` - ${p.company}` : ""}`;
  const desc = p.meta_description ||
    `Order ${p.name}${p.strength ? ` ${p.strength}` : ""}${p.company ? ` by ${p.company}` : ""} online at ৳${fmtPrice(p.price)}. Fast home delivery in Bangladesh. বাংলাদেশে দ্রুত হোম ডেলিভারি।`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description || desc,
    image: p.image_url || DEFAULT_OG,
    sku: p.id,
    ...(p.company ? { brand: { "@type": "Brand", name: p.company } } : {}),
    ...(cat ? { category: cat.name } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: Number(p.price) || 0,
      availability: (p.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(cat ? [{ name: cat.name, url: `/category/${cat.id}` }] : []),
    { name: p.name, url: `/product/${p.slug || p.id}` },
  ];

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>
        ${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}
      </ol>
    </nav>
    <article>
      <h1>${escapeHtml(p.name)}${p.strength ? ` <span>${escapeHtml(p.strength)}</span>` : ""}</h1>
      ${p.name_bn ? `<h2>${escapeHtml(p.name_bn)}</h2>` : ""}
      ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="400" />` : ""}
      <p><strong>Price:</strong> ৳${fmtPrice(p.price)}${p.original_price && p.original_price > p.price ? ` <s>৳${fmtPrice(p.original_price)}</s>` : ""}</p>
      ${p.company ? `<p><strong>Brand:</strong> ${escapeHtml(p.company)}</p>` : ""}
      ${p.dosage_form ? `<p><strong>Dosage Form:</strong> ${escapeHtml(p.dosage_form)}</p>` : ""}
      ${cat ? `<p><strong>Category:</strong> <a href="${BASE_URL}/category/${cat.id}">${escapeHtml(cat.name)}</a></p>` : ""}
      <p><strong>Availability:</strong> ${(p.stock || 0) > 0 ? "In Stock" : "Out of Stock"}</p>
      ${p.requires_prescription ? `<p><em>Prescription required</em></p>` : ""}
      ${p.description ? `<section><h3>Description</h3><div>${escapeHtml(p.description)}</div></section>` : ""}
    </article>
  `;

  return {
    title,
    description: desc,
    canonical: url,
    ogImage: p.image_url || undefined,
    ogType: "product",
    bodyContent,
    jsonLd: [productSchema, breadcrumbSchema(breadcrumbs)],
    cacheProfile: "product",
    lastModified: p.updated_at,
  };
}

async function renderCategory(idOrSlug: string): Promise<PageData | null> {
  const { data: cat } = await supabase
    .from("categories")
    .select("id, name")
    .eq("id", idOrSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!cat) return null;

  const { data: layout } = await supabase
    .from("category_layouts")
    .select("description, seo_text")
    .eq("category_id", cat.id)
    .maybeSingle();

  const { data: products } = await supabase
    .from("medicines")
    .select("id, name, slug, price, image_url, company, stock")
    .eq("category_id", cat.id)
    .gt("stock", 0)
    .order("name")
    .limit(50);

  const url = `${BASE_URL}/category/${cat.id}`;
  const title = `${cat.name} - Online Pharmacy`;
  const desc = layout?.description ||
    `Buy ${cat.name} online from Optimum Pharmaceuticals HLB. Fast home delivery in Dhaka, Bangladesh. ${products?.length || 0}+ products available. বাংলাদেশে দ্রুত হোম ডেলিভারি।`;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
    { name: cat.name, url: `/category/${cat.id}` },
  ];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cat.name,
    numberOfItems: products?.length || 0,
    itemListElement: (products || []).slice(0, 30).map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/product/${p.slug || p.id}`,
      name: p.name,
    })),
  };

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
    </nav>
    <h1>${escapeHtml(cat.name)}</h1>
    ${layout?.seo_text ? `<section>${escapeHtml(layout.seo_text)}</section>` : ""}
    <section>
      <h2>Products in ${escapeHtml(cat.name)}</h2>
      <ul>
        ${(products || []).map((p: any) => `
          <li>
            <a href="${BASE_URL}/product/${p.slug || p.id}">
              ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="80" />` : ""}
              <strong>${escapeHtml(p.name)}</strong>
              ${p.company ? ` — ${escapeHtml(p.company)}` : ""}
              — ৳${fmtPrice(p.price)}
            </a>
          </li>
        `).join("")}
      </ul>
    </section>
  `;

  return {
    title,
    description: desc,
    canonical: url,
    bodyContent,
    jsonLd: [itemListSchema, breadcrumbSchema(breadcrumbs)],
    cacheProfile: "category",
  };
}

async function renderDoctor(slugOrId: string): Promise<PageData | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const cols = "id, name, slug, specialization, designation, qualifications, education, bio, image_url, fee, schedule, chamber_name, chamber_address, visit_days, visit_time, experience_years, bmdc_number, languages, meta_title, meta_description";

  let d: any = null;
  if (isUuid) {
    ({ data: d } = await supabase.from("doctors").select(cols).eq("id", slugOrId).maybeSingle());
  } else {
    ({ data: d } = await supabase.from("doctors").select(cols).eq("slug", slugOrId).maybeSingle());
  }

  if (!d) return null;

  const url = `${BASE_URL}/doctor/${d.slug || d.id}`;
  const title = d.meta_title || `${d.name}${d.specialization ? ` - ${d.specialization}` : ""} | Bangladesh`;
  const desc = d.meta_description ||
    `Book online consultation with ${d.name}${d.specialization ? ` (${d.specialization})` : ""} in Bangladesh. Consultation fee ৳${fmtPrice(d.fee)}. বাংলাদেশে অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।`;

  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: d.name,
    image: d.image_url || DEFAULT_OG,
    url,
    ...(d.specialization ? { medicalSpecialty: d.specialization } : {}),
    ...(d.bmdc_number ? { identifier: d.bmdc_number } : {}),
    ...(d.chamber_name || d.chamber_address ? {
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dhaka",
        addressCountry: "BD",
        ...(d.chamber_address ? { streetAddress: d.chamber_address } : {}),
      },
    } : {}),
    priceRange: `৳${fmtPrice(d.fee)}`,
  };

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Doctors", url: "/doctors-bangladesh" },
    { name: d.name, url: `/doctor/${d.slug || d.id}` },
  ];

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
    </nav>
    <article>
      <h1>${escapeHtml(d.name)}</h1>
      ${d.designation ? `<p>${escapeHtml(d.designation)}</p>` : ""}
      ${d.specialization ? `<h2>${escapeHtml(d.specialization)}</h2>` : ""}
      ${d.image_url ? `<img src="${escapeHtml(d.image_url)}" alt="${escapeHtml(d.name)}" width="300" />` : ""}
      <p><strong>Consultation Fee:</strong> ৳${fmtPrice(d.fee)}</p>
      ${d.qualifications ? `<p><strong>Qualifications:</strong> ${escapeHtml(d.qualifications)}</p>` : ""}
      ${d.education ? `<p><strong>Education:</strong> ${escapeHtml(d.education)}</p>` : ""}
      ${d.experience_years ? `<p><strong>Experience:</strong> ${d.experience_years} years</p>` : ""}
      ${d.bmdc_number ? `<p><strong>BMDC:</strong> ${escapeHtml(d.bmdc_number)}</p>` : ""}
      ${d.languages ? `<p><strong>Languages:</strong> ${escapeHtml(d.languages)}</p>` : ""}
      ${d.chamber_name ? `<p><strong>Chamber:</strong> ${escapeHtml(d.chamber_name)}</p>` : ""}
      ${d.chamber_address ? `<p><strong>Address:</strong> ${escapeHtml(d.chamber_address)}</p>` : ""}
      ${d.visit_days ? `<p><strong>Visit Days:</strong> ${escapeHtml(d.visit_days)}</p>` : ""}
      ${d.visit_time ? `<p><strong>Visit Time:</strong> ${escapeHtml(d.visit_time)}</p>` : ""}
      ${d.bio ? `<section><h3>About</h3><p>${escapeHtml(d.bio)}</p></section>` : ""}
    </article>
  `;

  return {
    title,
    description: desc,
    canonical: url,
    ogImage: d.image_url || undefined,
    ogType: "profile",
    bodyContent,
    jsonLd: [physicianSchema, breadcrumbSchema(breadcrumbs)],
    cacheProfile: "doctor",
  };
}

async function renderCompany(slugOrName: string): Promise<PageData | null> {
  const decoded = decodeURIComponent(slugOrName);
  const cols = "id, name, slug, description, logo_url, banner_url, address";

  // Try slug first, then name
  let { data: c } = await supabase.from("companies").select(cols).eq("slug", slugOrName).eq("active", true).maybeSingle();
  if (!c) {
    ({ data: c } = await supabase.from("companies").select(cols).eq("name", decoded).eq("active", true).maybeSingle());
  }

  if (!c) return null;

  const { data: products } = await supabase
    .from("medicines")
    .select("id, name, slug, price, image_url, stock")
    .eq("company", c.name)
    .gt("stock", 0)
    .limit(30);

  const url = `${BASE_URL}/company/${c.slug || encodeURIComponent(c.name)}`;
  const title = `${c.name} - All Products`;
  const desc = c.description || `Browse all ${c.name} products available at Optimum Pharmaceuticals HLB. Fast home delivery in Dhaka, Bangladesh.`;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Brands", url: "/companies" },
    { name: c.name, url: `/company/${c.slug || encodeURIComponent(c.name)}` },
  ];

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: c.name,
    description: desc,
    logo: c.logo_url || DEFAULT_OG,
    url,
  };

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
    </nav>
    <article>
      <h1>${escapeHtml(c.name)}</h1>
      ${c.logo_url ? `<img src="${escapeHtml(c.logo_url)}" alt="${escapeHtml(c.name)} logo" width="200" />` : ""}
      ${c.description ? `<p>${escapeHtml(c.description)}</p>` : ""}
      ${c.address ? `<p><strong>Address:</strong> ${escapeHtml(c.address)}</p>` : ""}
      <section>
        <h2>Products by ${escapeHtml(c.name)}</h2>
        <ul>
          ${(products || []).map((p: any) => `
            <li>
              <a href="${BASE_URL}/product/${p.slug || p.id}">
                <strong>${escapeHtml(p.name)}</strong> — ৳${fmtPrice(p.price)}
              </a>
            </li>
          `).join("")}
        </ul>
      </section>
    </article>
  `;

  return {
    title,
    description: desc,
    canonical: url,
    ogImage: c.banner_url || c.logo_url || undefined,
    bodyContent,
    jsonLd: [brandSchema, breadcrumbSchema(breadcrumbs)],
    cacheProfile: "company",
  };
}

async function renderHome(): Promise<PageData> {
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order")
    .limit(20);

  const activeCatIds = (cats || []).map((c: any) => c.id);
  const { data: featured } = await supabase
    .from("medicines")
    .select("id, name, slug, price, image_url")
    .gt("stock", 0)
    .in("category_id", activeCatIds.length ? activeCatIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(20);

  const url = `${BASE_URL}/`;
  const title = "Online Pharmacy Bangladesh — Order Medicine Online";
  const desc = "বাংলাদেশে অনলাইনে ওষুধ অর্ডার করুন। দ্রুত হোম ডেলিভারি, বিশ্বস্ত ফার্মেসি — Optimum Pharmaceuticals HLB।";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: SITE_NAME,
    url: BASE_URL,
    image: `${BASE_URL}/favicon.png`,
    telephone: "+8801306383938",
    priceRange: "৳",
    address: {
      "@type": "PostalAddress",
      streetAddress: "6th Floor, Colombia Super Market, 31 Mohakhali C/A",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
      postalCode: "1213",
      addressCountry: "BD",
    },
    geo: { "@type": "GeoCoordinates", latitude: 23.778, longitude: 90.4050 },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "23:00",
    },
  };

  const bodyContent = `
    <h1>Optimum Pharmaceuticals HLB — Online Pharmacy in Bangladesh</h1>
    <p>${escapeHtml(desc)}</p>
    <section>
      <h2>Shop by Category</h2>
      <ul>${(cats || []).map((c: any) => `<li><a href="${BASE_URL}/category/${c.id}">${escapeHtml(c.name)}</a></li>`).join("")}</ul>
    </section>
    <section>
      <h2>Featured Products</h2>
      <ul>${(featured || []).map((p: any) => `<li><a href="${BASE_URL}/product/${p.slug || p.id}">${escapeHtml(p.name)} — ৳${fmtPrice(p.price)}</a></li>`).join("")}</ul>
    </section>
    <nav>
      <h2>Quick Links</h2>
      <ul>
        <li><a href="${BASE_URL}/companies">Brands</a></li>
        <li><a href="${BASE_URL}/health-tips">Health Tips</a></li>
        <li><a href="${BASE_URL}/about">About Us</a></li>
        <li><a href="${BASE_URL}/contact">Contact</a></li>
      </ul>
    </nav>
  `;

  return {
    title,
    description: desc,
    canonical: url,
    bodyContent,
    jsonLd: [websiteSchema, localBusiness, organizationSchema()],
    cacheProfile: "home",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog
// ─────────────────────────────────────────────────────────────────────────────

async function renderBlogIndex(): Promise<PageData> {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,cover_image_url,author_name,published_at,updated_at,reading_minutes,category,tags")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const list = posts || [];
  const url = `${BASE_URL}/blog`;
  const title = "Health & Wellness Blog — Optimum Pharmaceuticals HLB Bangladesh";
  const description =
    "Read trusted articles on medicine, nutrition, fitness, and wellness from the Optimum Pharmaceuticals HLB health team. বাংলাদেশ থেকে স্বাস্থ্য বিষয়ক বিজ্ঞানসম্মত আর্টিকেল।";

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ];

  const itemsHtml = list.length
    ? list
        .map(
          (p: any) => `
        <article>
          ${p.cover_image_url ? `<img src="${escapeHtml(p.cover_image_url)}" alt="${escapeHtml(p.title)}" loading="lazy" width="320" height="180" />` : ""}
          <h2><a href="${BASE_URL}/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></h2>
          ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ""}
          <p><small>By ${escapeHtml(p.author_name || "Optimum Pharmaceuticals HLB Team")} · ${
            p.published_at ? new Date(p.published_at).toDateString() : ""
          } · ${p.reading_minutes || 3} min read</small></p>
        </article>
      `
        )
        .join("\n")
    : `<p>No articles published yet.</p>`;

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
    </nav>
    <h1>Health &amp; Wellness Blog</h1>
    <p>Expert-reviewed articles on medicines, nutrition, lifestyle, and preventive care from Optimum Pharmaceuticals HLB Bangladesh.</p>
    <section>${itemsHtml}</section>
  `;

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Optimum Pharmaceuticals HLB Health Blog",
    url,
    description,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/optimum-logo.jpg` },
    },
    blogPost: list.map((p: any) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${BASE_URL}/blog/${p.slug}`,
      datePublished: p.published_at,
      dateModified: p.updated_at || p.published_at,
      author: { "@type": "Person", name: p.author_name || "Optimum Pharmaceuticals HLB Team" },
      image: p.cover_image_url || undefined,
    })),
  };

  return {
    title,
    description,
    canonical: url,
    ogType: "website",
    bodyContent,
    jsonLd: [organizationSchema(), breadcrumbSchema(breadcrumbs), blogJsonLd],
    cacheProfile: "bloglist",
    lastModified: list[0]?.updated_at || list[0]?.published_at,
  };
}

async function renderBlogPost(slug: string): Promise<PageData | null> {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return null;

  const url = `${BASE_URL}/blog/${post.slug}`;
  const title = post.meta_title || `${post.title} | Optimum Pharmaceuticals HLB Blog`;
  const description =
    post.meta_description ||
    post.excerpt ||
    `Read "${post.title}" by ${post.author_name} on the Optimum Pharmaceuticals HLB health blog.`;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

  const tagsHtml =
    post.tags && post.tags.length
      ? `<p><strong>Tags:</strong> ${post.tags.map((t: string) => escapeHtml(t)).join(", ")}</p>`
      : "";

  const bodyContent = `
    <nav aria-label="Breadcrumb">
      <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
    </nav>
    <article>
      <h1>${escapeHtml(post.title)}</h1>
      <p>
        <small>
          By <span itemprop="author">${escapeHtml(post.author_name || "Optimum Pharmaceuticals HLB Team")}</span> ·
          Published <time datetime="${post.published_at || ""}">${
            post.published_at ? new Date(post.published_at).toDateString() : ""
          }</time>
          ${
            post.updated_at && post.updated_at !== post.published_at
              ? ` · Updated <time datetime="${post.updated_at}">${new Date(post.updated_at).toDateString()}</time>`
              : ""
          }
          · ${post.reading_minutes || 3} min read
        </small>
      </p>
      ${post.cover_image_url ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}" width="1200" height="630" />` : ""}
      ${post.excerpt ? `<p><em>${escapeHtml(post.excerpt)}</em></p>` : ""}
      <div>${post.content || ""}</div>
      ${tagsHtml}
    </article>
  `;

  const articleJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      name: post.author_name || "Optimum Pharmaceuticals HLB Team",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/optimum-logo.jpg`,
      },
    },
    articleSection: post.category || undefined,
    keywords: post.tags && post.tags.length ? post.tags.join(", ") : undefined,
    wordCount: post.content ? String(post.content).replace(/<[^>]+>/g, "").trim().split(/\s+/).length : undefined,
  };

  // Strip undefined keys for clean JSON-LD
  Object.keys(articleJsonLd).forEach((k) => articleJsonLd[k] === undefined && delete articleJsonLd[k]);

  return {
    title,
    description,
    canonical: url,
    ogImage: post.cover_image_url || undefined,
    ogType: "article",
    bodyContent,
    jsonLd: [organizationSchema(), breadcrumbSchema(breadcrumbs), articleJsonLd],
    cacheProfile: "blog",
    lastModified: post.updated_at || post.published_at,
  };
}

async function renderStaticPage(path: string): Promise<PageData | null> {
  const map: Record<string, { title: string; desc: string; h1: string; intro: string }> = {
    "/about": {
      title: "About Optimum Pharmaceuticals HLB — Trusted Online Pharmacy in Bangladesh",
      desc: "Learn about Optimum Pharmaceuticals HLB, Bangladesh's trusted online pharmacy delivering genuine medicines across Bangladesh.",
      h1: "About Optimum Pharmaceuticals HLB",
      intro: "Optimum Pharmaceuticals HLB is Bangladesh's trusted online pharmacy.",
    },
    "/contact": {
      title: "Contact Optimum Pharmaceuticals HLB — Customer Support Bangladesh",
      desc: "Contact Optimum Pharmaceuticals HLB for orders, support, or partnerships. Located in Dhaka, Bangladesh. Phone: +8801306383938.",
      h1: "Contact Us",
      intro: "Reach Optimum Pharmaceuticals HLB via phone, email, or visit our Bangladesh branch.",
    },
    "/faq": {
      title: "Frequently Asked Questions — Optimum Pharmaceuticals HLB",
      desc: "Common questions about ordering medicines, delivery, and payment at Optimum Pharmaceuticals HLB.",
      h1: "Frequently Asked Questions",
      intro: "Find answers to common questions about Optimum Pharmaceuticals HLB services.",
    },
    "/privacy": {
      title: "Privacy Policy — Optimum Pharmaceuticals HLB",
      desc: "Read Optimum Pharmaceuticals HLB's privacy policy regarding how we collect, use, and protect your personal data.",
      h1: "Privacy Policy",
      intro: "Your privacy is important to us.",
    },
    "/terms": {
      title: "Terms of Service — Optimum Pharmaceuticals HLB",
      desc: "Read the terms and conditions governing your use of Optimum Pharmaceuticals HLB's online pharmacy and healthcare services.",
      h1: "Terms of Service",
      intro: "Please read these terms carefully before using Optimum Pharmaceuticals HLB.",
    },
    "/refund-policy": {
      title: "Refund & Return Policy — Optimum Pharmaceuticals HLB",
      desc: "Learn about Optimum Pharmaceuticals HLB's refund and return policy for medicines and healthcare products.",
      h1: "Refund Policy",
      intro: "Our refund and return policy ensures customer satisfaction.",
    },
    "/shipping": {
      title: "Shipping & Delivery Info — Optimum Pharmaceuticals HLB Bangladesh",
      desc: "Delivery zones, charges, and estimated times for medicine and healthcare orders from Optimum Pharmaceuticals HLB Bangladesh.",
      h1: "Shipping Information",
      intro: "Fast home delivery across Bangladesh and surrounding districts.",
    },
    "/categories": {
      title: "All Product Categories — Optimum Pharmaceuticals HLB",
      desc: "Browse all product categories at Optimum Pharmaceuticals HLB — medicines, baby care, healthcare, and more.",
      h1: "All Categories",
      intro: "Browse our full range of healthcare and consumer product categories.",
    },
    "/companies": {
      title: "All Pharmaceutical Brands — Optimum Pharmaceuticals HLB",
      desc: "Browse all pharmaceutical and consumer brands available at Optimum Pharmaceuticals HLB — Square, Beximco, Incepta, Huggies, Whisper, NAN, Lactogen, and more.",
      h1: "All Brands",
      intro: "Trusted pharmaceutical and consumer brands available at Optimum Pharmaceuticals HLB.",
    },
    "/health-tips": {
      title: "Health Tips & Wellness Articles — Optimum Pharmaceuticals HLB",
      desc: "Read expert health tips, wellness advice, and medical articles to support your healthy lifestyle.",
      h1: "Health Tips",
      intro: "Expert health tips and wellness articles.",
    },
    "/offers": {
      title: "Special Offers & Discounts — Optimum Pharmaceuticals HLB",
      desc: "Check the latest offers, flash sales, and discount codes on medicines and healthcare products at Optimum Pharmaceuticals HLB.",
      h1: "Special Offers",
      intro: "Latest deals and flash sales at Optimum Pharmaceuticals HLB.",
    },
  };

  const meta = map[path];
  if (!meta) return null;

  const url = `${BASE_URL}${path}`;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: meta.h1, url: path },
  ];

  return {
    title: meta.title,
    description: meta.desc,
    canonical: url,
    bodyContent: `
      <nav aria-label="Breadcrumb">
        <ol>${breadcrumbs.map((b, i) => `<li><a href="${BASE_URL}${b.url}">${escapeHtml(b.name)}</a>${i < breadcrumbs.length - 1 ? " / " : ""}</li>`).join("")}</ol>
      </nav>
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
      <p>Visit <a href="${url}">${url}</a> for the full content.</p>
    `,
    jsonLd: [organizationSchema(), breadcrumbSchema(breadcrumbs)],
    cacheProfile: "static",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

async function route(pathname: string): Promise<PageData | null> {
  // Strip leading function-name segment when called via supabase functions URL
  // and any query/hash
  let p = pathname.replace(/^\/render-html/, "").split("?")[0].split("#")[0];
  if (!p || p === "") p = "/";

  // Normalize trailing slash (except root)
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  // Dynamic routes
  const productMatch = p.match(/^\/product\/(.+)$/);
  if (productMatch) return renderProduct(decodeURIComponent(productMatch[1]));

  const categoryMatch = p.match(/^\/category\/(.+)$/);
  if (categoryMatch) return renderCategory(decodeURIComponent(categoryMatch[1]));

  const companyMatch = p.match(/^\/company\/(.+)$/);
  if (companyMatch) return renderCompany(companyMatch[1]);

  // Blog
  if (p === "/blog") return renderBlogIndex();
  const blogMatch = p.match(/^\/blog\/(.+)$/);
  if (blogMatch) return renderBlogPost(decodeURIComponent(blogMatch[1]));

  // Home
  if (p === "/") return renderHome();

  // Static pages
  return renderStaticPage(p);
}

// ─────────────────────────────────────────────────────────────────────────────
// Server
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Support: /functions/v1/render-html?path=/product/abc OR /functions/v1/render-html/product/abc
    const queryPath = url.searchParams.get("path");
    const pathname = queryPath || url.pathname;

    const pageData = await route(pathname);
    const ifNoneMatch = req.headers.get("if-none-match");

    // ── 404 path ──────────────────────────────────────────────────────────
    if (!pageData) {
      const notFound: PageData = {
        title: "Page Not Found",
        description: "The page you are looking for does not exist.",
        canonical: `${BASE_URL}${pathname}`,
        bodyContent: `<h1>404 - Page Not Found</h1><p><a href="${BASE_URL}/">Return to homepage</a></p>`,
        jsonLd: [organizationSchema()],
        noIndex: true,
        cacheProfile: "notfound",
      };
      const body = renderHtml(notFound);
      const etag = await computeEtag(body);
      const cacheControl = buildCacheControl("notfound");

      if (ifNoneMatch && ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ...corsHeaders,
            ETag: etag,
            "Cache-Control": cacheControl,
            Vary: "Accept-Encoding",
          },
        });
      }

      return new Response(body, {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": cacheControl,
          ETag: etag,
          Vary: "Accept-Encoding",
        },
      });
    }

    // ── Successful render ────────────────────────────────────────────────
    const body = renderHtml(pageData);
    const etag = await computeEtag(body);
    const cacheControl = buildCacheControl(pageData.cacheProfile ?? "default");

    // 304 Not Modified — saves bandwidth and round-trips for repeat crawls
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: etag,
          "Cache-Control": cacheControl,
          "X-Robots-Tag": pageData.noIndex ? "noindex, nofollow" : "index, follow",
          Vary: "Accept-Encoding",
          ...(pageData.lastModified
            ? { "Last-Modified": new Date(pageData.lastModified).toUTCString() }
            : {}),
        },
      });
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": cacheControl,
        ETag: etag,
        "X-Robots-Tag": pageData.noIndex ? "noindex, nofollow" : "index, follow",
        Vary: "Accept-Encoding",
        ...(pageData.lastModified
          ? { "Last-Modified": new Date(pageData.lastModified).toUTCString() }
          : {}),
      },
    });
  } catch (err: any) {
    console.error("render-html error:", err);
    return new Response(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Server Error</h1><p>${escapeHtml(err.message || "Unknown error")}</p></body></html>`, {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
});
