import { useState, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 80;
const MAX_PULL = 130;

const PullToRefresh = ({ children, onRefresh }: { children: ReactNode; onRefresh: () => Promise<void> }) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Rubber-band resistance effect
      const resistance = 1 - Math.min(diff / 600, 0.6);
      setPullDistance(Math.min(diff * resistance * 0.5, MAX_PULL));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(50);
      if (navigator.vibrate) navigator.vibrate(10);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const ready = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance > 8 || refreshing ? Math.max(pullDistance, refreshing ? 50 : 0) : 0,
          opacity: pullDistance > 8 || refreshing ? 1 : 0,
          transition: pulling ? "none" : "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            transform: `scale(${refreshing ? 1 : 0.6 + progress * 0.4})`,
            transition: pulling ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Circular progress ring */}
          <svg width="32" height="32" viewBox="0 0 32 32" className="absolute">
            <circle
              cx="16" cy="16" r="12"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2.5"
            />
            {!refreshing && (
              <circle
                cx="16" cy="16" r="12"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={75.4}
                strokeDashoffset={75.4 * (1 - progress)}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  transition: pulling ? "none" : "stroke-dashoffset 0.3s ease",
                }}
              />
            )}
          </svg>
          <RefreshCw
            size={16}
            strokeWidth={2.2}
            className={`text-primary ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
              transition: pulling ? "none" : "transform 0.3s ease",
              opacity: ready || refreshing ? 1 : 0.6,
            }}
          />
        </div>
      </div>

      {/* Content with bounce transform */}
      <div
        style={{
          transform: pullDistance > 0 && !refreshing ? `translateY(${pullDistance * 0.05}px)` : "none",
          transition: pulling ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
