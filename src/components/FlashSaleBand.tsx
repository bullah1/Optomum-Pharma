import { ChevronRight, Zap, Timer, Rocket } from "lucide-react";
import { trackMarketingEvent } from "@/hooks/useMarketingTracker";
import OptimizedImage from "@/components/OptimizedImage";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const useCountdown = (targetDate: string | null) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - now;
  if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, expired: false };
};

const FlashSaleBand = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const [pickerItem, setPickerItem] = useState<any>(null);

  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: items = [] } = useQuery<any[]>({
    queryKey: ["homepage-flash-sale"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  const soonestEnd = useMemo(() => {
    const now = new Date().toISOString();
    const dates = items.filter((i: any) => i.ends_at && i.ends_at > now).map((i: any) => i.ends_at);
    if (dates.length === 0) return null;
    return dates.sort()[0];
  }, [items]);

  const countdown = useCountdown(soonestEnd);

  const activeItems = useMemo(() => {
    const now = new Date().toISOString();
    return items.filter((i: any) => !i.ends_at || i.ends_at > now);
  }, [items, countdown]);

  if (activeItems.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-spot-flash fill-spot-flash" />
          <h2 className="text-sm font-bold text-foreground">Flash Sale</h2>
          {countdown && !countdown.expired && (
            <div className="flex items-center gap-1 text-[10px] font-bold ml-1">
              <Timer size={10} className="text-destructive" />
              <span className="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded tabular-nums">{pad(countdown.h)}</span>
              <span className="text-destructive">:</span>
              <span className="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded tabular-nums">{pad(countdown.m)}</span>
              <span className="text-destructive">:</span>
              <span className="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded tabular-nums">{pad(countdown.s)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative group/band">
        <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory">
          {activeItems.map((item: any) => {
            const product = item.medicines;
            if (!product) return null;
            const discount = item.discount_percent || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0);
            const salePrice = item.sale_price || product.price;

            return (
              <Link
                key={item.id}
                to={`/product/${product.id}`}
                className="bg-card rounded-xl border border-border hover:border-primary/30 transition-colors overflow-hidden flex flex-col w-[152px] min-w-[152px] sm:w-[175px] sm:min-w-[175px] md:w-[210px] md:min-w-[210px] shrink-0 snap-start"
              >
                <div className="relative overflow-hidden">
                  <OptimizedImage src={product.image_url} alt={product.name} width={210} height={158} objectFit="contain" aspectClass="aspect-square" className="p-3" />
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded">{discount}% OFF</span>
                  )}
                  <span className="absolute top-2 right-2 bg-accent/15 text-accent text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Zap size={8} /> FLASH
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1 border-t border-border">
                  {product.company && <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{product.company}</p>}
                  <h4 className="text-[12px] font-medium text-foreground leading-snug line-clamp-2 mb-2">{product.name}</h4>
                  <div className="flex-1" />
                  <div className="flex items-end justify-between pt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground line-through">৳{product.original_price || product.price}</span>
                      <span className="text-[14px] font-bold text-accent leading-none">৳{salePrice}</span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerItem({ ...product, salePrice: Number(salePrice) }); }}
                      aria-label={`Add ${product.name} to cart`}
                      className="bg-primary text-primary-foreground text-[11px] font-semibold min-w-[44px] min-h-[44px] flex items-center justify-center px-3.5 py-1.5 rounded-lg active:scale-90 transition-transform"
                    >ADD</button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })} aria-label="Scroll flash sale products"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border items-center justify-center text-foreground opacity-0 group-hover/band:opacity-100 transition-opacity">
          <ChevronRight size={14} />
        </button>
      </div>
    </section>

    {pickerItem && createPortal(
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={() => setPickerItem(null)}>
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm sm:mx-auto shadow-xl" style={{ animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)" }} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-muted-foreground/20" /></div>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0">
              {pickerItem.image_url ? <img src={pickerItem.image_url} alt="" className="w-full h-full object-contain p-1" /> : <Rocket size={18} className="text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{pickerItem.name}</h3>
              {pickerItem.company && <p className="text-xs text-muted-foreground">{pickerItem.company}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-accent">৳{pickerItem.salePrice}</p>
              {pickerItem.original_price && <p className="text-[10px] text-muted-foreground line-through">৳{pickerItem.original_price}</p>}
            </div>
          </div>
          <div className="py-2 pb-safe max-h-[50vh] overflow-y-auto">
            <p className="px-5 py-2 text-xs font-medium text-muted-foreground">Select Quantity</p>
            {[1, 2, 3, 4].map((qty) => (
              <button key={qty} onClick={() => {
                addItem({ id: pickerItem.id, name: pickerItem.name, price: pickerItem.salePrice, original_price: pickerItem.original_price ? Number(pickerItem.original_price) : null, image_url: pickerItem.image_url, company: pickerItem.company, requires_prescription: pickerItem.requires_prescription }, qty);
                trackMarketingEvent("add_to_cart", { product_id: pickerItem.id, product_name: pickerItem.name, price: pickerItem.salePrice, quantity: qty });
                setPickerItem(null);
              }} className="w-full flex items-center justify-between px-5 py-3 text-sm text-foreground hover:bg-primary/5 transition-colors">
                <span className="font-medium">{qty} × {pickerItem.name}</span>
                <span className="text-xs font-bold text-primary">৳{qty * pickerItem.salePrice}</span>
              </button>
            ))}
          </div>
          <div className="px-5 pb-5 pt-1">
            <button onClick={() => setPickerItem(null)} className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98] transition-transform">Cancel</button>
          </div>
        </div>
      </div>, document.body
    )}
    </>
  );
};

export default FlashSaleBand;
