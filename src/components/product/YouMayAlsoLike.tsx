import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DesktopProductGrid from "./DesktopProductGrid";

interface Props {
  productId: string;
  productName: string;
  category?: string | null;
  company?: string | null;
  dosageForm?: string | null;
}

const YouMayAlsoLike = ({ productId, productName, category, company, dosageForm }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-recommendations", productId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("product-recommendations", {
        body: { product_id: productId, product_name: productName, category, company, dosage_form: dosageForm },
      });
      if (error) throw error;
      return (data?.recommendations || []) as any[];
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 px-4 md:px-0 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-[15px] md:text-[17px] font-bold text-foreground">You May Also Like</h3>
        </div>
        <div className="flex md:grid md:grid-cols-4 gap-3 px-4 md:px-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[130px] md:w-auto">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 mt-2 w-3/4" />
              <Skeleton className="h-4 mt-1 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DesktopProductGrid
      products={data!}
      title="You May Also Like"
      titleIcon={<Sparkles size={16} className="text-primary" />}
      titleBadge={<span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">AI</span>}
    />
  );
};

export default YouMayAlsoLike;
