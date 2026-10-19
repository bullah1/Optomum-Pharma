import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: Set<string>;
  isInWishlist: (medicineId: string) => boolean;
  toggleWishlist: (medicineId: string) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      fetchedForRef.current = null;
      return;
    }
    // Deduplicate: don't refetch for same user
    if (fetchedForRef.current === user.id) return;
    fetchedForRef.current = user.id;
    // Defer wishlist fetch to not compete with LCP resources
    const timer = setTimeout(() => {
      setLoading(true);
      supabase
        .from("wishlists")
        .select("medicine_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setWishlistIds(new Set((data || []).map((w: any) => w.medicine_id)));
          setLoading(false);
        });
    }, 1500);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const isInWishlist = useCallback(
    (medicineId: string) => wishlistIds.has(medicineId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (medicineId: string) => {
      if (!user) {
        toast.error("Please login to add to wishlist");
        return;
      }
      const inList = wishlistIds.has(medicineId);
      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (inList) next.delete(medicineId);
        else next.add(medicineId);
        return next;
      });

      if (inList) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("medicine_id", medicineId);
        if (error) {
          // Revert
          setWishlistIds((prev) => new Set(prev).add(medicineId));
          toast.error("Failed to remove from wishlist");
        }
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, medicine_id: medicineId });
        if (error) {
          // Revert
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(medicineId);
            return next;
          });
          toast.error("Failed to add to wishlist");
        } else {
          toast.success("Wishlist এ যোগ হয়েছে");
        }
      }
    },
    [user, wishlistIds]
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, isInWishlist, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
