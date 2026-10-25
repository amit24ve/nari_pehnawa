import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const TopBar = () => {
  const [announcements, setAnnouncements] = useState([]);

  // Fetch dynamic announcements from backend
  const loadAnnouncements = useCallback(() => {
    fetch(`${API_BASE_URL}/announcements/?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data.filter((a) => a.is_active !== false));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAnnouncements();

    // Listen to real-time custom events & storage events for instant updates without page refresh
    const handleUpdate = () => {
      loadAnnouncements();
    };

    window.addEventListener("np_announcements_updated", handleUpdate);
    window.addEventListener("np_mystery_jar_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("np_announcements_updated", handleUpdate);
      window.removeEventListener("np_mystery_jar_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [loadAnnouncements]);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  // Create a repeated array to ensure a seamless continuous infinite scroll
  // Repeat enough times so there are no empty gaps across wide viewports
  const baseItems = announcements.length < 4
    ? [...announcements, ...announcements, ...announcements, ...announcements]
    : announcements;
  const marqueeItems = [...baseItems, ...baseItems];

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#4A0A19] via-[#7B1128] to-[#4A0A19] text-white border-b border-[#d4af37]/30 select-none overflow-hidden h-[34px] sm:h-[38px] flex items-center">
      <style>{`
        @keyframes npTopMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .np-marquee-track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation: npTopMarquee 80s linear infinite;
        }
        .np-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Subtle edge fades for smooth entrance and exit */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#4A0A19] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#4A0A19] to-transparent z-10" />

      {/* Infinite scrolling track */}
      <div className="np-marquee-track">
        {marqueeItems.map((item, idx) => {
          const content = (
            <div className="inline-flex items-center gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-medium tracking-wide text-white px-6 sm:px-8 group cursor-pointer">
              <span className="text-sm flex-shrink-0 animate-pulse">{item.icon || "✨"}</span>
              <span className="font-semibold text-white/95 whitespace-nowrap">
                {item.text}
              </span>
              {item.sub_text && (
                <span className="hidden sm:inline text-white/70 text-xs">
                  ({item.sub_text})
                </span>
              )}
              {item.link && (
                <span className="inline-flex items-center gap-1 text-[#ffe29a] font-bold text-[11px] ml-1 bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors whitespace-nowrap">
                  Shop Now &rarr;
                </span>
              )}
              <span className="text-[#d4af37]/60 ml-4 select-none">✦</span>
            </div>
          );

          return item.link ? (
            <Link
              key={`${item.id || idx}-${idx}`}
              to={item.link}
              className="inline-block hover:opacity-95 transition-opacity"
            >
              {content}
            </Link>
          ) : (
            <span key={`${item.id || idx}-${idx}`} className="inline-block">
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TopBar;

