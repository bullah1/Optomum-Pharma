import { memo } from "react";
import { Banknote, Truck, BadgeCheck, UserX } from "lucide-react";

/** Short trust strip that answers the questions buyers have before ordering. */
const ITEMS = [
  { icon: BadgeCheck, title: "১০০% অরিজিনাল", sub: "সরাসরি কোম্পানি থেকে" },
  { icon: Banknote, title: "ক্যাশ অন ডেলিভারি", sub: "পণ্য হাতে পেয়ে টাকা" },
  { icon: Truck, title: "ঢাকা ৳৭০ · বাইরে ৳১৩০", sub: "সারা বাংলাদেশে ডেলিভারি" },
  { icon: UserX, title: "লগইন লাগবে না", sub: "নাম-ফোন-ঠিকানা দিলেই হবে" },
];

const OrderPromise = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
    {ITEMS.map(({ icon: Icon, title, sub }) => (
      <div key={title} className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-foreground leading-tight">{title}</p>
          <p className="text-[9.5px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
        </div>
      </div>
    ))}
  </div>
));

OrderPromise.displayName = "OrderPromise";
export default OrderPromise;
