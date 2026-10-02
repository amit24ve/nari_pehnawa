/**
 * Guest/Visitor Identity Management
 * 
 * Provides a permanent, unique anonymous identifier for guest interactions
 * (Reels Like, Campaign Voting, Analytics) that persists across page refreshes,
 * navigation, and browser sessions.
 */

const GUEST_ID_KEY = 'nari_visitor_id';
const LEGACY_GUEST_ID_KEY = 'nari_guest_id';

export function getPersistentGuestId() {
  try {
    // 1. Check primary key
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      // 2. Check legacy key
      id = localStorage.getItem(LEGACY_GUEST_ID_KEY);
    }

    // 3. If still missing, generate robust unique UUID-like identifier
    if (!id || typeof id !== 'string' || id.trim().length < 8) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = 'np_gst_' + crypto.randomUUID();
      } else {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 12);
        const extraRand = Math.random().toString(36).substring(2, 8);
        id = `np_gst_${timestamp}_${randomPart}_${extraRand}`;
      }
    }

    // Always mirror to both keys for backward and forward compatibility
    localStorage.setItem(GUEST_ID_KEY, id);
    localStorage.setItem(LEGACY_GUEST_ID_KEY, id);

    return id;
  } catch (e) {
    // Fallback if localStorage is inaccessible (e.g. strict private mode)
    return 'np_gst_anon_client_session';
  }
}

/**
 * Returns header dictionary to attach with API requests
 */
export function getGuestHeaders(token = null) {
  const guestId = getPersistentGuestId();
  const headers = {
    'X-Visitor-Id': guestId,
    'X-Guest-Id': guestId,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Try reading token from localStorage if available
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (e) {
      // ignore
    }
  }

  return headers;
}
