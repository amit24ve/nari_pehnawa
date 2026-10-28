import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          // Sort by display_order if available
          const sorted = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          setCategories(sorted);
        } else {
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error("Categories fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
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

  const toggleWishlist = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // If still loading and no data yet, show subtle spinner
  if (loading && categories.length === 0) {
    return (
      <section className="py-8 bg-white">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-[#780016] animate-spin" />
        </div>
      </section>
    );
  }

  // If no categories from DB, don't break layout
  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 bg-white overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        {/* Top Centered Floral Motif */}
        <div className="flex justify-center mb-2">
          <img
            src="/floral_motif.png"
            alt=""
            className="h-4 sm:h-5 w-auto object-contain opacity-90 select-none pointer-events-none"
          />
        </div>

        {/* Heading with Decorative Horizontal Flanking Lines */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-xl mx-auto">
          <div className="h-[1.5px] w-12 sm:w-24 md:w-32 bg-[#800020]/90" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#780016] tracking-wider uppercase select-none">
            SHOP BY CATEGORY
          </h2>
          <div className="h-[1.5px] w-12 sm:w-24 md:w-32 bg-[#800020]/90" />
        </div>

        {/* Tagline */}
        <p className="text-gray-600 text-xs sm:text-sm font-sans tracking-wide mt-1.5 select-none font-normal">
          Find the style that feels like you
        </p>
      </div>

      {/* Dynamic Category Cards Grid: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6 max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {categories.map((cat, index) => {
          const catId = cat.id || cat._id || `cat-${index}`;
          const catLink = getCategoryLink(cat);
          const catImg = getCategoryImage(cat);
          const isLiked = !!liked[catId];

          return (
            <div
              key={catId}
              onClick={() => navigate(catLink)}
              className="group relative cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-stone-100 select-none border border-stone-200/60"
              title={`Shop ${cat.name}`}
            >
              {/* Category Image - Framed top for optimal model display */}
              <div className="w-full aspect-square relative overflow-hidden bg-stone-100">
                <img
                  src={catImg}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_HERO_FALLBACK;
                  }}
                  loading="lazy"
                />

                {/* Subtle bottom vignette to ensure pill button has great contrast */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Interactive Wishlist Heart Button (Top-Right) */}
              <button
                type="button"
                onClick={(e) => toggleWishlist(e, catId)}
                aria-label={`Save ${cat.name} to wishlist`}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-sm z-10 active:scale-90 cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                    isLiked
                      ? "fill-rose-600 text-rose-600 scale-110"
                      : "text-gray-800 stroke-[1.8] group-hover:text-rose-600"
                  }`}
                />
              </button>

              {/* Maroon Pill Badge at Bottom Center (Category Name + '>') */}
              <div className="absolute bottom-2.5 sm:bottom-4 inset-x-0 flex justify-center px-2 pointer-events-none z-10">
                <span className="bg-[#780016] group-hover:bg-[#600012] text-white text-[11px] sm:text-xs md:text-sm font-bold py-1.5 sm:py-2 px-3.5 sm:px-5 rounded-full shadow-md tracking-wider uppercase flex items-center justify-center gap-1.5 font-sans transition-all duration-300 group-hover:scale-105 pointer-events-auto">
                  <span className="truncate max-w-[170px]">{cat.name}</span>
                  <span className="text-xs sm:text-sm font-normal">›</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Centered Floral Motif */}
      <div className="flex justify-center mt-6 sm:mt-8">
        <img
          src="/floral_motif.png"
          alt=""
          className="h-4 sm:h-5 w-auto object-contain opacity-90 select-none pointer-events-none"
        />
      </div>
    </section>
  );
};

export default Categories;
