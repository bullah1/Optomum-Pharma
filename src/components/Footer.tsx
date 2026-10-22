import { forwardRef } from "react";
import { Phone, MapPin, MessageCircle, Linkedin, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import paymentMethodsImg from "@/assets/payment-methods.png";

const socialIcons = [
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Facebook, label: "Facebook" },
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
];

const Footer = forwardRef<HTMLElement>((_props, ref) => {
  const { data: s } = useSiteSettings();
  const siteName = s?.site_name || "Optimum Pharmaceuticals HLB";
  const siteLogo = s?.site_logo;
  const contactPhone = s?.contact_phone || "+8801306383938";
  const contactEmail = s?.contact_email || "support@optimumpharmahlb.com";
  const contactAddress = s?.contact_address || "6th Floor, Colombia Super Market, 31 Mohakhali C/A, Dhaka 1213, Bangladesh";

  return (
    <footer ref={ref} className="bg-card border-t border-border mt-10 hidden md:block">
      <div className="container py-10">
        <div className="grid grid-cols-4 gap-10">
          <div>
            <div className="mb-3">
              <img src={siteLogo || "/images/optimum-logo.jpg"} alt={siteName} className="h-10 object-contain" />
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Official online store of Optimum Pharmaceuticals HLB — authentic herbal and Ayurvedic medicines, delivered nationwide.
            </p>

            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mt-5 mb-3">We Accept</h4>
            <div className="bg-background/50 rounded-xl border border-border p-2.5 flex items-center justify-center">
              <img
                src={paymentMethodsImg}
                alt="Accepted payment methods"
                className="max-w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Return & Refund Policy</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Our Services</h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              <li><Link to="/categories" className="hover:text-primary transition-colors">All Categories</Link></li>
              <li><Link to="/offers" className="hover:text-primary transition-colors">Special Offers</Link></li>
              <li><Link to="/companies" className="hover:text-primary transition-colors">Brands</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3 text-[13px] text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-primary shrink-0" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle size={14} className="text-primary shrink-0" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-0.5 text-primary shrink-0" />
                <span className="leading-snug">{contactAddress}</span>
              </li>
            </ul>

            <div className="flex gap-2 mt-5">
              {socialIcons.map(({ icon: Icon, label }) => (
                <div key={label} className="w-8 h-8 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                  <Icon size={14} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-5 text-center text-[11px] text-muted-foreground/60">
          © 2026 {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
