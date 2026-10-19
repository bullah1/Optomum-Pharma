import { WifiOff } from "lucide-react";
import useOnlineStatus from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
      <WifiOff size={16} />
      <span>No internet connection</span>
    </div>
  );
};

export default OfflineBanner;
