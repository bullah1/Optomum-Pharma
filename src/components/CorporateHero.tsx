import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Leaf, Truck } from "lucide-react";

/** Default homepage hero — corporate, manufacturer-led. Admin-uploaded banners replace it. */
const CorporateHero = () => (
  <section
    aria-label="Optimum Pharmaceuticals HLB"
    className="relative overflow-hidden rounded-2xl border border-border bg-[#0B2540] text-white"
  >
    {/* Brand glow */}
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F8931D]/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-[#01AEF2]/20 blur-3xl" />

    <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-6 px-5 py-7 sm:px-8 md:px-12 md:py-12">
      <div className="flex flex-col justify-center">
        <p className="text-[10px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#F8931D]">
          Optimum Pharmaceuticals HLB
        </p>
        <h1 className="mt-2.5 text-[22px] sm:text-3xl md:text-[40px] font-bold leading-[1.15] tracking-tight">
          Herbal medicine,
          <br className="hidden sm:block" /> crafted with care.
        </h1>
        <p className="mt-3 max-w-lg text-[13px] md:text-base text-white/75 leading-relaxed">
          Authentic herbal, Ayurvedic and nutraceutical medicines from Optimum Pharmaceuticals HLB and
          Index Laboratories — supplied directly by the manufacturer, delivered across Bangladesh.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F8931D] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:bg-[#e8850f] active:scale-95 transition"
          >
            Explore products <ArrowRight size={15} />
          </Link>
          <a
            href="#our-brands"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Our brands
          </a>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-white/5 rotate-6" />
          <div className="relative rounded-[2rem] bg-white p-8 shadow-2xl">
            <img src="/images/optimum-mark.png" alt="" width={150} height={150} className="h-36 w-36 object-contain" />
          </div>
        </div>
      </div>
    </div>

    <div className="relative hidden sm:grid grid-cols-3 border-t border-white/10 text-[10.5px] sm:text-xs text-white/80">
      {[
        { Icon: ShieldCheck, label: "Manufacturer direct" },
        { Icon: Leaf, label: "Herbal & Ayurvedic" },
        { Icon: Truck, label: "Nationwide delivery" },
      ].map(({ Icon, label }) => (
        <div key={label} className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 border-r border-white/10 last:border-r-0">
          <Icon size={14} className="text-[#F8931D] shrink-0" /> {label}
        </div>
      ))}
    </div>
  </section>
);

export default CorporateHero;
