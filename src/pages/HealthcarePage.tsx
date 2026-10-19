import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import MobileBottomNav from "@/components/MobileBottomNav";
import { HeartPulse, Stethoscope, ChevronRight, Loader2, FlaskConical, ShoppingBag, Phone } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { getBreadcrumbSchema } from "@/lib/seo";

const services = [
  { name: "Doctor Consultation", desc: "Talk to a doctor online", icon: "👨‍⚕️", path: "/healthcare/doctors", color: "bg-blue-50 dark:bg-blue-950/30" },
  { name: "Home Visit", desc: "Doctor visits at your door", icon: "🏠", path: "/healthcare/doctors", color: "bg-orange-50 dark:bg-orange-950/30" },
  { name: "Lab Tests", desc: "Book health checkups", icon: "🧪", path: "/lab-test", color: "bg-emerald-50 dark:bg-emerald-950/30" },
  { name: "Medical Equipment", desc: "BP monitors & more", icon: "🩺", path: "/category/a1000000-0000-0000-0000-000000000002", color: "bg-purple-50 dark:bg-purple-950/30" },
];

const HealthcarePage = () => {
  const navigate = useNavigate();

  useSEO(
    {
      title: "হেলথকেয়ার সেবা বাংলাদেশ — ডাক্তার, ল্যাব টেস্ট | Optimum Pharmaceuticals HLB",
      description: "বাংলাদেশে ডাক্তার পরামর্শ, হোম ভিজিট, ল্যাব টেস্ট ও মেডিকেল ইকুইপমেন্ট। ঘরে বসে সেবা নিন।",
      canonical: "https://optimumpharmahlb.com/healthcare",
    },
    [
      { id: "hc-breadcrumb", data: getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Healthcare Bangladesh", url: "/healthcare" }]) },
    ]
  );

  const { data: healthTips = [], isLoading: tipsLoading } = useQuery({
    queryKey: ["health-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_tips")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as { id: string; title: string; description: string; icon: string }[];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title="Healthcare" subtitle="Your health, just a click away" />
      <main className="container py-3 max-w-3xl space-y-4">

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {services.map((s, i) => (
            <Link
              key={i}
              to={s.path}
              className="bg-card rounded-xl border border-border p-3.5 hover:border-primary/30 transition-all active:scale-[0.98] group"
            >
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-2.5`}>
                <span className="text-xl">{s.icon}</span>
              </div>
              <h4 className="text-[13px] font-semibold text-foreground leading-tight">{s.name}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
              <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 mt-2 group-hover:gap-1.5 transition-all">
                Explore <ChevronRight size={10} />
              </span>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2.5">
          <Link
            to="/my-appointments"
            className="flex-1 flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-3 hover:border-primary/30 transition-colors"
          >
            <Stethoscope size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">My Appointments</p>
              <p className="text-[9px] text-muted-foreground">View & track</p>
            </div>
          </Link>
          <Link
            to="/my-lab-tests"
            className="flex-1 flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-3 hover:border-primary/30 transition-colors"
          >
            <FlaskConical size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">My Lab Tests</p>
              <p className="text-[9px] text-muted-foreground">Reports & status</p>
            </div>
          </Link>
        </div>

        {/* Health Tips */}
        {tipsLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={18} /></div>
        ) : healthTips.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
              <HeartPulse size={13} className="text-primary" /> Health Tips
            </h3>
            <div className="space-y-1.5">
              {healthTips.slice(0, 5).map((tip) => (
                <div key={tip.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-3">
                  <span className="text-lg">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency CTA */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Phone size={18} className="text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">Emergency Helpline</p>
            <p className="text-[10px] text-muted-foreground">Available 24/7</p>
          </div>
          <a href="tel:+8801306383938" className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2 rounded-lg">
            Call Now
          </a>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default HealthcarePage;
