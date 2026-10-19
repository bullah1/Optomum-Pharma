import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"));
const AdminLayout = lazy(() => import("@/components/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));

const AdminPrescriptions = lazy(() => import("@/pages/admin/AdminPrescriptions"));
const AdminCoupons = lazy(() => import("@/pages/admin/AdminCoupons"));
const AdminInventory = lazy(() => import("@/pages/admin/AdminInventory"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminHomepage = lazy(() => import("@/pages/admin/AdminHomepage"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminHealthTips = lazy(() => import("@/pages/admin/AdminHealthTips"));
const AdminBlogPosts = lazy(() => import("@/pages/admin/AdminBlogPosts"));
const AdminCategoryLayouts = lazy(() => import("@/pages/admin/AdminCategoryLayouts"));

const AdminMarketing = lazy(() => import("@/pages/admin/AdminMarketing"));
const AdminBanners = lazy(() => import("@/pages/admin/AdminBanners"));
const AdminFlashSale = lazy(() => import("@/pages/admin/AdminFlashSale"));
const AdminPromoCards = lazy(() => import("@/pages/admin/AdminPromoCards"));
const AdminCompanies = lazy(() => import("@/pages/admin/AdminCompanies"));
const AdminDeliveryZones = lazy(() => import("@/pages/admin/AdminDeliveryZones"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminCourier = lazy(() => import("@/pages/admin/AdminCourier"));
const AdminTeam = lazy(() => import("@/pages/admin/AdminTeam"));
const AdminSexualWellnessImages = lazy(() => import("@/pages/admin/AdminSexualWellnessImages"));

export const adminRoutes = (
  <>
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="categories" element={<AdminCategories />} />
      
      <Route path="prescriptions" element={<AdminPrescriptions />} />
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="inventory" element={<AdminInventory />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="homepage" element={<AdminHomepage />} />
      <Route path="health-tips" element={<AdminHealthTips />} />
      <Route path="blog" element={<AdminBlogPosts />} />
      <Route path="category-layouts" element={<AdminCategoryLayouts />} />
      
      <Route path="marketing" element={<AdminMarketing />} />
      <Route path="banners" element={<AdminBanners />} />
      <Route path="flash-sale" element={<AdminFlashSale />} />
      <Route path="promo-cards" element={<AdminPromoCards />} />
      <Route path="companies" element={<AdminCompanies />} />
      <Route path="delivery-zones" element={<AdminDeliveryZones />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="courier" element={<AdminCourier />} />
      <Route path="team" element={<AdminTeam />} />
      <Route path="sexual-wellness-images" element={<AdminSexualWellnessImages />} />
    </Route>
  </>
);
