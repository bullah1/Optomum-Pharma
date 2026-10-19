import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { ChevronDown, ShoppingCart, Truck, RotateCcw, CreditCard, Pill, Shield, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_SECTIONS = [
  {
    title: "Orders & Shopping",
    icon: <ShoppingCart size={15} />,
    items: [
      { q: "How do I place an order?", a: "Simply browse our products, add items to your cart, and proceed to checkout. You can pay via Cash on Delivery, bKash, Nagad, or card payment." },
      { q: "Can I order without creating an account?", a: "No, you need to create an account to place orders. This helps us track your orders and provide better service." },
      { q: "Is there a minimum order amount?", a: "There is no minimum order amount. However, orders above ৳500 qualify for free delivery within Dhaka." },
      { q: "Can I modify or cancel my order?", a: "You can cancel your order before it's been processed. Once it's shipped, cancellation is not possible. Contact our support team for assistance." },
    ],
  },
  {
    title: "Delivery",
    icon: <Truck size={15} />,
    items: [
      { q: "What are the delivery charges?", a: "Delivery charges vary by location. Inside Dhaka it's ৳70, and outside Dhaka it starts from ৳130. Orders above ৳500 within Dhaka get free delivery." },
      { q: "How long does delivery take?", a: "Inside Dhaka: 2-4 hours for express delivery, 24 hours for standard. Outside Dhaka: 2-3 business days via courier." },
      { q: "Do you deliver nationwide?", a: "Yes, we deliver to all 64 districts across Bangladesh through our courier partners." },
      { q: "Can I track my order?", a: "Yes, you can track your order status in real-time from the 'My Orders' section of your account." },
    ],
  },
  {
    title: "Medicines & Prescriptions",
    icon: <Pill size={15} />,
    items: [
      { q: "Are all medicines genuine?", a: "Absolutely. We source all medicines directly from authorized distributors and manufacturers. Every product is verified by our licensed pharmacists." },
      { q: "Do I need a prescription?", a: "Prescription medicines require a valid prescription. You can upload your prescription during checkout or via the Prescription Upload page." },
      { q: "What if my medicine is out of stock?", a: "You can enable stock notifications for any product. We'll notify you immediately when it's back in stock." },
      { q: "Can I get medicine advice?", a: "Yes, you can consult with our pharmacists via call or WhatsApp for any medicine-related queries." },
    ],
  },
  {
    title: "Payments",
    icon: <CreditCard size={15} />,
    items: [
      { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and major debit/credit cards." },
      { q: "Is online payment secure?", a: "Yes, all online transactions are processed through secure, encrypted payment gateways." },
      { q: "When will I get my refund?", a: "Refunds for online payments are processed within 5-7 business days. COD refunds are handled via bKash/Nagad." },
    ],
  },
  {
    title: "Returns & Refunds",
    icon: <RotateCcw size={15} />,
    items: [
      { q: "What is your return policy?", a: "We accept returns within 7 days of delivery for damaged, expired, or wrong products. The product must be unused and in original packaging." },
      { q: "How do I request a return?", a: "Contact our support team via call or WhatsApp with your order number and reason for return. We'll arrange a pickup." },
      { q: "Are there items that can't be returned?", a: "For safety reasons, opened medicines, syringes, and personal care items cannot be returned unless defective." },
    ],
  },
  {
    title: "Account & Privacy",
    icon: <Shield size={15} />,
    items: [
      { q: "Is my personal data safe?", a: "Yes, we follow strict data protection policies. Your personal and medical information is encrypted and never shared with third parties." },
      { q: "How do I delete my account?", a: "Contact our support team to request account deletion. All your data will be permanently removed within 30 days." },
    ],
  },
];

const FAQPage = () => {
  useSEO(
    {
      title: "FAQ | Optimum Pharmaceuticals HLB — Frequently Asked Questions",
      description: "Find answers to common questions about ordering, delivery, payments, returns, and more at Optimum Pharmaceuticals HLB Bangladesh online pharmacy.",
      canonical: "/faq",
    },
    {
      id: "faq-schema",
      data: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_SECTIONS.flatMap((section) =>
          section.items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          }))
        ),
      },
    }
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Help & FAQ" />

      <main className="container py-5 space-y-5 max-w-3xl">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto">
            <HelpCircle size={22} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">How can we help?</h1>
          <p className="text-[11px] text-muted-foreground">Find answers to the most common questions</p>
        </div>

        {FAQ_SECTIONS.map((section, i) => (
          <section key={i} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-primary">{section.icon}</span>
              <h2 className="text-xs font-bold text-foreground">{section.title}</h2>
            </div>
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card overflow-hidden">
              {section.items.map((item, j) => (
                <AccordionItem key={j} value={`${i}-${j}`} className="border-border">
                  <AccordionTrigger className="px-4 py-3 text-[11px] font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 text-[10px] text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-card p-4 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">Still have questions?</p>
          <p className="text-[10px] text-muted-foreground">Our support team is available 24/7</p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <a href="tel:+8801306383938" className="text-[10px] font-medium text-primary hover:underline">Call Us</a>
            <span className="text-muted-foreground/30">•</span>
            <a href="https://wa.me/8801306383938" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-primary hover:underline">WhatsApp</a>
            <span className="text-muted-foreground/30">•</span>
            <a href="mailto:support@optimumpharmahlb.com" className="text-[10px] font-medium text-primary hover:underline">Email</a>
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default FAQPage;
