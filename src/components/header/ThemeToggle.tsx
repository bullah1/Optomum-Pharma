import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = ({ size = "desktop" }: { size?: "desktop" | "mobile" }) => {
  const { toggleTheme, isDark } = useTheme();

  const isSmall = size === "mobile";
  const w = isSmall ? "w-[32px]" : "w-[42px]";
  const h = isSmall ? "h-[18px]" : "h-[24px]";
  const thumbSize = isSmall ? "w-[14px] h-[14px]" : "w-5 h-5";
  const thumbPos = isDark ? (isSmall ? "left-[16px]" : "left-[20px]") : "left-[2px]";
  const iconSize = isSmall ? 8 : 11;

  return (
    <button
      onClick={toggleTheme}
      className={`relative ${w} ${h} rounded-full transition-colors duration-300 shrink-0`}
      style={{ background: isDark ? "hsl(32 94% 56%)" : "hsl(210 15% 85%)" }}
      aria-label="Toggle dark mode"
    >
      <div
        className={`absolute top-[2px] ${thumbSize} rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 ${thumbPos}`}
      >
        {isDark ? (
          <Moon size={iconSize} className="text-primary" />
        ) : (
          <Sun size={iconSize} className="text-amber-500" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
