import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Loader2, Gift, Copy } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

const OffersPage = () => {
  useSEO({
    title: "Special Offers & Discount Coupons | Optimum Pharmaceuticals HLB Bangladesh",
    description: "Exclusive discount coupons & promo codes on medicines and healthcare products. Save money on every order at Optimum Pharmaceuticals HLB Bangladesh.",
    canonical: "/offers",
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["public-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" copied!`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Special Offers" />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Special Offers</h2>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Gift size={40} className="mx-auto mb-3 opacity-40" />
            <p>No offers available right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-lg">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}
                      </span>
                      <span className="text-xs text-muted-foreground">OFF</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Min order: ৳{c.min_order_amount}</p>
                    {c.expires_at && <p className="text-[10px] text-muted-foreground">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>}
                  </div>
                  <button
                    onClick={() => copyCoupon(c.code)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 rounded-xl text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Copy size={14} /> {c.code}
                  </button>
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

export default OffersPage;
