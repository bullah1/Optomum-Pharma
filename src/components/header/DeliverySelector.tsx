import { MapPin, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DeliverySelector = ({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) => {
  const [selectedZone, setSelectedZone] = useState("Bangladesh");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: zones } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, area, charge, estimated_time")
        .eq("active", true)
        .order("area");
      if (error) throw error;
      return data;
    },
    enabled: open, // Only fetch when dropdown is opened
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (variant === "mobile") {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors"
        >
          <MapPin size={12} className="text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-foreground max-w-[60px] truncate">{selectedZone}</span>
          <ChevronDown size={9} className="text-muted-foreground shrink-0" />
        </button>
        {open && zones && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-card rounded-2xl shadow-ios-lg z-[60] overflow-hidden border border-border">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Area</p>
            </div>
            <ul className="py-1 max-h-64 overflow-y-auto">
              {zones.map((zone) => (
                <li key={zone.id}>
                  <button
                    onClick={() => { setSelectedZone(zone.area); localStorage.setItem("visitor_area", zone.area); setOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${selectedZone === zone.area ? "text-primary bg-primary/5 font-medium" : "text-foreground hover:bg-muted/50"}`}
                  >
                    <span>{zone.area}</span>
                    <span className="text-[10px] text-muted-foreground">৳{zone.charge}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
      >
        <MapPin size={15} className="text-primary/70" />
        <div className="text-left">
          <span className="text-[10px] text-muted-foreground/70 block leading-none">Deliver to</span>
          <span className="font-semibold text-foreground text-xs flex items-center gap-0.5">
            {selectedZone} <ChevronDown size={11} className="text-muted-foreground" />
          </span>
        </div>
      </button>
      {open && zones && (
        <div className="absolute top-full left-0 mt-2 w-60 bg-card rounded-2xl shadow-ios-lg z-[60] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Area</p>
          </div>
          <ul className="py-1 max-h-72 overflow-y-auto">
            {zones.map((zone) => (
              <li key={zone.id}>
                <button
                  onClick={() => { setSelectedZone(zone.area); localStorage.setItem("visitor_area", zone.area); setOpen(false); }}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedZone === zone.area ? "text-primary bg-primary/5 font-medium" : "text-foreground hover:bg-muted/50"}`}
                >
                  <span>{zone.area}</span>
                  <span className="text-[10px] text-muted-foreground">৳{zone.charge} • {zone.estimated_time}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DeliverySelector;
