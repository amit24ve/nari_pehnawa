const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

export const DEFAULT_FALLBACK_IMAGE =
  "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const DEFAULT_HERO_FALLBACK =
  "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=1600";

/**
 * Resolves any image URL (relative uploads, API uploads, CDN, or local public files)
 * into a fully accessible absolute URL or clean public path.
 */
export const resolveImageUrl = (img, fallback = DEFAULT_FALLBACK_IMAGE) => {
  if (!img || typeof img !== "string") return fallback;
  const trimmed = img.trim();
  if (!trimmed) return fallback;

  // External, data URL or blob
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Local client public folder assets (e.g. /hero_slide_1.png, /logo.png)
  if (
    trimmed.startsWith("/hero_") ||
    trimmed.startsWith("/category_") ||
    trimmed.startsWith("/gob-") ||
    trimmed.startsWith("/logo") ||
    trimmed.startsWith("/assets/")
  ) {
    return trimmed;
  }

  // Backend uploads (/api/uploads/..., /uploads/...)
  let cleanPath = trimmed;
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  // If starts with /uploads/ without /api, map to /api/uploads/ for robust proxying
  if (cleanPath.startsWith("/uploads/")) {
    cleanPath = `/api${cleanPath}`;
  }

  return `${API_BASE}${cleanPath}`;
};
