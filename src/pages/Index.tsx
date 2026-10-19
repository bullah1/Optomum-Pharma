import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import FloatingCart from "@/components/FloatingCart";
import PullToRefresh from "@/components/PullToRefresh";
import { useSEO } from "@/hooks/useSEO";
import { getOrganizationSchema, getWebSiteSchema, getLocalBusinessSchema } from "@/lib/seo";
import { lazy, Suspense, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
// Skeleton import removed - using inline placeholders for better CLS
import { ProductBandSkeleton } from "@/components/product/ProductCardSkeleton";
import { useHomepageData } from "@/hooks/useHomepageData";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Eagerly load above-the-fold components
import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import QuickActions from "@/components/QuickActions";

// Lazy load below-the-fold components
const PromoCards = lazy(() => import("@/components/PromoCards"));
const FlashSaleBand = lazy(() => import("@/components/FlashSaleBand"));
const CustomProductSlider = lazy(() => import("@/components/CustomProductSlider"));
const HomepageCategoryBands = lazy(() => import("@/components/HomepageCategoryBands"));
const PWAInstallBanner = lazy(() => import("@/components/PWAInstallBanner"));
const CustomerTestimonials = lazy(() => import("@/components/CustomerTestimonials"));
const TopBrands = lazy(() => import("@/components/TopBrands"));
const HealthTipsPreview = lazy(() => import("@/components/HealthTipsPreview"));
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const Footer = lazy(() => import("@/components/Footer"));

const sectionSkeletons: Record<string, React.ReactNode> = {
  banner: <div className="h-[180px] sm:h-[260px] md:h-[380px] rounded-xl bg-muted animate-pulse" />,
  category_grid: <div className="h-[140px] rounded-xl bg-muted/50 animate-pulse" />,
  quick_actions: <div className="h-[80px] rounded-xl bg-muted/50 animate-pulse" />,
  promo_cards: (
    <div className="flex gap-2.5 overflow-hidden h-[110px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="min-w-[150px] h-[110px] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  ),
  flash_sale: (
    <div className="space-y-3 min-h-[240px]">
      <div className="h-5 w-28 rounded-lg bg-muted animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[140px] h-[200px] shrink-0 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  ),
  custom_products: <ProductBandSkeleton bandIndex={0} />,
  ai_trending: <ProductBandSkeleton bandIndex={0} />,
};

const sectionComponents: Record<string, React.ComponentType<any>> = {
  banner: HeroBanner,
  category_grid: CategoryGrid,
  quick_actions: QuickActions,
  promo_cards: PromoCards,
  flash_sale: FlashSaleBand,
};

/** Lightweight scroll-reveal wrapper */
const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`reveal ${isVisible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
};

const Index = () => {
  const { data } = useHomepageData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole === "rider") navigate("/rider", { replace: true });
  }, [userRole, navigate]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  useSEO(
    {
      title: "Optimum Pharmaceuticals HLB — বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি | Online Pharmacy Bangladesh",
      description: "বাংলাদেশে অনলাইনে ওষুধ অর্ডার করুন। দ্রুত হোম ডেলিভারি। Order medicines in Bangladesh with fast delivery.",
      canonical: "https://optimumpharmahlb.com/",
    },
    [
      { id: "org", data: getOrganizationSchema() },
      { id: "website", data: getWebSiteSchema() },
      { id: "local-business", data: getLocalBusinessSchema() },
    ]
  );

  // Use sections from API, fallback to default order
  // Optimized order: Banner → Flash Sale → Categories → Promos → Trending
  const sections = data?.sections?.length ? data.sections : [
    { id: "1", section_type: "banner", title: "Hero Banner", sort_order: 0, active: true, config: {}, subtitle: null },
    { id: "5", section_type: "flash_sale", title: "Flash Sale", sort_order: 1, active: true, config: {}, subtitle: null },
    { id: "2", section_type: "category_grid", title: "Categories", sort_order: 2, active: true, config: { mobile_only: true }, subtitle: null },
    { id: "3", section_type: "quick_actions", title: "Quick Actions", sort_order: 3, active: true, config: { mobile_only: true }, subtitle: null },
    { id: "4", section_type: "promo_cards", title: "Promotions", sort_order: 4, active: true, config: {}, subtitle: null },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="container max-w-7xl mx-auto">
          <div className="flex gap-6">
            <aside className="hidden md:block w-[240px] shrink-0 self-start sticky top-20">
              <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pt-1 pb-4" style={{ scrollbarWidth: 'none' }}>
                <SidebarNav />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
               <main className="py-4 space-y-6">
                {/* ── Dynamic sections ── */}
                <div className="space-y-5">
                  {sections
                    .filter((s: any) => s.active)
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    // Ordering shortcuts (Call / Upload Rx) always sit right after the hero banner
                    .sort((a: any, b: any) => {
                      const rank = (t: string) => (t === "banner" ? 0 : t === "quick_actions" ? 1 : 2);
                      return rank(a.section_type) - rank(b.section_type);
                    })
                    .map((section: any, idx: number) => {
                      // Show "Shop by Category" header right before category_grid
                      const showCategoryHeader = section.section_type === "category_grid";
                      const sectionWrap = "";
                      const sectionClean = "";

                      // Banner & category grid don't need card wrap
                      const needsCard = !["banner", "category_grid", "quick_actions"].includes(section.section_type);
                      const wrapClass = needsCard ? sectionWrap : sectionClean;

                      if (section.section_type === "custom_products") {
                        const productIds = section.config?.product_ids || [];
                        const autoCategoryId = section.config?.auto_category_id || null;
                        if (!productIds.length && !autoCategoryId) return null;
                        const isMobileOnly = section.config?.mobile_only;
                        return (
                          <div key={section.id} className={`${wrapClass} ${isMobileOnly ? "md:hidden" : ""}`}>
                            <Suspense fallback={sectionSkeletons.custom_products}>
                              <CustomProductSlider
                                title={section.title}
                                subtitle={section.subtitle}
                                productIds={productIds}
                                onlyDiscounted={!!section.config?.only_discounted}
                                autoCategoryId={autoCategoryId}
                              />
                            </Suspense>
                          </div>
                        );
                      }

                      const Component = sectionComponents[section.section_type];
                      if (!Component) return null;
                      const isMobileOnly = section.config?.mobile_only;

                      return (
                        <div key={section.id} className={`${wrapClass} ${isMobileOnly ? "md:hidden" : ""}`}>
                          {showCategoryHeader && (
                            <div className="flex items-center justify-between px-1 mb-3">
                              <h1 className="text-base font-bold text-foreground">Shop by Category</h1>
                              <Link to="/categories" className="text-[11px] font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                                All Categories
                              </Link>
                            </div>
                          )}
                          <Suspense fallback={sectionSkeletons[section.section_type] || <div className="h-[80px] rounded-lg bg-muted animate-pulse" />}>
                            <Component />
                          </Suspense>
                        </div>
                      );
                    })}
                </div>




                {/* ── Shop by Category (bands) ── */}
                <RevealSection>
                  <Suspense fallback={<ProductBandSkeleton bandIndex={0} />}>
                    <HomepageCategoryBands />
                  </Suspense>
                </RevealSection>

                {/* ── Bottom Section ── */}
                <RevealSection>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <Suspense fallback={null}>
                      <div className="px-3.5 pt-4 pb-3">
                        <HealthTipsPreview />
                      </div>
                    </Suspense>
                    <div className="h-px bg-border mx-4" />
                    <Suspense fallback={null}>
                      <div className="px-3.5 py-3">
                        <h2 className="text-sm font-bold text-foreground mb-2.5 px-0.5">Top Brands</h2>
                        <TopBrands />
                      </div>
                    </Suspense>
                    <div className="h-px bg-border mx-4" />
                    <Suspense fallback={null}>
                      <div className="px-3.5 py-3">
                        <CustomerTestimonials />
                      </div>
                    </Suspense>
                    <div className="h-px bg-border mx-4" />
                  </div>
                </RevealSection>

                <div className="md:hidden py-1">
                  <Suspense fallback={null}>
                    <PWAInstallBanner />
                  </Suspense>
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        <FloatingCart />
      </div>
    </PullToRefresh>
  );
};

export default Index;
