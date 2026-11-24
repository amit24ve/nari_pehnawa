import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "def_mega_sale",
    text: "MEGA SALE IS LIVE: UP TO 40% OFF ON FESTIVE ETHNIC WEAR",
    link: "/category/sale",
    cta: "Shop Now →",
  },
  {
    id: "def_free_shipping",
    text: "FREE EXPRESS SHIPPING ON ALL PREPAID ORDERS ABOVE ₹799",
    link: "/category/sale",
    cta: "Explore →",
  },
  {
    id: "def_seller_hub",
    text: "SELL ON NARI PEHNAWA: EXPAND YOUR ETHNIC BRAND NATIONWIDE",
    link: "/seller/register",
    cta: "Register as Seller →",
  },
  {
    id: "def_new_arrival",
    text: "HANDCRAFTED BANARASI & LUCKNOWI KURTIS NOW IN STOCK",
    link: "/new-arrivals",
    cta: "View Collection →",
  },
];

const TopBar = () => {
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);

  const loadAnnouncements = useCallback(async () => {
    try {
      const [annRes, saleRes] = await Promise.all([
        fetch(`${API_BASE_URL}/announcements/?_t=${Date.now()}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_BASE_URL}/products/?on_sale=true&limit=10&_t=${Date.now()}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      const baseAnnouncements = Array.isArray(annRes)
        ? annRes
            .filter((a) => a.is_active !== false && a.text)
            .map((a) => ({
              id: a.id || a._id,
              // Strip excessive emojis from text to keep it clean and professional
              text: (a.text || "").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim().toUpperCase(),
              link: a.link || "/category/sale",
              cta: a.link?.includes("seller") ? "Register →" : "Shop Now →",
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
            text: `EXCLUSIVE FESTIVE OFFER: ${dealText.toUpperCase()} ON SELECTED STYLES`,
            link: "/category/sale",
            cta: "Shop Deals →",
          });
        });
      }

      const sellerItem = {
        id: "seller_hub_announcement",
        text: "SELL ON NARI PEHNAWA: BECOME A VERIFIED MERCHANT PARTNER",
        link: "/seller/register",
        cta: "Register as Seller →",
      };

      const combined = [...activeDeals, ...baseAnnouncements, sellerItem];
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

  // Repeat for continuous seamless infinite loop
  const baseItems = announcements.length < 4
    ? [...announcements, ...announcements, ...announcements, ...announcements]
    : announcements;
  const marqueeItems = [...baseItems, ...baseItems];

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#3B0713] via-[#660C22] to-[#3B0713] text-white border-b border-[#D4AF37]/30 select-none overflow-hidden h-[34px] sm:h-[36px] flex items-center">
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
          animation: npTopMarquee 70s linear infinite;
        }
        .np-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#3B0713] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#3B0713] to-transparent z-10" />

      {/* Infinite Scrolling Track */}
      <div className="np-marquee-track">
        {marqueeItems.map((item, idx) => {
          const isSeller = Boolean(item.link && item.link.includes("seller"));

          const content = (
            <div className="inline-flex items-center gap-2 sm:gap-3 text-xs font-medium tracking-wide text-white px-5 sm:px-8 group cursor-pointer leading-none">
              {/* Clean separator */}
              <span className="text-[#D4AF37] text-[10px] select-none opacity-80">✦</span>

              {/* Title Text strictly single line */}
              <span className="font-semibold text-white/95 whitespace-nowrap tracking-wider text-[11px] sm:text-xs">
                {item.text}
              </span>

              {/* Action Button */}
              {item.cta && (
                <span className="inline-flex items-center text-[#FFE29A] font-bold text-[10px] sm:text-[11px] bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors whitespace-nowrap">
                  {item.cta}
                </span>
              )}
            </div>
          );

          if (isSeller) {
            return (
              <button
                key={`${item.id || idx}-${idx}`}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("np_open_seller_register"))}
                className="inline-flex items-center hover:opacity-95 transition-opacity text-left cursor-pointer"
              >
                {content}
              </button>
            );
          }

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

      {/* Pinned Right Button: Seller Inquiry */}
      <div className="relative z-20 flex-shrink-0 pr-2 sm:pr-4 pl-2 bg-gradient-to-l from-[#3B0713] via-[#3B0713] to-transparent h-full flex items-center">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("np_open_seller_inquiry"))}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#3B0713] hover:from-[#E5C158] hover:to-[#FFF] text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer whitespace-nowrap border border-[#D4AF37]/60 active:scale-95"
          title="Submit merchant seller requirements & partner with Nari Pehnawa"
        >
          <FileText className="w-3 h-3 text-[#3B0713]" />
          <span>Seller Inquiry</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
