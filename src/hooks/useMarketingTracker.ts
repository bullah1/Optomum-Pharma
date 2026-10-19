import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "mkt_session_id";
const UTM_KEY = "mkt_utm";
const FIRST_VISIT_KEY = "mkt_first_visit";
const LAST_VISIT_KEY = "mkt_last_visit";

function generateSessionId() {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function getStoredUTM() {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
  } catch { return {}; }
}

export function getFirstVisitId() {
  return localStorage.getItem(FIRST_VISIT_KEY);
}

export function getLastVisitId() {
  return sessionStorage.getItem(LAST_VISIT_KEY);
}

export function useMarketingTracker() {
  useEffect(() => {
    // Defer marketing tracking to not block initial render
    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams(window.location.search);
          const utm_source = params.get("utm_source");
          const utm_medium = params.get("utm_medium");
          const utm_campaign = params.get("utm_campaign");
          const utm_term = params.get("utm_term");
          const utm_content = params.get("utm_content");

          const hasUTM = utm_source || utm_medium || utm_campaign;

          let sessionId = sessionStorage.getItem(SESSION_KEY);
          if (!sessionId) {
            sessionId = generateSessionId();
            sessionStorage.setItem(SESSION_KEY, sessionId);
          }

          const userId = await getCurrentUserId();

          if (hasUTM) {
            const utmData = { utm_source, utm_medium, utm_campaign, utm_term, utm_content };
            sessionStorage.setItem(UTM_KEY, JSON.stringify(utmData));

            const { data, error } = await supabase
              .from("marketing_visits")
              .insert({
                session_id: sessionId!,
                user_id: userId,
                utm_source,
                utm_medium,
                utm_campaign,
                utm_term,
                utm_content,
                referrer: document.referrer || null,
                landing_page: window.location.pathname,
                device_type: getDeviceType(),
                browser: getBrowser(),
                os: getOS(),
              })
              .select("id")
              .maybeSingle();

            if (!error && data) {
              if (!localStorage.getItem(FIRST_VISIT_KEY)) {
                localStorage.setItem(FIRST_VISIT_KEY, data.id);
              }
              sessionStorage.setItem(LAST_VISIT_KEY, data.id);
            } else if (error) {
              console.warn("Marketing visit skipped:", error.message);
            }
          }

          trackMarketingEvent("page_view", { page: window.location.pathname });
        } catch (error) {
          console.warn("Marketing tracker skipped:", error);
        }
      })();
    }, 2000); // 2s delay

    // Track time spent on page
    const pageStart = Date.now();
    const currentPage = window.location.pathname;
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - pageStart) / 1000);
      if (timeSpent > 3) {
        trackMarketingEvent("page_time", { page: currentPage, seconds: timeSpent });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Track page time on SPA navigation
      const timeSpent = Math.round((Date.now() - pageStart) / 1000);
      if (timeSpent > 3) {
        trackMarketingEvent("page_time", { page: currentPage, seconds: timeSpent });
      }
    };
  }, []);
}

export function trackMarketingEvent(eventType: string, eventData: Record<string, any> = {}) {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  void getCurrentUserId()
    .then(async (userId) => {
      const { error } = await supabase.from("marketing_events").insert({
        session_id: sessionId,
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname,
      });

      if (error) {
        console.warn("Marketing event skipped:", error.message);
      }
    })
    .catch((error) => {
      console.warn("Marketing event skipped:", error);
    });
}
