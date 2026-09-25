import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

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
    button_text: "Explore Collection",
    button_link: "/category/sale",
    show_on_mobile: true,
    delay_seconds: 3,
  });

  const navigate = useNavigate();

  // Load dynamic welcome offer modal settings from backend
  const loadWelcomeConfig = useCallback(() => {
    fetch(`${API_URL}/announcements/welcome-modal?_t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg) {
          setConfig((prev) => ({ ...prev, ...cfg }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadWelcomeConfig();

    const handleUpdate = () => {
      loadWelcomeConfig();
    };

    window.addEventListener("np_welcome_modal_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("np_welcome_modal_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [loadWelcomeConfig]);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* Clean Modern Banner Modal */}
      <div
        className="relative w-full max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 transform transition-all animate-scaleUp z-10 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer shadow-md border border-white/20"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Banner Image (Clean, No Harsh Border, High Resolution) */}
        {config.banner_image && (
          <div className="relative w-full h-52 sm:h-56 bg-neutral-100 overflow-hidden">
            <img
              src={resolveImageUrl(config.banner_image, "/nari_post_banner.jpg")}
              alt={config.title || "Special Offer"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/nari_post_banner.jpg";
              }}
            />
          </div>
        )}

        {/* Content Area (Clean Typography, No Badges, No Nested Card Clutter) */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-white">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 font-serif leading-tight">
              {config.title || "Special Offer"}
            </h3>
            {config.subtitle && (
              <p className="text-xs sm:text-[13px] text-gray-600 mt-1.5 leading-relaxed">
                {config.subtitle}
              </p>
            )}
          </div>

          {/* Clean Coupon Snippet (Minimalist text row, not a bulky card) */}
          {config.coupon_code && (
            <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-xl border border-gray-200 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Use Code:</span>
                <span className="font-mono font-black text-gray-900 tracking-wider">
                  {config.coupon_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[11px] font-bold text-[#8B0000] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          )}

          {/* Action CTA Button */}
          <button
            onClick={handleAction}
            className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{config.button_text || "Explore Collection"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
