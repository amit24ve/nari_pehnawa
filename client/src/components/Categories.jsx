import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

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
          setCategories(data);
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
    const slug = (cat.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    return `/category/${slug}`;
  };

  const getCategoryTagline = (cat) => {
    if (cat.tagline) return cat.tagline;
    return `Discover ${cat.name || "Kurtis"} Collection!`;
  };

  const getCategoryImage = (cat) => {
    if (cat.image && cat.image.trim() !== "") return resolveImageUrl(cat.image, DEFAULT_HERO_FALLBACK);
    return DEFAULT_HERO_FALLBACK;
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  const displayList = categories.length < 4 ? [...categories, ...categories, ...categories] : [...categories, ...categories];

  return (
    <section className="py-10 bg-white overflow-hidden relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <SectionHeading>
          Shop by Category
        </SectionHeading>
        <p className="text-xs md:text-sm text-gray-500 mt-2 font-sans">
          Explore handcrafted ethnic designs tailored for Nari Pehnawa elegance
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-3"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-9 h-9 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        /* Scrolling Container with edge gradient masks and hover pause */
        <div className="relative w-full group/slider">
          {/* Subtle left & right edge masks for luxury fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />

          <div className="flex animate-scroll-left hover:[animation-play-state:paused] space-x-5 sm:space-x-6 px-6 pb-6">
            {displayList.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const catTagline = getCategoryTagline(category);
              const borderColor = category.border_color || category.borderColor || "#8B0000";

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  className="flex-shrink-0 w-[250px] sm:w-[280px] md:w-[310px] lg:w-[330px] h-[290px] sm:h-[330px] md:h-[365px] lg:h-[385px] relative group cursor-pointer rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-stone-900 border-2 border-stone-200/90 hover:border-amber-400/90"
                  onClick={() => navigate(catLink)}
                  title={`View ${category.name} collection`}
                >
                  {/* Category Image - Framed to top for optimal kurti/model display */}
                  <img
                    src={catImg}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_HERO_FALLBACK;
                    }}
                  />

                  {/* Gradient Overlay for Crisp Text Legibility at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-36 sm:h-40 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-5 text-center transform translate-y-0.5 group-hover:translate-y-0 transition-transform duration-300">
                    {/* Tagline */}
                    <p className="text-amber-200/95 text-xs sm:text-[13px] text-center font-medium drop-shadow-md italic mb-2 line-clamp-1">
                      {catTagline}
                    </p>

                    {/* Category Name Badge */}
                    <div className="flex justify-center">
                      <div
                        className="text-white text-xs sm:text-sm font-bold py-2 px-5 rounded-full text-center border shadow-lg tracking-wider uppercase truncate max-w-full font-serif backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: borderColor,
                          borderColor: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {category.name}
                      </div>
                    </div>
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
