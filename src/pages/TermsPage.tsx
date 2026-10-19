import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { FileText, ShoppingCart, Truck, CreditCard, RotateCcw, AlertTriangle, Scale, Mail } from "lucide-react";

const SECTIONS = [
  {
    icon: <ShoppingCart size={18} />,
    title: "Ordering & Prescriptions",
    content: `By placing an order on Optimum Pharmaceuticals HLB, you confirm that all information provided is accurate. Prescription medicines require a valid prescription uploaded before or during checkout. We reserve the right to cancel orders if prescriptions are invalid or not provided.`,
  },
  {
    icon: <CreditCard size={18} />,
    title: "Pricing & Payments",
    content: `All prices are listed in Bangladeshi Taka (BDT) and include applicable taxes unless stated otherwise. We accept Cash on Delivery (COD) and online payments. Prices may change without prior notice, but confirmed orders will be honored at the listed price.`,
  },
  {
    icon: <Truck size={18} />,
    title: "Delivery Policy",
    content: `We aim to deliver within 12–24 hours inside Dhaka and 2–5 business days outside Dhaka. Delivery charges vary by location and are displayed at checkout. We are not responsible for delays caused by circumstances beyond our control.`,
  },
  {
    icon: <RotateCcw size={18} />,
    title: "Returns & Refunds",
    content: `Due to the nature of pharmaceutical products, returns are accepted only for damaged, defective, or incorrect items reported within 24 hours of delivery. Refunds will be processed within 7–10 business days after verification. Non-returnable items include opened medicines and health supplements.`,
  },
  {
    icon: <AlertTriangle size={18} />,
    title: "Limitation of Liability",
    content: `Optimum Pharmaceuticals HLB provides medicines and healthcare products from licensed sources. We are not liable for any adverse reactions, misuse, or self-medication. Always consult a healthcare professional before using any medicine. Our platform is not a substitute for professional medical advice.`,
  },
  {
    icon: <Scale size={18} />,
    title: "Account & Usage",
    content: `You are responsible for maintaining the confidentiality of your account credentials. Optimum Pharmaceuticals HLB reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform. All content on our platform is protected by copyright.`,
  },
];

const TermsPage = () => {
  useSEO({
    title: "Terms of Service | Optimum Pharmaceuticals HLB",
    description: "Read the terms and conditions for using Optimum Pharmaceuticals HLB's online pharmacy and healthcare services.",
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Terms of Service" />

      <main className="container py-5 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileText size={24} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Effective: April 2026</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            By using Optimum Pharmaceuticals HLB, you agree to the following terms and conditions. Please read them carefully before placing any orders.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-[42px]">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center space-y-2">
          <Mail size={18} className="mx-auto text-primary" />
          <p className="text-xs text-muted-foreground">
            Have questions? Reach out at{" "}
            <a href="mailto:support@optimumpharmahlb.com" className="text-primary font-medium hover:underline">
              support@optimumpharmahlb.com
            </a>
          </p>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default TermsPage;
