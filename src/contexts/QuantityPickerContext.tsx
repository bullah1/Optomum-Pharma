import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { lazy, Suspense } from "react";

const QuantityPickerSheet = lazy(() => import("@/components/product/QuantityPickerSheet"));

type ProductData = Omit<CartItem, "quantity">;

interface QuantityPickerContextType {
  openPicker: (product: ProductData) => void;
}

const QuantityPickerContext = createContext<QuantityPickerContextType | undefined>(undefined);

export const QuantityPickerProvider = ({ children }: { children: ReactNode }) => {
  const { addItem } = useCart();
  const [pickerProduct, setPickerProduct] = useState<ProductData | null>(null);

  const openPicker = useCallback((product: ProductData) => {
    setPickerProduct(product);
  }, []);

  const handleSelect = useCallback((qty: number) => {
    if (pickerProduct) {
      addItem(pickerProduct, qty);
      setPickerProduct(null);
    }
  }, [pickerProduct, addItem]);

  return (
    <QuantityPickerContext.Provider value={{ openPicker }}>
      {children}
      {pickerProduct && (
        <Suspense fallback={null}>
          <QuantityPickerSheet
            show={!!pickerProduct}
            productName={pickerProduct.name}
            onSelect={handleSelect}
            onClose={() => setPickerProduct(null)}
          />
        </Suspense>
      )}
    </QuantityPickerContext.Provider>
  );
};

export const useQuantityPicker = () => {
  const ctx = useContext(QuantityPickerContext);
  if (!ctx) throw new Error("useQuantityPicker must be used within QuantityPickerProvider");
  return ctx;
};
