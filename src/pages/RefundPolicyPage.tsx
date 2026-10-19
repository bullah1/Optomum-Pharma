import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";

const ELIGIBLE = [
  "Damaged or broken products on arrival",
  "Expired medicines received",
  "Wrong product delivered",
  "Missing items from the order",
  "Defective or sealed-broken items",
];

const NOT_ELIGIBLE = [
  "Opened or used medicines",
  "Personal hygiene & care items (opened)",
  "Syringes, needles, and surgical items",
  "Products damaged by customer misuse",
  "Items returned after 7 days",
];

const STEPS = [
  { step: "1", title: "Contact Support", desc: "Reach out via call, WhatsApp, or email within 7 days of delivery with your order number." },
  { step: "2", title: "Verification", desc: "Our team will verify the issue and may request photos of the product." },
  { step: "3", title: "Pickup Arranged", desc: "We'll arrange a free pickup from your address for eligible returns." },
  { step: "4", title: "Refund Processed", desc: "Refund is processed within 5-7 business days after receiving the returned item." },
];

const RefundPolicyPage = () => {
  useSEO({
    title: "Refund & Return Policy | Optimum Pharmaceuticals HLB",
    description: "Learn about Optimum Pharmaceuticals HLB's refund, return, and exchange policies. We ensure hassle-free returns for eligible products.",
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Refund & Return Policy" />

      <main className="container py-5 space-y-5 max-w-3xl">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto">
            <RotateCcw size={22} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Refund & Return Policy</h1>
          <p className="text-[11px] text-muted-foreground">Hassle-free returns within 7 days</p>
        </div>

        {/* Overview */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-xs font-bold text-foreground">Overview</h2>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            At Optimum Pharmaceuticals HLB, customer satisfaction is our priority. If you receive a damaged, expired, or incorrect product, 
            we offer a full refund or replacement. Returns must be initiated within 7 days of delivery.
          </p>
        </section>

        {/* Eligible / Not Eligible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-primary" /> Eligible for Return
            </h2>
            <ul className="space-y-1.5">
              {ELIGIBLE.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 size={10} className="text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <XCircle size={13} className="text-destructive" /> Not Eligible
            </h2>
            <ul className="space-y-1.5">
              {NOT_ELIGIBLE.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <XCircle size={10} className="text-destructive/60 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* How it works */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-foreground px-1">How Returns Work</h2>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                  {s.step}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-[11px] font-bold text-foreground">{s.title}</h3>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Methods */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-primary" /> Refund Timeline
          </h2>
          <div className="space-y-1.5">
            {[
              { method: "bKash / Nagad / Rocket", time: "3-5 business days" },
              { method: "Credit / Debit Card", time: "5-7 business days" },
              { method: "Cash on Delivery orders", time: "Refunded via bKash/Nagad within 3-5 days" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[10px] font-medium text-foreground">{r.method}</span>
                <span className="text-[9px] text-muted-foreground">{r.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Note */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-foreground">Important Note</h3>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Refunds are only processed after the returned product has been received and inspected by our team. 
              Please ensure the product is in its original packaging. For any disputes, contact us at support@optimumpharmahlb.com.
            </p>
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default RefundPolicyPage;
