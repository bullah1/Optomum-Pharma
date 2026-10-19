/**
 * SEO Utility — Dynamic meta tags & JSON-LD for SPA
 * Clean, framework-agnostic helpers ready for future SSR migration
 */

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "product" | "article";
  noIndex?: boolean;
}

const SITE_NAME = "Optimum Pharmaceuticals HLB";
const BASE_URL = "https://optimumpharmahlb.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

/** Update document <head> meta tags dynamically */
export function setPageMeta(meta: PageMeta) {
  const fullTitle = meta.title === SITE_NAME ? meta.title : `${meta.title} | ${SITE_NAME}`;
  document.title = fullTitle;

  const setMeta = (attr: string, key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMeta("name", "description", meta.description);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:type", meta.type || "website");
  setMeta("property", "og:image", meta.image || DEFAULT_IMAGE);
  setMeta("property", "og:url", meta.canonical || window.location.href);
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", meta.description);
  setMeta("name", "twitter:image", meta.image || DEFAULT_IMAGE);

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", meta.canonical || window.location.href);

  // Robots
  if (meta.noIndex) {
    setMeta("name", "robots", "noindex, nofollow");
  }
}

/** JSON-LD Structured Data helpers */
export function setJsonLd(id: string, data: Record<string, any>) {
  let script = document.getElementById(`jsonld-${id}`) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = `jsonld-${id}`;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function removeJsonLd(id: string) {
  document.getElementById(`jsonld-${id}`)?.remove();
}

/** Organization schema for homepage */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: "বাংলাদেশে বেবি ডায়াপার (Huggies, Supermom), ফর্মুলা মিল্ক (NAN, Lactogen, Nido), স্যানিটারি প্যাড (Whisper, Senora) ও হেলথকেয়ার পণ্য — দ্রুত হোম ডেলিভারি।",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["en", "bn"],
    },
  };
}

/** Local Business schema for Bangladesh SEO */
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: "Optimum Pharmaceuticals HLB — Baby Care, Diapers & Hygiene Store Bangladesh",
    image: `${BASE_URL}/favicon.png`,
    url: BASE_URL,
    telephone: "+8801306383938",
    description: "বাংলাদেশে Huggies/Supermom ডায়াপার, NAN/Lactogen/Nido ফর্মুলা মিল্ক, Whisper/Senora প্যাড, বেবি কেয়ার ও হেলথকেয়ার পণ্য দ্রুত হোম ডেলিভারি।",
    address: {
      "@type": "PostalAddress",
      streetAddress: "6th Floor, Colombia Super Market, 31 Mohakhali C/A",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
      postalCode: "1213",
      addressCountry: "BD",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 23.7780,
      longitude: 90.4050,
    },
    areaServed: [
      ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "23:00",
    },
    priceRange: "৳",
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, bKash, Nagad",
    sameAs: [],
  };
}

/** Product schema for product pages */
export function getProductSchema(product: {
  name: string;
  description?: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  id: string;
  stock: number;
  company?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image_url || DEFAULT_IMAGE,
    brand: product.company ? { "@type": "Brand", name: product.company } : undefined,
    url: `${BASE_URL}/product/${product.id}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BDT",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(product.original_price && product.original_price > product.price
        ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] }
        : {}),
    },
  };
}

/** Breadcrumb schema */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

/** WebSite schema with search action */
export function getWebSiteSchema() {
  return {
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
}
