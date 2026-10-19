import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface QuantityPickerSheetProps {
  show: boolean;
  productName: string;
  maxQty?: number;
  onSelect: (qty: number) => void;
  onClose: () => void;
}

const QuantityPickerSheet = ({ show, productName, maxQty = 7, onSelect, onClose }: QuantityPickerSheetProps) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl w-full max-w-xs mx-auto shadow-ios-lg animate-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold text-foreground">Select Quantity</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="pb-3 max-h-[50vh] overflow-y-auto">
          {Array.from({ length: maxQty }, (_, i) => i + 1).map((qty) => (
            <button
              key={qty}
              onClick={() => onSelect(qty)}
              className="w-full text-left px-5 py-3 text-[15px] text-foreground hover:bg-secondary transition-colors active:bg-secondary/80 border-b border-border last:border-0"
            >
              {qty} × {productName}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuantityPickerSheet;
