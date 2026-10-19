import { useState, useEffect } from "react";
import { Download, X, Zap, Wifi, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_popup_dismissed_at";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const SHOW_DELAY_MS = 12_000; // 12s after page load

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const PWAInstallPopup = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    // Already installed → never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return;

    // Cooldown after dismiss
    const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (last && Date.now() - last < COOLDOWN_MS) return;

    let prompt: BeforeInstallPromptEvent | null = null;
    let timer: number | undefined;

    const handler = (e: Event) => {
      e.preventDefault();
      prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari fallback (no beforeinstallprompt event)
    if (isIOS()) {
      timer = window.setTimeout(() => {
        setIosMode(true);
        setOpen(true);
      }, SHOW_DELAY_MS);
    }

    const installed = () => setOpen(false);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setOpen(false);
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-popup-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-6 pb-7 mx-0 sm:mx-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>

        {/* App icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
            <img
              src="/pwa-192x192.png"
              alt="Optimum Pharmaceuticals HLB"
              className="w-12 h-12 rounded-xl"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          </div>
        </div>

        <h2 id="pwa-popup-title" className="text-center text-lg font-bold text-foreground">
          Install Optimum Pharmaceuticals HLB App
        </h2>
        <p className="text-center text-[13px] text-muted-foreground mt-1.5 px-2">
          Faster checkout, instant order updates &amp; offline access — just like a native app.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary/60">
            <Zap size={18} className="text-primary" />
            <span className="text-[10.5px] font-medium text-foreground">Faster</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary/60">
            <Wifi size={18} className="text-primary" />
            <span className="text-[10.5px] font-medium text-foreground">Offline</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary/60">
            <Bell size={18} className="text-primary" />
            <span className="text-[10.5px] font-medium text-foreground">Updates</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 space-y-2">
          {iosMode ? (
            <div className="text-[12.5px] text-foreground bg-secondary/60 rounded-xl p-3 leading-relaxed">
              On iPhone: tap <span className="font-semibold">Share</span> in Safari, then{" "}
              <span className="font-semibold">"Add to Home Screen"</span>.
            </div>
          ) : (
            <button
              onClick={install}
              disabled={!deferredPrompt}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              <Download size={16} /> Install Now
            </button>
          )}
          <button
            onClick={close}
            className="w-full py-2.5 rounded-xl text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPopup;
