import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const PWAUpdatePrompt = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleSWUpdate = async () => {
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return;

      const showUpdateToast = () => {
        toast({
          title: "New Update Available",
          description: "A new version is available. Please refresh.",
          duration: 15000,
          action: (
            <button
              onClick={() => {
                reg.waiting?.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
              }}
              className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors tap-effect"
            >
              Update
            </button>
          ),
        });
      };

      if (reg.waiting) {
        showUpdateToast();
      }

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        newSW?.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateToast();
          }
        });
      });
    };

    if ("serviceWorker" in navigator) {
      handleSWUpdate();
    }
  }, [toast]);

  return null;
};

export default PWAUpdatePrompt;
