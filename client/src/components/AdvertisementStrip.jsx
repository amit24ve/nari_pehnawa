import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Curated default promotional ads if backend list is loading or empty
const FALLBACK_ADS = [
  {
    id: "promo_festive_sale",
    title: "Grand Festive Celebration",
    subtitle: "Up to 40% Off on Pure Silk & Banarasi Kurtis",
    badge: "FESTIVE DEAL",
    image: "/api/api/uploads/7f6c4498b0ef46d2aab5b5dad0ede8d5.webp",
    link: "/category/sale",
    bg_gradient: "from-[#4A0A19] to-[#780016]",
    accent_color: "#D4AF37",
  },
  {
    id: "promo_new_arrivals",
    title: "New Season Collection 2026",
    subtitle: "Fresh Handcrafted Kurtis & Sets Just Dropped",
    badge: "JUST LAUNCHED",
    image: "/api/api/uploads/a280729561574dfa80ac1290f9eb68c8.webp",
    link: "/new-arrivals",
    bg_gradient: "from-[#1a2e3b] to-[#0f172a]",
    accent_color: "#38bdf8",
  },
  {
    id: "promo_wedding_bogo",
    title: "Celebration Special BOGO",
    subtitle: "Buy 1 Get 1 Free on Curated Partywear",
    badge: "LIMITED PERIOD",
    image: "/api/api/uploads/bb5701bc0f9e4bad8bbc32880cf95b1f.webp",
    link: "/category/sale",
    bg_gradient: "from-[#311124] to-[#581335]",
    accent_color: "#f472b6",
  },
  {
    id: "promo_seller_hub",
    title: "Sell on Nari Pehnawa",
    subtitle: "Reach Millions of Ethnic Fashion Shoppers Nationwide",
    badge: "SELLER HUB",
    image: "/api/api/uploads/e822dee5ee8d4a6e9ab3475dbe877a70.webp",
    link: "/seller/register",
    bg_gradient: "from-[#064e3b] to-[#022c22]",
    accent_color: "#34d399",
  },
];

const AdvertisementStrip = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        // Attempt fetching dedicated advertisements or hero slider banners
        const [adRes, slideRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/advertisements/?active_only=true`),
          fetch(`${API_BASE_URL}/slider/?active_only=true`),
        ]);

        let loaded = [];
        if (adRes.status === "fulfilled" && adRes.value.ok) {
          const adData = await adRes.value.json().catch(() => []);
          if (Array.isArray(adData) && adData.length > 0) {
            loaded = adData;
          }
        }

        if (loaded.length === 0 && slideRes.status === "fulfilled" && slideRes.value.ok) {
          const slideData = await slideRes.value.json().catch(() => []);
          if (Array.isArray(slideData) && slideData.length > 0) {
            loaded = slideData.map((s, idx) => ({
              id: s.id || `slide_ad_${idx}`,
              title: s.title || (idx === 0 ? "Grand Festive Kurti Collection" : "Premium Handcrafted Styles"),
              subtitle: s.subtitle || "Explore Authentic Indian Heritage Fashion",
              badge: idx % 2 === 0 ? "TRENDING NOW" : "SPECIAL DEAL",
              image: s.image,
              link: s.cta_link || "/category/sale",
              accent_color: idx % 2 === 0 ? "#D4AF37" : "#f43f5e",
            }));
          }
        }

        if (loaded.length > 0) {
          setAds(loaded);
        } else {
          setAds(FALLBACK_ADS);
        }
      } catch (e) {
        setAds(FALLBACK_ADS);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Duplicate items for continuous infinite scroll when multiple ads exist
  const displayAds = ads.length > 0
    ? (ads.length < 5 ? [...ads, ...ads, ...ads] : [...ads, ...ads])
    : FALLBACK_ADS;

  // Auto-scroll loop
  useEffect(() => {
    if (loading || isPaused || displayAds.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    let animId;
    const step = () => {
      if (!isPaused && !isDragging.current && el) {
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 0.8;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [loading, isPaused, displayAds.length]);

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

  const scrollByAmount = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full py-3 sm:py-4 bg-gradient-to-b from-stone-100/90 via-white to-stone-100/60 border-b border-stone-200/80 overflow-hidden select-none">
      <div
        className="relative max-w-7xl mx-auto px-3 sm:px-6 group/ad-slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          onMouseUp();
        }}
      >
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(-360)}
          aria-label="Scroll ads left"
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center opacity-0 group-hover/ad-slider:opacity-100 transition-opacity hover:bg-[#8B0000] hover:text-white cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(360)}
          aria-label="Scroll ads right"
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center opacity-0 group-hover/ad-slider:opacity-100 transition-opacity hover:bg-[#8B0000] hover:text-white cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Subtle Edge Fade Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-stone-100/90 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-stone-100/90 to-transparent z-10" />

        {/* Scrolling Cards Row */}
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide py-1 px-1 cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: "auto" }}
        >
          {displayAds.map((ad, idx) => {
            const rawImg = ad.image || "";
            const imgSrc = rawImg.trim() !== "" ? resolveImageUrl(rawImg, DEFAULT_HERO_FALLBACK) : DEFAULT_HERO_FALLBACK;
            const targetLink = ad.link || ad.cta_link || "/category/sale";
            const badgeText = ad.badge || "PROMOTION";
            const accent = ad.accent_color || "#D4AF37";

            const isExternal = targetLink.startsWith("http");

            const CardInner = (
              <div className="relative w-[280px] sm:w-[340px] md:w-[380px] lg:w-[410px] h-[130px] sm:h-[150px] md:h-[165px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200/90 transition-all duration-300 group/card flex-shrink-0 bg-stone-900 cursor-pointer">
                {/* Background Image */}
                <img
                  src={imgSrc}
                  alt={ad.title || "Nari Pehnawa Offer"}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-out pointer-events-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_HERO_FALLBACK;
                  }}
                />

                {/* Dark Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20 z-10 pointer-events-none" />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 p-3 sm:p-4 flex flex-col justify-between pointer-events-none">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm text-stone-900 backdrop-blur-sm"
                      style={{ backgroundColor: accent }}
                    >
                      {badgeText}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/80 font-medium flex items-center gap-1 group-hover/card:text-amber-300 transition-colors">
                      Explore <ArrowRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 className="text-xs sm:text-sm md:text-[15px] font-bold text-white tracking-wide line-clamp-1 drop-shadow-sm font-serif">
                      {ad.title}
                    </h4>
                    {ad.subtitle && (
                      <p className="text-[10px] sm:text-xs text-white/85 font-normal line-clamp-1 mt-0.5 drop-shadow-xs">
                        {ad.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );

            if (isExternal) {
              return (
                <a
                  key={`${ad.id || idx}-${idx}`}
                  href={targetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (hasMoved.current) e.preventDefault();
                  }}
                  className="block flex-shrink-0"
                >
                  {CardInner}
                </a>
              );
            }

            return (
              <Link
                key={`${ad.id || idx}-${idx}`}
                to={targetLink}
                onClick={(e) => {
                  if (hasMoved.current) e.preventDefault();
                }}
                className="block flex-shrink-0"
              >
                {CardInner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdvertisementStrip;
