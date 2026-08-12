import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";

const AsFeaturedOn = () => {
  const scrollContainerRef = useRef(null);

  const mediaLogos = [
    { id: 1, name: "Entrepreneur" },
    { id: 2, name: "BW BUSINESSWORLD" },
    { id: 3, name: "BW DISRUPT" },
    { id: 4, name: "First India" },
    { id: 5, name: "Hindustan Times" },
    { id: 6, name: "SHE THE PEOPLE" },
    { id: 7, name: "mid-day" },
  ];

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* As Featured On Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <SectionHeading>
              AS FEATURED ON
            </SectionHeading>
          </div>

          {/* Media Logos Carousel */}
          <div className="relative max-w-5xl mx-auto">
            {/* Left Arrow */}
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 border border-gray-200 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 border border-gray-200 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Logos Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-12 overflow-x-auto scrollbar-hide scroll-smooth px-12 py-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {mediaLogos.map((media) => (
                <div
                  key={media.id}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-lg font-bold text-gray-600 hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                    {media.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Section with Decorative Elements */}
        <div className="bg-gradient-to-br from-[#fff5f5] to-[#fdf8f5] rounded-3xl p-12 mb-12 relative overflow-hidden border border-[#f0d0d0]">
          {/* Decorative Sun Icon */}
          <div className="absolute top-8 left-12">
            <svg
              className="w-16 h-16 text-[#8B0000]/15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5" strokeWidth="2" />
              <path
                strokeLinecap="round"
                strokeWidth="2"
                d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              />
            </svg>
          </div>

          {/* Decorative Plant Left */}
          <div className="absolute bottom-0 left-8">
            <svg
              className="w-20 h-32 text-[#8B0000]/15"
              viewBox="0 0 100 150"
              fill="currentColor"
            >
              <path d="M50 150 Q45 120 40 100 Q35 80 45 60 Q50 50 50 40 Q50 30 45 20 Q40 10 50 0 M50 150 Q55 120 60 100 Q65 80 55 60" />
            </svg>
          </div>

          {/* Decorative Animal Right */}
          <div className="absolute bottom-8 right-12">
            <svg
              className="w-24 h-16 text-[#8B0000]/15"
              viewBox="0 0 100 60"
              fill="currentColor"
            >
              <ellipse cx="50" cy="40" rx="30" ry="15" />
              <circle cx="35" cy="25" r="8" />
              <path d="M20 40 L10 50 M30 40 L25 55 M70 40 L75 55 M80 40 L90 50" />
            </svg>
          </div>

          {/* Decorative Plant Right */}
          <div className="absolute top-0 right-8">
            <svg
              className="w-20 h-32 text-[#8B0000]/15"
              viewBox="0 0 100 150"
              fill="currentColor"
            >
              <path d="M50 0 Q45 30 40 50 Q35 70 45 90 Q50 100 50 110 Q50 120 45 130 Q40 140 50 150" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h3
              className="text-3xl md:text-4xl font-serif font-bold mb-4"
              style={{ color: "#8B0000" }}
            >
              GET ON THE LIST
            </h3>
            <p className="text-gray-600 mb-6">
              Sign up for weekly newsletters to receive information about the
              new arrivals, future events and specials discounts.
            </p>

            {/* Email Form */}
            <form className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                required
              />
              <button
                type="submit"
                className="bg-[#8B0000] hover:bg-[#6B0000] text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                SIGN ME UP!
              </button>
            </form>
          </div>
        </div>

        {/* Brand Description */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-4" style={{ color: "#8B0000" }}>
            STYLISH ETHNIC WEAR FOR WOMEN & MEN – HAND-PICKED DESIGNER OUTFITS
          </h3>

          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              Looking for ethnic wear online that feels fresh, fun, and
              on-trend? At <span className="font-semibold">Bunaai</span>, we
              bring together traditional styles and modern fits for both women
              and men. From everyday essentials to celebration-ready looks, our
              collections suit every occasion.
            </p>

            <p>
              Explore ethnic wear for women and men with a modern twist. Try our
              fusion wear for men and women for a modern twist on traditional
              styles. Every piece is rooted in Indian culture but designed for
              today.
            </p>

            <div className="my-4">
              <p className="font-semibold text-gray-800">
                FREE SHIPPING | 100% QUALITY ASSURANCE | EASY RETURNS
              </p>
            </div>

            <p>
              Shop trending pieces like{" "}
              <span className="text-[#8B0000] font-medium">
                pre-set sets for women
              </span>
              ,{" "}
              <span className="text-[#8B0000] font-medium">
                designer suit sets for women
              </span>
              , and{" "}
              <span className="text-[#8B0000] font-medium">
                festive wear online
              </span>
            </p>

            <div>
              <p className="font-semibold text-gray-800 mb-2">
                SHOP OUR BESTSELLING COLLECTIONS
              </p>
              <p>
                Explore our most-loved{" "}
                <span className="text-[#8B0000] font-medium">
                  ethnic wear online
                </span>{" "}
                collections that redefine everyday elegance and festive flair.
                From{" "}
                <span className="text-[#8B0000] font-medium">
                  designer suit sets for women
                </span>{" "}
                to stunning{" "}
                <span className="text-[#8B0000] font-medium">co-ords</span>
              </p>
              <button className="text-[#8B0000] font-semibold mt-2 hover:underline">
                Read more
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default AsFeaturedOn;
