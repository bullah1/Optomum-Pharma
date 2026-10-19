import { memo } from "react";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const FloatingCart = memo(() => {
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  return (
    <Link
      to="/cart"
      aria-label={`View cart, ${totalItems} items, ৳${totalPrice}`}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-1.5"
    >
      <div className="gradient-primary text-primary-foreground rounded-2xl p-3 shadow-ios-lg flex flex-col items-center gap-1">
        <ShoppingCart size={20} />
        <span className="text-[10px] font-bold">{totalItems} Item</span>
      </div>
      <div className="gradient-gold text-gold-foreground rounded-xl px-3 py-1 text-[10px] font-bold shadow-ios">
        ৳{totalPrice}
      </div>
    </Link>
  );
});

FloatingCart.displayName = "FloatingCart";
export default FloatingCart;
