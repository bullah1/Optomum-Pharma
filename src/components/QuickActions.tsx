import { memo } from "react";
import { Phone, Upload, Tag, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";


/* Shared card design tokens — keep all cards visually consistent */
const CARD_BASE = "rounded-xl border shadow-sm active:scale-[0.97] transition-all";

const QuickActions = memo(() => {
  const queryClient = useQueryClient();
  const s = queryClient.getQueryData<Record<string, string>>(["site-settings"]);
  const contactPhone = s?.contact_phone || "+8801306383938";

  return (
    <div className="space-y-2.5">
      {/* Primary CTAs — stronger visual weight (solid colored bg, white text) */}
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`tel:${contactPhone}`}
          className={`${CARD_BASE} h-[64px] flex items-center gap-2.5 px-3 bg-[#01AEF2] border-[#0098D4] text-white`}
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Phone size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="block text-[12.5px] font-bold leading-tight">Call to Order</span>
            <span className="block text-[10px] text-white/85 mt-0.5 leading-tight">24/7 Hotline</span>
          </div>
        </a>
        <Link
          to="/prescription-upload"
          className={`${CARD_BASE} h-[64px] flex items-center gap-2.5 px-3 bg-[#F8931D] border-[#E07B0A] text-white`}
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Upload size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="block text-[12.5px] font-bold leading-tight">Upload Rx</span>
            <span className="block text-[10px] text-white/85 mt-0.5 leading-tight">Get Medicine</span>
          </div>
        </Link>
      </div>

      {/* Discount banner — same card system */}
      <Link
        to="/categories"
        className={`${CARD_BASE} flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50/70 border-emerald-100 group`}
      >
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
          <Tag size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-tight">সব প্রোডাক্টে MRP থেকে ১০% ছাড়</p>
          <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-tight">লগইন ছাড়াই অর্ডার · ক্যাশ অন ডেলিভারি</p>
        </div>
        <ChevronRight size={15} className="text-muted-foreground/50 group-active:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
});

QuickActions.displayName = "QuickActions";
export default QuickActions;
