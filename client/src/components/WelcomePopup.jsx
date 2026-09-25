import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Tag,
  ShoppingBag,
  Gift,
  Flame,
  Truck,
  Zap,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    is_enabled: true,
    template_type: "festive-royal", // festive-royal | new-launch | flash-sale | welcome-gift | free-shipping
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
  const templateType = config.template_type || "festive-royal";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 1: FESTIVE ROYAL (Side-by-Side Split Gold & Maroon)
      ═══════════════════════════════════════════════════ */}
      {templateType === "festive-royal" && (
        <div
          className="relative w-full max-w-lg md:max-w-2xl bg-gradient-to-br from-[#3d0815] via-[#580C1F] to-[#20040b] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#d4af37]/60 transform transition-all animate-scaleUp z-10 flex flex-col md:flex-row text-left group"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Poster Image */}
          <div className="w-full md:w-5/12 h-44 sm:h-52 md:h-auto relative overflow-hidden flex-shrink-0">
            <img
              src={bannerSrc}
              alt=""
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent to-transparent" />
            <div className="absolute top-3 left-3 bg-[#d4af37] text-[#580C1F] font-black text-[10px] tracking-widest px-2.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {config.discount_badge || "ROYAL FESTIVE"}
            </div>
          </div>

          {/* Right Content */}
          <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between space-y-4 text-white">
            <div className="space-y-2">
              <div className="text-[10px] text-[#ffe29a] font-bold tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#d4af37]" /> Festive Celebration Offer
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-serif text-white leading-tight">
                {config.title || "Grand Festive Season Sale"}
              </h2>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                {config.subtitle || "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"}
              </p>
            </div>

            {/* Coupon Box */}
            {config.coupon_code && (
              <div className="p-3 bg-black/40 border border-dashed border-[#d4af37] rounded-xl flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <div className="text-[9px] text-[#ffe29a] font-bold">COUPON CODE</div>
                    <div className="text-sm font-mono font-black text-white">{config.coupon_code}</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    copied ? "bg-emerald-500 text-white" : "bg-[#d4af37] hover:bg-[#ffe29a] text-[#580C1F]"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "COPIED" : "COPY"}</span>
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#580C1F] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-[#d4af37]/40 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{config.button_text || "EXPLORE FESTIVE COLLECTION"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-around text-[10px] text-amber-200/60 pt-1 border-t border-white/10">
              <span>🚚 Free Express Shipping</span>
              <span>•</span>
              <span>💵 Cash On Delivery</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 2: NEW LAUNCH (Full-Bleed Modern Glassmorphic)
      ═══════════════════════════════════════════════════ */}
      {templateType === "new-launch" && (
        <div
          className="relative w-full max-w-md sm:max-w-lg min-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/40 transform transition-all animate-scaleUp z-10 flex flex-col justify-end text-center group"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={bannerSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Glass Sheet */}
          <div className="relative z-20 p-6 sm:p-7 backdrop-blur-md bg-slate-950/75 border-t border-emerald-500/30 rounded-t-3xl space-y-3.5 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-emerald-400" /> {config.discount_badge || "NEW SEASON ARRIVALS"}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {config.title || "New Season Designer Arrivals"}
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {config.subtitle || "Discover Exclusive Pure Cotton & Silk Handcrafted Kurtis"}
            </p>

            {config.coupon_code && (
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl">
                <span className="text-[10px] text-emerald-300 font-bold uppercase">Code:</span>
                <span className="font-mono font-bold text-white text-sm tracking-wider">{config.coupon_code}</span>
                <button
                  onClick={handleCopyCode}
                  className="ml-2 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded-md transition"
                >
                  {copied ? "COPIED!" : "COPY"}
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{config.button_text || "SHOP NEW ARRIVALS"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 3: FLASH SALE (High-Energy Crimson & Flame Urgency)
      ═══════════════════════════════════════════════════ */}
      {templateType === "flash-sale" && (
        <div
          className="relative w-full max-w-md sm:max-w-lg bg-gradient-to-b from-red-950 via-slate-950 to-black rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-600/70 transform transition-all animate-scaleUp z-10 text-center group"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Urgent Ribbon Bar */}
          <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-black py-1.5 px-4 font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 shadow-md">
            <Flame className="w-3.5 h-3.5 animate-bounce text-black" />
            <span>LIMITED TIME FLASH DEAL • HURRY!</span>
            <Flame className="w-3.5 h-3.5 animate-bounce text-black" />
          </div>

          <button
            onClick={dismiss}
            className="absolute top-8 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8 space-y-4 text-white">
            <div className="inline-block px-4 py-1.5 rounded-full bg-rose-600/20 border border-rose-500 text-rose-300 text-xs font-black uppercase tracking-wider">
              {config.discount_badge || "UP TO 40% OFF"}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {config.title || "Mega Flash Deal: Limited Stock"}
            </h2>
            <p className="text-xs text-rose-100/80 max-w-sm mx-auto">
              {config.subtitle || "Up to 40% OFF on Best Selling Ethnic Sets & Kurtas"}
            </p>

            {config.coupon_code && (
              <div className="max-w-xs mx-auto p-3 bg-red-950/60 border-2 border-dashed border-rose-500 rounded-2xl flex items-center justify-between gap-3">
                <div className="text-left">
                  <div className="text-[9px] text-rose-300 font-bold uppercase">COUPON</div>
                  <div className="text-base font-black font-mono text-amber-300">{config.coupon_code}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition"
                >
                  {copied ? "COPIED!" : "COPY"}
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-rose-600/40 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-white text-white" />
              <span>{config.button_text || "GRAB FLASH DEAL"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 4: WELCOME GIFT (Centered Luxury Velvet & Gift Voucher)
      ═══════════════════════════════════════════════════ */}
      {templateType === "welcome-gift" && (
        <div
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#1f1624] to-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/40 transform transition-all animate-scaleUp z-10 text-center p-6 sm:p-8 space-y-4 text-white group"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-amber-400 p-0.5 shadow-xl shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
              <Gift className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
              {config.discount_badge || "EXCLUSIVE FIRST ORDER VOUCHER"}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {config.title || "Welcome to Nari Pehnawa"}
            </h2>
            <p className="text-xs text-purple-100/70 max-w-xs mx-auto">
              {config.subtitle || "Get Flat ₹200 OFF on Your First Purchase Above ₹999"}
            </p>
          </div>

          {config.coupon_code && (
            <div className="p-3 bg-purple-950/40 border border-dashed border-amber-300/60 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
              <div className="text-left">
                <div className="text-[9px] text-amber-200 uppercase font-bold">VOUCHER CODE</div>
                <div className="text-base font-black font-mono text-white">{config.coupon_code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition"
              >
                {copied ? "COPIED!" : "COPY VOUCHER"}
              </button>
            </div>
          )}

          <button
            onClick={handleAction}
            className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <span>{config.button_text || "CLAIM WELCOME GIFT"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 5: FREE SHIPPING (Express Logistics & Zero COD)
      ═══════════════════════════════════════════════════ */}
      {templateType === "free-shipping" && (
        <div
          className="relative w-full max-w-md sm:max-w-lg bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-sky-400/50 transform transition-all animate-scaleUp z-10 text-center p-6 sm:p-7 space-y-4 text-white group"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-sky-400" /> {config.discount_badge || "PAN-INDIA EXPRESS SHIPPING"}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {config.title || "Pan-India Free Express Shipping"}
          </h2>
          <p className="text-xs text-sky-100/80 max-w-sm mx-auto">
            {config.subtitle || "Zero Shipping Charges & Cash on Delivery on All Orders Above ₹499"}
          </p>

          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 bg-sky-950/50 border border-sky-500/30 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div className="text-[10px] font-bold text-sky-200">100% Free Shipping</div>
            </div>
            <div className="p-2.5 bg-sky-950/50 border border-sky-500/30 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-[10px] font-bold text-emerald-200">Cash on Delivery</div>
            </div>
          </div>

          {config.coupon_code && (
            <div className="p-2.5 bg-sky-950/60 border border-dashed border-sky-400 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] text-sky-300 font-bold uppercase">Code: </span>
                <span className="font-mono font-bold text-white text-sm">{config.coupon_code}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-lg transition"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          )}

          <button
            onClick={handleAction}
            className="w-full py-3 bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <span>{config.button_text || "START SHOPPING NOW"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WelcomePopup;
