import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NariHeadingDecoration } from "./NariHeadingDecoration";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Fallback hero slides using local Nari Pehnawa brand banners
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
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState("next"); // "next" | "prev"
  const [slideCycle, setSlideCycle] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);
  const navigate = useNavigate();

  // Fetch slides from backend (admin can manage them via Settings)
  useEffect(() => {
    fetch(`${API_BASE}/slider/?active_only=true`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
          setCurrent(0);
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  const go = useCallback(
    (idx, dir = "next") => {
      if (animating || idx === current) return;
      setAnimating(true);
      setDirection(dir);
      setPrevIndex(current);
      setCurrent(idx);
      setSlideCycle((c) => c + 1);
      setTimeout(() => {
        setAnimating(false);
        setPrevIndex(null);
      }, 980);
    },
    [animating, current]
  );

  const next = useCallback(() => {
    const nextIdx = (current + 1) % slides.length;
    go(nextIdx, "next");
  }, [current, slides.length, go]);

  const prev = useCallback(() => {
    const prevIdx = (current - 1 + slides.length) % slides.length;
    go(prevIdx, "prev");
  }, [current, slides.length, go]);

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

  // Auto-advance slowly every 5.5s (relaxed, slow pace so user can admire the zoom effect before sliding)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next, isPaused, slides.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40 && touchEndX.current !== 0) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <>
      <section
        className="relative overflow-hidden bg-white select-none mx-0 sm:mx-2.5 shadow-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <style>{`
          .home-hero-slider {
            height: clamp(280px, 64vw, 400px);
          }
          @media(min-width: 768px) {
            .home-hero-slider {
              height: clamp(470px, calc(40.14vw + 12px), 600px);
            }
          }
          @keyframes heroKenBurnsSlow {
            0% {
              transform: scale(1.0);
            }
            100% {
              transform: scale(1.09);
            }
          }
          .hero-kenburns-zoom {
            animation: heroKenBurnsSlow 6.5s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
            will-change: transform;
          }
          .hero-kenburns-hold {
            transform: scale(1.09);
            will-change: transform;
          }

          @keyframes heroSlideInRight {
            0% {
              transform: translate3d(100%, 0, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes heroSlideOutLeft {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-100%, 0, 0);
            }
          }
          @keyframes heroSlideInLeft {
            0% {
              transform: translate3d(-100%, 0, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes heroSlideOutRight {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(100%, 0, 0);
            }
          }

          .hero-slide-enter-next {
            animation: heroSlideInRight 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            z-index: 10;
          }
          .hero-slide-exit-next {
            animation: heroSlideOutLeft 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            z-index: 5;
          }
          .hero-slide-enter-prev {
            animation: heroSlideInLeft 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            z-index: 10;
          }
          .hero-slide-exit-prev {
            animation: heroSlideOutRight 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            z-index: 5;
          }
        `}</style>
        <div className="home-hero-slider relative w-full overflow-hidden">
          {slides.map((slide, i) => {
            const resolvedSrc = resolveImageUrl(slide.image, DEFAULT_HERO_FALLBACK);
            const hasText = Boolean(slide.title || slide.subtitle || (slide.cta_text && slide.cta_link && slide.cta_link !== "/"));

            const isCurrent = i === current;
            const isPrev = i === prevIndex;

            let animClass = "opacity-0 pointer-events-none z-0";
            if (animating) {
              if (isCurrent) {
                animClass = direction === "next" ? "hero-slide-enter-next" : "hero-slide-enter-prev";
              } else if (isPrev) {
                animClass = direction === "next" ? "hero-slide-exit-next" : "hero-slide-exit-prev";
              }
            } else if (isCurrent) {
              animClass = "opacity-100 z-10 translate-x-0";
            }

            const imgKey = isCurrent
              ? `hero-img-${i}-${slideCycle}`
              : isPrev
              ? `hero-img-${i}-${slideCycle - 1}`
              : `hero-img-${i}-idle`;

            return (
              <div
                key={slide.id || i}
                className={`absolute inset-0 overflow-hidden bg-stone-900 ${animClass}`}
              >
                {/* Background image with slow Ken Burns zoom */}
                <img
                  key={imgKey}
                  src={resolvedSrc}
                  alt={slide.alt || slide.title || "Nari Pehnawa"}
                  className={`w-full h-full object-cover object-top ${
                    isCurrent ? "hero-kenburns-zoom" : isPrev ? "hero-kenburns-hold" : ""
                  }`}
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
                {hasText && (isCurrent || isPrev) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-[68px] md:pb-[76px] px-4 sm:px-6 text-center z-10 pointer-events-none">
                    <div className="pointer-events-auto max-w-2xl">
                      {slide.title && (
                        <h2
                          className="text-white font-bold drop-shadow-xl mb-1.5 sm:mb-2 leading-tight text-center font-serif tracking-normal"
                          style={{ fontSize: "clamp(1.2rem, 3.8vw, 2.75rem)" }}
                        >
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-amber-100/95 text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-3 sm:mb-4 font-normal drop-shadow-md line-clamp-2 sm:line-clamp-none tracking-wide">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.cta_text && slide.cta_link && (
                        <Link
                          to={slide.cta_link}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#F3E5AB] hover:to-[#D4AF37] text-[#24060E] text-xs md:text-sm font-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-2xl tracking-wider uppercase hover:scale-105 active:scale-95 transition-all duration-300 border border-white/40"
                        >
                          <span>{slide.cta_text}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Dot indicators — positioned at bottom */}
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i > current) go(i, "next");
                  else if (i < current) go(i, "prev");
                }}
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
    </>
  );
};

export default HeroSection;
