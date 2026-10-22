import { useParams, Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Building2, Pill, Search, MapPin } from "lucide-react";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";
import { useEffect, useRef, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbSchema } from "@/lib/seo";

const PAGE_SIZE = 20;

const CompanyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // Fetch company info
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const decoded = decodeURIComponent(slug!);
      
      // Try slug first
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", decoded)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      // Fallback: try by name
      const { data: byName, error: err2 } = await supabase
        .from("companies")
        .select("*")
        .eq("name", decoded)
        .eq("active", true)
        .maybeSingle();
      if (err2) throw err2;
      if (byName) return byName;

      // Fallback: try by ID
      const { data: byId, error: err3 } = await supabase
        .from("companies")
        .select("*")
        .eq("id", slug!)
        .maybeSingle();
      if (err3) throw err3;
      return byId;
    },
    enabled: !!slug,
  });

  // If no company record found, still show products by company name
  const companyName = company?.name || decodeURIComponent(slug || "");

  // Auto SEO for brand pages
  useSEO(
    {
      title: companyName ? `${companyName} — সকল প্রোডাক্ট অনলাইনে | Optimum Pharmaceuticals HLB Bangladesh` : "Brand | Optimum Pharmaceuticals HLB",
      description: company?.description
        ? company.description.replace(/<[^>]+>/g, "").slice(0, 160)
        : `${companyName} এর সকল ওষুধ ও হেলথকেয়ার প্রোডাক্ট অনলাইনে অর্ডার করুন। দ্রুত বাংলাদেশ হোম ডেলিভারি। Order ${companyName} products online at Optimum Pharmaceuticals HLB Bangladesh.`,
      canonical: slug ? `/company/${slug}` : undefined,
    },
    companyName
      ? [
          {
            id: "company-breadcrumb",
            data: getBreadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Brands", url: "/companies" },
              { name: companyName, url: `/company/${slug}` },
            ]),
          },
          {
            id: "company-org",
            data: {
              "@context": "https://schema.org",
              "@type": "Brand",
              name: companyName,
              ...(company?.logo_url && { logo: company.logo_url }),
              ...(company?.description && { description: company.description.replace(/<[^>]+>/g, "").slice(0, 300) }),
            },
          },
        ]
      : undefined
  );

  // Fetch products by company name
  const {
    data,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["company-products", companyName, search],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("medicines")
        .select("id,name,name_bn,price,original_price,image_url,company,slug,requires_prescription")
        .eq("company", companyName)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!companyName,
  });

  const allProducts = data?.pages.flat() ?? [];

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const isLoading = companyLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title={company?.name || "Company"} />

      <main className="container py-4 space-y-4">
        {/* Company Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-border">
          {company?.banner_url && (
            <img
              src={company.banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-4 py-5 sm:px-6 sm:py-7">
            <div className="flex items-start gap-4">
              {company?.logo_url ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  <img src={company.logo_url} alt={company.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                  <Building2 size={28} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                  {companyName}
                </h1>
                {company?.address && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin size={12} className="shrink-0" />
                    {company.address}
                  </p>
                )}
                {company?.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 line-clamp-3">
                    {company.description}
                  </p>
                )}
                {!isLoading && allProducts.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-2">
                    {allProducts.length}+ Products
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card border-border"
          />
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : !allProducts.length ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Pill size={32} className="text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? "No products match your search." : "No products available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="py-4 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CompanyPage;
