import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface LabCartItem {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  type: "test" | "package";
  tests_count?: number;
}

interface LabCartContextType {
  items: LabCartItem[];
  addItem: (item: LabCartItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  isInCart: (id: string) => boolean;
  totalAmount: number;
}

const LabCartContext = createContext<LabCartContextType | undefined>(undefined);

export const LabCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LabCartItem[]>([]);

  const addItem = useCallback((item: LabCartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearItems = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <LabCartContext.Provider value={{ items, addItem, removeItem, clearItems, isInCart, totalAmount }}>
      {children}
    </LabCartContext.Provider>
  );
};

export const useLabCart = () => {
  const context = useContext(LabCartContext);
  if (!context) throw new Error("useLabCart must be used within LabCartProvider");
  return context;
};
