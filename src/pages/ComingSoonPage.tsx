import { useLocation, Link } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/wishlists": "Wishlists",
  "/notified-products": "Notified Products",
  "/suggest-products": "Suggest Products",
  "/refer-earn": "Refer & Earn",
  "/rate-us": "Rate Us",
};

const ComingSoonPage = () => {
  const { pathname } = useLocation();
  const title = titles[pathname] || "Feature";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title={title} />
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Construction size={48} className="mx-auto text-primary/40" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">This feature is coming soon! We are working on it.</p>
        <Link to="/account">
          <Button variant="outline" className="gap-2 rounded-xl mt-4">
            <ArrowLeft size={16} /> Back to Account
          </Button>
        </Link>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default ComingSoonPage;
