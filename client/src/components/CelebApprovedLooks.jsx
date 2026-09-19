import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const CelebApprovedLooks = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [celebLooks, setCelebLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/celeb-looks/?active_only=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch celeb looks");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCelebLooks(data);
        } else {
          setCelebLooks([]);
        }
      })
      .catch((e) => {
        console.error("Celeb looks fetch error:", e);
        setCelebLooks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 320;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(() => {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft <
            container.scrollWidth - container.clientWidth - 10
        );
      }, 300);
    }
  };

  if (!loading && celebLooks.length === 0) {
    return null;
  }

  return (
    <section className="py-14 bg-white overflow-hidden relative">
      <div className="container mx-auto px-4 text-center">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <SectionHeading>
            CELEB APPROVED LOOKS
          </SectionHeading>
          <p className="text-xs md:text-sm text-gray-500 mt-2 font-sans max-w-lg mx-auto">
            Discover Bollywood &amp; Influencer favorite ethnic outfits from Nari Pehnawa
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-3"></div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
          </div>
        ) : (
          /* Scrollable Gallery with Arrows */
          <div className="relative">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 py-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {celebLooks.map((look) => (
                <div
                  key={look.id || look._id}
                  className="flex-shrink-0 w-[270px] md:w-[300px] group cursor-pointer text-left"
                  onClick={() => navigate(look.link || "/category/anarkali-kurtis")}
                >
                  {/* Image Card */}
                  <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-gray-100 border border-gray-100">
                    <img
                      src={resolveImageUrl(look.image, DEFAULT_FALLBACK_IMAGE)}
                      alt={look.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-[370px] object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-[#8B0000] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {look.tag || "Celeb Look"}
                    </div>

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <button className="w-full py-2.5 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-lg hover:bg-gray-100 transition">
                        VIEW CELEB LOOK →
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mt-3 text-center">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1">
                      {look.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#8B0000] mt-1">
                      ₹{Number(look.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CelebApprovedLooks;
