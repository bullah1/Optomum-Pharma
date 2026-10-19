import DesktopProductGrid from "./DesktopProductGrid";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  company?: string | null;
  slug?: string | null;
  delivery_time?: string | null;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  if (!products.length) return null;
  return <DesktopProductGrid products={products} title="Similar Products" />;
};

export default RelatedProducts;
