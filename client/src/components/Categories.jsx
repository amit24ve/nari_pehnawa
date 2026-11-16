import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Stylized Ethnic Kurti / Apparel Icon (Strictly fashion garment - no ladies, no stars, no emojis)
const KurtiIcon = ({ className = "w-5 h-5 text-[#8B0000]" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Clean, luxury kurti outline with elegant neckline and side slits */}
    <path d="M7 2.5L9.5 5H14.5L17 2.5L20 6.5L18 8L17 7.2V21C17 21.55 16.55 22 16 22H14.5L14 15.5H10L9.5 22H8C7.45 22 7 21.55 7 21V7.2L6 8L4 6.5L7 2.5Z" />
    <path
      d="M10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5H10Z"
      fill="#ffffff"
      opacity="0.85"
    />
  </svg>
);

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort(
            (a, b) => (a.display_order || 99) - (b.display_order || 99)
          );
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
    const slug = (cat.slug || cat.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");
    return `/category/${slug}`;
  };

  const getCategoryImage = (cat) => {
    if (cat.image && cat.image.trim() !== "")
      return resolveImageUrl(cat.image, DEFAULT_HERO_FALLBACK);
    return DEFAULT_HERO_FALLBACK;
  };

  const getCategoryBadge = (cat) => {
    if (cat.badge && cat.badge.trim()) {
      const b = cat.badge.trim();
      return b.length > 14 ? `${b.slice(0, 12).toUpperCase()}...` : b.toUpperCase();
    }
    const raw = (cat.tagline || "").trim();
    if (raw) {
      const lower = raw.toLowerCase();
      const matchPercent = raw.match(/(\d+%\s*off|\d+%\s*discount)/i);
      if (matchPercent) return `UP TO ${matchPercent[1].toUpperCase()}`;
      if (lower.includes("mega sale")) return "MEGA SALE";
      if (lower.includes("sale")) return "SALE";
      if (lower.includes("festive")) return "FESTIVE DEAL";
      if (
        lower.includes("new arrival") ||
        lower.includes("new arrivals") ||
        (cat.name && cat.name.toLowerCase().includes("new"))
      )
        return "NEW ARRIVAL";
      if (lower.includes("trending")) return "TRENDING";
      if (lower.includes("hot")) return "HOT DEAL";
    }
    return "POPULAR";
  };

  // Continuous auto-sliding animation for multiple / unlimited categories
  useEffect(() => {
    if (loading || isPaused || categories.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    let animId;
    const step = () => {
      if (!isPaused && !isDragging.current && el) {
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 0.8;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [loading, isPaused, categories.length]);

  const onMouseDown = (e) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  // Ensure seamless continuous loop when scrolling
  const displayCategories =
    categories.length < 6
      ? [...categories, ...categories, ...categories, ...categories]
      : [...categories, ...categories];

  return (
    <section className="py-10 sm:py-14 bg-white relative overflow-hidden select-none border-b border-stone-100">
      {/* 3D Border Shine & Shimmer Animation Style */}
      <style>{`
        @keyframes npBorderGleam {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .np-3d-border {
          background: linear-gradient(135deg, #111827 0%, #780016 35%, #ffffff 50%, #8B0000 68%, #111827 100%);
          background-size: 250% 250%;
          transition: all 0.35s ease-out;
        }
        .group:hover .np-3d-border {
          animation: npBorderGleam 2.8s ease infinite;
          box-shadow: 0 12px 24px -4px rgba(120, 0, 22, 0.3), 0 4px 12px rgba(0, 0, 0, 0.18);
        }
      `}</style>

      {/* Section Header with Stylized Kurti Icons & Brand Maroon/Black/White Theme */}
      <div className="container mx-auto px-4 mb-8 sm:mb-10 text-center relative z-10">
        <div className="inline-flex items-center justify-center gap-3 mb-1.5">
          <KurtiIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B0000] drop-shadow-xs" />
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-[#780016] tracking-wider uppercase font-serif">
            SHOP BY CATEGORY
          </h2>
          <KurtiIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B0000] drop-shadow-xs" />
        </div>
        <p className="text-xs sm:text-sm text-stone-500 font-normal tracking-wide max-w-xl mx-auto">
          Explore handcrafted ethnic designs tailored for authentic elegance
        </p>
        <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-2.5"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-14">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        /* Slider Track with Clean Edge Fades — No clunky arrow buttons */
        <div
          className="relative max-w-[1440px] mx-auto px-2 sm:px-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            onMouseUp();
          }}
        >
          {/* Subtle edge fade masks for seamless entrance and exit */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-20" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-20" />

          {/* Continuous Sliding Container */}
          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex items-end gap-6 sm:gap-8 md:gap-9 overflow-x-auto scrollbar-hide py-3 px-3 cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: "auto" }}
          >
            {displayCategories.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const badgeText = getCategoryBadge(category);
              const isSaleBadge =
                badgeText.toLowerCase().includes("sale") ||
                badgeText.includes("%") ||
                badgeText.toLowerCase().includes("festive");

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  onClick={() => {
                    if (!hasMoved.current) {
                      navigate(catLink);
                    }
                  }}
                  className="flex-shrink-0 flex flex-col items-center group cursor-pointer text-center relative w-[130px] sm:w-[145px] md:w-[155px]"
                >
                  {/* ── Stable Garment Frame with 3D Maroon/Black/White Border ── */}
                  <div className="relative z-20 w-[114px] h-[130px] sm:w-[126px] sm:h-[144px] md:w-[136px] md:h-[156px] mb-[-16px] sm:mb-[-18px] transition-transform duration-300 ease-out group-hover:-translate-y-2">
                    {/* 3D Multi-Layer Metallic Border (Maroon, Black, White gleam) */}
                    <div
                      className="w-full h-full rounded-full p-[3px] np-3d-border shadow-md"
                      style={{
                        boxShadow:
                          "0 8px 18px -4px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(120, 0, 22, 0.22)",
                      }}
                    >
                      {/* Inner Circular Garment Frame */}
                      <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                        <img
                          src={catImg}
                          alt={category.name}
                          loading="lazy"
                          className="w-full h-full rounded-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-108 pointer-events-none"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_HERO_FALLBACK;
                          }}
                        />

                        {/* Subtle Glass Reflection Light */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 rounded-full" />
                      </div>
                    </div>

                    {/* Floating Pill Badge (Maroon & White) */}
                    {badgeText && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[94%] flex justify-center">
                        <span
                          className={`inline-block font-bold text-white uppercase tracking-wider rounded-full shadow-md border border-white/70 transition-transform duration-300 group-hover:scale-105 truncate max-w-[105px] sm:max-w-[115px] ${
                            isSaleBadge
                              ? "bg-gradient-to-r from-[#780016] via-[#8B0000] to-[#580C1F] text-[8px] sm:text-[9px] px-2.5 py-0.5"
                              : "bg-[#780016] text-[8.5px] sm:text-[9.5px] px-2.5 py-0.5 font-sans"
                          }`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── 3D Pedestal in Maroon, White & Black ── */}
                  <div className="relative z-10 w-full flex flex-col items-center">
                    {/* Realistic Ground Contact Shadow */}
                    <div className="absolute -bottom-1 w-[105px] sm:w-[118px] md:w-[128px] h-3.5 bg-black/16 blur-md rounded-[100%] transition-all duration-300 group-hover:blur-lg group-hover:opacity-75 pointer-events-none" />

                    {/* 3D Pedestal Body */}
                    <div className="relative w-[110px] sm:w-[124px] md:w-[134px] h-[30px] sm:h-[34px] transition-transform duration-300 group-hover:scale-[1.02]">
                      {/* Cylindrical Base (3D Depth) in Deep Maroon/Black */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-[19px] sm:h-[22px] rounded-b-[50%] transition-all duration-300"
                        style={{
                          background:
                            "linear-gradient(to right, #111827 0%, #4A0A14 20%, #780016 50%, #4A0A14 80%, #111827 100%)",
                          boxShadow:
                            "0 6px 14px rgba(0, 0, 0, 0.18), 0 2px 5px rgba(120, 0, 22, 0.25)",
                        }}
                      >
                        {/* Specular highlight rim line */}
                        <div className="absolute inset-x-0 bottom-1 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>

                      {/* Pedestal Top Disc (Tilted 3D Ellipse) in Silver-Maroon Bevel */}
                      <div
                        className="absolute top-0 inset-x-0 h-[22px] sm:h-[25px] rounded-[50%] p-[2px] transition-all duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #e5e7eb 30%, #780016 65%, #111827 100%)",
                          boxShadow:
                            "inset 0 1px 2px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)",
                        }}
                      >
                        {/* Top Surface Texture: White/Pearl Sheen with Maroon Tint */}
                        <div
                          className="w-full h-full rounded-[50%] relative overflow-hidden flex items-center justify-center"
                          style={{
                            background:
                              "radial-gradient(ellipse at 50% 35%, #ffffff 0%, #FAFAF9 50%, #F5F5F4 80%, #E7E5E4 100%)",
                          }}
                        >
                          {/* Contact Shadow of Garment */}
                          <div className="w-12 sm:w-14 h-2.5 rounded-[100%] bg-black/25 blur-[2.5px] transition-all duration-300 group-hover:scale-75 group-hover:opacity-45 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Category Information Below Pedestal ── */}
                  <div className="mt-3 sm:mt-3.5 w-full px-1 z-20">
                    <h3 className="text-xs sm:text-[13px] font-bold text-stone-900 tracking-wide line-clamp-1 group-hover:text-[#8B0000] transition-colors duration-200 font-serif">
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
