import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

const CATEGORY_ITEMS = [
  {
    id: "printed-kurtis",
    name: "PRINTED KURTIS",
    image: "/category_card_printed.png",
    link: "/category/printed-kurtis",
  },
  {
    id: "sleeveless-kurtis",
    name: "SLEEVELESS KURTIS",
    image: "/category_card_sleeveless.png",
    link: "/category/sleeveless-kurtis",
  },
  {
    id: "halter-neck-tops",
    name: "HALTER NECK TOPS",
    image: "/category_card_halter.png",
    link: "/category/halter-neck-top",
  },
  {
    id: "new-arrivals",
    name: "NEW ARRIVALS",
    image: "/category_card_newarrivals.png",
    link: "/new-arrivals",
  },
];

const Categories = () => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState({});

  const toggleWishlist = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

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

      {/* 4 Category Cards in Grid: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6 max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {CATEGORY_ITEMS.map((item) => {
          const isLiked = !!liked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className="group relative cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-stone-50 select-none"
              title={`Shop ${item.name}`}
            >
              {/* Card Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full aspect-square object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Interactive Wishlist Heart Button (Top-Right) */}
              <button
                type="button"
                onClick={(e) => toggleWishlist(e, item)}
                aria-label={`Save ${item.name} to wishlist`}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/75 hover:bg-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-sm z-10 active:scale-90 cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                    isLiked
                      ? "fill-rose-600 text-rose-600 scale-110"
                      : "text-gray-800 stroke-[1.8] group-hover:text-rose-600"
                  }`}
                />
              </button>
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
