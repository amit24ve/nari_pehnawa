import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Store, ChevronRight } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "def_festive",
    text: "Grand Launch Celebration: Handcrafted Designer Ethnic Wear & Kurtis",
    link: "/new-arrivals",
    cta: "Explore",
  },
  {
    id: "def_express_delivery",
    text: "Express Pan-India Delivery on All Prepaid Orders Above ₹799",
    link: "/category/sale",
    cta: "Shop Now",
  },
  {
    id: "def_cod",
    text: "Cash on Delivery Available Across India • Easy 7-Day Hassle-Free Returns",
    link: "/category/sale",
    cta: "View Offers",
  },
];

const TopBar = () => {
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);

  const loadAnnouncements = useCallback(async () => {
    try {
      const [annRes, saleRes] = await Promise.all([
        fetch(`${API_BASE_URL}/announcements/?_t=${Date.now()}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_BASE_URL}/products/?on_sale=true&limit=8&_t=${Date.now()}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      const baseAnnouncements = Array.isArray(annRes)
        ? annRes
            .filter((a) => a.is_active !== false && a.text)
            .map((a) => ({
              id: a.id || a._id,
              // Strip excessive emojis to maintain a calm, premium luxury aesthetic
              text: (a.text || "").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim(),
              link: a.link || "/category/sale",
              cta: a.sub_text ? a.sub_text.trim() : (a.link?.includes("new") ? "Explore" : "Shop Now"),
            }))
        : [];

      const activeDeals = [];
      if (Array.isArray(saleRes) && saleRes.length > 0) {
        const dealMap = new Map();
        saleRes.forEach((p) => {
          const deal = p.deal_text ? p.deal_text.trim() : null;
          if (deal && !dealMap.has(deal)) {
            dealMap.set(deal, p);
          }
        });

        dealMap.forEach((_, dealText) => {
          activeDeals.push({
            id: `deal_${dealText}`,
            text: `Exclusive Festive Special: ${dealText}`,
            link: "/category/sale",
            cta: "View Collection",
          });
        });
      }

      // Marquee contains shopper-focused announcements only.
      // Seller onboarding is prominently anchored in the fixed right concierge button.
      const combined = [...activeDeals, ...baseAnnouncements];
      if (combined.length > 0) {
        setAnnouncements(combined);
      }
    } catch (e) {
      console.error("TopBar announcement error:", e);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();

    const handleUpdate = () => loadAnnouncements();
    window.addEventListener("np_announcements_updated", handleUpdate);
    window.addEventListener("np_deals_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("np_announcements_updated", handleUpdate);
      window.removeEventListener("np_deals_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [loadAnnouncements]);

  // Ensure sufficient repetitions for a seamless, glitch-free continuous infinite loop
  const baseItems = announcements.length < 4
    ? [...announcements, ...announcements, ...announcements, ...announcements]
    : announcements;
  const marqueeItems = [...baseItems, ...baseItems];

  return (
    <div className="relative z-50 bg-[#1F0407] text-[#F7F4EE] border-b border-[#D4AF37]/20 select-none overflow-hidden h-[34px] sm:h-[36px] flex items-center">
      <style>{`
        @keyframes npTopMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .np-marquee-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .np-marquee-track {
          display: flex;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation: npTopMarquee 58s linear infinite;
        }
        .np-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Left Edge Luxury Gradient Fade Mask */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#1F0407] to-transparent z-10" />

      {/* Full-width continuous scrolling marquee track */}
      <div className="np-marquee-wrapper">
        <div className="np-marquee-track">
          {marqueeItems.map((item, idx) => {
            const content = (
              <div className="inline-flex items-center gap-2.5 sm:gap-3 text-xs font-normal px-6 sm:px-9 group cursor-pointer leading-none">
                {/* Elegant Minimal Gold Star Separator */}
                <span className="text-[#D4AF37] text-[8px] select-none opacity-60">✦</span>

                {/* Announcement Headline */}
                <span className="font-sans font-medium text-[#F7F4EE]/90 whitespace-nowrap tracking-[0.04em] text-[11px] sm:text-[11.5px] transition-colors group-hover:text-white">
                  {item.text}
                </span>

                {/* Inline Minimal Luxury CTA */}
                {item.cta && (
                  <span className="inline-flex items-center gap-0.5 text-[#E5C378] font-semibold text-[10.5px] tracking-wide whitespace-nowrap opacity-90 group-hover:opacity-100 group-hover:underline">
                    <span>{item.cta}</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            );

            return item.link ? (
              <Link
                key={`${item.id || idx}-${idx}`}
                to={item.link}
                className="inline-flex items-center hover:opacity-95 transition-opacity"
              >
                {content}
              </Link>
            ) : (
              <span key={`${item.id || idx}-${idx}`} className="inline-flex items-center">
                {content}
              </span>
            );
          })}
        </div>
      </div>

      {/* Permanently FIXED Right Button: Enquiry as Seller (Refined Luxury Concierge Pill) */}
      <div className="absolute right-0 top-0 bottom-0 z-30 flex items-center pl-8 sm:pl-12 pr-3 sm:pr-4 bg-gradient-to-l from-[#1F0407] via-[#1F0407]/95 to-transparent pointer-events-auto">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("np_open_seller_inquiry"))}
          className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D060D] hover:bg-[#3D0A14] text-[#F3E5AB] hover:text-white text-[10.5px] sm:text-[11px] font-medium tracking-wide uppercase shadow-xs transition-all duration-200 cursor-pointer whitespace-nowrap border border-[#D4AF37]/45 hover:border-[#D4AF37] active:scale-95"
          title="Submit merchant partner inquiry & sell on Nari Pehnawa"
        >
          <Store className="w-3.5 h-3.5 text-[#D4AF37] transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
          <span className="hidden sm:inline">Enquiry as Seller</span>
          <span className="sm:hidden text-[10px]">Seller Enquiry</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
