import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import heroPharmacist from "@/assets/hero-pharmacist.jpg";

// Preload hero image for LCP
if (typeof window !== "undefined") {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = heroPharmacist;
  link.fetchPriority = "high";
  document.head.appendChild(link);
}

const fallbackSlides = [
  {
    image_url: heroPharmacist,
    eyebrow: "Optimum HLB · Index Laboratories",
    title: "Herbal medicine,",
    highlight: "crafted with care",
    subtitle: "Authentic herbal and Ayurvedic medicines, delivered nationwide.",
    cta_text: "Explore products",
    cta_link: "/categories",
    overlay: true,
  },
];

import CorporateHero from "@/components/CorporateHero";

const BannerCarousel = () => {
  const queryClient = useQueryClient();
  const cachedBanners = queryClient.getQueryData<any[]>(["homepage-banners"]);

  // If admin has uploaded banners, keep using them; otherwise use the premium hero
  const slides =
    cachedBanners && cachedBanners.length > 0 ? cachedBanners : fallbackSlides;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border h-[200px] sm:h-[260px] md:h-[380px] shadow-ios"
      aria-label="Hero banner"
      role="region"
    >
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {slides.map((slide: any, i: number) => {
            const showOverlay = slide.overlay !== false && (slide.title || slide.eyebrow);
            const inner = showOverlay ? (
              <div className="relative w-full h-full bg-white">
                {/* Two-column layout: image left, text right (same on mobile + desktop) */}
                <div className="absolute inset-0 grid grid-cols-[45%_55%] sm:grid-cols-[42%_58%] md:grid-cols-2">
                  {/* Image column */}
                  <div className="relative h-full overflow-hidden bg-secondary/40">
                    <img
                      src={slide.image_url || heroPharmacist}
                      alt={slide.title ? `${slide.title} ${slide.highlight ?? ""}` : `Banner ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "25% center" }}
                      width={1920}
                      height={1080}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding={i === 0 ? "sync" : "async"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                    />
                    {/* Soft fade into white text column */}
                    <div className="absolute inset-y-0 right-0 w-8 md:w-20 bg-gradient-to-r from-transparent to-white" />
                  </div>

                  {/* Text column */}
                  <div className="flex flex-col justify-center px-3 sm:px-5 md:px-10 py-4">
                    {slide.eyebrow && (
                      <p className="text-[9px] sm:text-[11px] md:text-sm font-semibold tracking-[0.12em] uppercase text-primary mb-1.5 md:mb-3 leading-tight">
                        {slide.eyebrow}
                      </p>
                    )}
                    <h2 className="text-[15px] sm:text-[20px] md:text-[34px] font-bold leading-[1.15] md:leading-tight text-foreground">
                      {slide.title}
                      {slide.highlight && (
                        <>
                          <br />
                          <span className="text-primary">{slide.highlight}</span>
                        </>
                      )}
                    </h2>
                    {slide.subtitle && (
                      <p className="hidden md:block text-sm md:text-base text-muted-foreground mt-3 max-w-md">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.cta_text && (
                      <Link
                        to={slide.cta_link || "/"}
                        className="inline-flex w-fit items-center gap-1.5 mt-2.5 md:mt-5 px-3.5 md:px-6 py-1.5 md:py-3 bg-primary text-primary-foreground text-[11px] md:text-sm font-semibold rounded-full shadow-md md:shadow-lg hover:shadow-xl active:scale-95 transition-all"
                      >
                        {slide.cta_text}
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={slide.image_url || heroPharmacist}
                  alt={slide.title ? `${slide.title} ${slide.highlight ?? ""}` : `Banner ${i + 1}`}
                  className="w-full h-full object-cover object-center"
                  width={1920}
                  height={1080}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </div>
            );

            return (
              <div
                key={i}
                className="min-w-0 shrink-0 grow-0 basis-full h-[200px] sm:h-[260px] md:h-[380px]"
              
              >
                {slide.cta_link && !showOverlay ? (
                  <Link to={slide.cta_link} className="block h-full">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
          role="tablist"
          aria-label="Banner slides"
        >
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 min-w-[24px] min-h-[24px] flex items-center justify-center ${
                i === selectedIndex ? "" : ""
              }`}
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`Slide ${i + 1} of ${slides.length}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === selectedIndex ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-foreground/25"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const HeroBanner = () => {
  const queryClient = useQueryClient();
  const cachedBanners = queryClient.getQueryData<any[]>(["homepage-banners"]);
  // Admin-uploaded banners show as a carousel; otherwise the corporate hero
  return cachedBanners && cachedBanners.length > 0 ? <BannerCarousel /> : <CorporateHero />;
};

export default HeroBanner;
