import { useState, useRef, useEffect, forwardRef, ImgHTMLAttributes, type ReactNode } from "react";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string | null | undefined;
  alt: string;
  fallback?: string | ReactNode;
  /** false = eager load (above-the-fold), true = lazy (default) */
  lazy?: boolean;
  /** Aspect ratio class e.g. "aspect-square", "aspect-[4/3]" */
  aspectClass?: string;
  /** Explicit width for CLS prevention */
  width?: number;
  /** Explicit height for CLS prevention */
  height?: number;
  /** Object fit mode */
  objectFit?: "cover" | "contain";
  /** Responsive sizes hint for srcset (default: auto) */
  sizes?: string;
  /** Enable blur-up placeholder (default: true) */
  blurPlaceholder?: boolean;
}

/**
 * Production-grade optimized image component
 *
 * ✅ WebP auto-serve with JPEG/PNG fallback (<picture>)
 * ✅ IntersectionObserver lazy loading + native loading="lazy"
 * ✅ Explicit width/height to avoid CLS
 * ✅ Responsive srcset via Supabase Image Transformation
 * ✅ Blur-up placeholder for perceived performance
 * ✅ Above-the-fold eager loading support
 * ✅ Fade-in animation on load
 * ✅ Graceful fallback on error / missing src
 */

/** Generate srcset for responsive images using Supabase transform or raw URL */
function buildSrcSet(src: string, widths: number[] = [320, 480, 640, 960, 1280]) {
  // If it's a Supabase storage URL, we can use render/image transform
  if (src.includes("supabase.co/storage")) {
    return widths
      .map((w) => {
        const url = new URL(src);
        url.searchParams.set("width", String(w));
        url.searchParams.set("quality", "80");
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }
  // For external URLs, return single src (no transform available)
  return undefined;
}

/** Build WebP variant URL for Supabase storage */
function buildWebPUrl(src: string) {
  if (src.includes("supabase.co/storage")) {
    const url = new URL(src);
    url.searchParams.set("format", "webp");
    url.searchParams.set("quality", "80");
    return url.toString();
  }
  return undefined;
}

function buildWebPSrcSet(src: string, widths: number[] = [320, 480, 640, 960, 1280]) {
  if (src.includes("supabase.co/storage")) {
    return widths
      .map((w) => {
        const url = new URL(src);
        url.searchParams.set("width", String(w));
        url.searchParams.set("quality", "80");
        url.searchParams.set("format", "webp");
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }
  return undefined;
}

const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(({
  src,
  alt,
  fallback = "",
  lazy = true,
  aspectClass,
  width,
  height,
  objectFit = "cover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  blurPlaceholder = true,
  className = "",
  style,
  ...props
}, ref) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // Fallback state
  if (!src || error) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-secondary/50 ${aspectClass || ""} ${className}`}
        style={{ width: width || undefined, height: height || undefined, ...style }}
        role="img"
        aria-label={alt}
      >
        {typeof fallback === "string" ? (
          <span className="text-3xl opacity-40">{fallback}</span>
        ) : (
          fallback || <span className="text-3xl opacity-40">📦</span>
        )}
      </div>
    );
  }

  const srcSet = buildSrcSet(src);
  const webpSrcSet = buildWebPSrcSet(src);
  const webpSrc = buildWebPUrl(src);
  const hasWebP = !!webpSrc;
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${aspectClass || ""} ${className}`}
      style={{ width: width || undefined, height: height || undefined, ...style }}
    >
      {/* Blur placeholder */}
      {blurPlaceholder && !loaded && (
        <div
          className="absolute inset-0 bg-secondary/60 animate-pulse"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />
      )}

      {inView && (
        <picture>
          {/* WebP source — auto format for Supabase storage URLs */}
          {hasWebP && (
            <source
              type="image/webp"
              srcSet={webpSrcSet || webpSrc}
              sizes={webpSrcSet ? sizes : undefined}
            />
          )}

          {/* Original format with responsive srcset */}
          {srcSet && (
            <source
              srcSet={srcSet}
              sizes={sizes}
            />
          )}

          {/* Fallback <img> */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? "lazy" : "eager"}
            decoding={lazy ? "async" : "sync"}
            fetchPriority={lazy ? "auto" : "high"}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full ${fitClass} transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            {...props}
          />
        </picture>
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
export default OptimizedImage;
