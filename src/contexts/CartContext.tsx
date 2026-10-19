import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const CART_STORAGE_KEY = "optimum_cart_v1";
const loadCart = (): any[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.quantity > 0) : [];
  } catch {
    return [];
  }
};
import { toast } from "sonner";
import { trackMarketingEvent } from "@/hooks/useMarketingTracker";


export interface CartItem {
  id: string;
  name: string;
  name_bn?: string | null;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  company?: string | null;
  requires_prescription?: boolean;
  item_type?: "product" | "lab_test" | "lab_package";
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCart() as CartItem[]);

  // Keep the cart after refresh / closing the tab / logging in
  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        toast.success(`${product.name_bn || product.name} quantity updated`);
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      toast.success(`${product.name_bn || product.name} added to cart`);
      return [...prev, { ...product, quantity }];
    });
    trackMarketingEvent("add_to_cart", { product_id: product.id, product_name: product.name, price: product.price, quantity });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) trackMarketingEvent("remove_from_cart", { product_id: id, product_name: item.name });
      return prev.filter((i) => i.id !== id);
    });
    toast.info("Item removed from cart");
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
