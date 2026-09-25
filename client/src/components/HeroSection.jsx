import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
  const [showJarModal, setShowJarModal] = useState(false);
  const navigate = useNavigate();

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
    <>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-[60px] sm:pb-[68px] px-6 text-center z-10 pointer-events-none">
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
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-white/15 hover:bg-white/30 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-white/15 hover:bg-white/30 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* ── Slim Bottom Offer Pill (Positioned right above the dot indicators) ── */}
          <div className="absolute bottom-9 sm:bottom-11 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              onClick={() => setShowJarModal(true)}
              className="group bg-white/95 hover:bg-white text-gray-900 border border-amber-300/90 shadow-lg backdrop-blur-md rounded-full py-1.5 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-all duration-300 cursor-pointer"
              title="Click to view Mystery Jewelry Jar offer"
            >
              <span className="text-sm">🎁</span>
              <span className="text-xs sm:text-[13px] font-bold text-gray-800 tracking-tight">
                Free Mystery Jewelry Jar for Top 5 Orders
              </span>
              <span className="text-[#8B0000] font-black text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                View &rarr;
              </span>
            </button>
          </div>

          {/* Dot indicators — positioned at bottom */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === current
                    ? "w-7 h-2 bg-white shadow-md"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mystery Jewelry Jar Modal Popup ── */}
      {showJarModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={() => setShowJarModal(false)} />

          <div
            className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-200/80 z-10 animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowJarModal(false)}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Jar Image */}
            <div className="relative w-full h-56 sm:h-64 bg-amber-50/50 overflow-hidden flex items-center justify-center">
              <img
                src="/mystery_jewelry_jar.jpg"
                alt="Free Mystery Jewelry Jar"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 bg-[#8B0000] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                🎁 Top 5 Orders Gift
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="text-[11px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1 font-serif">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Exclusive Launching Offer
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-gray-900 leading-tight">
                  Free Mystery Jewelry Jar
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Be among the <strong>first 5 lucky orders (1 to 5)</strong> on Nari Pehnawa to receive this handcrafted luxury Mystery Jewelry Jar packed with premium fashion earrings, necklaces, and surprises along with your order!
                </p>
              </div>

              {/* Highlights badge box */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1.5 text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <span>✨</span> 100% Free with Your First 5 Purchases
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span>🎁</span> Premium Glass Jar with Hand-picked Jewelry
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span>⚡</span> Automatically Added to Qualifying Deliveries
                </div>
              </div>

              <button
                onClick={() => {
                  setShowJarModal(false);
                  navigate("/new-arrivals");
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] via-[#A00000] to-[#8B0000] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-900/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Shop Now &amp; Claim Gift</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroSection;
