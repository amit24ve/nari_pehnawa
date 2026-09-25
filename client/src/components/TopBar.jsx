import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, Tag, Gift, Truck } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const TopBar = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Fetch dynamic announcements from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/announcements/?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-rotate slider every 4 seconds
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [announcements.length, isPaused]);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const contentElement = (
    <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-[13px] font-medium tracking-wide text-white transition-opacity duration-300">
      {current.badge && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#d4af37] text-[#580C1F] shadow-sm">
          {current.icon || "✨"} {current.badge}
        </span>
      )}
      <span className="font-semibold text-white/95 truncate max-w-[280px] sm:max-w-md md:max-w-xl">
        {current.text}
      </span>
      {current.sub_text && (
        <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-white/15 border border-white/20 text-[#ffe29a] font-bold text-[11px]">
          {current.sub_text}
        </span>
      )}
      {current.link && (
        <span className="hidden lg:inline-flex items-center gap-0.5 text-[#ffe29a] hover:underline font-bold text-[11px] ml-1">
          SHOP NOW &rarr;
        </span>
      )}
    </div>
  );

  return (
    <div
      className="relative z-50 bg-gradient-to-r from-[#580C1F] via-[#7B1128] to-[#580C1F] text-white border-b border-[#d4af37]/30 select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[34px] sm:h-[38px] flex items-center justify-between">
        {/* Left arrow (if multiple announcements) */}
        {announcements.length > 1 ? (
          <button
            onClick={handlePrev}
            aria-label="Previous announcement"
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex-shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Center content */}
        <div className="flex-1 text-center px-2 min-w-0">
          {current.link ? (
            <Link
              to={current.link}
              className="inline-block hover:opacity-95 transition-opacity"
            >
              {contentElement}
            </Link>
          ) : (
            contentElement
          )}
        </div>

        {/* Right arrow & dots */}
        {announcements.length > 1 ? (
          <button
            onClick={handleNext}
            aria-label="Next announcement"
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition flex-shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>
    </div>
  );
};

export default TopBar;
