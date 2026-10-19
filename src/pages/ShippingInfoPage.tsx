import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { Truck, MapPin, Clock, Package, AlertTriangle, CheckCircle2 } from "lucide-react";

const ZONES = [
  { area: "Inside Dhaka", charge: "৳70", time: "2-4 hours (Express) / 24 hours (Standard)", free: "Free above ৳500" },
  { area: "Dhaka Suburbs", charge: "৳100", time: "24-48 hours", free: "Free above ৳1,000" },
  { area: "Outside Dhaka (Divisions)", charge: "৳130", time: "2-3 business days", free: "Free above ৳2,000" },
  { area: "Remote Areas", charge: "৳150-200", time: "3-5 business days", free: "—" },
];

const ShippingInfoPage = () => {
  useSEO({
    title: "Shipping & Delivery | Optimum Pharmaceuticals HLB",
    description: "Learn about Optimum Pharmaceuticals HLB's shipping charges, delivery times, and coverage areas across Bangladesh.",
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Shipping & Delivery" />

      <main className="container py-5 space-y-5 max-w-3xl">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto">
            <Truck size={22} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Shipping & Delivery</h1>
          <p className="text-[11px] text-muted-foreground">Fast, reliable delivery across all of Bangladesh</p>
        </div>

        {/* Coverage */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <MapPin size={13} className="text-primary" /> Delivery Coverage
          </h2>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            We deliver to all 64 districts of Bangladesh. Inside Dhaka, we offer express delivery within 2-4 hours. 
            Outside Dhaka, orders are shipped via trusted courier partners.
          </p>
        </section>

        {/* Charges Table */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-foreground px-1">Delivery Charges & Timeline</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {ZONES.map((zone, i) => (
              <div key={i} className="p-3.5 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-[11px] font-bold text-foreground">{zone.area}</h3>
                  <span className="text-[11px] font-bold text-primary">{zone.charge}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Clock size={9} /> {zone.time}
                  </span>
                  {zone.free !== "—" && (
                    <span className="text-[8px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">{zone.free}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Process */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-foreground px-1">How Delivery Works</h2>
          <div className="space-y-2">
            {[
              { step: "1", title: "Order Confirmed", desc: "Your order is verified and sent to our pharmacy team" },
              { step: "2", title: "Packaging", desc: "Products are carefully packed with temperature-controlled packaging for medicines" },
              { step: "3", title: "Dispatched", desc: "Order is picked up by our delivery partner or in-house rider" },
              { step: "4", title: "Delivered", desc: "You receive your order at your doorstep with invoice" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                  {s.step}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-bold text-foreground">{s.title}</h3>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Points */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Package size={13} className="text-primary" /> Good to Know
          </h2>
          <ul className="space-y-2">
            {[
              "Cash on Delivery (COD) is available for all areas",
              "You can track your order in real-time from your account",
              "Delivery attempts are made up to 2 times before returning",
              "Medicines are packed in temperature-safe packaging",
              "You'll receive SMS/notification updates at every step",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <CheckCircle2 size={10} className="text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Note */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-foreground">Please Note</h3>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Delivery times may vary during holidays, natural disasters, or high-demand periods. 
              For urgent orders, please contact our support team for express delivery options.
            </p>
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default ShippingInfoPage;
