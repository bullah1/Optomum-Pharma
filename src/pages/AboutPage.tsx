import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";
import {
  Building2, MapPin, Phone, Mail, Calendar, Shield, Award,
  MessageCircle, PhoneCall, Users, Heart, Eye, Truck, Clock,
  CheckCircle2, Star, Pill, Stethoscope, FlaskConical, Sparkles,
  Globe, Zap, HeartHandshake, Target, TrendingUp, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COMPANY = {
  name: "Optimum Pharmaceuticals HLB",
  tagline: "বাংলাদেশের বিশ্বস্ত অনলাইন হেলথকেয়ার পার্টনার",
  description:
    "Optimum Pharmaceuticals HLB সারা বাংলাদেশে অথেনটিক ওষুধ, ল্যাব টেস্ট, ডাক্তার পরামর্শ ও বিউটি সেবা দ্রুত হোম ডেলিভারি দিয়ে থাকে।",
  mission: "বাংলাদেশের প্রতিটি পরিবারের জন্য মানসম্মত ও সাশ্রয়ী স্বাস্থ্যসেবা নিশ্চিত করা।",
  vision: "To become the most trusted digital health companion across South Asia.",
  phone: "+8801306383938",
  email: "support@optimumpharmahlb.com",
  whatsapp: "+8801306383938",
  address: "6th Floor, Colombia Super Market, 31 Mohakhali C/A, Dhaka 1213, Bangladesh",
  businessType: "Online Pharmacy & E-Commerce",
  established: "2024",
  tradeLicense: "TRAD/DSCC/2024/XXXXX",
};

const STATS = [
  { icon: <Pill size={16} />, value: "5,000+", label: "Products" },
  { icon: <Users size={16} />, value: "10,000+", label: "Customers" },
  { icon: <Truck size={16} />, value: "15,000+", label: "Deliveries" },
  { icon: <Star size={16} />, value: "4.8★", label: "Rating" },
];

const SERVICES = [
  { icon: <Pill size={18} />, title: "Medicine Delivery", desc: "Genuine medicines delivered to your doorstep within hours" },
];

const WHY_CHOOSE = [
  { icon: <Shield size={15} />, title: "Licensed & Certified", desc: "Government approved pharmacy" },
  { icon: <BadgeCheck size={15} />, title: "100% Authentic", desc: "Verified by pharmacists" },
  { icon: <Zap size={15} />, title: "Express Delivery", desc: "Within 2 hours in Dhaka" },
  { icon: <HeartHandshake size={15} />, title: "24/7 Support", desc: "Round the clock care" },
  { icon: <TrendingUp size={15} />, title: "Best Prices", desc: "Regular discounts & offers" },
  { icon: <Globe size={15} />, title: "Nationwide", desc: "All 64 districts covered" },
];

const getRoleIcon = (designation: string) => {
  const lower = designation.toLowerCase();
  if (lower.includes("director") || lower.includes("ceo")) return <Award size={11} />;
  if (lower.includes("pharma")) return <Pill size={11} />;
  if (lower.includes("doctor") || lower.includes("medical") || lower.includes("consultant")) return <Stethoscope size={11} />;
  if (lower.includes("delivery") || lower.includes("logistics")) return <Truck size={11} />;
  if (lower.includes("developer") || lower.includes("web") || lower.includes("tech")) return <Globe size={11} />;
  if (lower.includes("marketing") || lower.includes("digital")) return <TrendingUp size={11} />;
  if (lower.includes("support") || lower.includes("customer")) return <MessageCircle size={11} />;
  if (lower.includes("manager") || lower.includes("operation")) return <Target size={11} />;
  return <Users size={11} />;
};

const AboutPage = () => {
  useSEO({
    title: "আমাদের সম্পর্কে | Optimum Pharmaceuticals HLB — বাংলাদেশের অনলাইন ফার্মেসি",
    description: "Optimum Pharmaceuticals HLB বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি। আমাদের টিম, সেবা ও মিশন জানুন।",
    canonical: "https://optimumpharmahlb.com/about",
  });

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members_public" as any)
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as { id: string; name: string; designation: string | null; bio: string | null; image_url: string | null; sort_order: number; active: boolean }[];
    },
  });

  const leader = teamMembers[0];
  const restMembers = teamMembers.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="About Us" />

      <main className="container py-5 space-y-6 max-w-3xl">
        {/* Hero */}
        <section className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mx-auto">
            <Building2 size={26} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{COMPANY.name}</h1>
            <p className="text-xs font-medium text-primary mt-0.5">{COMPANY.tagline}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto">
            {COMPANY.description}
          </p>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {["Licensed Pharmacy", "Verified Products", "Fast Delivery"].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={9} className="text-primary" /> {t}
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-4 gap-2">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center rounded-xl border border-border bg-card p-2.5 space-y-1">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mx-auto text-primary">
                {stat.icon}
              </div>
              <p className="text-xs font-bold text-foreground">{stat.value}</p>
              <p className="text-[8px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Heart size={15} className="text-primary" />
            </div>
            <h3 className="text-[11px] font-bold text-foreground">Our Mission</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{COMPANY.mission}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Eye size={15} className="text-primary" />
            </div>
            <h3 className="text-[11px] font-bold text-foreground">Our Vision</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{COMPANY.vision}</p>
          </div>
        </section>

        {/* Services */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">What We Offer</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {SERVICES.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
                  {s.icon}
                </div>
                <h3 className="text-[11px] font-bold text-foreground">{s.title}</h3>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Why Choose Us</h2>
          <div className="grid grid-cols-3 gap-2">
            {WHY_CHOOSE.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 text-center space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mx-auto text-primary">
                  {item.icon}
                </div>
                <h3 className="text-[10px] font-bold text-foreground leading-tight">{item.title}</h3>
                <p className="text-[8px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Info */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <h2 className="text-xs font-bold text-foreground">Company Information</h2>
          </div>
          <div className="divide-y divide-border/15">
            {[
              { icon: <Building2 size={12} />, label: "Business Type", value: COMPANY.businessType },
              { icon: <Calendar size={12} />, label: "Established", value: COMPANY.established },
              { icon: <Shield size={12} />, label: "Trade License", value: COMPANY.tradeLicense },
              { icon: <MapPin size={12} />, label: "Address", value: COMPANY.address },
              { icon: <Phone size={12} />, label: "Phone", value: COMPANY.phone },
              { icon: <Mail size={12} />, label: "Email", value: COMPANY.email },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-primary shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-[8px] text-muted-foreground">{item.label}</p>
                  <p className="text-[11px] font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold text-foreground">Meet Our Team</h2>
            <p className="text-[10px] text-muted-foreground">The people behind your healthcare experience</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2.5">
                  <div className="w-14 h-14 rounded-full bg-muted mx-auto" />
                  <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
                  <div className="h-2 bg-muted rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border bg-muted/5">
              <Users size={28} className="mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">Team information coming soon</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Leader - horizontal card */}
              {leader && (
                <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                  {leader.image_url ? (
                    <img src={leader.image_url} alt={leader.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/8 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                      {leader.name?.[0]}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{leader.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                      {getRoleIcon(leader.designation)} {leader.designation}
                    </span>
                    {leader.bio && (
                      <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">{leader.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rest - grid */}
              {restMembers.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {restMembers.map((member: any) => (
                    <div key={member.id} className="rounded-xl border border-border bg-card p-3.5 text-center space-y-1.5 hover:border-primary/15 transition-colors">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-14 h-14 rounded-full object-cover mx-auto" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center mx-auto text-primary font-semibold text-base">
                          {member.name?.[0]}
                        </div>
                      )}
                      <h3 className="text-[11px] font-bold text-foreground leading-tight">{member.name}</h3>
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                        {getRoleIcon(member.designation)} {member.designation}
                      </span>
                      {member.bio && (
                        <p className="text-[8px] text-muted-foreground leading-relaxed line-clamp-2">{member.bio}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Contact */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-bold text-foreground text-center">Get in Touch</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button asChild size="sm" className="gap-1.5 text-[10px] h-9 rounded-lg">
              <a href={`tel:${COMPANY.phone}`}>
                <PhoneCall size={13} /> Call
              </a>
            </Button>
            <Button asChild size="sm" className="gap-1.5 text-[10px] h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
              <a href={`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={13} /> WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 text-[10px] h-9 rounded-lg">
              <a href={`mailto:${COMPANY.email}`}>
                <Mail size={13} /> Email
              </a>
            </Button>
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 flex-wrap pb-2">
          <Link to="/privacy" className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-border hover:border-primary/20">Privacy Policy</Link>
          <Link to="/terms" className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-border hover:border-primary/20">Terms of Service</Link>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AboutPage;
