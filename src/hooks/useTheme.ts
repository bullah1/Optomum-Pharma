import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem("optimumpharmahlb-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return null;
}

export function useTheme() {
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("optimumpharmahlb-theme", "light");
  }, []);

  const setTheme = useCallback((_t: Theme) => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  return { theme, setTheme, toggleTheme, isDark: false };
}
