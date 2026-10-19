import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import { Shield, Lock, Eye, Database, Bell, UserCheck, Mail } from "lucide-react";

const SECTIONS = [
  {
    icon: <Database size={18} />,
    title: "Information We Collect",
    content: `When you use Optimum Pharmaceuticals HLB, we may collect personal information such as your name, email address, phone number, delivery address, and payment details. We also collect device information, browsing behavior, and order history to improve your experience.`,
  },
  {
    icon: <Eye size={18} />,
    title: "How We Use Your Information",
    content: `We use your information to process orders, deliver medicines, provide customer support, send order updates, and improve our services. We may also use anonymized data for analytics and to personalize your experience.`,
  },
  {
    icon: <Lock size={18} />,
    title: "Data Security",
    content: `We implement industry-standard security measures including SSL encryption, secure payment gateways, and access controls to protect your personal data. Your medical and prescription information is handled with the highest level of confidentiality.`,
  },
  {
    icon: <UserCheck size={18} />,
    title: "Data Sharing",
    content: `We never sell your personal information. We only share data with trusted delivery partners, payment processors, and healthcare providers as necessary to fulfill your orders and provide services. All partners are bound by strict confidentiality agreements.`,
  },
  {
    icon: <Bell size={18} />,
    title: "Notifications & Communications",
    content: `We may send you order updates, health tips, promotional offers, and important service announcements via SMS, email, or push notifications. You can opt out of promotional communications at any time from your account settings.`,
  },
  {
    icon: <Shield size={18} />,
    title: "Your Rights",
    content: `You have the right to access, update, or delete your personal information at any time. You can also request a copy of your data or ask us to stop processing it. Contact our support team for any privacy-related requests.`,
  },
];

const PrivacyPolicyPage = () => {
  useSEO({
    title: "Privacy Policy | Optimum Pharmaceuticals HLB",
    description: "Read Optimum Pharmaceuticals HLB's privacy policy to understand how we collect, use, and protect your personal information.",
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Privacy Policy" />

      <main className="container py-5 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: April 2026</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            At Optimum Pharmaceuticals HLB, we are committed to protecting your privacy and ensuring the security of your personal information.
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
            Questions about our privacy practices? Contact us at{" "}
            <a href="mailto:privacy@optimumpharmahlb.com" className="text-primary font-medium hover:underline">
              privacy@optimumpharmahlb.com
            </a>
          </p>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default PrivacyPolicyPage;
