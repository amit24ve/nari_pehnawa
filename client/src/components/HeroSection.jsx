import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NariHeadingDecoration } from "./NariHeadingDecoration";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Reliable Pexels URL builder — uses the w/h combo that Pexels CDN always serves
const px = (id, w = 1400, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&dpr=1`;

// Hero slides — use the site's own Nari Pehnawa model/fashion images first,
// with Pexels as secondary slides
const FALLBACK_SLIDES = [
  {
    id: "f1",
    image: "/hero_slide_1.png",
    alt: "Heritage Woven into Every Drape",
    title: "Heritage Woven Into Every Drape",
    subtitle: "Discover the finest ethnic wear for the modern Indian woman",
    cta_text: "Shop Now",
    cta_link: "/category/anarkali-kurtis",
  },
  {
    id: "f2",
    image: "/hero_slide_2.png",
    alt: "Embrace the Elegance of Tradition",
    title: "Embrace The Elegance Of Tradition",
    subtitle: "Chikankari, Palazzo Sets & more — crafted with love",
    cta_text: "Explore Collection",
    cta_link: "/category/chikankari-kurtis",
  },
  {
    id: "f3",
    image: "/hero_slide_3.png",
    alt: "Royal Threads — Up to 50% Off",
    title: "Royal Threads — Up To 50% Off",
    subtitle: "Festive season deals on premium ethnic wear",
    cta_text: "View Offers",
    cta_link: "/category/embroidered-kurtis",
  },
];

const HeroSection = () => {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Fetch slides from backend (admin can manage them via Settings)
  useEffect(() => {
    fetch(`${API_BASE}/slider/?active_only=true`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
          setCurrent(0);
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  const go = useCallback(
    (idx) => {
      if (animating) return;
      setAnimating(true);
      setCurrent((idx + slides.length) % slides.length);
      setTimeout(() => setAnimating(false), 700);
    },
    [animating, slides.length],
  );

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // Preload adjacent images into browser memory to eliminate any loading flicker
  useEffect(() => {
    if (!slides.length) return;
    const nextIdx = (current + 1) % slides.length;
    const prevIdx = (current - 1 + slides.length) % slides.length;
    [slides[current]?.image, slides[nextIdx]?.image, slides[prevIdx]?.image].forEach((src) => {
      if (src) {
        const preImg = new Image();
        preImg.src = resolveImageUrl(src, DEFAULT_HERO_FALLBACK);
      }
    });
  }, [current, slides]);

  // Auto-advance every 5.5 s
  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="relative overflow-hidden bg-white select-none mx-2.5 shadow-sm">
      <div
        className="relative w-full"
        style={{ height: "clamp(280px, calc(40.14vw - 8px), 580px)" }}
      >
        {slides.map((slide, i) => {
          const resolvedSrc = resolveImageUrl(slide.image, DEFAULT_HERO_FALLBACK);
          const hasText = Boolean(slide.title || slide.subtitle || (slide.cta_text && slide.cta_link && slide.cta_link !== "/"));

          return (
            <div
              key={slide.id || i}
              className="absolute inset-0 transition-opacity duration-700 bg-stone-900"
              style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
            >
              {/* Background image */}
              <img
                src={resolvedSrc}
                alt={slide.alt || slide.title || "Nari Pehnawa"}
                className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out"
                loading={i === 0 ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_HERO_FALLBACK;
                }}
              />

              {/* Gradient overlay for readability if slide has text */}
              {hasText && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)",
                  }}
                />
              )}

              {/* Text overlay — positioned exactly 50px from bottom as requested */}
              {hasText && i === current && (
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-[50px] px-6 text-center z-10 pointer-events-none">
                  <div className="pointer-events-auto max-w-2xl">
                    {slide.title && (
                      <h2
                        className="text-white font-bold drop-shadow-lg mb-2 leading-tight inline-flex items-center justify-center gap-2 flex-wrap text-center font-serif"
                        style={{ fontSize: "clamp(1.3rem, 3.5vw, 2.5rem)" }}
                      >
                        <NariHeadingDecoration className="w-7 h-7 md:w-10 md:h-10" />
                        <span>{slide.title}</span>
                        <NariHeadingDecoration flip={true} className="w-7 h-7 md:w-10 md:h-10" />
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="text-white/90 text-xs md:text-sm max-w-xl mb-3 font-light drop-shadow">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.cta_text && slide.cta_link && (
                      <Link
                        to={slide.cta_link}
                        className="inline-block bg-white text-[#8B0000] text-xs md:text-sm font-bold px-6 py-2 rounded-full shadow-lg tracking-wide hover:bg-amber-50 hover:scale-105 transition-all"
                      >
                        {slide.cta_text}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Arrow buttons */}
        <button
          onClick={prev}
          className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-white/15 hover:bg-white/30 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-white/15 hover:bg-white/30 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* ── Floating Launching Offer Card / Button (Mystery Jewelry Jar on First 5 Orders) ── */}
        <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-30 pointer-events-auto max-w-[280px] sm:max-w-xs animate-fadeIn">
          <Link
            to="/new-arrivals"
            className="group block bg-gradient-to-br from-[#2b050f]/95 via-[#580C1F]/90 to-[#1b030a]/95 text-white p-2.5 sm:p-3.5 rounded-2xl border border-[#d4af37]/70 shadow-2xl backdrop-blur-md hover:scale-105 hover:border-[#ffe29a] transition-all duration-300"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#d4af37] via-[#fff1be] to-[#d4af37] p-0.5 flex-shrink-0 shadow-md">
                <div className="w-full h-full bg-[#580C1F] rounded-[10px] flex items-center justify-center text-base sm:text-lg animate-pulse">
                  🎁
                </div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#ffe29a] bg-black/40 px-1.5 py-0.5 rounded">
                    LAUNCHING OFFER
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white truncate font-serif mt-0.5">
                  Free Mystery Jewelry Jar ✨
                </h4>
                <p className="text-[10px] sm:text-[11px] text-amber-100/85 line-clamp-1">
                  Top 5 Orders (1 to 5) Get a Gift!
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Dot indicators — no counter */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-7 h-2 bg-white shadow"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
