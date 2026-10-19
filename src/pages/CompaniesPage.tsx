import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";

const CompaniesPage = () => {
  const [search, setSearch] = useState("");

  useSEO({
    title: "Pharma Brands & Companies | Optimum Pharmaceuticals HLB Bangladesh",
    description: "Browse trusted pharmaceutical brands and healthcare companies available at Optimum Pharmaceuticals HLB. Order genuine medicines from top brands with fast home delivery.",
    canonical: "/companies",
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = companies?.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  ) ?? [];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title="Companies" />

      <main className="container py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card border-border"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-16">
            <Building2 size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">কোনো কোম্পানি পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((company) => (
              <Link
                key={company.id}
                to={`/company/${company.slug || company.id}`}
                className="bg-card rounded-xl border border-border hover:border-primary/30 transition-all p-4 flex flex-col items-center text-center gap-2.5 group"
              >
                {company.logo_url ? (
                  <div className="w-14 h-14 rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden">
                    <img src={company.logo_url} alt={company.name} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 size={22} className="text-primary" />
                  </div>
                )}
                <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
                  {company.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CompaniesPage;
