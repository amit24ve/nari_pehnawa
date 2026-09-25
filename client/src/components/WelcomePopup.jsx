import React, { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Copy, Check, ArrowRight, Tag, ShoppingBag, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

const STORAGE_KEY = "np_first_visit_offer_v3";
const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    is_enabled: true,
    banner_image: "/nari_post_banner.jpg",
    title: "Grand Festive Season Sale",
    subtitle: "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear",
    coupon_code: "FESTIVE10",
    discount_badge: "FLAT 10% OFF",
    button_text: "EXPLORE COLLECTION",
    button_link: "/new-arrivals",
    show_on_mobile: true,
    delay_seconds: 3,
  });

  const navigate = useNavigate();

  // Load dynamic welcome offer modal settings from backend
  useEffect(() => {
    fetch(`${API_URL}/announcements/welcome-modal?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg) {
          setConfig((prev) => ({ ...prev, ...cfg }));
        }
      })
      .catch(() => {});
  }, []);

  // Show modal on website load / refresh
  useEffect(() => {
    if (!config.is_enabled) return;

    const delay = Math.max(1, config.delay_seconds || 2) * 1000;
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [config.is_enabled, config.delay_seconds]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (!config.coupon_code) return;
    navigator.clipboard.writeText(config.coupon_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAction = () => {
    dismiss();
    if (config.button_link) {
      navigate(config.button_link);
    } else {
      navigate("/new-arrivals");
    }
  };

  if (!visible || !config.is_enabled) return null;

  const bannerSrc = resolveImageUrl(config.banner_image, "/nari_post_banner.jpg");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* Modal Container: Full-Image Card with Content Overlay */}
      <div
        className="relative w-full max-w-md sm:max-w-lg md:max-w-xl min-h-[480px] sm:min-h-[520px] rounded-3xl overflow-hidden shadow-2xl border border-[#d4af37]/50 transform transition-all animate-scaleUp z-10 flex flex-col justify-end text-center group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full Card Background Image */}
        <img
          src={bannerSrc}
          alt={config.title || "Offer Banner"}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            e.target.src = "/nari_post_banner.jpg";
          }}
        />

        {/* Cinematic Dark & Luxury Maroon Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={dismiss}
          aria-label="Close offer modal"
          className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Overlay Content */}
        <div className="relative z-20 p-6 sm:p-8 flex flex-col items-center justify-end space-y-4 text-white">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif text-white tracking-tight leading-snug drop-shadow-lg">
            {config.title || "Grand Festive Season Sale"}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-amber-100/90 font-medium max-w-md mx-auto drop-shadow leading-relaxed">
            {config.subtitle || "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"}
          </p>

          {/* Coupon Code Box */}
          {config.coupon_code && (
            <div className="w-full max-w-sm p-3 sm:p-3.5 bg-black/40 backdrop-blur-md border-2 border-dashed border-[#d4af37] rounded-2xl flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37] text-[#580C1F] flex items-center justify-center flex-shrink-0 font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-amber-200/80 uppercase tracking-widest">
                    COUPON CODE
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#ffe29a] font-mono tracking-wider">
                    {config.coupon_code}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg ${
                  copied
                    ? "bg-emerald-500 text-white scale-105"
                    : "bg-[#d4af37] hover:bg-[#f3e5ab] text-[#580C1F] hover:scale-105"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    COPY CODE
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action CTA Button */}
          <button
            onClick={handleAction}
            className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#580C1F] font-black text-sm sm:text-base tracking-wide shadow-2xl hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.03]"
          >
            <ShoppingBag className="w-4 h-4 text-[#580C1F]" />
            <span>{config.button_text || "EXPLORE COLLECTION"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Guarantee / Perks Subtext */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] text-amber-100/70 font-medium">
            <span className="flex items-center gap-1">
              🚚 Free Express Shipping
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              💵 Easy Cash On Delivery
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              ✨ 100% Authentic Fabric
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
