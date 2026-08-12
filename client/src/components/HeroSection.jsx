import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NariHeadingDecoration } from "./NariHeadingDecoration";

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

  // Auto-advance every 5.5 s
  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="relative overflow-hidden bg-white select-none mx-2.5 rounded-2xl shadow-sm">
      <div
        className="relative w-full"
        style={{ height: "clamp(220px, calc(40.14vw - 8px), 580px)" }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id || i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            {/* Background image */}
            <img
              src={slide.image}
              alt={slide.alt || ""}
              className="w-full h-full object-cover object-top"
              loading={i === 0 ? "eager" : "lazy"}
            />


          </div>
        ))}

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
