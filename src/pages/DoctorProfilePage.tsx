import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  Stethoscope,
  Clock,
  Award,
  GraduationCap,
  MapPin,
  Languages,
  CheckCircle2,
  Star,
  Phone,
  MessageCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Navigation,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const CONTACT_PHONE = "+8801306383938";
const WHATSAPP_PHONE = "8801306383938";

const DoctorProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor-profile", slug],
    queryFn: async () => {
      let { data } = await supabase.from("doctors").select("*").eq("slug", slug!).maybeSingle();
      if (!data) {
        const fallback = await supabase.from("doctors").select("*").eq("id", slug!).maybeSingle();
        data = fallback.data;
      }
      return data;
    },
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ["doctor-reviews", doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      const { data } = await supabase
        .from("doctor_reviews")
        .select("id, rating, comment, patient_name, created_at")
        .eq("doctor_id", doctor.id)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!doctor?.id,
  });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const visitSchedule =
    [doctor?.visit_days, doctor?.visit_time].filter(Boolean).join(", ") || doctor?.schedule || "";

  // SEO
  useSEO(
    doctor
      ? {
          title:
            doctor.meta_title ||
            `${doctor.name}${doctor.specialization ? ` - ${doctor.specialization}` : ""} বাংলাদেশ | Chamber, Visit Time, Fee`,
          description:
            doctor.meta_description ||
            `${doctor.name}${doctor.specialization ? ` (${doctor.specialization})` : ""} বাংলাদেশ। ${doctor.chamber_name ? "Chamber: " + doctor.chamber_name + ". " : ""}${visitSchedule ? "Visit: " + visitSchedule + ". " : ""}Fee ৳${doctor.fee}. Appointment: ${CONTACT_PHONE}`,
          canonical: `https://optimumpharmahlb.com/doctor/${doctor.slug || doctor.id}`,
          image: doctor.image_url || undefined,
          type: "article",
        }
      : { title: "Loading...", description: "Loading doctor profile" },
    doctor
      ? [
          {
            id: "doctor-physician-schema",
            data: {
              "@context": "https://schema.org",
              "@type": "Physician",
              name: doctor.name,
              medicalSpecialty: doctor.specialization || "General Practice",
              image: doctor.image_url || undefined,
              description:
                doctor.bio || `${doctor.name} is a doctor in Dhaka, Bangladesh.`,
              url: `https://optimumpharmahlb.com/doctor/${doctor.slug || doctor.id}`,
              telephone: CONTACT_PHONE,
              priceRange: `৳${doctor.fee}`,
              ...(doctor.bmdc_number && { identifier: `BMDC: ${doctor.bmdc_number}` }),
              ...(doctor.chamber_name && {
                memberOf: { "@type": "Organization", name: doctor.chamber_name },
              }),
              areaServed: [
                ],
              address: {
                "@type": "PostalAddress",
                streetAddress: doctor.chamber_address || undefined,
                addressLocality: "Dhaka",
                addressRegion: "Dhaka Division",
                addressCountry: "BD",
              },
              ...(visitSchedule && { availableService: visitSchedule }),
              ...(avgRating > 0 && {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: avgRating.toFixed(1),
                  reviewCount: reviews?.length || 0,
                  bestRating: "5",
                  worstRating: "1",
                },
              }),
              ...(reviews && reviews.length > 0 && {
                review: reviews.slice(0, 5).map((r) => ({
                  "@type": "Review",
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: r.rating,
                    bestRating: "5",
                  },
                  author: { "@type": "Person", name: r.patient_name || "Patient" },
                  reviewBody: r.comment || "",
                })),
              }),
            },
          },
          {
            id: "doctor-breadcrumb",
            data: {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://optimumpharmahlb.com/" },
                { "@type": "ListItem", position: 2, name: "Doctors Bangladesh", item: "https://optimumpharmahlb.com/doctors-bangladesh" },
                { "@type": "ListItem", position: 3, name: doctor.name, item: `https://optimumpharmahlb.com/doctor/${doctor.slug || doctor.id}` },
              ],
            },
          },
          {
            id: "doctor-faq",
            data: {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `${doctor.name}-এর consultation fee কত?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${doctor.name}-এর কনসালটেশন ফি ৳${doctor.fee}।`,
                  },
                },
                {
                  "@type": "Question",
                  name: `${doctor.name}-এর সাথে appointment কীভাবে নেব?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${doctor.name}-এর সাথে appointment নিতে কল করুন ${CONTACT_PHONE} নম্বরে অথবা WhatsApp করুন। Optimum Pharmaceuticals HLB থেকে আপনার appointment নিশ্চিত করা হবে।`,
                  },
                },
                ...(doctor.chamber_name
                  ? [
                      {
                        "@type": "Question",
                        name: `${doctor.name} কোথায় বসেন?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: `${doctor.name} ${doctor.chamber_name}${doctor.chamber_address ? ", " + doctor.chamber_address : ""}-এ বসেন।`,
                        },
                      },
                    ]
                  : []),
                ...(visitSchedule
                  ? [
                      {
                        "@type": "Question",
                        name: `${doctor.name} কখন বসেন?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: `${doctor.name} সাধারণত ${visitSchedule} সময়ে চেম্বারে বসেন।`,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : undefined
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageTopBar title="Doctor Profile" />
        <div className="container py-4 max-w-3xl space-y-3">
          <div className="h-40 rounded-2xl bg-muted/40 skeleton-shimmer" />
          <div className="h-24 rounded-2xl bg-muted/40 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-6 text-center">
        <Stethoscope size={48} className="text-muted-foreground mb-3" />
        <h1 className="text-lg font-bold text-foreground">Doctor not found</h1>
        <p className="text-sm text-muted-foreground mt-1">এই ডাক্তারের প্রোফাইল পাওয়া যায়নি।</p>
        <Link
          to="/doctors-bangladesh"
          className="mt-4 text-sm font-semibold text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> View all doctors
        </Link>
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(
    `আসসালামু আলাইকুম। আমি ${doctor.name}${doctor.specialization ? ` (${doctor.specialization})` : ""}-এর সাথে appointment নিতে চাই। Optimum Pharmaceuticals HLB থেকে।`
  );

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-6">
      <PageTopBar title={doctor.name} subtitle={doctor.specialization || "Doctor"} />

      <main className="container py-3 max-w-3xl space-y-3">
        {/* Hero card */}
        <section className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-card shadow-md flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                {doctor.image_url ? (
                  <img
                    src={doctor.image_url}
                    alt={`${doctor.name} - ${doctor.specialization || "Doctor"} Bangladesh`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Stethoscope size={42} className="text-primary/70" />
                )}
              </div>
              {doctor.available && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
              )}
            </div>

            <h1 className="text-lg font-bold text-foreground mt-3">{doctor.name}</h1>
            {doctor.designation && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{doctor.designation}</p>
            )}
            {doctor.specialization && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mt-1.5">
                {doctor.specialization}
              </span>
            )}

            {doctor.qualifications && (
              <p className="text-[11px] text-muted-foreground mt-1.5">{doctor.qualifications}</p>
            )}

            {doctor.bmdc_number && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                <BadgeCheck size={11} /> BMDC: {doctor.bmdc_number}
              </div>
            )}

            {avgRating > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-[11px] text-muted-foreground">({reviews?.length} reviews)</span>
              </div>
            )}

            {doctor.available && (
              <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 size={12} /> Available for consultation
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fee</p>
              <p className="text-base font-bold text-foreground mt-0.5">৳{doctor.fee}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Experience</p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {doctor.experience_years ? `${doctor.experience_years}+ yrs` : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Chamber card — most important for SEO */}
        {(doctor.chamber_name || doctor.chamber_address || visitSchedule) && (
          <section className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Chamber Information</h2>
            </div>

            <div className="space-y-2.5">
              {doctor.chamber_name && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{doctor.chamber_name}</p>
                    {doctor.chamber_address && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{doctor.chamber_address}</p>
                    )}
                  </div>
                </div>
              )}

              {visitSchedule && (
                <div className="flex items-start gap-2.5">
                  <CalendarDays size={14} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">Visit Time</p>
                    <p className="text-xs text-foreground font-medium">{visitSchedule}</p>
                  </div>
                </div>
              )}

              {doctor.chamber_map_url && (
                <a
                  href={doctor.chamber_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  <Navigation size={12} /> Get Directions
                </a>
              )}
            </div>
          </section>
        )}

        {/* About */}
        {doctor.bio && (
          <section className="bg-card rounded-2xl border border-border p-4">
            <h2 className="text-sm font-bold text-foreground mb-2">About {doctor.name}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {doctor.bio}
            </p>
          </section>
        )}

        {/* Other details */}
        {(doctor.education || doctor.languages || doctor.experience_years) && (
          <section className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
            <h2 className="text-sm font-bold text-foreground mb-1">Details</h2>

            {doctor.education && (
              <div className="flex items-start gap-2.5">
                <GraduationCap size={15} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase">Education</p>
                  <p className="text-xs text-foreground">{doctor.education}</p>
                </div>
              </div>
            )}

            {doctor.languages && (
              <div className="flex items-start gap-2.5">
                <Languages size={15} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase">Languages</p>
                  <p className="text-xs text-foreground">{doctor.languages}</p>
                </div>
              </div>
            )}

            {doctor.experience_years && (
              <div className="flex items-start gap-2.5">
                <Award size={15} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase">Experience</p>
                  <p className="text-xs text-foreground">{doctor.experience_years}+ years</p>
                </div>
              </div>
            )}

            {doctor.schedule && !visitSchedule && (
              <div className="flex items-start gap-2.5">
                <Clock size={15} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase">Schedule</p>
                  <p className="text-xs text-foreground">{doctor.schedule}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* How to book */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-foreground mb-2">How to Book Appointment</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {doctor.name}-এর সাথে appointment নিতে নিচের <strong className="text-foreground">Call</strong> অথবা{" "}
            <strong className="text-foreground">WhatsApp</strong> বাটনে ক্লিক করুন। আমাদের team আপনার appointment confirm করে দেবে।
          </p>
        </section>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">Patient Reviews</h2>
            <ul className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < r.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-muted-foreground/30"
                        }
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {r.patient_name || "Anonymous"}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-foreground leading-relaxed">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SEO content */}
        <section className="bg-card rounded-2xl border border-border p-4">
          <h2 className="text-sm font-bold text-foreground mb-2">
            {doctor.name} — বাংলাদেশ | Chamber, Visit Time & Appointment
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {doctor.name}{doctor.specialization && ` (${doctor.specialization})`} বাংলাদেশের একজন{" "}
            {doctor.designation || "অভিজ্ঞ"} ডাক্তার।{" "}
            {doctor.chamber_name && `তিনি ${doctor.chamber_name}-এ বসেন। `}
            {visitSchedule && `Visit time: ${visitSchedule}। `}
            কনসালটেশন ফি মাত্র ৳{doctor.fee}। Appointment-এর জন্য Optimum Pharmaceuticals HLB-এ কল করুন{" "}
            <strong className="text-foreground">{CONTACT_PHONE}</strong> অথবা WhatsApp করুন।
          </p>
        </section>
      </main>

      {/* Sticky Call + WhatsApp bar */}
      <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-30 px-3">
        <div className="container max-w-3xl flex gap-2">
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="flex-1 bg-primary text-primary-foreground font-bold text-sm py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Phone size={16} />
            Call Now
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_PHONE}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default DoctorProfilePage;
