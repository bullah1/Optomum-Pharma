import { useEffect } from "react";
import { setPageMeta, setJsonLd, removeJsonLd, type PageMeta } from "@/lib/seo";

/**
 * Hook to set page-level SEO meta + optional JSON-LD
 * Usage: useSEO({ title: "Cart", description: "..." }, { id: "org", data: {...} })
 */
export function useSEO(
  meta: PageMeta,
  jsonLd?: { id: string; data: Record<string, any> } | { id: string; data: Record<string, any> }[]
) {
  useEffect(() => {
    setPageMeta(meta);

    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    schemas.forEach((s) => setJsonLd(s.id, s.data));

    return () => {
      schemas.forEach((s) => removeJsonLd(s.id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.description, meta.canonical]);
}
