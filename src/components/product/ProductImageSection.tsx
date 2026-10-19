import { Pill, Share2, Check, Clock, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ProductImageSectionProps {
  imageUrl: string | null;
  name: string;
  productId: string;
  discount: number;
  requiresPrescription: boolean;
  deliveryTime: string | null;
  slug?: string | null;
}

const ProductImageSection = ({
  imageUrl, name, productId, discount, requiresPrescription, deliveryTime, slug,
}: ProductImageSectionProps) => {
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  const productUrl = `${window.location.origin}/product/${slug || productId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `Check out ${name}`, url: productUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative bg-white dark:bg-card md:rounded-2xl md:border md:border-border overflow-hidden">
      {/* Image container — clean white bg */}
      <div className="relative flex items-center justify-center min-h-[380px] md:min-h-[500px]">
        {/* Discount badge — top left */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 z-10 bg-destructive text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            {discount}% OFF
          </span>
        )}

        {/* Rx badge — top right */}
        {requiresPrescription && (
          <span className="absolute top-3 right-3 z-10 bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 py-1 rounded-full">
            Rx Required
          </span>
        )}

        {/* Product image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`w-full object-contain transition-transform duration-300 p-6 md:p-10 ${
              zoomed ? "scale-150 cursor-zoom-out" : "max-h-[360px] md:max-h-[480px] cursor-zoom-in"
            }`}
            onClick={() => setZoomed(!zoomed)}
          />
        ) : (
          <Pill size={56} className="text-muted-foreground/15" />
        )}
      </div>

      {/* Bottom bar — delivery time + share */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        {/* Delivery time */}
        <div className="flex items-center gap-1.5">
          {deliveryTime && (
            <>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock size={11} className="text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wide">
                {deliveryTime}
              </span>
            </>
          )}
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center active:scale-90 transition-all"
          aria-label="Share"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-foreground/60" />}
        </button>
      </div>
    </div>
  );
};

export default ProductImageSection;
