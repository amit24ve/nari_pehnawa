import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const VISITOR_ID_KEY = "np_visitor_id";
const SESSION_ID_KEY = "np_session_id";
const MERGED_KEY = "np_visitor_merged";

// Helper to get or generate Visitor ID
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Helper to get or generate Session ID
export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Track generic custom events
export const trackCustomEvent = (eventType, eventData = {}) => {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const path = window.location.pathname;

  fetch(`${API_BASE_URL}/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      path: path,
    }),
    keepalive: true,
  }).catch(() => {});
};

// Track form submissions
export const trackFormSubmission = (formId, formData = {}) => {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  const safeData = { ...formData };
  const sensitiveKeys = ["password", "card", "cvv", "pin", "token"];
  Object.keys(safeData).forEach((key) => {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      safeData[key] = "[REDACTED]";
    }
  });

  fetch(`${API_BASE_URL}/analytics/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      form_id: formId,
      data: safeData,
    }),
    keepalive: true,
  }).catch(() => {});
};

const VisitorTracker = () => {
  const location = useLocation();
  const lastPath = useRef(null);
  const entryTime = useRef(Date.now());
  const maxScroll = useRef(0);

  // 1. Session start & User merge logic
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    // Check if user is logged in
    let userId = null;
    try {
      const userStr = localStorage.getItem("neel_admin_user") || localStorage.getItem("user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        userId = parsed.id || parsed._id || null;
      }
    } catch (e) {
      console.error("Error reading user token for analytics", e);
    }

    // Determine traffic source
    const params = new URLSearchParams(window.location.search);
    let referrer = document.referrer || null;
    let trafficSource = "Direct";

    if (referrer) {
      const host = new URL(referrer).hostname.toLowerCase();
      if (host.includes("google")) trafficSource = "Google Search";
      else if (host.includes("facebook")) trafficSource = "Facebook";
      else if (host.includes("instagram")) trafficSource = "Instagram";
      else if (host.includes("whatsapp")) trafficSource = "WhatsApp";
      else if (host.includes("t.me") || host.includes("telegram")) trafficSource = "Telegram";
      else if (host.includes("twitter") || host.includes("t.co")) trafficSource = "Twitter/X";
      else trafficSource = `Referral: ${host}`;
    }

    const sessionPayload = {
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: userId,
      referrer: referrer,
      traffic_source: trafficSource,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
      landing_page: location.pathname,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "en-US",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
    };

    fetch(`${API_BASE_URL}/analytics/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionPayload),
      keepalive: true
    }).then(() => {
      // If user is logged in, perform backend Visitor merge
      if (userId && !localStorage.getItem(`${MERGED_KEY}_${userId}`)) {
        fetch(`${API_BASE_URL}/analytics/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: visitorId,
            user_id: userId,
            login_status: "Logged User"
          })
        }).then(() => {
          localStorage.setItem(`${MERGED_KEY}_${userId}`, "true");
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [location.pathname]);

  // 2. Track page views, time spent, and scroll heatmaps
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const currentPath = location.pathname;

    const referrer = lastPath.current || document.referrer || null;
    fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: visitorId,
        session_id: sessionId,
        path: currentPath,
        title: document.title || "Storefront",
        referrer: referrer,
      }),
      keepalive: true
    }).catch(() => {});

    maxScroll.current = 0;
    entryTime.current = Date.now();
    lastPath.current = currentPath;

    // Track scroll depth
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / docHeight) * 100));
      if (pct > maxScroll.current) {
        maxScroll.current = pct;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Handle timing metrics on page leave
    return () => {
      window.removeEventListener("scroll", handleScroll);
      
      const timeSpent = Math.round((Date.now() - entryTime.current) / 1000);
      if (timeSpent > 0) {
        fetch(`${API_BASE_URL}/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: visitorId,
            session_id: sessionId,
            path: currentPath,
            title: document.title || "Storefront",
            time_spent: timeSpent,
            scroll_percentage: maxScroll.current,
          }),
          keepalive: true
        }).catch(() => {});

        // Save Scroll Heatmap entry
        fetch(`${API_BASE_URL}/analytics/heatmap/scroll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: visitorId,
            session_id: sessionId,
            path: currentPath,
            max_scroll: maxScroll.current
          }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [location.pathname]);

  // 3. Track Heatmap clicks, e-commerce triggers, and search keywords
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const handleGlobalClick = (e) => {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const currentPath = location.pathname;

      // 3a. Save Heatmap click coordinates (percentages relative to viewport)
      const xPct = parseFloat(((e.clientX / window.innerWidth) * 100).toFixed(2));
      const yPct = parseFloat(((e.clientY / window.innerHeight) * 100).toFixed(2));
      
      const interactiveEl = e.target.closest("button, a, input, [role='button']");
      const targetTag = interactiveEl ? interactiveEl.tagName.toLowerCase() : e.target.tagName.toLowerCase();
      const targetText = interactiveEl ? (interactiveEl.innerText || interactiveEl.value || "").trim().slice(0, 40) : "";

      fetch(`${API_BASE_URL}/analytics/heatmap/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorId,
          session_id: sessionId,
          path: currentPath,
          x: xPct,
          y: yPct,
          target_tag: targetTag,
          target_text: targetText
        }),
        keepalive: true
      }).catch(() => {});

      // 3b. Automatic E-commerce Trigger Mapping
      if (interactiveEl) {
        const text = targetText.toLowerCase();
        
        // Cart Addition
        if (text.includes("add to cart") || text.includes("bag now") || text.includes("add to bag")) {
          // Attempt to extract product metadata if available on product pages
          const pathParts = currentPath.split("/");
          const productId = pathParts[pathParts.length - 1] || "unknown";
          
          trackCustomEvent("cart_add", {
            product_id: productId,
            price: document.querySelector("[data-product-price]")?.innerText || 0.0,
            quantity: 1
          });
        }
        
        // Cart Removal
        if (text.includes("remove") || text.includes("delete item")) {
          trackCustomEvent("cart_remove", {
            product_id: "removed_item",
            price: 0.0,
            quantity: 1
          });
        }

        // Wishlist additions
        if (text.includes("wishlist") || text.includes("favorite") || text.includes("heart")) {
          trackCustomEvent("wishlist_add", {
            product_id: "wishlist_item"
          });
        }

        // Checkout Initiated
        if (text.includes("checkout") || text.includes("buy now") || text.includes("place order")) {
          trackCustomEvent("checkout_started", {
            cart_value: 0.0
          });
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [location.pathname]);

  // 4. Performance Metrics (Speed tracking)
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const reportPerformance = () => {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      // Read timing parameters
      const timing = window.performance.timing;
      if (!timing) return;

      const pageLoadTime = (timing.loadEventEnd - timing.navigationStart) / 1000;
      if (pageLoadTime > 0 && pageLoadTime < 30) {
        fetch(`${API_BASE_URL}/analytics/performance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: visitorId,
            session_id: sessionId,
            path: location.pathname,
            page_load_time: parseFloat(pageLoadTime.toFixed(2))
          })
        }).catch(() => {});
      }
    };

    window.addEventListener("load", reportPerformance);
    return () => window.removeEventListener("load", reportPerformance);
  }, [location.pathname]);

  return null;
};

export default VisitorTracker;
