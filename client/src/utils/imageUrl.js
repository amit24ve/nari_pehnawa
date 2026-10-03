const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

export const DEFAULT_FALLBACK_IMAGE = "/product_1_sky_bloom.jpg";

export const DEFAULT_HERO_FALLBACK = "/hero_slide_1.png";

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

  // Clean any multiple /api/ prefixes
  while (cleanPath.startsWith("/api/api/")) {
    cleanPath = cleanPath.replace("/api/api/", "/api/");
  }

  // If starts with /uploads/ without /api, map to /api/uploads/ for robust proxying
  if (cleanPath.startsWith("/uploads/")) {
    cleanPath = `/api${cleanPath}`;
  }

  // If API_BASE is relative ("/api") and cleanPath already starts with "/api/", return directly
  const base = (API_BASE || "").trim().replace(/\/+$/, "");
  if (base === "/api" || base === "") {
    return cleanPath;
  }

  if (base.endsWith("/api") && cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.substring(4);
  }

  return `${base}${cleanPath}`;
};
