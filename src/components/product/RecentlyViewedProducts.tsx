import type { RecentProduct } from "@/hooks/useRecentlyViewed";
import DesktopProductGrid from "./DesktopProductGrid";

const RecentlyViewedProducts = ({ products }: { products: RecentProduct[] }) => {
  if (!products.length) return null;
  return <DesktopProductGrid products={products} title="Recently Viewed" />;
};

export default RecentlyViewedProducts;
