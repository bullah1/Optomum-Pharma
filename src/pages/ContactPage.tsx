import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { Phone, Mail, MessageCircle, MapPin, Clock, PhoneCall, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_METHODS = [
  {
    icon: <PhoneCall size={18} />,
    title: "Call Us",
    detail: "+880 1306-383938",
    sub: "Available 24/7",
    href: "tel:+8801306383938",
    action: "Call Now",
  },
  {
    icon: <MessageCircle size={18} />,
    title: "WhatsApp",
    detail: "+880 1306-383938",
    sub: "Quick responses",
    href: "https://wa.me/8801306383938",
    action: "Message",
  },
  {
    icon: <Mail size={18} />,
    title: "Email",
    detail: "support@optimumpharmahlb.com",
    sub: "Reply within 24 hours",
    href: "mailto:support@optimumpharmahlb.com",
    action: "Send Email",
  },
];

const ContactPage = () => {
  useSEO({
    title: "যোগাযোগ করুন | Optimum Pharmaceuticals HLB বাংলাদেশ",
    description: "Optimum Pharmaceuticals HLB বাংলাদেশে যোগাযোগ করুন। কল, WhatsApp বা ইমেইলে ২৪/৭ সেবা পান।",
    canonical: "https://optimumpharmahlb.com/contact",
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Contact Us" />

      <main className="container py-5 space-y-5 max-w-3xl">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto">
            <Phone size={22} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Get in Touch</h1>
          <p className="text-[11px] text-muted-foreground">We're here to help you 24 hours a day, 7 days a week</p>
        </div>

        {/* Contact Methods */}
        <div className="space-y-2.5">
          {CONTACT_METHODS.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 hover:border-primary/15 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/12 transition-colors">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">{c.title}</h3>
                <p className="text-[11px] font-medium text-foreground/80">{c.detail}</p>
                <p className="text-[9px] text-muted-foreground">{c.sub}</p>
              </div>
              <span className="text-[10px] font-medium text-primary shrink-0">{c.action} →</span>
            </a>
          ))}
        </div>

        {/* Office Address */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <MapPin size={13} className="text-primary" /> Our Office
          </h2>
          <div className="space-y-2">
            <p className="text-[11px] text-foreground font-medium">Optimum Pharmaceuticals HLB</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              6th Floor, Colombia Super Market,<br />
              31 Mohakhali C/A, Dhaka 1213, Bangladesh
            </p>
          </div>
        </section>

        {/* Business Hours */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-primary" /> Business Hours
          </h2>
          <div className="space-y-1.5">
            {[
              { day: "Customer Support", time: "24/7 (Always Available)" },
              { day: "Office Hours", time: "Sat - Thu, 9:00 AM - 6:00 PM" },
              { day: "Delivery (Dhaka)", time: "8:00 AM - 10:00 PM" },
              { day: "Delivery (Outside Dhaka)", time: "Courier based, 2-3 days" },
            ].map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[10px] font-medium text-foreground">{h.day}</span>
                <span className="text-[9px] text-muted-foreground">{h.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Help */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">Need quick answers?</p>
          <p className="text-[10px] text-muted-foreground">Check our FAQ for instant help with common questions</p>
          <Button asChild size="sm" variant="outline" className="text-[10px] h-8 rounded-lg gap-1.5">
            <a href="/faq">Visit FAQ <Send size={10} /></a>
          </Button>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default ContactPage;
