import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuantityPicker } from "@/contexts/QuantityPickerContext";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingCart from "@/components/FloatingCart";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Pill } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WishlistPage = () => {
  const { user } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { openPicker } = useQuantityPicker();
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["wishlist-products", Array.from(wishlistIds)],
    queryFn: async () => {
      if (wishlistIds.size === 0) return [];
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, name_bn, price, original_price, image_url, company, requires_prescription, stock")
        .in("id", Array.from(wishlistIds));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleAddToCart = (product: any) => {
    openPicker({
      id: product.id,
      name: product.name,
      name_bn: product.name_bn,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      image_url: product.image_url,
      company: product.company,
      requires_prescription: product.requires_prescription,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <PageTopBar title="Wishlist" />
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
          <Heart size={48} className="mx-auto text-muted-foreground/40" />
          <h2 className="text-xl font-bold text-foreground">Wishlist</h2>
          <p className="text-sm text-muted-foreground">Login to view your Wishlist</p>
          <Link to="/auth">
            <Button className="rounded-xl mt-4">Login / Sign Up</Button>
          </Link>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="My Wishlist" />

      <div className="container max-w-3xl py-4 px-4">
        <h2 className="hidden md:block text-lg font-bold text-foreground mb-4">
          <Heart size={20} className="inline text-destructive mr-2" />
          My Wishlist ({wishlistIds.size})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Heart size={48} className="mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Your wishlist is empty</p>
            <Link to="/">
              <Button variant="outline" className="rounded-xl mt-2">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const discount = product.original_price
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                : 0;
              return (
                <div key={product.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                  <Link to={`/product/${product.id}`} className="w-16 h-16 rounded-lg bg-secondary/30 flex items-center justify-center overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Pill size={24} className="text-muted-foreground/20" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`}>
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{product.name}</h4>
                    </Link>
                    {product.company && <p className="text-[10px] text-muted-foreground mt-0.5">{product.company}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-foreground">৳{product.price}</span>
                      {product.original_price && (
                        <span className="text-[10px] text-muted-foreground line-through">৳{product.original_price}</span>
                      )}
                      {discount > 0 && (
                        <span className="text-[9px] font-semibold text-destructive">{discount}% OFF</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1.5 rounded-lg active:scale-90 transition-transform"
                    >
                      <ShoppingCart size={14} />
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MobileBottomNav />
      <FloatingCart />
    </div>
  );
};

export default WishlistPage;
