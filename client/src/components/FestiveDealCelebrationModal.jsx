import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Festive celebration emojis (Flowers, Gifts, Sparkles, Celebrations)
const CELEBRATION_ITEMS = [
  "🌸", "🌺", "🌹", "🌼", "💮", "🌷", // Flowers
  "🎁", "🛍️", "🎁", "✨", "🎉", "💖", "🪔", "🎊" // Gifts & Festive celebration items
];

const FestiveDealCelebrationModal = () => {
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Check if any sale/BOGO deal is active in the store
  const checkDealAndTriggerShower = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/?on_sale=true&limit=6&_t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const hasSaleDeal = data.some((p) => p.on_sale || p.deal_text || p.mega_sale_price);
        if (hasSaleDeal) {
          triggerFlowersAndGiftsDrop();
        }
      }
    } catch (e) {
      console.error("Festive shower fetch error:", e);
    }
  };

  const triggerFlowersAndGiftsDrop = () => {
    // Generate 50 festive flowers and gifts falling across the screen
    const items = Array.from({ length: 50 }).map((_, i) => {
      const icon = CELEBRATION_ITEMS[Math.floor(Math.random() * CELEBRATION_ITEMS.length)];
      const startX = Math.random() * 96 + 2; // 2% to 98% horizontal spread
      const duration = 2.6 + Math.random() * 1.6; // 2.6s to 4.2s fall time
      const delay = Math.random() * 0.9; // staggered start
      const size = 22 + Math.random() * 22; // 22px to 44px
      const sway = (Math.random() - 0.5) * 90; // horizontal sway as it falls
      const spin = (Math.random() - 0.5) * 720; // 3D rotation angle

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

    setParticles(items);
    setIsActive(true);

    // Auto cleanup after the falling animation finishes (~4.8 seconds)
    setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, 4800);
  };

  useEffect(() => {
    // Slight delay after mount so initial page renders before shower starts
    const timeout = setTimeout(() => {
      checkDealAndTriggerShower();
    }, 350);

    // Listen to admin deal updates
    window.addEventListener("np_deals_updated", checkDealAndTriggerShower);
    window.addEventListener("np_announcements_updated", checkDealAndTriggerShower);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("np_deals_updated", checkDealAndTriggerShower);
      window.removeEventListener("np_announcements_updated", checkDealAndTriggerShower);
    };
  }, []);

  if (!isActive || particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-50 select-none"
      aria-hidden="true"
    >
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
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.22))",
          }}
        >
          {p.icon}
        </div>
      ))}

      {/* Pure CSS Keyframes for Flowers & Gifts Shower */}
      <style>{`
        @keyframes festiveShower {
          0% {
            transform: translateY(-50px) translateX(0) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(50px) translateX(var(--sway-x)) rotate(35deg) scale(1.1);
          }
          80% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(105vh) translateX(calc(var(--sway-x) * 1.6)) rotate(var(--spin-deg)) scale(0.85);
            opacity: 0;
          }
        }
        .animate-festive-drop {
          animation: festiveShower var(--duration, 3.2s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default FestiveDealCelebrationModal;
