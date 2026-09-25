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

  // Show modal ONLY on first visit
  useEffect(() => {
    // Check if user already dismissed or saw the welcome offer
    const alreadyShown =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;

    if (!config.is_enabled) return;

    const delay = (config.delay_seconds || 3) * 1000;
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [config.is_enabled, config.delay_seconds]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    localStorage.setItem(STORAGE_KEY, "1");
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg md:max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#d4af37]/40 transform transition-all animate-scaleUp z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={dismiss}
          aria-label="Close offer modal"
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Offer Banner Image */}
        <div className="relative w-full h-56 sm:h-72 md:h-80 bg-gradient-to-br from-[#580C1F] to-[#2E0F15] overflow-hidden group">
          <img
            src={bannerSrc}
            alt={config.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.src = "/nari_post_banner.jpg";
            }}
          />

          {/* Floating Discount Badge */}
          {config.discount_badge && (
            <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-[#580C1F] font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl flex items-center gap-1.5 border border-[#580C1F]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#580C1F]" />
              {config.discount_badge}
            </div>
          )}

          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Modal Body & Offer Content */}
        <div className="p-5 sm:p-6 md:p-8 bg-gradient-to-b from-white via-rose-50/20 to-white text-center">
          {/* Brand Tagline */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#580C1F]/10 text-[#580C1F] text-xs font-bold uppercase tracking-widest mb-2">
            <span>✨</span>
            <span>Nari Pehnawa Exclusive</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-snug">
            {config.title || "Grand Festive Season Sale"}
          </h2>

          {/* Subtitle */}
          <p className="mt-1 text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto">
            {config.subtitle || "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"}
          </p>

          {/* Coupon Code Box */}
          {config.coupon_code && (
            <div className="mt-4 sm:mt-5 p-3 sm:p-3.5 bg-amber-50/80 border-2 border-dashed border-[#d4af37] rounded-2xl flex items-center justify-between gap-3 max-w-sm mx-auto shadow-inner">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#580C1F] text-[#d4af37] flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Coupon Code
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#580C1F] tracking-widest">
                    {config.coupon_code}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#580C1F] hover:bg-[#7B1128] text-[#ffe29a]"
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
          <div className="mt-5 sm:mt-6">
            <button
              onClick={handleAction}
              className="w-full max-w-sm mx-auto py-3 sm:py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#580C1F] via-[#7B1128] to-[#580C1F] hover:from-[#7B1128] hover:to-[#580C1F] text-[#F7ECE1] font-bold text-sm sm:text-base tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02]"
            >
              <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
              <span>{config.button_text || "EXPLORE COLLECTION"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Guarantee / Perks Subtext */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-500 font-medium">
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
