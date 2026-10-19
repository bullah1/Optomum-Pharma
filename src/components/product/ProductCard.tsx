import { memo } from "react";
import { Link } from "react-router-dom";
import { Pill } from "lucide-react";
import { useQuantityPicker } from "@/contexts/QuantityPickerContext";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    name_bn?: string | null;
    price: number;
    original_price?: number | null;
    image_url?: string | null;
    company?: string | null;
    slug?: string | null;
    requires_prescription?: boolean;
  };
  /** Fixed width for horizontal scroll mode */
  fixedWidth?: boolean;
}

const ProductCard = memo(({ product, fixedWidth }: ProductCardProps) => {
  const { openPicker } = useQuantityPicker();
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className={`bg-card rounded-xl border border-border card-lift overflow-hidden flex flex-col group ${
        fixedWidth ? "w-[148px] min-w-[148px] sm:w-[170px] sm:min-w-[170px] shrink-0" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary/5 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-[92%] h-[92%] object-contain object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Pill size={36} className="text-muted-foreground/20" />
        )}

        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            {discount}% OFF
          </span>
        )}
        {product.requires_prescription && (
          <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            Rx
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2 pt-1.5 pb-2 flex flex-col flex-1">
        <h4 className="text-[11px] sm:text-[12px] font-medium text-foreground leading-snug line-clamp-2">
          {product.name_bn || product.name}
        </h4>
        {product.company && (
          <p className="text-[9px] text-spot-doctor font-medium mt-0.5 truncate">
            {product.company}
          </p>
        )}

        <div className="flex items-end justify-between mt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-bold text-foreground leading-none">
              ৳{product.price}
            </span>
            {product.original_price && product.original_price !== product.price && (
              <span className="text-[10px] text-muted-foreground line-through leading-none">
                ৳{product.original_price}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
            className="bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 min-h-[30px] rounded-lg shadow-sm active:scale-90 transition-all duration-200 hover:brightness-95"
          >
            + Add
          </button>
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
