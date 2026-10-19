import { ShoppingCart, User, Package, Heart, MapPin, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuantityPicker } from "@/contexts/QuantityPickerContext";
import { lazy, Suspense } from "react";
import ThemeToggle from "@/components/header/ThemeToggle";
import DeliverySelector from "@/components/header/DeliverySelector";
import SearchBar from "@/components/header/SearchBar";
import BrandLogo from "@/components/BrandLogo";

const NotificationBell = lazy(() => import("@/components/NotificationBell"));

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { openPicker } = useQuantityPicker();
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const siteName = siteSettings?.site_name || "Optimum Pharmaceuticals HLB";
  const siteLogo = siteSettings?.site_logo;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0];

  return (
    <>
      <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border pt-safe transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}>
        {/* ===== DESKTOP HEADER ===== */}
        <div className="hidden md:block">
          <div className="container flex items-center gap-6 py-2.5">
            <BrandLogo size="md" />

            <DeliverySelector variant="desktop" />
            <SearchBar variant="desktop" onAddItem={(item) => openPicker({ id: item.id, name: item.name, price: Number(item.price), original_price: item.original_price ? Number(item.original_price) : null, image_url: item.image_url, company: item.company })} />

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label="Account menu" className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-secondary/60 transition-colors outline-none">
                      <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User size={15} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground leading-tight">Hello,</p>
                        <p className="text-[11px] font-semibold text-foreground leading-tight">{userName}</p>
                      </div>
                      <ChevronDown size={12} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                        <User size={14} /> My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2 cursor-pointer">
                        <Package size={14} /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlists" className="flex items-center gap-2 cursor-pointer">
                        <Heart size={14} /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/manage-address" className="flex items-center gap-2 cursor-pointer">
                        <MapPin size={14} /> Addresses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-secondary/60 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User size={15} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground leading-tight">Hello, Sign in</p>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">Account</p>
                  </div>
                </Link>
              )}

              <ThemeToggle size="desktop" />
              <Suspense fallback={<div className="p-2 w-[37px]" />}>
                <NotificationBell size={21} />
              </Suspense>

              <Link to="/cart" className="relative p-2 rounded-xl hover:bg-secondary/60 transition-colors" aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}>
                <ShoppingCart size={21} className="text-foreground" aria-hidden="true" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center" aria-hidden="true">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ===== MOBILE HEADER — Clean & Minimal ===== */}
        <div className="md:hidden">
          <div className={`flex items-center justify-between px-4 transition-all duration-200 ${scrolled ? "py-1" : "py-1.5"}`}>
            {/* Logo */}
            <BrandLogo size={scrolled ? "sm" : "md"} />

            {/* Right actions — only essential */}
            <div className="flex items-center gap-0.5">
              <Suspense fallback={<div className="p-2 w-[34px]" />}>
                <NotificationBell size={18} />
              </Suspense>
              <Link to="/cart" className="relative p-2 rounded-xl active:bg-secondary/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}>
                <ShoppingCart size={19} className="text-foreground" aria-hidden="true" />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-accent-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-50" aria-hidden="true">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <SearchBar variant="mobile" scrolled={scrolled} onAddItem={(item) => openPicker({ id: item.id, name: item.name, price: Number(item.price), original_price: item.original_price ? Number(item.original_price) : null, image_url: item.image_url, company: item.company })} />
        </div>
      </header>
    </>
  );
};

export default Header;
