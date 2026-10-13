/**
 * Influencer Collaboration & Referral Attribution Utility
 * Nari Pehnawa - Privacy-conscious, 30-day first-party attribution tracking.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const STORAGE_REF_KEY = "np_collab_ref";
const STORAGE_TIME_KEY = "np_collab_time";
const VISITOR_ID_KEY = "np_visitor_id";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

/**
 * Safely get or create a persistent anonymous visitor ID.
 */
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * Capture ?ref= from the current URL if present.
 * Updates the 30-day attribution window and records the click on backend asynchronously.
 */
export function captureReferral() {
  if (typeof window === "undefined") return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref") || urlParams.get("collab_ref");

    if (refCode && refCode.trim()) {
      const cleanRef = refCode.trim().toUpperCase();

      // Store in localStorage with timestamp (30-day window)
      localStorage.setItem(STORAGE_REF_KEY, cleanRef);
      localStorage.setItem(STORAGE_TIME_KEY, Date.now().toString());

      // Send non-blocking beacon/fetch to backend
      const payload = {
        referral_code: cleanRef,
        visitor_id: getVisitorId(),
        landing_page: window.location.pathname + window.location.search,
        referrer: document.referrer || "",
      };

      fetch(`${API_BASE_URL}/collab/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((err) => {
        // Silently tolerate tracking errors so user shopping is NEVER disturbed
        console.debug("[Collab] Click record notice:", err);
      });
    }
  } catch (e) {
    // Graceful error silence
    console.debug("[Collab] Capture exception:", e);
  }
}

/**
 * Retrieve the active referral code if within the 30-day attribution window.
 * Returns null if expired or not found.
 */
export function getActiveCollabRef() {
  if (typeof window === "undefined") return null;

  try {
    const refCode = localStorage.getItem(STORAGE_REF_KEY);
    const timeStr = localStorage.getItem(STORAGE_TIME_KEY);

    if (!refCode || !timeStr) return null;

    const recordedTime = parseInt(timeStr, 10);
    const now = Date.now();

    if (isNaN(recordedTime) || now - recordedTime > ATTRIBUTION_WINDOW_MS) {
      // Attribution window expired
      clearActiveCollabRef();
      return null;
    }

    return refCode.trim().toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Clear the stored referral attribution.
 */
export function clearActiveCollabRef() {
  try {
    localStorage.removeItem(STORAGE_REF_KEY);
    localStorage.removeItem(STORAGE_TIME_KEY);
  } catch (_) {}
}

/**
 * Return detailed attribution metadata for checkout/analytics.
 */
export function getReferralAttributionInfo() {
  try {
    const ref = getActiveCollabRef();
    if (!ref) return null;

    const timeStr = localStorage.getItem(STORAGE_TIME_KEY);
    const recordedTime = parseInt(timeStr, 10);
    const daysLeft = Math.max(
      0,
      Math.ceil((ATTRIBUTION_WINDOW_MS - (Date.now() - recordedTime)) / (24 * 60 * 60 * 1000))
    );

    return {
      code: ref,
      recordedAt: new Date(recordedTime).toISOString(),
      daysRemaining: daysLeft,
    };
  } catch {
    return null;
  }
}
