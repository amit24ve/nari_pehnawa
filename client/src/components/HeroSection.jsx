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
  const [jarConfig, setJarConfig] = useState({
    is_enabled: true,
    pill_text: "Free Mystery Jewellery Jar",
    pill_subtext: "View Gift →",
    image_url: "/mystery_jewelry_jar.jpg",
    title: "Free Mystery Jewellery Jar 🎁",
    overlay_text: "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!",
    description: "Receive this handcrafted luxury glass jar with red ribbon, filled with premium surprise jewelry inside with your delivery parcel!",
    button_text: "Shop Now & Claim Gift",
    button_link: "/new-arrivals",
  });
  const navigate = useNavigate();

  // Load dynamic mystery jar config from backend
  const loadJarConfig = useCallback(() => {
    fetch(`${API_BASE}/announcements/mystery-jar?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg) setJarConfig((prev) => ({ ...prev, ...cfg }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadJarConfig();
    const handleUpdate = () => loadJarConfig();
    window.addEventListener("np_mystery_jar_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      window.removeEventListener("np_mystery_jar_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [loadJarConfig]);

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
      <section className="relative overflow-hidden bg-white select-none mx-0 sm:mx-2.5 shadow-sm">
        <style>{`
          .home-hero-slider {
            height: clamp(260px, 60vw, 380px);
          }
          @media(min-width: 768px) {
            .home-hero-slider {
              height: clamp(450px, calc(40.14vw - 8px), 580px);
            }
          }
        `}</style>
        <div className="home-hero-slider relative w-full">
          {slides.map((slide, i) => {
            const resolvedSrc = resolveImageUrl(slide.image, DEFAULT_HERO_FALLBACK);
            const hasText = Boolean(slide.title || slide.subtitle || (slide.cta_text && slide.cta_link && slide.cta_link !== "/"));

            return (
              <div
                key={slide.id || i}
                className="absolute inset-0 transition-opacity duration-700 bg-stone-900"
                style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
              >
                {/* Background image — matching Category hero mobile proportion & full visibility */}
                <img
                  src={resolvedSrc}
                  alt={slide.alt || slide.title || "Nari Pehnawa"}
                  className="w-full h-full object-cover object-center sm:object-top transition-transform duration-1000 ease-out"
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

                {/* Text overlay */}
                {hasText && i === current && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-[68px] md:pb-[76px] px-4 sm:px-6 text-center z-10 pointer-events-none">
                    <div className="pointer-events-auto max-w-2xl">
                      {slide.title && (
                        <h2
                          className="text-white font-bold drop-shadow-lg mb-1 sm:mb-2 leading-tight inline-flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-center font-serif"
                          style={{ fontSize: "clamp(1.1rem, 3.5vw, 2.5rem)" }}
                        >
                          <NariHeadingDecoration className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10" />
                          <span>{slide.title}</span>
                          <NariHeadingDecoration flip={true} className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10" />
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-white/90 text-xs sm:text-sm max-w-xl mb-2 sm:mb-3 font-light drop-shadow line-clamp-2 sm:line-clamp-none">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.cta_text && slide.cta_link && (
                        <Link
                          to={slide.cta_link}
                          className="inline-block bg-white text-[#8B0000] text-xs md:text-sm font-bold px-5 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-lg tracking-wide hover:bg-amber-50 hover:scale-105 transition-all"
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
            className="absolute left-1.5 sm:left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 cursor-pointer shadow-md"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-1.5 sm:right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 cursor-pointer shadow-md"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ── Fixed Rectangular Bottom Offer Box (Thicker black border, rich shadow, clean gift icon) ── */}
          {jarConfig.is_enabled && (
            <div className="absolute bottom-7 sm:bottom-9 md:bottom-11 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95%] sm:max-w-none">
              <button
                onClick={() => setShowJarModal(true)}
                className="bg-white/95 hover:bg-white text-gray-900 border-1.5 sm:border-2 border-black shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md rounded-xl sm:rounded-2xl py-1.5 sm:py-2 px-3 sm:px-5 flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-transform hover:scale-102"
                title="Click to view Mystery Jewellery Jar offer"
              >
                <span className="text-xl sm:text-2xl flex-shrink-0 select-none leading-none">
                  🎁
                </span>
                <div className="text-left">
                  <div className="text-xs sm:text-[13px] font-black text-gray-900 leading-tight tracking-tight whitespace-nowrap">
                    {jarConfig.pill_text || "Free Mystery Jewellery Jar"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#8B0000] flex items-center gap-1">
                    <span>View Gift</span>
                    <span className="text-xs">&rarr;</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Dot indicators — positioned at bottom */}
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === current
                    ? "w-6 sm:w-7 h-1.5 sm:h-2 bg-white shadow-md"
                    : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Compact Card Modal Popup (Compact Square Card with Full Image & Clear Text) ── */}
      {showJarModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={() => setShowJarModal(false)} />

          <div
            className="relative bg-white rounded-3xl max-w-[340px] sm:max-w-[360px] w-full overflow-hidden shadow-2xl border border-black/80 z-10 animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowJarModal(false)}
              className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer shadow-lg border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Full Image Container with Overlay Text */}
            <div className="relative w-full h-64 sm:h-72 bg-black overflow-hidden group">
              <img
                src={resolveImageUrl(jarConfig.image_url, "/mystery_jewelry_jar.jpg")}
                alt="Free Mystery Jewellery Jar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.target.src = "/mystery_jewelry_jar.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              {/* Text Overlay directly on the Image */}
              <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#ffe29a] bg-[#8B0000]/90 px-2 py-0.5 rounded-md inline-block shadow">
                  🎁 DAILY TOP 5 ORDERS
                </div>
                <h4 className="text-base sm:text-lg font-black font-serif text-white leading-tight drop-shadow-md">
                  {jarConfig.overlay_text || "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!"}
                </h4>
              </div>
            </div>

            {/* Compact Modal Footer Content */}
            <div className="p-4 space-y-3 bg-white">
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {jarConfig.description || "Receive this handcrafted luxury glass jar with red ribbon, filled with premium surprise jewelry inside with your delivery parcel!"}
              </p>

              <button
                onClick={() => {
                  setShowJarModal(false);
                  navigate(jarConfig.button_link || "/new-arrivals");
                }}
                className="w-full py-3 bg-gradient-to-r from-[#8B0000] via-[#A00000] to-[#8B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-900/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{jarConfig.button_text || "Shop Now & Claim Gift"}</span>
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
