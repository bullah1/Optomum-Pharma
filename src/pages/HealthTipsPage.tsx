import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Loader2, Lightbulb } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const HealthTipsPage = () => {
  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["health-tips-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("health_tips")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return data || [];
    },
  });

  useSEO(
    {
      title: "স্বাস্থ্য টিপস | Health Tips Bangla — Optimum Pharmaceuticals HLB Bangladesh",
      description: "ডায়াবেটিস, উচ্চ রক্তচাপ, হৃদরোগ, কিডনি ও সাধারণ অসুস্থতার বিজ্ঞানসম্মত স্বাস্থ্য পরামর্শ। Daily health tips in Bangla & English from Optimum Pharmaceuticals HLB Bangladesh.",
      canonical: "/health-tips",
    },
    tips.length > 0
      ? {
          id: "health-tips-list",
          data: {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Optimum Pharmaceuticals HLB Health Tips",
            itemListElement: tips.slice(0, 20).map((t: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.title,
              description: t.description,
            })),
          },
        }
      : undefined
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Health Tips" />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : tips.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb size={40} className="mx-auto mb-3 opacity-40" />
            <p>No health tips available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tips.map((tip: any) => (
              <div key={tip.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                    {tip.icon || "💡"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default HealthTipsPage;
