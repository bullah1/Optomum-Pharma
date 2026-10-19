
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { lazy, Suspense } from "react";
import { FlaskConical, Clock, Shield, Star, Phone, MessageCircle, Search, Package, Zap, BadgePercent, Building2, CheckCircle2, Plus, ArrowRight } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLabCart } from "@/contexts/LabCartContext";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbSchema } from "@/lib/seo";

const SidebarNav = lazy(() => import("@/components/SidebarNav"));

// Import category images
import bloodImg from "@/assets/lab/blood-test.png";
import diabetesImg from "@/assets/lab/diabetes.png";
import hormoneImg from "@/assets/lab/hormone.png";
import organImg from "@/assets/lab/organ.png";
import vitaminImg from "@/assets/lab/vitamin.png";
import generalImg from "@/assets/lab/general.png";
import neuroImg from "@/assets/lab/neuro.png";
import boneImg from "@/assets/lab/bone.png";

const healthConcerns = [
  { id: "blood", label: "Blood", image: bloodImg, color: "bg-red-50 dark:bg-red-950/30" },
  { id: "diabetes", label: "Diabetes", image: diabetesImg, color: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "hormone", label: "Hormone", image: hormoneImg, color: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "organ", label: "Organ", image: organImg, color: "bg-pink-50 dark:bg-pink-950/30" },
  { id: "vitamin", label: "Vitamin", image: vitaminImg, color: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "general", label: "General", image: generalImg, color: "bg-teal-50 dark:bg-teal-950/30" },
  { id: "neuro", label: "Neuro", image: neuroImg, color: "bg-indigo-50 dark:bg-indigo-950/30" },
  { id: "bone", label: "Bone", image: boneImg, color: "bg-orange-50 dark:bg-orange-950/30" },
];

