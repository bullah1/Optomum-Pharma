import { useState, useEffect } from "react";
import { Download, Smartphone, Wifi, Zap, ArrowLeft, Share, MoreVertical, Check, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { permission, requestPermission } = useNotificationPermission();

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "Super Fast", desc: "Loads fast like a native app" },
    { icon: Wifi, title: "Works Offline", desc: "Browse even without internet" },
    { icon: Smartphone, title: "Home Screen", desc: "Opens like an app" },
    { icon: Bell, title: "Notification Sound", desc: "Get instant order updates" },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title="Install App" />
      <main className="container max-w-lg mx-auto py-6 px-4 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <Download size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Install Optimum Pharmaceuticals HLB App</h1>
          <p className="text-muted-foreground text-sm">Install directly on your phone — no app store needed!</p>
        </div>

        {/* Features */}
        <div className="grid gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install Action */}
        {isInstalled ? (
          <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <Check size={32} className="text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-primary">App installed! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">Open Optimum Pharmaceuticals HLB from your home screen</p>
          </div>
        ) : isIOS ? (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <p className="text-sm font-semibold text-foreground text-center">Install on iPhone / iPad</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
                <p className="text-sm text-foreground">In Safari browser, tap the <Share size={14} className="inline text-primary" /> (Share) button</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
                <p className="text-sm text-foreground">Select "Add to Home Screen"</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">3</div>
                <p className="text-sm text-foreground">Tap "Add" — done!</p>
              </div>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Install Now
          </button>
        ) : (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <p className="text-sm font-semibold text-foreground text-center">Install on Android</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
                <p className="text-sm text-foreground">In Chrome browser, open the <MoreVertical size={14} className="inline text-primary" /> menu</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
                <p className="text-sm text-foreground">Tap "Install app" or "Add to Home screen"</p>
              </div>
            </div>
          </div>
        )}
        {/* Notification Permission */}
        {typeof Notification !== "undefined" && permission !== "granted" && (
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">Get order updates, offers — all with sound</p>
              </div>
            </div>
            <button
              onClick={() => requestPermission()}
              className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            >
              <Bell size={16} /> Allow Notifications
            </button>
          </div>
        )}
        {typeof Notification !== "undefined" && permission === "granted" && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <Check size={18} className="text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">Notifications enabled — you'll get updates with sound ✅</p>
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default InstallPage;
