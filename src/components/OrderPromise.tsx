import { memo } from "react";
import { Banknote, Truck, BadgeCheck, Zap } from "lucide-react";

/** Service commitments shown on the homepage. */
const ITEMS = [
  { icon: BadgeCheck, title: "Authentic products", sub: "Supplied by the manufacturer" },
  { icon: Banknote, title: "Cash on delivery", sub: "Pay when you receive" },
  { icon: Truck, title: "Nationwide delivery", sub: "Dhaka ৳70 · Outside ৳130" },
  { icon: Zap, title: "Quick checkout", sub: "No account required" },
];

const OrderPromise = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
    {ITEMS.map(({ icon: Icon, title, sub }) => (
      <div key={title} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="w-9 h-9 rounded-lg bg-[#0B2540]/5 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-[#0B2540]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-tight">{title}</p>
          <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
        </div>
      </div>
    ))}
  </div>
));

OrderPromise.displayName = "OrderPromise";
export default OrderPromise;
