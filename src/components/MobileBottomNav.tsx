import { memo } from "react";
import { Home, LayoutGrid, Upload, Tag, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Categories", icon: LayoutGrid, path: "/categories" },
  { label: "Upload Rx", icon: Upload, path: "/prescription-upload" },
  { label: "Offers", icon: Tag, path: "/offers" },
  { label: "Account", icon: User, path: "/account" },
];

const MobileBottomNav = memo(() => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border md:hidden safe-area-bottom bg-card/95 backdrop-blur-sm" aria-label="Main navigation">
      <div className="flex items-center justify-around py-1 px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.label}
              to={tab.path}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] min-h-[48px] justify-center px-2 py-1 rounded-2xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:opacity-70"
              }`}
            >
              <div className="relative">
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.3 : 1.7}
                  aria-hidden="true"
                />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[10px] ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";
export default MobileBottomNav;
