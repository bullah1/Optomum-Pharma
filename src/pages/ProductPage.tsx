import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ProductPageHeader from "@/components/product/ProductPageHeader";
import Footer from "@/components/Footer";

import FloatingCart from "@/components/FloatingCart";
import ProductImageSection from "@/components/product/ProductImageSection";
import ProductInfoSection from "@/components/product/ProductInfoSection";
import ProductDescriptionCard from "@/components/product/ProductDescriptionCard";
import ProductReviews from "@/components/product/ProductReviews";
import RelatedProducts from "@/components/product/RelatedProducts";
import RecentlyViewedProducts from "@/components/product/RecentlyViewedProducts";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import QuantityPickerSheet from "@/components/product/QuantityPickerSheet";
import ProductPageSkeleton from "@/components/product/ProductPageSkeleton";
import { useSEO } from "@/hooks/useSEO";
import { trackMarketingEvent } from "@/hooks/useMarketingTracker";
import { ShoppingCart, ChevronRight, ShieldCheck, Truck, RotateCcw, Lock, Pill, Clock, Share2, Phone } from "lucide-react";
import { useState, useEffect } from "react";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, totalItems, totalPrice } = useCart();
  const { isB2B } = useAuth();
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [showBn, setShowBn] = useState(false);
  const [inlineCtaVisible, setInlineCtaVisible] = useState(true);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!);
      let result: any;
      if (isUuid) {
        const { data, error } = await supabase.from("medicines").select("*, categories(name, id)").eq("id", id!).single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await (supabase.from("medicines").select("*, categories(name, id)") as any).eq("slug", id!).single();
        if (error) throw error;
        result = data;
      }
      if (!isB2B && result) {
        result.b2b_price = null;
      }
      return result;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  useSEO(
    {
      title: (product as any)?.meta_title || product?.name || "Product",
      description: (product as any)?.meta_description || product?.description?.replace(/<[^>]+>/g, "").slice(0, 160) || "",
      canonical: product ? `/product/${(product as any)?.slug || product.id}` : undefined,
    },
    product
      ? [
          {
            id: "product",
            data: {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: (product as any)?.meta_description || product.description?.replace(/<[^>]+>/g, "").slice(0, 160),
              image: product.image_url || undefined,
              brand: product.company ? { "@type": "Brand", name: product.company } : undefined,
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "BDT",
                availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                areaServed: { "@type": "Country", name: "Bangladesh" },
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
                },
              },
            },
          },
        ]
      : undefined
  );

  const { recentProducts, addProduct: addRecentProduct } = useRecentlyViewed(product?.id);

  useEffect(() => {
    if (product) {
      trackMarketingEvent("product_view", {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        category: (product as any).categories?.name || null,
      });
      addRecentProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        image_url: product.image_url,
        slug: (product as any).slug,
      });
    }
  }, [product?.id]);

  // Toggle sticky Add-to-Cart based on inline button visibility
  useEffect(() => {
    if (!product) return;
    const el = document.querySelector("[data-inline-add-cart]");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlineCtaVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id]);

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines").select("*")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(8);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id && !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("medicine_id", product!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  const discount = (product?.original_price && product.original_price > product.price)
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSelectQty = (qty: number) => {
    if (!product) return;
    setSelectedQty(qty);
    addItem({
      id: product.id, name: product.name, name_bn: product.name_bn,
      price: Number(product.price), original_price: product.original_price ? Number(product.original_price) : null,
      image_url: product.image_url, company: product.company,
      requires_prescription: product.requires_prescription,
    }, qty);
    trackMarketingEvent("add_to_cart", {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: qty,
    });
    setShowQtyPicker(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <ProductPageHeader productName="Loading..." productId="" />
        <div className="container max-w-5xl mx-auto px-4">
          <ProductPageSkeleton />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <ProductPageHeader productName="Product Not Found" productId="" />
        <div className="text-center py-20">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">Go Back Home</Link>
        </div>
      </div>
    );
  }

  const categoryName = (product as any).categories?.name;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 overflow-x-hidden">
      <ProductPageHeader
        productName={product.name}
        productId={product.id}
        slug={(product as any).slug}
        imageUrl={product.image_url}
        price={product.price}
      />

      <div className="container max-w-7xl mx-auto px-4">
        {/* Breadcrumb — desktop */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground py-3 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          {categoryName && (
            <>
              <Link to={`/category/${(product as any).categories?.id}`} className="hover:text-primary transition-colors">{categoryName}</Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[400px]">{product.name}</span>
        </nav>

        {/* Content area — 3-col desktop */}
        <div className="md:grid md:grid-cols-[1.1fr,0.9fr,0.45fr] md:gap-6 md:py-4">
          {/* LEFT: Image */}
          <div>
            <ProductImageSection
              imageUrl={product.image_url}
              name={product.name}
              productId={product.id}
              discount={discount}
              requiresPrescription={product.requires_prescription}
              deliveryTime={product.delivery_time}
              slug={(product as any).slug}
            />
          </div>

          {/* CENTER: Info + Description */}
          <div className="md:py-4 space-y-0 md:space-y-4">
            <ProductInfoSection
              name={product.name}
              nameBn={product.name_bn}
              company={product.company}
              dosageForm={(product as any).dosage_form}
              strength={(product as any).strength}
              price={product.price}
              originalPrice={product.original_price}
              discount={discount}
              stock={product.stock}
              productId={product.id}
              avgRating={avgRating}
              reviewCount={reviews?.length || 0}
              qty={selectedQty}
              onAddToCart={() => setShowQtyPicker(true)}
              deliveryTime={product.delivery_time}
              categoryName={categoryName}
              categoryId={(product as any).categories?.id}
            />

            {/* Desktop: Description inside center column */}
            <div className="hidden md:block">
              {product.description ? (
                <ProductDescriptionCard
                  description={product.description}
                  nameBn={product.name_bn}
                  showBn={showBn}
                  onToggleBn={() => setShowBn(!showBn)}
                />
              ) : (
                <div className="py-4 border-t border-border">
                  <h3 className="text-[16px] font-bold text-foreground mb-3">Product Details</h3>
                  <div className="space-y-2 text-[13px] text-muted-foreground">
                    {product.company && <p><span className="font-medium text-foreground">Brand:</span> {product.company}</p>}
                    {(product as any).dosage_form && <p><span className="font-medium text-foreground">Type:</span> {(product as any).dosage_form}</p>}
                    {(product as any).strength && <p><span className="font-medium text-foreground">Strength:</span> {(product as any).strength}</p>}
                    {categoryName && <p><span className="font-medium text-foreground">Category:</span> {categoryName}</p>}
                    {product.requires_prescription && <p><span className="font-medium text-foreground">Prescription:</span> Required</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar — Trust + Delivery + Similar */}
          <div className="hidden md:flex flex-col gap-4 sticky top-20 self-start">
            {/* Trust Badges */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Why Shop With Us</h4>
              <div className="space-y-2.5">
                {[
                  { Icon: ShieldCheck, label: "100% Authentic", color: "text-emerald-500" },
                  { Icon: Truck, label: "Fast Home Delivery", color: "text-blue-500" },
                  { Icon: RotateCcw, label: "Easy Returns & Refunds", color: "text-orange-500" },
                  { Icon: Lock, label: "Cash on Delivery · No login needed", color: "text-violet-500" },
                  { Icon: Pill, label: "Licensed Pharmacy", color: "text-rose-500" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2.5">
                    <b.Icon size={15} className={b.color} strokeWidth={2} />
                    <span className="text-[12px] text-foreground/70">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            {product.delivery_time && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs font-semibold text-foreground mb-2">Delivery</h4>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" strokeWidth={2} />
                  <span className="text-[12px] text-foreground font-medium">{product.delivery_time}</span>
                </div>
              </div>
            )}

            {/* Similar Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs font-semibold text-foreground mb-3">Similar Products</h4>
                <div className="space-y-2.5">
                  {relatedProducts.slice(0, 5).map((rp: any) => {
                    const rpDiscount = rp.original_price && rp.original_price > rp.price
                      ? Math.round(((rp.original_price - rp.price) / rp.original_price) * 100) : 0;
                    return (
                      <Link
                        key={rp.id}
                        to={`/product/${rp.slug || rp.id}`}
                        className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-all group"
                      >
                        <img
                          src={rp.image_url || "/placeholder.svg"}
                          alt={rp.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 bg-muted border border-border"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{rp.name}</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-[11px] font-bold text-primary">৳{rp.price}</span>
                            {rpDiscount > 0 && <span className="text-[9px] text-muted-foreground line-through">৳{rp.original_price}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Call Expert CTA */}
        <div className="md:hidden px-4 mt-2">
          <a
            href="tel:+8801712345678"
            className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 active:scale-[0.99] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Phone size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground">Call Pharmacy Expert</p>
              <p className="text-[10px] text-muted-foreground">Free advice from licensed pharmacists</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
          </a>
        </div>

        {/* Description — only show if exists */}
        {product.description && (
          <ProductDescriptionCard
            description={product.description}
            nameBn={product.name_bn}
            showBn={showBn}
            onToggleBn={() => setShowBn(!showBn)}
          />
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mt-2 md:mt-3">
            <ProductReviews reviews={reviews} />
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mt-2 md:mt-3">
        </div>

        {/* Similar Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-2 md:mt-3">
            <RelatedProducts products={relatedProducts} />
          </div>
        )}

        {/* Recently Viewed */}
        <div className="mt-2 md:mt-3 mb-6">
          <RecentlyViewedProducts products={recentProducts} />
        </div>
      </div>

      {/* Footer — full width outside container */}
      <Footer />

      {/* Quantity Picker */}
      <QuantityPickerSheet
        show={showQtyPicker}
        productName={product.name}
        onSelect={handleSelectQty}
        onClose={() => setShowQtyPicker(false)}
      />

      {/* Mobile sticky Add to Cart / View Cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom">
        {totalItems > 0 ? (
          <div className="bg-primary">
            <Link
              to="/cart"
              className="flex items-center justify-between text-primary-foreground px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} />
                <div className="flex flex-col">
                  <span className="text-xs font-medium opacity-90">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
                  <span className="text-sm font-bold">৳{totalPrice}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm">
                View Cart
                <ChevronRight size={16} />
              </div>
            </Link>
          </div>
        ) : product && product.stock > 0 && !inlineCtaVisible ? (
          <div className="bg-background/95 backdrop-blur-xl border-t border-border px-4 py-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground">৳{product.price * selectedQty}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-[11px] text-muted-foreground line-through">৳{product.original_price * selectedQty}</span>
                )}
                {discount > 0 && (
                  <span className="text-[9px] font-bold text-destructive">{discount}% OFF</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowQtyPicker(true)}
              className="shrink-0 bg-primary text-primary-foreground font-semibold py-2.5 px-8 rounded-xl text-[13px] active:scale-[0.97] transition-all"
            >
              Add To Cart
            </button>
          </div>
        ) : null}
      </div>

      <FloatingCart />
      <FloatingWhatsApp productName={product.name} />
    </div>
  );
};

export default ProductPage;
