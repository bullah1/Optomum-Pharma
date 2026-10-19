
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import ProductCard from "@/components/product/ProductCard";
import { useSEO } from "@/hooks/useSEO";

const BEAUTY_KEYWORDS = ["beauty", "skin", "care", "cosmetic", "makeup", "cream", "lotion", "face", "hair", "body", "soap", "shampoo", "sunscreen", "moistur", "serum", "cleanser", "wash", "গোসল", "সৌন্দর্য", "ত্বক", "ক্রিম"];

const beautySubCategories = [
  { id: "skincare", label: "Skin Care", icon: "🧴" },
  { id: "haircare", label: "Hair Care", icon: "💇" },
  { id: "bodycare", label: "Body Care", icon: "🛁" },
  { id: "makeup", label: "Makeup", icon: "💄" },
  { id: "suncare", label: "Sun Care", icon: "☀️" },
];

const classifyProduct = (product: any): string => {
  const text = `${product.name} ${product.description || ""} ${product.dosage_form || ""}`.toLowerCase();
  if (/hair|shampoo|condit|চুল/i.test(text)) return "haircare";
  if (/sun|spf|সান/i.test(text)) return "suncare";
  if (/makeup|lipstick|foundation|mascara|মেকআপ/i.test(text)) return "makeup";
  if (/body|soap|wash|lotion|গোসল|বডি/i.test(text)) return "bodycare";
  return "skincare";
};

const BeautyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useSEO({
    title: "Beauty Products & Skincare | Optimum Pharmaceuticals HLB Bangladesh",
    description: "Shop authentic skincare, haircare, makeup, sunscreen & beauty products from top brands. Fast home delivery in Bangladesh.",
    canonical: "/beauty",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["beauty-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Filter beauty-related products
      return (data || []).filter((m) => {
        const text = `${m.name} ${m.description || ""} ${m.company || ""} ${m.dosage_form || ""}`.toLowerCase();
        return BEAUTY_KEYWORDS.some((kw) => text.includes(kw));
      });
    },
  });

  const allProducts = products || [];
  const filtered = activeTab
    ? allProducts.filter((p) => classifyProduct(p) === activeTab)
    : allProducts;


  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title="Beauty & Care" subtitle="Take care of your beauty ✨" />
      <main className="container py-3 max-w-3xl space-y-3">
        {/* Beauty Specialist CTA */}
        <Link
          to="/beauty/specialists"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/90 to-pink-600/90 dark:from-rose-600/80 dark:to-pink-700/80 p-5 block group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Beauty Specialists</h2>
              <p className="text-xs text-white/80">Book an appointment with specialists ✨</p>
            </div>
            <div className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-bold group-hover:bg-white/30 transition-colors">
              Book Now
            </div>
          </div>
        </Link>

        {/* Sub-category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveTab(null)}
            className={`text-[11px] font-semibold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              !activeTab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            All Products
          </button>
          {beautySubCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(activeTab === cat.id ? null : cat.id)}
              className={`text-[11px] font-semibold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">✨</span>
            <p className="text-sm text-muted-foreground">No products in this category</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">{filtered.length} products found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BeautyPage;
