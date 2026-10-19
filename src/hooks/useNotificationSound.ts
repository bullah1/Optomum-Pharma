import { useCallback, useRef } from "react";

/**
 * Generates a pleasant notification chime using Web Audio API.
 * No external audio file needed.
 */
export const useNotificationSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // Three-tone chime: C5 → E5 → G5 (major triad)
      const notes = [523.25, 659.25, 783.99];
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now + i * 0.14);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.45);
      });
    } catch {
      // Audio not available — fail silently
    }
  }, []);

  return { playSound };
};
