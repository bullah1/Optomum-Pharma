import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { X, Search, Check } from "lucide-react";

interface ProductPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const ProductPicker = ({ selectedIds, onChange }: ProductPickerProps) => {
  const [search, setSearch] = useState("");

  const { data: allProducts = [] } = useQuery({
    queryKey: ["admin-all-products-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, name_bn, price, image_url, company")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.name_bn?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const selectedProducts = useMemo(() => {
    const map = new Map(allProducts.map((p: any) => [p.id, p]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [allProducts, selectedIds]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeProduct = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-3">
      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Selected ({selectedProducts.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedProducts.map((p: any) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-lg"
              >
                {p.name}
                <button onClick={() => removeProduct(p.id)} className="hover:text-destructive">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-9 h-9"
        />
      </div>

      {/* Product list */}
      <div className="max-h-[250px] overflow-y-auto border border-border rounded-xl divide-y divide-border/30">
        {filtered.slice(0, 50).map((p: any) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleProduct(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors ${
                isSelected ? "bg-primary/5" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                {p.company && <p className="text-[10px] text-muted-foreground">{p.company}</p>}
              </div>
              <span className="text-xs font-bold text-foreground shrink-0">৳{p.price}</span>
              {isSelected && <Check size={14} className="text-primary shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No products found</p>
        )}
      </div>
    </div>
  );
};

export default ProductPicker;
