import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Stethoscope, Clock, Search, Calendar, Loader2, X, Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSEO } from "@/hooks/useSEO";

const DoctorConsultationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useSEO(
    {
      title: "অনলাইন ডাক্তার কনসালটেশন বাংলাদেশ | Online Doctor Consultation Bangladesh",
      description:
        "বাংলাদেশে অনলাইনে অভিজ্ঞ ডাক্তারের সাথে পরামর্শ নিন — মেডিসিন, গাইনি, শিশু, চর্ম, হৃদরোগ ও আরও অনেক বিভাগের বিশেষজ্ঞ ডাক্তার। ঘরে বসেই সহজে অ্যাপয়েন্টমেন্ট বুক করুন। Book online video/phone consultation with expert doctors in Dhaka, Bangladesh.",
      canonical: "https://optimumpharmahlb.com/healthcare/doctors",
      type: "website",
    },
    [
      {
        id: "doctor-consult-service",
        data: {
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: "Optimum Pharmaceuticals HLB Online Doctor Consultation — Bangladesh",
          url: "https://optimumpharmahlb.com/healthcare/doctors",
          image: "https://optimumpharmahlb.com/favicon.png",
          telephone: "+8801306383938",
          priceRange: "৳",
          medicalSpecialty: [
            "GeneralPractice",
            "Gynecologic",
            "Pediatric",
            "Dermatologic",
            "Cardiovascular",
            "Internal Medicine",
          ],
          areaServed: [
            ],
          address: {
            "@type": "PostalAddress",
            streetAddress: "6th Floor, Colombia Super Market, 31 Mohakhali C/A",
            addressLocality: "Dhaka",
            addressRegion: "Dhaka Division",
            postalCode: "1213",
            addressCountry: "BD",
          },
          availableService: {
            "@type": "MedicalProcedure",
            name: "Online Doctor Consultation / অনলাইন ডাক্তার পরামর্শ",
            procedureType: "https://schema.org/TherapeuticProcedure",
          },
        },
      },
      {
        id: "doctor-consult-breadcrumb",
        data: {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://optimumpharmahlb.com/" },
            { "@type": "ListItem", position: 2, name: "Healthcare", item: "https://optimumpharmahlb.com/healthcare" },
            { "@type": "ListItem", position: 3, name: "Doctor Consultation", item: "https://optimumpharmahlb.com/healthcare/doctors" },
          ],
        },
      },
      {
        id: "doctor-consult-faq",
        data: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "বাংলাদেশে অনলাইনে ডাক্তার দেখানো যায় কীভাবে?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Optimum Pharmaceuticals HLB-এ গিয়ে পছন্দের ডাক্তার নির্বাচন করুন, সময় বেছে নিন এবং অ্যাপয়েন্টমেন্ট বুক করুন। নির্ধারিত সময়ে ডাক্তার আপনার সাথে যোগাযোগ করবেন।",
              },
            },
            {
              "@type": "Question",
              name: "Online doctor consultation fee কত বাংলাদেশে?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ডাক্তার ও বিশেষজ্ঞতা অনুযায়ী ফি ভিন্ন হয়। সাধারণত ৳৩০০ থেকে ৳১০০০ এর মধ্যে। প্রতিটি ডাক্তারের প্রোফাইলে ফি উল্লেখ করা আছে।",
              },
            },
            {
              "@type": "Question",
              name: "Can I consult a doctor online from Bangladesh?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, Optimum Pharmaceuticals HLB offers online doctor consultations across Bangladesh.",
              },
            },
          ],
        },
      },
    ]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<any | null>(null);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("available", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const specializations = [...new Set(doctors?.map((d) => d.specialization).filter(Boolean))];

  const filtered = doctors?.filter((d) => {
    const matchesSpec = !selectedSpec || d.specialization === selectedSpec;
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const handleBookDoctor = (doctor: any) => {
    if (!user) {
      toast.error("Please login to book a consultation");
      navigate("/auth");
      return;
    }
    navigate("/healthcare/doctors/book", { state: { doctor } });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Doctor Consultation" subtitle="Book an appointment with expert doctors" />
      <main className="container py-3 max-w-3xl space-y-3">

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search doctors or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Specialization chips */}
        {specializations.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setSelectedSpec(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                !selectedSpec
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              All
            </button>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(selectedSpec === spec ? null : spec)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                  selectedSpec === spec
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* Doctor listing */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 bg-muted/50 rounded" />
                    <div className="h-3 w-1/2 bg-muted/40 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Stethoscope size={32} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No doctors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground px-0.5">{filtered.length} doctors available</p>
            {filtered.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex gap-3.5">
                  {/* Doctor Photo - clickable */}
                  <button
                    onClick={() => setProfileDoctor(doctor)}
                    className="relative shrink-0 active:scale-95 transition-transform"
                    aria-label={`View ${doctor.name} profile`}
                  >
                    <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center">
                      {doctor.image_url ? (
                        <img
                          src={doctor.image_url}
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Stethoscope size={28} className="text-primary/70" strokeWidth={1.8} />
                      )}
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                  </button>

                  {/* Info - name clickable */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setProfileDoctor(doctor)}
                      className="text-left w-full group"
                    >
                      <h4 className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                        {doctor.name}
                      </h4>
                      <p className="text-[10px] text-primary/70 font-medium mt-0.5">View profile →</p>
                    </button>
                    {doctor.specialization && (
                      <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                        {doctor.specialization}
                      </div>
                    )}
                    {doctor.schedule && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5">
                        <Clock size={10} /> {doctor.schedule}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price + Book */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-foreground">৳{doctor.fee}</span>
                    <span className="text-[11px] text-muted-foreground">/ visit</span>
                  </div>
                  <button
                    onClick={() => handleBookDoctor(doctor)}
                    className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl active:scale-95 hover:opacity-90 transition-all shadow-sm shadow-primary/20"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Doctor Profile Dialog */}
      <Dialog open={!!profileDoctor} onOpenChange={(o) => !o && setProfileDoctor(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden gap-0 border-border rounded-2xl">
          {profileDoctor && (
            <div className="bg-card">
              <DialogTitle className="sr-only">{profileDoctor.name} profile</DialogTitle>
              <DialogDescription className="sr-only">
                Doctor profile information for {profileDoctor.name}
              </DialogDescription>

              {/* Centered photo & identity */}
              <div className="flex flex-col items-center px-5 pt-8 pb-5">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border-4 border-primary/10 shadow-md flex items-center justify-center">
                    {profileDoctor.image_url ? (
                      <img src={profileDoctor.image_url} alt={profileDoctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope size={42} className="text-primary/70" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
                </div>

                <h2 className="text-lg font-extrabold text-foreground mt-3 text-center leading-tight">
                  {profileDoctor.name}
                </h2>
                {profileDoctor.specialization && (
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                    <Award size={11} /> {profileDoctor.specialization}
                  </div>
                )}
                <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-emerald-600">
                  <CheckCircle2 size={11} /> Available for consultation
                </div>
              </div>

              {/* Info grid */}
              <div className="px-5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Fee</p>
                    <p className="text-base font-extrabold text-foreground mt-1">৳{profileDoctor.fee}</p>
                  </div>
                  <div className="bg-secondary/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Schedule</p>
                    <p className="text-[11px] font-bold text-foreground mt-1 leading-tight">
                      {profileDoctor.schedule || "Flexible"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-5 py-4 mt-3 border-t border-border/60 bg-secondary/20">
                <button
                  onClick={() => setProfileDoctor(null)}
                  className="flex-1 bg-card border border-border text-foreground text-sm font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const d = profileDoctor;
                    setProfileDoctor(null);
                    handleBookDoctor(d);
                  }}
                  className="flex-[1.5] bg-primary text-primary-foreground text-sm font-bold py-3 rounded-xl active:scale-95 hover:opacity-90 transition-all shadow-sm shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  <Calendar size={14} /> Book Now
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default DoctorConsultationPage;
