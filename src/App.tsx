import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { QuantityPickerProvider } from "@/contexts/QuantityPickerContext";
import { Suspense, lazy, useRef, useLayoutEffect } from "react";

import ScrollToTop from "@/components/ScrollToTop";
import MobileBottomNav from "@/components/MobileBottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { useMarketingTracker } from "@/hooks/useMarketingTracker";

// Lazy load non-critical global components
const PWAUpdatePrompt = lazy(() => import("@/components/PWAUpdatePrompt"));
const NotificationPermissionManager = lazy(() => import("@/components/NotificationPermissionManager"));
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

// Route configs
import { publicRoutes } from "@/routes/publicRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { riderRoutes } from "@/routes/riderRoutes";

const ConditionalMobileBottomNav = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/product/")) return null;
  if (location.pathname.startsWith("/admin")) return null;
  if (location.pathname.startsWith("/rider")) return null;
  return <MobileBottomNav />;
};

const PageLoader = () => null;

// Lightweight page transition wrapper — CSS animation class, no forced reflow
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const prevPath = useRef(location.pathname);

  useLayoutEffect(() => {
    if (prevPath.current !== location.pathname && ref.current) {
      prevPath.current = location.pathname;
      const el = ref.current;
      el.classList.remove("page-enter");
      // Use rAF to re-add class — triggers CSS animation without forced reflow
      requestAnimationFrame(() => {
        el.classList.add("page-enter");
      });
    }
  }, [location.pathname]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  useMarketingTracker();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
            <QuantityPickerProvider>
              <WishlistProvider>
                <TooltipProvider>
                  <OfflineBanner />
                  <Suspense fallback={null}>
                    <NotificationPermissionManager />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Toaster />
                    <Sonner />
                  </Suspense>
                  <BrowserRouter>
                    <ScrollToTop />
                    <PageTransition>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          {publicRoutes}
                          {adminRoutes}
                          {riderRoutes}
                        </Routes>
                      </Suspense>
                    </PageTransition>
                    <ConditionalMobileBottomNav />
                  </BrowserRouter>
                </TooltipProvider>
              </WishlistProvider>
            </QuantityPickerProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
