import { useState, useEffect } from "react";
import { Download, X, Smartphone, Zap, Wifi } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // Check if user dismissed recently (24h cooldown)
    const lastDismissed = localStorage.getItem("pwa_banner_dismissed");
    if (lastDismissed && Date.now() - Number(lastDismissed) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show banner after 5 seconds of browsing
    const timer = setTimeout(() => setShowBanner(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDismissed(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa_banner_dismissed", String(Date.now()));
  };

  // Don't render if installed, dismissed, or not ready
  if (isStandalone || dismissed || !showBanner) return null;

  return (
    <div className="mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl border border-primary/20 p-4 overflow-hidden">
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3.5">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Smartphone size={24} className="text-primary-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold text-foreground leading-tight">
              Install Optimum Pharmaceuticals HLB App
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Zap size={10} className="text-primary" /> Fast
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Wifi size={10} className="text-primary" /> Offline
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Download size={10} className="text-primary" /> Free
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform shadow-md shadow-primary/20"
            >
              <Download size={14} /> Install Now
            </button>
          ) : (
            <Link
              to="/install"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform shadow-md shadow-primary/20"
            >
              <Download size={14} /> View Install Guide
            </Link>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-[12px] font-medium active:scale-[0.97] transition-transform"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
