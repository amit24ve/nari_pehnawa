import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scrollByAmount = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

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

  return (
    <section className="py-8 sm:py-10 bg-[#FCFBF7] border-y border-stone-200/70 overflow-hidden relative select-none">
      <div className="container mx-auto px-4 mb-6 sm:mb-8 text-center">
        <SectionHeading>
          Shop by Category
        </SectionHeading>
        <p className="text-xs sm:text-sm text-stone-500 mt-1.5 font-normal tracking-wide">
          Explore handcrafted ethnic designs tailored for authentic elegance
        </p>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-2.5"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 group/category-slider"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            onMouseUp();
          }}
        >
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-280)}
              aria-label="Scroll categories left"
              className="absolute left-2 sm:left-4 top-[38%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-stone-800 shadow-md border border-stone-200 flex items-center justify-center transition-all hover:bg-[#8B0000] hover:text-white hover:border-[#8B0000] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(280)}
              aria-label="Scroll categories right"
              className="absolute right-2 sm:right-4 top-[38%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-stone-800 shadow-md border border-stone-200 flex items-center justify-center transition-all hover:bg-[#8B0000] hover:text-white hover:border-[#8B0000] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Edge gradient fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-r from-[#FCFBF7] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-l from-[#FCFBF7] to-transparent z-10" />

          {/* Categories Horizontal Scroll Row */}
          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            className="flex items-start gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide py-3 px-2 cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: "smooth" }}
          >
            {categories.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const borderColor = category.border_color || category.borderColor || "#8B0000";

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  onClick={() => {
                    if (!hasMoved.current) {
                      navigate(catLink);
                    }
                  }}
                  className="flex-shrink-0 flex flex-col items-center group cursor-pointer w-[92px] sm:w-[110px] md:w-[124px] text-center"
                >
                  {/* Circular Card Outer Ring */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-tr from-stone-200 via-stone-100 to-stone-300 group-hover:from-[#8B0000] group-hover:via-rose-500 group-hover:to-amber-400 shadow-xs group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    {/* Inner Circle Frame */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-white border border-stone-200/80 flex items-center justify-center relative">
                      <img
                        src={catImg}
                        alt={category.name}
                        loading="lazy"
                        className="w-full h-full rounded-full object-cover object-top group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_HERO_FALLBACK;
                        }}
                      />

                      {/* Subtle Inner Glow on Hover */}
                      <div className="absolute inset-0 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Optional Tagline or Offer Badge */}
                    {category.tagline && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap uppercase tracking-wider scale-90 group-hover:scale-100 transition-transform pointer-events-none"
                        style={{ backgroundColor: borderColor }}
                      >
                        {category.tagline.includes("%") || category.tagline.toLowerCase().includes("sale")
                          ? category.tagline.split(/[!🌸🖤]/)[0].trim()
                          : "Popular"}
                      </span>
                    )}
                  </div>

                  {/* Category Name Underneath */}
                  <span className="block text-xs sm:text-[13px] font-semibold text-stone-800 text-center tracking-normal mt-2.5 line-clamp-1 w-full group-hover:text-[#8B0000] transition-colors">
                    {category.name}
                  </span>

                  {/* Clean micro subtitle */}
                  <span className="block text-[10px] text-stone-600 font-medium tracking-normal mt-0.5 truncate w-full">
                    Explore Collection
                  </span>
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
