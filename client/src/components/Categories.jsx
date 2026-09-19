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
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        /* Scrolling Container */
        <div className="relative w-full">
          <div className="flex animate-scroll-left space-x-4 sm:space-x-5 px-4 pb-4">
            {displayList.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const catTagline = getCategoryTagline(category);
              const borderColor = category.border_color || category.borderColor || "#8B0000";

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] h-[260px] sm:h-[280px] md:h-[295px] relative group cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 bg-stone-900 border border-stone-200/80 hover:border-[#8B0000]"
                  onClick={() => navigate(catLink)}
                  title={`View ${category.name} collection`}
                >
                  {/* Category Image */}
                  <img
                    src={catImg}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_HERO_FALLBACK;
                    }}
                  />

                  {/* Gradient Overlay for Text Legibility at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-95" />

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-3.5 sm:p-4 text-center transform translate-y-0.5 group-hover:translate-y-0 transition-transform duration-300">
                    {/* Tagline */}
                    <p className="text-amber-100/90 text-[11px] sm:text-xs text-center font-medium drop-shadow-md italic mb-1.5 line-clamp-1">
                      {catTagline}
                    </p>

                    {/* Category Name Badge */}
                    <div className="flex justify-center">
                      <div
                        className="text-white text-xs sm:text-[13px] font-bold py-1.5 px-4 rounded-full text-center border shadow-md tracking-wider uppercase truncate max-w-full font-serif backdrop-blur-xs transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: borderColor,
                          borderColor: "rgba(255,255,255,0.35)",
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
