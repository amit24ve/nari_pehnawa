import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Soft luxury pastel ambient glows for alternating podiums (rose, lavender, cream, champagne, mint, peach)
const PASTEL_GLOWS = [
  "radial-gradient(circle, rgba(254, 205, 211, 0.65) 0%, rgba(254, 226, 226, 0.25) 55%, transparent 75%)",
  "radial-gradient(circle, rgba(233, 213, 255, 0.65) 0%, rgba(243, 232, 255, 0.25) 55%, transparent 75%)",
  "radial-gradient(circle, rgba(254, 240, 138, 0.6) 0%, rgba(254, 243, 199, 0.25) 55%, transparent 75%)",
  "radial-gradient(circle, rgba(254, 215, 170, 0.65) 0%, rgba(255, 237, 213, 0.25) 55%, transparent 75%)",
  "radial-gradient(circle, rgba(204, 251, 241, 0.65) 0%, rgba(236, 253, 245, 0.25) 55%, transparent 75%)",
  "radial-gradient(circle, rgba(251, 207, 232, 0.65) 0%, rgba(254, 240, 138, 0.25) 55%, transparent 75%)",
];

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort by display_order if present
          const sorted = [...data].sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
          setCategories(sorted);
        } else {
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error("Categories fetch error:", err);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getCategoryLink = (cat) => {
    if (cat.link) return cat.link;
    const slug = (cat.slug || cat.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    return `/category/${slug}`;
  };

  const getCategoryImage = (cat) => {
    if (cat.image && cat.image.trim() !== "") return resolveImageUrl(cat.image, DEFAULT_HERO_FALLBACK);
    return DEFAULT_HERO_FALLBACK;
  };

  const getCategoryBadge = (cat, index) => {
    if (cat.badge && cat.badge.trim() !== "") return cat.badge.trim();
    if (cat.tagline && cat.tagline.trim() !== "") {
      const lower = cat.tagline.toLowerCase();
      if (lower.includes("sale") || lower.includes("discount") || lower.includes("%") || lower.includes("off")) {
        return cat.tagline.replace(/[!🌸🖤✨🔥]/g, "").trim();
      }
    }
    // Default badge to match boutique presentation
    return "POPULAR";
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white relative overflow-hidden select-none">
      {/* 3D Keyframe Animations & Ambient Styling */}
      <style>{`
        @keyframes npFloat3D {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.4deg);
          }
        }
        .animate-np-float-0 { animation: npFloat3D 4.5s ease-in-out infinite 0s; }
        .animate-np-float-1 { animation: npFloat3D 4.8s ease-in-out infinite 0.7s; }
        .animate-np-float-2 { animation: npFloat3D 4.4s ease-in-out infinite 1.4s; }
        .animate-np-float-3 { animation: npFloat3D 4.7s ease-in-out infinite 2.1s; }
        .animate-np-float-4 { animation: npFloat3D 4.5s ease-in-out infinite 2.8s; }
        .animate-np-float-5 { animation: npFloat3D 4.9s ease-in-out infinite 3.5s; }
      `}</style>

      {/* Subtle Luxury Background Accents */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FFFDF9] to-transparent opacity-60" />

      {/* Section Header */}
      <div className="container mx-auto px-4 mb-10 sm:mb-14 text-center relative z-10">
        <div className="inline-flex items-center justify-center gap-3 mb-1.5">
          <span className="text-[#8B0000] text-sm animate-pulse">✦</span>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-extrabold text-[#780016] tracking-wider uppercase font-serif">
            SHOP BY CATEGORY
          </h2>
          <span className="text-[#8B0000] text-sm animate-pulse">✦</span>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 font-normal tracking-wide max-w-xl mx-auto">
          Explore handcrafted ethnic designs tailored for authentic elegance
        </p>
        <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-3"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-9 h-9 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        /* Responsive 3D Category Grid:
           - Desktop: 6 categories in one row (lg:grid-cols-6)
           - Tablet: 3 categories per row (md:grid-cols-3)
           - Mobile: 2 categories per row (grid-cols-2)
        */
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-7 lg:gap-5 xl:gap-7 items-end justify-center">
            {categories.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const badgeText = getCategoryBadge(category, index);
              const pastelGlow = PASTEL_GLOWS[index % PASTEL_GLOWS.length];
              const animClass = `animate-np-float-${index % 6}`;
              const isSaleBadge = badgeText.toLowerCase().includes("sale") || badgeText.includes("%") || badgeText.toLowerCase().includes("festive");

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  onClick={() => navigate(catLink)}
                  className="group flex flex-col items-center cursor-pointer text-center relative pt-2"
                  style={{ perspective: "1000px" }}
                >
                  {/* ── Soft Ambient Pastel Glow ── */}
                  <div
                    className="pointer-events-none absolute -top-4 w-36 h-36 sm:w-44 sm:h-44 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 scale-100 group-hover:scale-125 z-0"
                    style={{ background: pastelGlow }}
                  />

                  {/* ── 3D Floating Garment Container ── */}
                  <div
                    className={`relative z-20 w-[116px] h-[132px] sm:w-[130px] sm:h-[148px] md:w-[140px] md:h-[160px] lg:w-[136px] lg:h-[154px] xl:w-[150px] xl:h-[170px] mb-[-18px] sm:mb-[-22px] transition-all duration-500 ease-out group-hover:-translate-y-4 group-hover:scale-105 ${animClass}`}
                  >
                    {/* Golden Metallic Beveled Portal Frame */}
                    <div
                      className="w-full h-full rounded-full p-[3px] transition-all duration-500 relative"
                      style={{
                        background: "linear-gradient(145deg, #FFF6D1 0%, #D4AF37 30%, #8C6514 65%, #FFEAA7 85%, #AA7818 100%)",
                        boxShadow: "0 14px 28px -6px rgba(0, 0, 0, 0.22), 0 6px 14px -3px rgba(212, 175, 55, 0.4), inset 0 1px 2px rgba(255,255,255,0.9)",
                      }}
                    >
                      {/* Inner Circular Garment Frame */}
                      <div className="w-full h-full rounded-full overflow-hidden bg-white relative shadow-inner">
                        <img
                          src={catImg}
                          alt={category.name}
                          loading="lazy"
                          className="w-full h-full rounded-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-112 pointer-events-none"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_HERO_FALLBACK;
                          }}
                        />

                        {/* Specular 3D Glass Light Gleam */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 rounded-full" />
                      </div>
                    </div>

                    {/* Floating Pill Badge */}
                    {badgeText && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap max-w-[92%] pointer-events-none">
                        <span
                          className={`inline-block font-bold text-white uppercase tracking-wider rounded-full shadow-md border border-white/60 transition-transform duration-300 group-hover:scale-105 truncate max-w-full ${
                            isSaleBadge
                              ? "bg-gradient-to-r from-[#8B0000] via-[#A81111] to-[#680000] text-[8px] sm:text-[9px] px-2.5 py-0.5"
                              : "bg-[#8B0000] text-[9px] sm:text-[10px] px-2.5 py-0.5 font-sans"
                          }`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── 3D Circular Podium / Pedestal ── */}
                  <div className="relative z-10 w-full flex flex-col items-center">
                    {/* Podium Contact / Ground Shadows */}
                    <div className="absolute -bottom-1 w-[110px] sm:w-[130px] lg:w-[126px] xl:w-[140px] h-4 bg-stone-900/18 blur-md rounded-[100%] transition-all duration-500 group-hover:blur-lg group-hover:opacity-80 group-hover:scale-110 pointer-events-none" />

                    {/* 3D Pedestal Body */}
                    <div className="relative w-[114px] sm:w-[132px] lg:w-[128px] xl:w-[144px] h-[34px] sm:h-[38px] transition-transform duration-500 group-hover:scale-[1.02]">
                      {/* Cylindrical Base (3D Depth) */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-[22px] sm:h-[25px] rounded-b-[50%] transition-all duration-300"
                        style={{
                          background: "linear-gradient(to right, #6D4C1B 0%, #A57813 15%, #D4AF37 32%, #FFF4C4 50%, #D4AF37 68%, #A57813 85%, #593D11 100%)",
                          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(180, 130, 20, 0.28)",
                        }}
                      >
                        {/* Specular highlight rim line */}
                        <div className="absolute inset-x-0 bottom-1 h-[1.5px] bg-gradient-to-r from-transparent via-amber-100/70 to-transparent" />
                      </div>

                      {/* Pedestal Top Disc (Tilted 3D Ellipse) */}
                      <div
                        className="absolute top-0 inset-x-0 h-[24px] sm:h-[27px] rounded-[50%] p-[2px] transition-all duration-300 group-hover:brightness-105"
                        style={{
                          background: "linear-gradient(135deg, #FFF7D6 0%, #E0BC52 25%, #946312 60%, #FFE187 85%, #84550F 100%)",
                          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)",
                        }}
                      >
                        {/* Top Surface Texture: Soft Marble Sheen */}
                        <div
                          className="w-full h-full rounded-[50%] relative overflow-hidden flex items-center justify-center"
                          style={{
                            background: "radial-gradient(ellipse at 50% 35%, #ffffff 0%, #FCF9F2 45%, #F5EADA 75%, #E2CCA1 100%)",
                          }}
                        >
                          {/* Ambient golden glow on top disc */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 via-transparent to-white/40 pointer-events-none" />

                          {/* Contact Shadow of Floating Garment */}
                          <div className="w-14 sm:w-16 h-3 rounded-[100%] bg-black/25 blur-[3px] transition-all duration-500 group-hover:scale-75 group-hover:opacity-40 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Category Information Below Pedestal ── */}
                  <div className="mt-3.5 sm:mt-4 w-full px-1 z-20">
                    <h3 className="text-xs sm:text-[13px] md:text-sm font-bold text-stone-900 tracking-wide line-clamp-1 group-hover:text-[#8B0000] transition-colors duration-300 font-serif">
                      {category.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium tracking-normal mt-0.5 truncate">
                      Explore Collection
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Categories;
