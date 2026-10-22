import { memo } from "react";
import { Phone, Upload } from "lucide-react";
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
            <span className="block text-[12.5px] font-bold leading-tight">Call to order</span>
            <span className="block text-[10px] text-white/85 mt-0.5 leading-tight">01306383938</span>
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
            <span className="block text-[12.5px] font-bold leading-tight">Prescription</span>
            <span className="block text-[10px] text-white/85 mt-0.5 leading-tight">Upload & order</span>
          </div>
        </Link>
      </div>

    </div>
  );
});

QuickActions.displayName = "QuickActions";
export default QuickActions;
