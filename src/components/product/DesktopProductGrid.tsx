import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductCard from "@/components/product/ProductCard";
import type { ReactNode } from "react";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  company?: string | null;
  slug?: string | null;
}

interface DesktopProductGridProps {
  products: ProductItem[];
  title: string;
  titleIcon?: ReactNode;
  titleBadge?: ReactNode;
}

const DesktopProductGrid = ({ products, title, titleIcon, titleBadge }: DesktopProductGridProps) => {
  const isMobile = useIsMobile();

  if (!products.length) return null;

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 px-4 md:px-0 mb-3">
        {titleIcon}
        <h3 className="text-[15px] md:text-[17px] font-bold text-foreground">{title}</h3>
        {titleBadge}
      </div>

      {/* Mobile: horizontal scroll | Desktop: grid */}
      {isMobile ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
          {products.map((p) => <ProductCard key={p.id} product={p} fixedWidth />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default DesktopProductGrid;