const LabTestPage = () => {
  const { items, addItem, isInCart, totalAmount } = useLabCart();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isMobile = useIsMobile();

  useSEO(
    {
      title: "ল্যাব টেস্ট বাংলাদেশ — হোম স্যাম্পল কালেকশন | Optimum Pharmaceuticals HLB",
      description: "বাংলাদেশে ল্যাব টেস্ট বুক করুন — রক্ত পরীক্ষা, ডায়াবেটিস, থাইরয়েড, ভিটামিন টেস্ট। ঘরে বসে স্যাম্পল কালেকশন। সেরা দামে রিপোর্ট পান।",
      canonical: "https://optimumpharmahlb.com/lab-test",
    },
    [
      {
        id: "lab-breadcrumb",
        data: getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Lab Test Bangladesh", url: "/lab-test" },
        ]),
      },
      {
        id: "lab-service",
        data: {
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: "Optimum Pharmaceuticals HLB Lab Test — বাংলাদেশ",
          description: "সারা বাংলাদেশে ল্যাব টেস্ট সেবা। ঘরে বসে স্যাম্পল কালেকশন।",
          areaServed: { "@type": "Country", name: "Bangladesh" },
          availableService: {
            "@type": "MedicalTest",
            name: "Diagnostic Lab Tests",
            description: "Blood test, Diabetes, Thyroid, Hormone, Vitamin tests with home sample collection in Bangladesh",
          },
        },
      },
    ]
  );

  const { data: labTests, isLoading } = useQuery({
    queryKey: ["lab-tests"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_tests").select("*").eq("available", true).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: dbPackages } = useQuery({
    queryKey: ["lab-packages"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_packages").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = labTests?.filter((t) => {
    const matchesCategory = !activeCategory || t.category === activeCategory;
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.name_bn?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularTests = labTests?.slice(0, 6);

  // Prefetch booking page chunk when user adds first item
  const handleAddTest = (item: { id: string; name: string; price: number; original_price?: number | null }, type: "test" | "package" = "test") => {
    addItem({ id: item.id, name: item.name, price: item.price, original_price: item.original_price, type });
    toast.success(`${item.name} has been added`);
    // Prefetch the booking page JS chunk
    import("@/pages/LabBookingPage").catch(() => {});
  };

  const handleProceedToBooking = () => {
    navigate("/lab-test/book", {
      state: { items },
    });
  };

  const TestRow = ({ test }: { test: any }) => {
    const discount = test.original_price ? Math.round(((test.original_price - test.price) / test.original_price) * 100) : 0;
    const added = isInCart(test.id);
    return (
      <div className="flex items-center gap-2.5 px-3 py-3 hover:bg-muted/20 transition-colors active:bg-muted/30">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1">{test.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock size={9} /> {test.report_time || "24hrs"}
            </span>
            <span className="text-[10px] text-muted-foreground">• {test.sample_type || "Blood"}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] font-bold text-foreground">৳{test.price}</span>
            {test.original_price && <span className="text-[10px] text-muted-foreground line-through">৳{test.original_price}</span>}
          </div>
          {discount > 0 && (
            <span className="text-[9px] font-bold text-destructive">{discount}% OFF</span>
          )}
        </div>

        <button
          onClick={() => !added && handleAddTest({ id: test.id, name: test.name, price: Number(test.price), original_price: test.original_price ? Number(test.original_price) : null })}
          disabled={added}
          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-all ${
            added ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default" : "bg-primary text-primary-foreground active:scale-95"
          }`}
        >
          {added ? <><CheckCircle2 size={10} /> Added</> : <><Plus size={10} /> Add</>}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Mobile: PageTopBar, Desktop: Header */}
      <div className="md:hidden">
        <PageTopBar
          title="Lab Test"
          subtitle="Book from home • Report in 24 hours"
          showCart={false}
          rightAction={
            items.length > 0 ? (
              <button
                onClick={() => navigate("/lab-test/book")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
              >
                <FlaskConical size={14} />
                Book Now ({items.length})
              </button>
            ) : undefined
          }
        />
      </div>
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="container max-w-5xl mx-auto">
        <div className="flex gap-5">

          <main className="flex-1 min-w-0 py-3 md:py-6 space-y-4">

            {/* Hero - hidden on desktop since Header is shown */}
            <div className="bg-primary rounded-xl px-4 py-3.5 md:px-6 md:py-5 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <FlaskConical size={20} className="text-primary-foreground md:w-6 md:h-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-base md:text-lg font-bold text-primary-foreground">Lab Test</h1>
                <p className="text-[11px] md:text-xs text-primary-foreground/70">Book from home • Report in 24 hours</p>
              </div>
              <div className="flex flex-col gap-1">
                <a href="tel:+8801306383938" className="bg-primary-foreground/15 text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Phone size={10} /> Call
                </a>
                <a href="https://wa.me/8801306383938" target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/15 text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <MessageCircle size={10} /> Chat
                </a>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tests... (e.g. CBC, Sugar)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Browse by Concern */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/30"
                }`}
              >
                All
              </button>
              {healthConcerns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    activeCategory === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  <img src={c.image} alt="" className="w-4 h-4 rounded object-contain" />
                  {c.label}
                </button>
              ))}
            </div>

            {/* Health Packages */}
            {!activeCategory && !searchQuery && dbPackages && dbPackages.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Package size={15} className="text-primary" /> Health Packages
                  </h2>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Zap size={9} /> Save
                  </span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
                  {dbPackages.map((pkg) => {
                    const discount = pkg.original_price ? Math.round(((Number(pkg.original_price) - Number(pkg.price)) / Number(pkg.original_price)) * 100) : 0;
                    const pkgAdded = isInCart(pkg.id);
                    return (
                      <div key={pkg.id} className="bg-card rounded-xl border border-border min-w-[240px] w-[240px] shrink-0 snap-start overflow-hidden">
                        <div className={`bg-gradient-to-r ${pkg.gradient || "from-primary/10 to-primary/5"} px-3 py-2 flex items-center gap-2`}>
                          <span className="text-lg">{pkg.icon === "Shield" ? "🛡️" : "📦"}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[12px] font-bold text-foreground leading-tight line-clamp-1">{pkg.name}</h3>
                            <p className="text-[10px] text-muted-foreground">{(pkg.tests || []).length} tests</p>
                          </div>
                          {pkg.badge && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${pkg.badge_color || "bg-primary text-primary-foreground"}`}>
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {(pkg.tests || []).slice(0, 4).map((t: string, i: number) => (
                              <span key={i} className="text-[9px] bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                            {(pkg.tests || []).length > 4 && (
                              <span className="text-[9px] text-muted-foreground">+{(pkg.tests || []).length - 4} more</span>
                            )}
                          </div>
                        </div>
                        <div className="px-3 pb-2.5 flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-extrabold text-foreground">৳{pkg.price}</span>
                              {pkg.original_price && <span className="text-[10px] text-muted-foreground line-through">৳{pkg.original_price}</span>}
                            </div>
                            {discount > 0 && (
                              <span className="text-[9px] font-bold text-destructive flex items-center gap-0.5">
                                <BadgePercent size={9} /> ৳{Number(pkg.original_price) - Number(pkg.price)} Save
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => !pkgAdded && handleAddTest({
                              id: pkg.id, name: pkg.name, price: Number(pkg.price),
                              original_price: pkg.original_price ? Number(pkg.original_price) : null,
                            }, "package")}
                            disabled={pkgAdded}
                            className={`text-[11px] font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-all ${
                              pkgAdded ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default" : "bg-primary text-primary-foreground active:scale-95"
                            }`}
                          >
                            {pkgAdded ? <><CheckCircle2 size={11} /> Added</> : <><Plus size={11} /> Add</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Most Booked */}
            {!activeCategory && !searchQuery && popularTests && popularTests.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500" /> Most Booked
                </h2>
                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/20">
                  {popularTests.map((test) => <TestRow key={test.id} test={test} />)}
                </div>
              </section>
            )}

            {/* Filtered / Search results */}
            {(activeCategory || searchQuery) && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-foreground">
                    {activeCategory ? healthConcerns.find(c => c.id === activeCategory)?.label : "Results"} {filtered?.length ? `(${filtered.length})` : ""}
                  </h2>
                  {activeCategory && (
                    <button onClick={() => setActiveCategory(null)} className="text-[11px] text-primary font-semibold">Clear</button>
                  )}
                </div>
                {!filtered?.length ? (
                  <div className="text-center py-10 bg-card rounded-xl border border-border">
                    <span className="text-3xl block mb-2">🧪</span>
                    <p className="text-sm text-muted-foreground">No tests found</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/20">
                    {filtered.map((test) => <TestRow key={test.id} test={test} />)}
                  </div>
                )}
              </section>
            )}

            {/* All Tests */}
            {!activeCategory && !searchQuery && labTests && labTests.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-foreground mb-2">View All Tests</h2>
                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/20">
                  {labTests.map((test) => <TestRow key={test.id} test={test} />)}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="bg-card rounded-xl p-4 text-center border border-border">
              <p className="text-[12px] text-muted-foreground mb-2">Can't find your test?</p>
              <a href="tel:+8801306383938" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl">
                <Phone size={13} /> Call: +8801306383938
              </a>
            </div>

            <Footer />
          </main>
        </div>
      </div>

      {/* Sticky Bottom — Lab Booking Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-ios">
          <div className="container max-w-lg py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{items.length} tests সিলেক্টেড</p>
              <p className="text-lg font-extrabold text-foreground leading-tight">৳{totalAmount}</p>
            </div>
            <button
              onClick={handleProceedToBooking}
              className="gradient-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-2xl shadow-ios active:scale-[0.97] transition-transform flex items-center gap-2"
            >
              <FlaskConical size={15} />
              Book Now
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default LabTestPage;
