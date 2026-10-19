import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

interface ProductPageHeaderProps {
  productName: string;
  productId: string;
  slug?: string | null;
  imageUrl?: string | null;
  price?: number;
}

const ProductPageHeader = ({ productName }: ProductPageHeaderProps) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border pt-safe">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <Link
          to="/cart"
          className="relative w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
          aria-label="View cart"
        >
          <ShoppingCart size={16} className="text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default ProductPageHeader;
