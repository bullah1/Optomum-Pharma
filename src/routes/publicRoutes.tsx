import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

// Only eagerly load the homepage — everything else is lazy
import Index from "@/pages/Index";

// Lazy load ALL other pages
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const CompaniesPage = lazy(() => import("@/pages/CompaniesPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const B2BAuthPage = lazy(() => import("@/pages/B2BAuthPage"));
const PrescriptionUploadPage = lazy(() => import("@/pages/PrescriptionUploadPage"));
const ProfileEditPage = lazy(() => import("@/pages/ProfileEditPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/OrderDetailPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ManageAddressPage = lazy(() => import("@/pages/ManageAddressPage"));
const HealthTipsPage = lazy(() => import("@/pages/HealthTipsPage"));
const BlogListPage = lazy(() => import("@/pages/BlogListPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const OffersPage = lazy(() => import("@/pages/OffersPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));
const AllCategoriesPage = lazy(() => import("@/pages/AllCategoriesPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Companies
const CompanyPage = lazy(() => import("@/pages/CompanyPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const RefundPolicyPage = lazy(() => import("@/pages/RefundPolicyPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ShippingInfoPage = lazy(() => import("@/pages/ShippingInfoPage"));

// Prefetch high-priority routes after initial paint — use requestIdleCallback
if (typeof window !== "undefined") {
  const prefetch = (cb: () => void) => {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(cb, { timeout: 3000 });
    } else {
      setTimeout(cb, 2000);
    }
  };
  window.addEventListener("load", () => {
    prefetch(() => {
      import("@/pages/ProductPage");
      import("@/pages/CategoryPage");
    });
    setTimeout(() => {
      import("@/pages/CartPage");
      import("@/pages/AuthPage");
      import("@/pages/AccountPage");
    }, 4000);
  });
}

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/b2b" element={<B2BAuthPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/categories" element={<AllCategoriesPage />} />
    <Route path="/category/:id" element={<CategoryPage />} />
    <Route path="/product/:id" element={<ProductPage />} />
    <Route path="/prescription-upload" element={<PrescriptionUploadPage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/profile/edit" element={<ProfileEditPage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/orders/:id" element={<OrderDetailPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/manage-address" element={<ManageAddressPage />} />
    <Route path="/health-tips" element={<HealthTipsPage />} />
    <Route path="/blog" element={<BlogListPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />
    <Route path="/offers" element={<OffersPage />} />
    <Route path="/wishlists" element={<WishlistPage />} />
    <Route path="/notified-products" element={<ComingSoonPage />} />
    <Route path="/suggest-products" element={<ComingSoonPage />} />
    <Route path="/refer-earn" element={<ComingSoonPage />} />
    <Route path="/rate-us" element={<ComingSoonPage />} />
    <Route path="/install" element={<InstallPage />} />

    {/* Doctor, Lab & Beauty — temporarily disabled (pharma-only) */}
    {["/lab-test/*", "/my-lab-tests", "/lab-booking/*", "/my-appointments", "/appointment/*", "/healthcare/*", "/doctors-bangladesh", "/doctor/*", "/beauty/*"].map((p) => (
      <Route key={p} path={p} element={<Navigate to="/" replace />} />
    ))}

    {/* Companies */}
    <Route path="/companies" element={<CompaniesPage />} />
    <Route path="/company/:slug" element={<CompanyPage />} />

    {/* About */}
    <Route path="/about" element={<AboutPage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/refund-policy" element={<RefundPolicyPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/shipping" element={<ShippingInfoPage />} />

    {/* Fallback */}
    <Route path="*" element={<NotFound />} />
  </>
);
