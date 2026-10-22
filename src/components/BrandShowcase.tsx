import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, BadgeCheck } from "lucide-react";

/** The two companies this store sells — shown prominently on the homepage. */
const BRANDS = [
  {
    name: "Optimum Pharmaceuticals HLB",
    slug: "optimum-pharmaceuticals-hlb",
    tagline: "হারবাল ও নিউট্রাসিউটিক্যাল · Herbal & Nutraceuticals",
    logo: "/images/optimum-mark.png",
    initial: "O",
    color: "#F8931D",
    bg: "from-[#FFF4E6] to-white",
  },
  {
    name: "Index Laboratories Ltd",
    slug: "index-laboratories-ltd",
    tagline: "আয়ুর্বেদিক ও ইউনানি · Ayurvedic & Unani",
    logo: null as string | null,
    initial: "I",
    color: "#01AEF2",
    bg: "from-[#E6F7FE] to-white",
  },
];

const BrandShowcase = memo(() => {
  const { data: brands } = useQuery<any[]>({
    queryKey: ["top-brands"],
    queryFn: () => [],
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });
  const countFor = (name: string) => brands?.find((b) => b.name === name)?.count;

  return (
    <section aria-labelledby="brands-heading">
      <h2 id="brands-heading" className="text-base font-bold text-foreground px-1 mb-3">
        আমাদের কোম্পানি · Our Brands
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BRANDS.map((b) => {
          const count = countFor(b.name);
          return (
            <Link
              key={b.slug}
              to={`/company/${b.slug}`}
              className={`group flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br ${b.bg} p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all`}
            >
              <div
                className="w-14 h-14 rounded-xl bg-white border flex items-center justify-center shrink-0 overflow-hidden"
                style={{ borderColor: `${b.color}40` }}
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} width={44} height={44} className="w-11 h-11 object-contain" loading="lazy" />
                ) : (
                  <span className="text-2xl font-extrabold" style={{ color: b.color }}>{b.initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground flex items-center gap-1 leading-tight">
                  {b.name} <BadgeCheck size={14} style={{ color: b.color }} className="shrink-0" />
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{b.tagline}</p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: b.color }}>
                  {count ? `${count}টি প্রোডাক্ট দেখুন` : "সব প্রোডাক্ট দেখুন"}
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
});

BrandShowcase.displayName = "BrandShowcase";
export default BrandShowcase;
