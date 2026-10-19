import { Star, Bell, BellOff, Heart, Clock, Truck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useStockNotify } from "@/hooks/useStockNotify";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ProductInfoSectionProps {
  name: string;
  nameBn?: string | null;
  company?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  price: number;
  originalPrice?: number | null;
  discount: number;
  stock: number;
  productId: string;
  avgRating: string | null;
  reviewCount: number;
  qty: number;
  onAddToCart: () => void;
  fixedBar?: boolean;
  deliveryTime?: string | null;
  categoryName?: string | null;
  categoryId?: string | null;
}

const ProductInfoSection = ({
  name, nameBn, company, dosageForm, strength, price, originalPrice,
  discount, stock, productId, avgRating, reviewCount, qty, onAddToCart,
  fixedBar = false, deliveryTime, categoryName, categoryId,
}: ProductInfoSectionProps) => {
  const { isSubscribed, toggleNotify } = useStockNotify(stock <= 0 ? [productId] : []);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const totalPrice = price * qty;
  const totalOriginal = originalPrice ? originalPrice * qty : null;

  const [visitorArea, setVisitorArea] = useState(() => localStorage.getItem("visitor_area") || "");

  useEffect(() => {
    const handler = () => setVisitorArea(localStorage.getItem("visitor_area") || "");
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 2000);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, []);

  const { data: zoneTime } = useQuery({
    queryKey: ["zone-delivery-time", visitorArea],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_zones")
        .select("estimated_time")
        .eq("area", visitorArea)
        .eq("active", true)
        .single();
      return data?.estimated_time || null;
    },
    enabled: !!visitorArea,
    staleTime: 10 * 60 * 1000,
  });

  const displayDeliveryTime = zoneTime || deliveryTime || "12-24 Hours";

  return (
    <div className="px-4 md:px-0 py-2 md:py-0 space-y-3">
      {/* Product Name + Wishlist */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] md:text-[22px] font-bold text-foreground leading-snug">
            {name}
          </h1>
          {nameBn && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{nameBn}</p>
          )}
        </div>
        <button
          onClick={() => toggleWishlist(productId)}
          className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center active:scale-90 transition-all"
        >
          <Heart
            size={16}
            className={isInWishlist(productId) ? "fill-destructive text-destructive" : "text-muted-foreground"}
          />
        </button>
      </div>

      {/* Rating */}
      {avgRating && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">{avgRating}/5</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={13}
                className={
                  s <= Math.round(Number(avgRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/20"
                }
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">
            ({reviewCount} Ratings)
          </span>
        </div>
      )}

      {/* Type + Brand + Category — single row, horizontal scroll if overflow */}
      {(dosageForm || company || categoryName) && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {dosageForm && (
            <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md bg-muted/60 text-[11px] font-medium text-foreground/80 whitespace-nowrap">
              {dosageForm}
            </span>
          )}
          {company && (
            <Link
              to={`/company/${encodeURIComponent(company)}`}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="text-[11px] font-medium text-foreground/80">{company}</span>
              <ChevronRight size={10} className="text-muted-foreground" />
            </Link>
          )}
          {categoryName && (
            <Link
              to={`/category/${categoryId}`}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="text-[11px] font-medium text-foreground/80">{categoryName}</span>
              <ChevronRight size={10} className="text-muted-foreground" />
            </Link>
          )}
        </div>
      )}

      {/* Strength info */}
      {strength && (
        <div className="text-[12px] text-spot-offer font-medium">{strength}</div>
      )}

      {/* Price + Add to Cart */}
      {!fixedBar && (
        <div className="pt-3 border-t border-border">
          {qty > 1 && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              {qty} × {dosageForm || "Unit"}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[22px] md:text-[26px] font-bold text-foreground leading-none">
                ৳ {totalPrice}
              </span>
              {totalOriginal && totalOriginal > totalPrice && (
                <span className="text-[12px] text-muted-foreground line-through">
                  ৳{totalOriginal}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-md">
                  {discount}% OFF
                </span>
              )}
            </div>
            {stock > 0 ? (
              <button
                onClick={onAddToCart}
                data-inline-add-cart
                className="shrink-0 bg-primary text-primary-foreground font-semibold py-2.5 px-6 rounded-xl text-[13px] whitespace-nowrap active:scale-[0.97] transition-all"
              >
                Add To Cart
              </button>
            ) : (
              <button
                onClick={() => toggleNotify(productId)}
                className={`shrink-0 font-semibold py-2.5 px-5 rounded-xl text-[12px] whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isSubscribed(productId)
                    ? "bg-muted text-muted-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {isSubscribed(productId) ? <BellOff size={14} /> : <Bell size={14} />}
                {isSubscribed(productId) ? "Notified" : "Notify Me"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop-only extras */}
      <div className="hidden md:flex items-center gap-4 pt-2 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <Truck size={13} className="text-primary" />
          Delivery: <span className="font-medium text-foreground">{displayDeliveryTime}</span>
          {visitorArea && <span className="opacity-60">({visitorArea})</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-primary" />
          COD Available
        </span>
        {stock > 0 && (
          <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            In Stock
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductInfoSection;
