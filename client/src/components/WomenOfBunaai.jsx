import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Heart, Quote } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const WomenOfNariPehnawa = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFallbackTestimonials = () => [
    {
      id: "w-1",
      customerName: "Pooja Roy",
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "Love this suit! 😍 It's very pretty and got so many compliments! 💕",
      productName: "Blush Pink Anarkali Kurta Set",
      link: "/category/anarkali-kurtis"
    },
    {
      id: "w-2",
      customerName: "Sneha Reddy",
      image: "https://images.pexels.com/photos/2220321/pexels-photo-2220321.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "I ordered this especially for Diwali, and it did not disappoint. Perfect ensemble! 😊",
      productName: "Ivory Chikankari Silk Kurti",
      link: "/category/chikankari-kurtis"
    },
    {
      id: "w-3",
      customerName: "Ananya Iyer",
      image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "Thank you for the stunning dress, it's the perfect occasion outfit. 💖",
      productName: "Deep Maroon Embroidered Anarkali",
      link: "/category/embroidered-kurtis"
    },
    {
      id: "w-4",
      customerName: "Divya Sen",
      image: "https://images.pexels.com/photos/2916450/pexels-photo-2916450.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "Wore this to a friend's wedding, cannot explain how awesome it looked! 😊",
      productName: "Navy Blue Palazzo Kurti Set",
      link: "/category/palazzo-set-kurtis"
    },
    {
      id: "w-5",
      customerName: "Kavya Sharma",
      image: "https://images.pexels.com/photos/2899764/pexels-photo-2899764.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "Vibrant colours, soft fabric — beautiful Nari Pehnawa collection! 😊",
      productName: "Multicolor Printed Kurti",
      link: "/category/printed-kurtis"
    },
    {
      id: "w-6",
      customerName: "Ritu Verma",
      image: "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=500&h=700&dpr=1",
      rating: 5,
      review: "Exactly as shown in the pictures. The colour is so bright and fitting is top notch! 😊",
      productName: "Festive Kurti Set - Royal Red",
      link: "/category/anarkali-kurtis"
    }
  ];

  useEffect(() => {
    fetch(`${API_BASE_URL}/reviews/`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.slice(0, 10).map((rev, idx) => ({
            id: rev._id || `rev-${idx}`,
            customerName: rev.user_name || rev.user?.name || "Happy Customer",
            image: rev.image || getFallbackTestimonials()[idx % 6].image,
            rating: rev.rating || 5,
            review: rev.comment || "Loved the outfit quality!",
            productName: rev.product_name || rev.product?.name || "Nari Pehnawa Kurti Set",
            link: rev.product_id ? `/product/${rev.product_id}` : "/category/anarkali-kurtis"
          }));
          setTestimonials(mapped);
        } else {
          setTestimonials(getFallbackTestimonials());
        }
      })
      .catch(() => {
        setTestimonials(getFallbackTestimonials());
      })
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
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
    <section className="py-16 bg-[#fdf8f5] overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <SectionHeading>
            WOMEN OF NARI PEHNAWA
          </SectionHeading>
          <p className="text-xs md:text-sm text-gray-600 mt-2 font-sans max-w-lg mx-auto">
            Real customer stories &amp; style inspiration wearing Nari Pehnawa ethnic wear
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-3"></div>
        </div>

        {/* Scrollable Gallery with Arrows */}
        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 w-[250px] md:w-[270px] group cursor-pointer"
                onClick={() => navigate(testimonial.link || "/category/anarkali-kurtis")}
              >
                {/* Image Card */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 mb-3 bg-white border border-gray-100">
                  <img
                    src={testimonial.image}
                    alt={testimonial.productName}
                    className="w-full h-[330px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-800 flex items-center gap-1 shadow-md">
                    <Quote className="w-3 h-3 text-[#8B0000]" /> {testimonial.customerName}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#8B0000] text-[#8B0000]" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs text-gray-600 text-center mb-2 px-2 line-clamp-2 italic">
                  "{testimonial.review}"
                </p>

                {/* Product Name */}
                <h3 className="text-xs md:text-sm font-bold text-gray-900 text-center line-clamp-1 group-hover:text-[#8B0000] transition">
                  {testimonial.productName}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WomenOfNariPehnawa;
