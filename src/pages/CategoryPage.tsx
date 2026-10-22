import { useParams, Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Pill } from "lucide-react";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { CategoryFilterSidebar, CategoryFilterSheet, defaultFilters, type FilterState } from "@/components/CategoryFilters";
import { trackMarketingEvent } from "@/hooks/useMarketingTracker";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbSchema } from "@/lib/seo";

const PAGE_SIZE = 20;

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Track category view
  useEffect(() => {
    if (id) {
      trackMarketingEvent("category_view", { category_id: id });
    }
  }, [id]);

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch custom layout for this category
  const { data: layout } = useQuery({
    queryKey: ["category-layout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_layouts")
        .select("*")
        .eq("category_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Auto SEO for category pages
  useSEO(
    {
      title: category ? `${category.name} — বাংলাদেশে অনলাইনে অর্ডার করুন | Optimum Pharmaceuticals HLB` : "Category | Optimum Pharmaceuticals HLB",
      description: category
        ? (layout?.description || layout?.seo_text || `${category.name} এর সকল প্রোডাক্ট অনলাইনে অর্ডার করুন। দ্রুত হোম ডেলিভারি বাংলাদেশে। Order ${category.name} online with fast home delivery from Optimum Pharmaceuticals HLB.`).replace(/<[^>]+>/g, "").slice(0, 160)
        : "Browse products at Optimum Pharmaceuticals HLB",
      canonical: id ? `/category/${id}` : undefined,
    },
    category
      ? {
          id: "category-breadcrumb",
          data: getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
            { name: category.name, url: `/category/${id}` },
          ]),
        }
      : undefined
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["medicines-by-category", id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("medicines")
        .select("id,name,name_bn,price,original_price,image_url,company,category_id,requires_prescription,delivery_time,stock")
        .eq("category_id", id!)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!id,
  });

  const allMedicines = data?.pages.flat() ?? [];

  // Client-side filtering
  const medicines = useMemo(() => {
    let result = allMedicines;

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      result = result.filter((m) => m.price >= min && m.price <= max);
    } else if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? Number(filters.minPrice) : 0;
      const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      result = result.filter((m) => m.price >= min && m.price <= max);
    }

    // Discount filter
    if (filters.discountRange) {
      const minDiscount = Number(filters.discountRange);
      result = result.filter((m) => {
        if (!m.original_price) return false;
        const disc = ((m.original_price - m.price) / m.original_price) * 100;
        return disc >= minDiscount;
      });
    }

    return result;
  }, [allMedicines, filters]);

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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title={category?.name || "Category"} />
      <main className="container py-4 space-y-4">
        {/* Category Hero Header */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border">
          {layout?.banner_url && (
            <img src={layout.banner_url} alt={category?.name || "Category"} className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="relative px-4 py-5 sm:px-6 sm:py-7 flex items-center gap-4">
            {category?.image_url ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm shrink-0">
                <img src={category.image_url} alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                <Pill size={24} className="text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">{category?.name || "Category"}</h2>
              {layout?.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{layout.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {!isLoading && allMedicines.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {allMedicines.length}+ Products
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <CategoryFilterSheet filters={filters} onChange={setFilters} resultCount={medicines.length} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : !allMedicines.length ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-muted-foreground">No products in this category yet.</p>
            <Link to="/" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            <CategoryFilterSidebar filters={filters} onChange={setFilters} resultCount={medicines.length} />

            <div className="flex-1 min-w-0">
              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No products match these filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {medicines.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="py-4 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                )}
                {!hasNextPage && allMedicines.length > PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground">You have seen all products</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* SEO Text */}
        {layout?.seo_text && (
          <div className="prose prose-sm max-w-none text-muted-foreground pt-4 border-t border-border">
            <p>{layout.seo_text}</p>
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CategoryPage;
