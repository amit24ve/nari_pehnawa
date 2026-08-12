import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { SectionHeading } from "./NariHeadingDecoration";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFallbackCategories = () => [
    {
      id: "cat-1",
      name: "ANARKALI KURTIS",
      tagline: "Timeless Anarkali Silhouettes!",
      image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/anarkali-kurtis",
      border_color: "#8B0000",
    },
    {
      id: "cat-2",
      name: "CHIKANKARI KURTIS",
      tagline: "Lucknowi Craftsmanship At Its Finest!",
      image: "https://images.pexels.com/photos/2802024/pexels-photo-2802024.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/chikankari-kurtis",
      border_color: "#a52a2a",
    },
    {
      id: "cat-3",
      name: "PALAZZO SET KURTIS",
      tagline: "Complete Sets For Effortless Dressing!",
      image: "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/palazzo-set-kurtis",
      border_color: "#8B0000",
    },
    {
      id: "cat-4",
      name: "EMBROIDERED KURTIS",
      tagline: "Intricate Threadwork, Elegant Charm!",
      image: "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/embroidered-kurtis",
      border_color: "#a52a2a",
    },
    {
      id: "cat-5",
      name: "PRINTED KURTIS",
      tagline: "Vibrant Prints For Every Occasion!",
      image: "https://images.pexels.com/photos/2899764/pexels-photo-2899764.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/printed-kurtis",
      border_color: "#8B0000",
    },
    {
      id: "cat-6",
      name: "STRAIGHT KURTIS",
      tagline: "Sleek & Chic Everyday Fashion!",
      image: "https://images.pexels.com/photos/2916450/pexels-photo-2916450.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/category/straight-kurtis",
      border_color: "#a52a2a",
    }
  ];

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(getFallbackCategories());
        }
      })
      .catch((err) => {
        console.error("Categories fetch error:", err);
        setCategories(getFallbackCategories());
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
    if (cat.image && cat.image.trim() !== "") return cat.image;
    return "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600";
  };

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
          <div className="flex animate-scroll-left space-x-6 px-4 pb-4">
            {displayList.map((category, index) => {
              const catLink = getCategoryLink(category);
              const catImg = getCategoryImage(category);
              const catTagline = getCategoryTagline(category);
              const borderColor = category.border_color || category.borderColor || "#8B0000";

              return (
                <div
                  key={`${category.id || category._id || index}-${index}`}
                  className="flex-shrink-0 w-[280px] md:w-[310px] h-[410px] relative group cursor-pointer rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-black"
                  onClick={() => navigate(catLink)}
                >
                  {/* 100% Clear Category Background Image */}
                  <img
                    src={catImg}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600";
                    }}
                  />

                  {/* Gradient Overlay for Text Legibility at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-25 pointer-events-none"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-5 text-center transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                    {/* Tagline */}
                    <p className="text-white text-xs md:text-sm text-center font-medium drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity duration-300 italic mb-2">
                      {catTagline}
                    </p>

                    {/* Category Name Badge */}
                    <div className="flex justify-center mb-3">
                      <div
                        className="text-white text-xs font-bold py-2 px-5 rounded-full text-center border shadow-lg tracking-wider uppercase truncate max-w-full"
                        style={{
                          backgroundColor: borderColor,
                          borderColor: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {category.name}
                      </div>
                    </div>

                    {/* Shop Now Button */}
                    <button className="w-full bg-white/95 hover:bg-white text-gray-900 text-xs font-bold py-2.5 rounded-xl transition-colors duration-300 border border-white shadow-md flex items-center justify-center gap-1.5">
                      <span>EXPLORE PRODUCTS</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8B0000]" />
                    </button>
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
