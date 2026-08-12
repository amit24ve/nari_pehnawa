import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const defaultCelebLooks = [
  {
    id: "c-1",
    name: "Haldi Georgette Anarkali Suit Set",
    price: 4500,
    image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Festive Favorite",
    link: "/category/anarkali-kurtis"
  },
  {
    id: "c-2",
    name: "Damini Cotton Printed Suit Set",
    price: 3200,
    image: "https://images.pexels.com/photos/2802024/pexels-photo-2802024.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Celebrity Pick",
    link: "/category/chikankari-kurtis"
  },
  {
    id: "c-3",
    name: "Orange Bandhej Cotton Suit Set",
    price: 3800,
    image: "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Bollywood Style",
    link: "/category/printed-kurtis"
  },
  {
    id: "c-4",
    name: "Urvi Silk Embroidered Suit Set",
    price: 5200,
    image: "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=600",
    tag: "Trending Now",
    link: "/category/embroidered-kurtis"
  }
];

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
        if (Array.isArray(data) && data.length > 0) {
          setCelebLooks(data);
        } else {
          setCelebLooks(defaultCelebLooks);
        }
      })
      .catch((e) => {
        console.error("Celeb looks fetch error:", e);
        setCelebLooks(defaultCelebLooks);
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
                      src={look.image}
                      alt={look.name}
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
