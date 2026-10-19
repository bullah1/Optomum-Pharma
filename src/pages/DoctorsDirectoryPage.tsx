import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Stethoscope, Clock, Search, ChevronRight, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";

const DoctorsDirectoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name, slug, designation, specialization, fee, schedule, image_url, experience_years, available, chamber_name, visit_days, visit_time")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const specializations = useMemo(
    () => [...new Set(doctors?.map((d) => d.specialization).filter(Boolean))],
    [doctors]
  );

  const filtered = doctors?.filter((d) => {
    const matchesSpec = !selectedSpec || d.specialization === selectedSpec;
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  // SEO — directory page targets "all doctors bangladesh"
  useSEO(
    {
      title: "বাংলাদেশের সকল ডাক্তারের তালিকা | All Doctors Bangladesh — Optimum Pharmaceuticals HLB",
      description:
        "বাংলাদেশের অভিজ্ঞ ও বিশেষজ্ঞ ডাক্তারদের সম্পূর্ণ তালিকা — মেডিসিন, গাইনি, শিশু, চর্ম, হৃদরোগ, সার্জারি ও আরও। নাম, বিশেষজ্ঞতা ও ফি দেখে অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন। Find verified doctors in Bangladesh — book online consultation today.",
      canonical: "https://optimumpharmahlb.com/doctors-bangladesh",
      type: "website",
    },
    [
      {
        id: "doctors-directory-itemlist",
        data: {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Doctors in Bangladesh",
          numberOfItems: doctors?.length ?? 0,
          itemListElement:
            doctors?.slice(0, 50).map((d, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Physician",
                name: d.name,
                medicalSpecialty: d.specialization || "General Practice",
                url: `https://optimumpharmahlb.com/doctor/${d.slug || d.id}`,
                image: d.image_url || undefined,
                areaServed: { "@type": "Country", name: "Bangladesh" },
              },
            })) ?? [],
        },
      },
      {
        id: "doctors-directory-breadcrumb",
        data: {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://optimumpharmahlb.com/" },
            { "@type": "ListItem", position: 2, name: "Doctors Bangladesh", item: "https://optimumpharmahlb.com/doctors-bangladesh" },
          ],
        },
      },
    ]
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar
        title="Doctors in Bangladesh"
        subtitle={`${doctors?.length ?? 0} verified doctors`}
      />

      <main className="container py-3 max-w-3xl space-y-3">
        {/* SEO H1 — visible but compact */}
        <header className="px-1">
          <h1 className="text-base font-bold text-foreground">
            বাংলাদেশের সকল ডাক্তারের তালিকা
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All verified doctors in Bangladesh — book online consultation
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ডাক্তারের নাম বা বিশেষজ্ঞতা খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-2xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Specialization chips */}
        {specializations.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none">
            <button
              onClick={() => setSelectedSpec(null)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                !selectedSpec
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              All ({doctors?.length ?? 0})
            </button>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  selectedSpec === spec
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground border border-border"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* Doctor list */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted/40 skeleton-shimmer" />
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            কোনো ডাক্তার পাওয়া যায়নি
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((doctor) => (
              <li key={doctor.id}>
                <Link
                  to={`/doctor/${doctor.slug || doctor.id}`}
                  className="block bg-card rounded-2xl border border-border p-3 hover:shadow-sm hover:border-primary/30 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Photo */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        {doctor.image_url ? (
                          <img
                            src={doctor.image_url}
                            alt={`${doctor.name} - ${doctor.specialization || "Doctor"} in Bangladesh`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Stethoscope size={24} className="text-primary/70" />
                        )}
                      </div>
                      {doctor.available && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-sm text-foreground truncate">
                        {doctor.name}
                      </h2>
                      {doctor.designation && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {doctor.designation}
                        </p>
                      )}
                      {doctor.specialization && (
                        <p className="text-[11px] text-primary font-medium mt-0.5 truncate">
                          {doctor.specialization}
                        </p>
                      )}
                      {doctor.chamber_name && (
                        <p className="text-[11px] text-muted-foreground mt-1 truncate flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{doctor.chamber_name}</span>
                        </p>
                      )}
                      {(doctor.visit_days || doctor.visit_time) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">
                            {[doctor.visit_days, doctor.visit_time].filter(Boolean).join(", ")}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Fee + arrow */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-foreground">৳{doctor.fee}</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* SEO content footer */}
        <section className="mt-6 px-1 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            <strong className="text-foreground">বাংলাদেশে ডাক্তার খুঁজছেন?</strong> Optimum Pharmaceuticals HLB-এ
            বাংলাদেশের সকল বিশেষজ্ঞ ডাক্তারের তালিকা পাবেন — মেডিসিন, গাইনি, শিশু, চর্ম, হৃদরোগ,
            অর্থোপেডিক, ইএনটি ও আরও অনেক বিভাগে। ঘরে বসেই অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।
          </p>
          <p>
            Find the best doctors in Bangladesh for online consultation. Book appointments with
            verified specialists in cardiology, gynecology, pediatrics, dermatology, and more.
          </p>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default DoctorsDirectoryPage;
