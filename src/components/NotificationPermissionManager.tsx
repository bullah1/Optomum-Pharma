import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

/**
 * Auto-requests notification permission when:
 * 1. User is logged in
 * 2. App is running in standalone/PWA mode
 * 3. Permission hasn't been decided yet
 */
const NotificationPermissionManager = () => {
  const { user } = useAuth();
  const { permission, requestPermission } = useNotificationPermission();

  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (permission !== "default") return;

    // In standalone (installed PWA) mode — request immediately
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;

    if (isStandalone) {
      // Small delay so the app feels loaded first
      const timer = setTimeout(() => requestPermission(), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, permission, requestPermission]);

  return null;
};

export default NotificationPermissionManager;
