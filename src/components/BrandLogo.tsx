import { Link } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/** Brand colors (from logo): orange #F8931D, blue #01AEF2 */
const BRAND_ORANGE = "#F8931D";
const BRAND_BLUE = "#01AEF2";

const BrandLogo = ({ size = "md", showTagline = false }: BrandLogoProps) => {
  const markSize = { sm: 30, md: 38, lg: 46 }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  const subSize = {
    sm: "text-[7.5px]",
    md: "text-[8.5px]",
    lg: "text-[10px]",
  }[size];

  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Optimum Pharmaceuticals HLB — Home">
      <img
        src="/images/optimum-mark.png"
        alt=""
        width={markSize}
        height={markSize}
        style={{ width: markSize, height: markSize }}
        className="object-contain shrink-0"
        fetchPriority="high"
        decoding="async"
      />
      <span className="flex flex-col leading-none">
        <span className={`${textSize} font-extrabold tracking-tight leading-none`}>
          <span style={{ color: BRAND_ORANGE }}>Optimum</span>{" "}
          <span style={{ color: BRAND_BLUE }}>HLB</span>
        </span>
        <span className={`${subSize} font-bold tracking-[0.18em] text-foreground/70 uppercase mt-0.5`}>
          Pharmaceuticals
        </span>
        {showTagline && (
          <span className={`${subSize} text-muted-foreground leading-tight mt-0.5`}>
            Herbal & Ayurvedic Medicines
          </span>
        )}
      </span>
    </Link>
  );
};

export default BrandLogo;
