import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Flame, ArrowRight, Gift, PartyPopper } from "lucide-react";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Festive celebration emojis (Flowers, Gifts, Sparkles, Celebrations)
const CELEBRATION_ITEMS = [
  "🌸", "🌺", "🌹", "🌼", "💮", "🌷", // Flowers
  "🎁", "🛍️", "🎁", "✨", "🎉", "💖", "🪔", "🎊" // Gifts & Festive elements
];

const FestiveDealCelebrationModal = () => {
  const [activeDeal, setActiveDeal] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Load active deal from backend
  const fetchActiveDeal = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/?on_sale=true&limit=6&_t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Find product with deal_text (e.g. BUY 1 GET 1 FREE)
        const dealProd = data.find((p) => p.deal_text && p.deal_text.trim().length > 0) || data[0];
        if (dealProd && (dealProd.deal_text || dealProd.mega_sale_price)) {
          setActiveDeal({
            id: dealProd.id || dealProd._id,
            name: dealProd.name,
            image: dealProd.image,
            deal_text: dealProd.deal_text || "BUY 1 GET 1 FREE (BOGO)",
            price: dealProd.mega_sale_price || dealProd.price,
            original_price: dealProd.original_price || (dealProd.price ? dealProd.price * 1.5 : null),
            sale_title: dealProd.sale_title || "Mega Festive Sale",
          });
          triggerCelebration();
        }
      }
    } catch (e) {
      console.error("Celebration modal fetch error:", e);
    }
  };

  const triggerCelebration = () => {
    // Generate 42 random falling flower and gift particles
    const generated = Array.from({ length: 42 }).map((_, i) => {
      const icon = CELEBRATION_ITEMS[Math.floor(Math.random() * CELEBRATION_ITEMS.length)];
      const startX = Math.random() * 96 + 2; // 2% to 98% horizontal
      const duration = 2.4 + Math.random() * 1.6; // 2.4s to 4s
      const delay = Math.random() * 0.7; // 0 to 0.7s delay
      const size = 22 + Math.random() * 20; // 22px to 42px
      const sway = (Math.random() - 0.5) * 80; // -40px to +40px horizontal sway
      const spin = (Math.random() - 0.5) * 720; // rotation

      return {
        id: i,
        icon,
        startX,
        duration,
        delay,
        size,
        sway,
        spin,
      };
    });

    setParticles(generated);
    setIsVisible(true);
    setIsClosing(false);
  };

  useEffect(() => {
    // Initial fetch on mount with slight delay so page loads smoothly
    const timeout = setTimeout(() => {
      fetchActiveDeal();
    }, 450);

    // Listen to admin deal updates
    window.addEventListener("np_deals_updated", fetchActiveDeal);
    window.addEventListener("np_announcements_updated", fetchActiveDeal);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("np_deals_updated", fetchActiveDeal);
      window.removeEventListener("np_announcements_updated", fetchActiveDeal);
    };
  }, []);

  // Auto-close timer (~2.8 seconds total: 2.4s visible + 400ms fade)
  useEffect(() => {
    if (!isVisible || isClosing || isPaused) return;

    timerRef.current = setTimeout(() => {
      handleClose();
    }, 2800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, isClosing, isPaused]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setParticles([]);
    }, 380);
  };

  const handleShopNow = () => {
    handleClose();
    navigate("/category/sale");
  };

  if (!isVisible || !activeDeal) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 select-none">
      {/* ── Falling Flowers & Gifts Shower Layer ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 animate-festive-drop will-change-transform"
            style={{
              left: `${p.startX}%`,
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--sway-x": `${p.sway}px`,
              "--spin-deg": `${p.spin}deg`,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
            }}
          >
            {p.icon}
          </div>
        ))}
      </div>

      {/* ── Soft Dark Backdrop with Festive Glow ── */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/45 backdrop-blur-[2.5px] transition-opacity duration-300 z-45 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* ── Regal Indian Festive Celebration Modal ── */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`relative z-50 w-full max-w-[430px] rounded-3xl overflow-hidden shadow-[0_15px_60px_rgba(139,0,0,0.45)] border-2 border-amber-300/90 bg-gradient-to-br from-[#4A0000] via-[#8B0000] to-[#380000] text-white transition-all duration-300 transform ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          boxShadow: "0 10px 50px rgba(212, 175, 55, 0.35), 0 0 25px rgba(255, 215, 0, 0.25)",
        }}
      >
        {/* Ornate Gold Filigree Corners (Pure CSS) */}
        <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none border-t-2 border-l-2 border-amber-300/60 rounded-tl-3xl m-1" />
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none border-t-2 border-r-2 border-amber-300/60 rounded-tr-3xl m-1" />
        <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none border-b-2 border-l-2 border-amber-300/60 rounded-bl-3xl m-1" />
        <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none border-b-2 border-r-2 border-amber-300/60 rounded-br-3xl m-1" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-amber-300/50 flex items-center justify-center text-amber-200 hover:text-white transition-all cursor-pointer"
          aria-label="Close deal popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Inner Content */}
        <div className="p-5 pt-6 text-center space-y-3.5">
          {/* Festive Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 text-[11px] font-black tracking-widest uppercase shadow-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>{activeDeal.sale_title || "FESTIVE MEGA CELEBRATION"}</span>
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
          </div>

          {/* Deal Headline */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 drop-shadow-md font-serif">
              ⚡ {activeDeal.deal_text}
            </h2>
            <p className="text-xs text-amber-100/85 font-medium">
              Limited Period Festive Mega Sale Offer • Grab Yours Now!
            </p>
          </div>

          {/* Featured Product Preview Card */}
          <div
            onClick={handleShopNow}
            className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-amber-300/40 flex items-center gap-3.5 text-left cursor-pointer hover:bg-white/15 transition-all group shadow-inner"
          >
            <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-amber-300/60 shadow-md">
              <img
                src={resolveImageUrl(activeDeal.image, DEFAULT_FALLBACK_IMAGE)}
                alt={activeDeal.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
              <span className="absolute top-1 left-1 bg-[#8B0000] text-amber-200 text-[8px] font-extrabold px-1 rounded">
                BOGO
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/90 block">
                Featured Deal Product
              </span>
              <h4 className="font-semibold text-xs sm:text-sm text-white truncate group-hover:text-amber-200 transition-colors">
                {activeDeal.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-amber-300 font-mono">
                  ₹{Number(activeDeal.price || 0).toLocaleString("en-IN")}
                </span>
                {activeDeal.original_price && activeDeal.original_price > activeDeal.price && (
                  <span className="text-xs text-white/50 line-through font-mono">
                    ₹{Number(activeDeal.original_price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA Action Button */}
          <button
            type="button"
            onClick={handleShopNow}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-amber-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>🛍️ SHOP BOGO DEALS NOW</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Auto-Close Timer Progress Bar */}
          <div className="pt-1">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 transition-all ease-linear"
                style={{
                  width: isClosing ? "0%" : "100%",
                  animation: !isPaused ? "timerCountdown 2.8s linear forwards" : "none",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-amber-200/70">
              <span>{isPaused ? "⏸️ Timer paused" : "⚡ Auto-closing in 2s"}</span>
              <span onClick={handleClose} className="hover:text-amber-100 cursor-pointer underline">
                Skip
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pure CSS Keyframes for Flowers & Gifts Shower */}
      <style>{`
        @keyframes festiveShower {
          0% {
            transform: translateY(-50px) translateX(0) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(40px) translateX(var(--sway-x)) rotate(30deg) scale(1.1);
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) translateX(calc(var(--sway-x) * 1.6)) rotate(var(--spin-deg)) scale(0.85);
            opacity: 0;
          }
        }
        .animate-festive-drop {
          animation: festiveShower var(--duration, 3s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes timerCountdown {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default FestiveDealCelebrationModal;
