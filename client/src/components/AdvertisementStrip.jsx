import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Fallback curated ads if backend list is empty
const FALLBACK_ADS = [
  {
    id: "promo_festive_sale",
    title: "Grand Festive Celebration",
    subtitle: "Up to 40% Off on Pure Silk & Banarasi Kurtis",
    badge: "FESTIVE DEAL",
    image: "/api/api/uploads/7f6c4498b0ef46d2aab5b5dad0ede8d5.webp",
    link: "/category/sale",
  },
  {
    id: "promo_new_arrivals",
    title: "New Season Collection 2026",
    subtitle: "Fresh Handcrafted Kurtis & Sets Just Dropped",
    badge: "JUST LAUNCHED",
    image: "/api/api/uploads/a280729561574dfa80ac1290f9eb68c8.webp",
    link: "/new-arrivals",
  },
  {
    id: "promo_wedding_bogo",
    title: "Celebration Special BOGO",
    subtitle: "Buy 1 Get 1 Free on Curated Partywear",
    badge: "LIMITED PERIOD",
    image: "/api/api/uploads/bb5701bc0f9e4bad8bbc32880cf95b1f.webp",
    link: "/category/sale",
  },
  {
    id: "promo_seller_hub",
    title: "Sell on Nari Pehnawa",
    subtitle: "Reach Millions of Ethnic Fashion Shoppers Nationwide",
    badge: "SELLER HUB",
    image: "/api/api/uploads/e822dee5ee8d4a6e9ab3475dbe877a70.webp",
    link: "/seller/register",
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
              badge: idx % 2 === 0 ? "POPULAR" : "SPECIAL DEAL",
              image: s.image,
              link: s.cta_link || "/category/sale",
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

  // Duplicate items for continuous infinite scroll
  const displayAds =
    ads.length > 0
      ? ads.length < 5
        ? [...ads, ...ads, ...ads, ...ads]
        : [...ads, ...ads]
      : FALLBACK_ADS;

  // Auto-scroll loop — smooth and continuous
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

  return (
    <section className="relative w-full py-3 sm:py-4 bg-gradient-to-b from-stone-50 via-white to-stone-50 border-b border-stone-200/70 overflow-hidden select-none">
      <div
        className="relative max-w-7xl mx-auto px-2 sm:px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          onMouseUp();
        }}
      >
        {/* Subtle Edge Fade Masks for seamless sliding without arrow buttons */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent z-10" />

        {/* Scrolling Cards Row */}
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex items-center gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide py-1 px-1 cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: "auto" }}
        >
          {displayAds.map((ad, idx) => {
            const rawImg = ad.image || "";
            const imgSrc =
              rawImg.trim() !== ""
                ? resolveImageUrl(rawImg, DEFAULT_HERO_FALLBACK)
                : DEFAULT_HERO_FALLBACK;
            const targetLink = ad.link || ad.cta_link || "/category/sale";
            const badgeText = ad.badge || "SPECIAL OFFER";
            const isExternal = targetLink.startsWith("http");

            const CardInner = (
              <div className="relative w-[280px] sm:w-[340px] md:w-[380px] lg:w-[400px] h-[130px] sm:h-[148px] md:h-[160px] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-stone-200 transition-all duration-300 group/card flex-shrink-0 bg-stone-900 cursor-pointer">
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

                {/* Dark Luxury Gradient Overlay (Brand Maroon & Black Tint) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 z-10 pointer-events-none" />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 p-3 sm:p-4 flex flex-col justify-between pointer-events-none">
                  {/* Top Badge (Royal Maroon & Crisp White) */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm text-white bg-[#780016] border border-white/30 backdrop-blur-sm">
                      {badgeText}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/90 font-medium flex items-center gap-1 group-hover/card:text-white transition-colors">
                      Explore{" "}
                      <ArrowRight className="w-3 h-3 group-hover/card:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 className="text-xs sm:text-sm md:text-[15px] font-bold text-white tracking-wide line-clamp-1 drop-shadow-sm font-serif">
                      {ad.title}
                    </h4>
                    {ad.subtitle && (
                      <p className="text-[10px] sm:text-xs text-stone-200 font-normal line-clamp-1 mt-0.5 drop-shadow-xs">
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
