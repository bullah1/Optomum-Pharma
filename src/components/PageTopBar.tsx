import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import type { ReactNode } from "react";

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  showCart?: boolean;
  rightAction?: ReactNode;
}

const PageTopBar = ({ title, subtitle, showCart = true, rightAction }: PageTopBarProps) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border pt-safe">
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-foreground leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground leading-tight">{subtitle}</p>
          )}
        </div>
        {rightAction ? rightAction : showCart ? (
          <Link to="/cart" className="relative w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors active:scale-95">
            <ShoppingCart size={16} className="text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default PageTopBar;
