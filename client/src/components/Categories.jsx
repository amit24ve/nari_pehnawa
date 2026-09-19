import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Color palettes matching reference image for each card
const CARD_THEMES = [
  { bg: "#FCE8EB", border: "#F5C7CE", accent: "#A6354B" }, // Rose Pink (Kurtis)
  { bg: "#FFF8EE", border: "#F7E7CE", accent: "#9E7B35" }, // Warm Ivory / Champagne (Sarees)
  { bg: "#E8F0E4", border: "#D2E2CC", accent: "#3B6E47" }, // Sage Mint Green (Anarkali)
  { bg: "#FCEEEA", border: "#F7D8D0", accent: "#8B4133" }, // Soft Dusty Rose (Palazzo Sets)
  { bg: "#FFF1E8", border: "#FCE0D0", accent: "#9E4D2C" }, // Soft Peach (Winter Wear)
  { bg: "#FBF6EE", border: "#F0E6D8", accent: "#8B6B38" }, // Warm Cream (Jewelry)
];

// Curated 6 ethnic categories matching the user's reference image exactly
const REFERENCE_CATEGORIES = [
  {
    name: "Kurtis",
    styles: "200+ Styles",
    image: "/api/uploads/929cb274317046e989f787676dad64e0.webp",
    link: "/category/kurtis",
  },
  {
    name: "Sarees",
    styles: "150+ Styles",
    image: "/api/uploads/41b5ef26f633442f83ebb9737e8c6887.webp",
    link: "/category/sarees",
  },
  {
    name: "Anarkali",
    styles: "120+ Styles",
    image: "/api/uploads/03fdd10666bb4e39b4e31354fc5fe70d.webp",
    link: "/category/anarkali",
  },
  {
    name: "Palazzo Sets",
    styles: "100+ Styles",
    image: "/api/uploads/5e2f5fd3aa62486fa72c783eb8020db2.webp",
    link: "/category/palazzo-sets",
  },
  {
    name: "Winter Wear",
    styles: "80+ Styles",
    image: "/api/uploads/ced70b71c02049689a65516b72fa8c9f.webp",
    link: "/category/winter-wear",
  },
  {
    name: "Jewelry",
    styles: "50+ Styles",
    image: "/api/uploads/137246d3a53646e083e2fa1ee26647fc.webp",
    link: "/category/jewelry",
  },
];

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(REFERENCE_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally fetch if admin updated images or styles count for these categories
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge custom styles_count or updated image if available
          const merged = REFERENCE_CATEGORIES.map((ref) => {
            const found = data.find(
              (d) =>
                (d.name || "").trim().toLowerCase() === ref.name.toLowerCase()
            );
            if (found) {
              return {
                ...ref,
                image: found.image || ref.image,
                styles: found.styles_count || found.styles || ref.styles,
                link: found.link || ref.link,
              };
            }
            return ref;
          });
          setCategories(merged);
        }
      })
      .catch(() => {});
  }, []);

  const getCategoryLink = (cat) => {
    if (cat.link) return cat.link;
    const slug = (cat.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    return `/category/${slug}`;
  };

  const getCategoryImage = (cat) => {
    if (cat.image && cat.image.trim() !== "") {
      return resolveImageUrl(cat.image, DEFAULT_HERO_FALLBACK);
    }
    return DEFAULT_HERO_FALLBACK;
  };

  const displayList = categories;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#FFF5F6] via-[#FFFDFC] to-[#FFFFFF] overflow-hidden relative select-none">
      {/* Delicate floral corner flourishes in background */}
      <div className="absolute top-0 left-0 w-48 h-48 opacity-25 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-rose-300">
          <path
            d="M20 20 C60 40, 80 80, 70 130 C90 90, 130 80, 170 70 M50 50 C90 70, 110 110, 120 160"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="70" cy="130" r="4" fill="currentColor" />
          <circle cx="170" cy="70" r="4" fill="currentColor" />
          <circle cx="120" cy="160" r="4" fill="currentColor" />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-56 h-56 opacity-20 pointer-events-none rotate-180">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-rose-300">
          <path
            d="M20 20 C60 40, 80 80, 70 130 C90 90, 130 80, 170 70"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="70" cy="130" r="4" fill="currentColor" />
        </svg>
      </div>

      {/* Decorative cursive accent on the top right (matching reference image) */}
      <div className="hidden lg:flex absolute top-8 right-8 xl:right-16 flex-col items-center rotate-[-6deg] select-none pointer-events-none opacity-85 z-10">
        <span
          className="text-2xl xl:text-[1.75rem] font-serif italic text-rose-400 font-normal leading-tight tracking-wide"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Traditional Looks
        </span>
        <span
          className="text-xl xl:text-2xl font-serif italic text-rose-400 font-normal leading-tight flex items-center gap-1.5"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Modern You
          <span className="inline-block text-rose-300 text-lg not-italic transform -rotate-12">
            ♡
          </span>
        </span>
      </div>

      {/* Section Header (matching reference image) */}
      <div className="container mx-auto px-4 mb-10 text-center relative z-10">
        {/* Top small category label */}
        <div className="flex items-center justify-center gap-3 mb-2.5">
          <div className="w-8 sm:w-16 h-[1px] bg-rose-400/40" />
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.28em] text-[#8B0000] uppercase font-sans">
            SHOP BY CATEGORY
          </span>
          <div className="w-8 sm:w-16 h-[1px] bg-rose-400/40" />
        </div>

        {/* Main Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#1A1A1A] tracking-tight">
          Find Your Perfect Ethnic Look
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-stone-500 font-sans mt-2 max-w-xl mx-auto">
          Explore our beautifully curated collections for every occasion
        </p>

        {/* Lotus emblem motif */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="w-8 sm:w-12 h-[1px] bg-[#8B0000]/30" />
          <span className="text-[#8B0000] text-sm opacity-80">🪷</span>
          <div className="w-8 sm:w-12 h-[1px] bg-[#8B0000]/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        /* Arched Cards Container */
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 px-1">
            {displayList.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const stylesCount =
                category.styles_count ||
                category.styles ||
                `${(index * 35 + 80)}+ Styles`;

              // Anarkali or slot 2 has the decorative scalloped temple arch
              const isTempleArch = index === 2 || category.name.toLowerCase().includes("anarkali");

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  onClick={() => navigate(catLink)}
                  className="group flex-shrink-0 w-[190px] sm:w-[210px] md:w-auto h-[340px] sm:h-[365px] md:h-[375px] flex flex-col justify-between p-2.5 sm:p-3 rounded-t-[80px] rounded-b-[28px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border"
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                  }}
                  title={`Explore ${category.name}`}
                >
                  {/* Model Image inside Arch */}
                  <div
                    className={`w-full flex-1 overflow-hidden relative shadow-inner ${
                      isTempleArch
                        ? "rounded-t-[60px] rounded-b-2xl"
                        : "rounded-t-[72px] rounded-b-2xl"
                    } bg-white/40`}
                  >
                    <img
                      src={catImg}
                      alt={category.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_HERO_FALLBACK;
                      }}
                    />
                  </div>

                  {/* Bottom Pod Container */}
                  <div className="mt-2.5 bg-white/95 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 flex items-center justify-between border border-black/5 shadow-xs transition-colors group-hover:bg-white">
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      {/* Leaf/botanical flourish motif icon */}
                      <span className="text-stone-400 text-xs flex-shrink-0 group-hover:text-[#8B0000] transition-colors">
                        🍂
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-stone-900 text-xs sm:text-sm tracking-tight truncate leading-tight group-hover:text-[#8B0000] transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-stone-400 font-sans mt-0.5 truncate">
                          {stylesCount}
                        </p>
                      </div>
                    </div>

                    {/* Circular Maroon Action Button */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6E1624] group-hover:bg-[#8B0000] text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Centered Explore All Categories Button (matching reference image) */}
          <div className="mt-10 sm:mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("/category/sale")}
              className="inline-flex items-center justify-center gap-2.5 bg-[#6E1624] hover:bg-[#8B0000] text-white font-bold text-xs sm:text-sm tracking-widest uppercase py-3.5 px-8 sm:px-10 rounded-full shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>EXPLORE ALL CATEGORIES</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Categories;
