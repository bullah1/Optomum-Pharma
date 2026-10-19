import { lazy } from "react";
import { Route } from "react-router-dom";

const RiderAuthPage = lazy(() => import("@/pages/RiderAuthPage"));
const RiderLayout = lazy(() => import("@/components/RiderLayout"));
const RiderDashboard = lazy(() => import("@/pages/rider/RiderDashboard"));
const RiderDeliveries = lazy(() => import("@/pages/rider/RiderDeliveries"));
const RiderWallet = lazy(() => import("@/pages/rider/RiderWallet"));
const RiderDeposits = lazy(() => import("@/pages/rider/RiderDeposits"));

export const riderRoutes = (
  <>
    <Route path="/rider/login" element={<RiderAuthPage />} />
    <Route path="/rider" element={<RiderLayout />}>
      <Route index element={<RiderDashboard />} />
      <Route path="deliveries" element={<RiderDeliveries />} />
      <Route path="wallet" element={<RiderWallet />} />
      <Route path="deposits" element={<RiderDeposits />} />
    </Route>
  </>
);
