import { useState } from "react";
import { X, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface FilterState {
  priceRange: string | null;
  minPrice: string;
  maxPrice: string;
  discountRange: string | null;
}

const PRICE_RANGES = [
  { label: "Under ৳500", value: "0-500" },
  { label: "৳500 - ৳1000", value: "500-1000" },
  { label: "৳1000 - ৳2000", value: "1000-2000" },
  { label: "Over ৳2000", value: "2000-999999" },
];

const DISCOUNT_RANGES = [
  { label: "10% and above", value: "10" },
  { label: "20% and above", value: "20" },
  { label: "30% and above", value: "30" },
  { label: "40% and above", value: "40" },
];

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const FilterContent = ({ filters, onChange, resultCount }: Props) => {
  const [customMin, setCustomMin] = useState(filters.minPrice);
  const [customMax, setCustomMax] = useState(filters.maxPrice);

  const clearPrice = () => onChange({ ...filters, priceRange: null, minPrice: "", maxPrice: "" });
  const clearDiscount = () => onChange({ ...filters, discountRange: null });

  const applyCustomPrice = () => {
    if (customMin || customMax) {
      onChange({ ...filters, priceRange: null, minPrice: customMin, maxPrice: customMax });
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">Price Range</h4>
          {(filters.priceRange || filters.minPrice || filters.maxPrice) && (
            <button onClick={clearPrice} className="text-xs font-semibold text-primary hover:underline">Clear</button>
          )}
        </div>
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${filters.priceRange === r.value ? "border-primary" : "border-muted-foreground/40 group-hover:border-primary/60"}`}>
                {filters.priceRange === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-foreground/80">{r.label}</span>
              <input type="radio" name="price" className="hidden" checked={filters.priceRange === r.value}
                onChange={() => onChange({ ...filters, priceRange: r.value, minPrice: "", maxPrice: "" })} />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Input placeholder="Min" type="number" value={customMin} onChange={(e) => setCustomMin(e.target.value)}
            className="h-8 text-xs" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input placeholder="Max" type="number" value={customMax} onChange={(e) => setCustomMax(e.target.value)}
            className="h-8 text-xs" />
          <button onClick={applyCustomPrice}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Discount Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">Discount Range</h4>
          {filters.discountRange && (
            <button onClick={clearDiscount} className="text-xs font-semibold text-primary hover:underline">Clear</button>
          )}
        </div>
        <div className="space-y-2">
          {DISCOUNT_RANGES.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${filters.discountRange === r.value ? "border-primary" : "border-muted-foreground/40 group-hover:border-primary/60"}`}>
                {filters.discountRange === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-foreground/80">{r.label}</span>
              <input type="radio" name="discount" className="hidden" checked={filters.discountRange === r.value}
                onChange={() => onChange({ ...filters, discountRange: r.value })} />
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
        {resultCount} products found
      </p>
    </div>
  );
};

// Desktop sidebar
export const CategoryFilterSidebar = (props: Props) => (
  <aside className="hidden lg:block w-[220px] shrink-0">
    <div className="sticky top-20 bg-card rounded-2xl border border-border p-4 shadow-ios">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <SlidersHorizontal size={14} /> Filter
      </h3>
      <FilterContent {...props} />
    </div>
  </aside>
);

// Mobile bottom sheet
export const CategoryFilterSheet = (props: Props) => {
  const hasFilters = props.filters.priceRange || props.filters.minPrice || props.filters.maxPrice || props.filters.discountRange;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="lg:hidden flex items-center gap-1.5 text-xs font-medium bg-secondary px-3 py-1.5 rounded-xl hover:bg-secondary/80 transition-colors">
          <SlidersHorizontal size={12} />
          Filter
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[75vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Filter</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <FilterContent {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const defaultFilters: FilterState = {
  priceRange: null,
  minPrice: "",
  maxPrice: "",
  discountRange: null,
};
