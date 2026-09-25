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

  const bannerSrc = resolveImageUrl(config.banner_image, "/nari_post_banner.jpg");
  const templateType = config.template_type || "festive-royal";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={dismiss} />

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 1: FESTIVE ROYAL (Full-Screen Image Backdrop with Left Visibility & Right Text Overlay)
      ═══════════════════════════════════════════════════ */}
      {templateType === "festive-royal" && (
        <div
          className="relative w-full max-w-xl md:max-w-2xl min-h-[440px] md:min-h-[480px] bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-[#d4af37]/80 transform transition-all animate-scaleUp z-10 flex flex-col justify-end md:justify-center text-left group"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Full-Screen Image */}
          <img
            src={resolveImageUrl(config.banner_image, "/nari_post_banner.jpg")}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-left md:object-center group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
          />

          {/* Left clear gradient / Right rich text gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#20040b]/95 via-[#20040b]/85 to-transparent md:from-transparent md:via-[#20040b]/85 md:to-[#1a0208]/98 pointer-events-none" />

          <button
            onClick={dismiss}
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content (Positioned on the Right on Desktop, Bottom on Mobile) */}
          <div className="relative z-20 md:ml-auto w-full md:w-7/12 p-6 sm:p-8 space-y-4 text-white">
            <div className="space-y-2">
              <div className="text-xs text-[#ffe29a] font-bold tracking-widest uppercase flex items-center gap-1.5 font-serif">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> Royal Festive Edition
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight drop-shadow-md">
                {config.title || "Grand Festive Season Sale"}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed drop-shadow">
                {config.subtitle || "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"}
              </p>
            </div>

            {/* Coupon Box */}
            {config.coupon_code && (
              <div className="p-3 bg-black/60 backdrop-blur-md border border-dashed border-[#d4af37] rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                <div>
                  <div className="text-[9px] text-[#ffe29a] font-bold uppercase tracking-wider">OFFER COUPON CODE</div>
                  <div className="text-base font-mono font-black text-white">{config.coupon_code}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    copied ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-[#d4af37] to-[#ffe29a] hover:opacity-95 text-[#580C1F]"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "COPIED" : "COPY"}</span>
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#580C1F] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl hover:shadow-[#d4af37]/40 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{config.button_text || "EXPLORE FESTIVE COLLECTION"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-around text-[10px] text-amber-200/80 pt-1 border-t border-white/10">
              <span>🚚 Free Express Shipping</span>
              <span>•</span>
              <span>💵 Cash On Delivery</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 2: NEW LAUNCH (Top-Half Image + Modern Emerald Sheet)
      ═══════════════════════════════════════════════════ */}
      {templateType === "new-launch" && (
        <div
          className="relative w-full max-w-md bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/50 transform transition-all animate-scaleUp z-10 flex flex-col text-center group"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismiss}
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Showcase Image */}
          <div className="w-full h-52 sm:h-60 relative overflow-hidden bg-slate-900">
            <img
              src={resolveImageUrl(config.banner_image, "/product_1_sky_bloom.jpg")}
              alt=""
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.target.src = "/product_1_sky_bloom.jpg"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom Modern Content */}
          <div className="p-5 sm:p-6 space-y-3.5 text-white bg-slate-950">
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> New Season Arrivals
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {config.title || "New Season Designer Arrivals"}
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {config.subtitle || "Discover Exclusive Pure Cotton & Silk Handcrafted Kurtis"}
            </p>

            {config.coupon_code && (
              <div className="flex items-center justify-between max-w-xs mx-auto p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3.5">
                <div className="text-left">
                  <div className="text-[9px] text-emerald-300 font-bold uppercase">DISCOUNT CODE</div>
                  <div className="font-mono font-black text-white text-sm tracking-wider">{config.coupon_code}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-lg transition"
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
          TEMPLATE 3: FLASH SALE (Full-Bleed Image with High-Energy Urgency)
      ═══════════════════════════════════════════════════ */}
      {templateType === "flash-sale" && (
        <div
          className="relative w-full max-w-md sm:max-w-lg min-h-[460px] rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-600 transform transition-all animate-scaleUp z-10 flex flex-col justify-between text-center group"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Image */}
          <img
            src={resolveImageUrl(config.banner_image, "/product_3_black_floral.jpg")}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = "/product_3_black_floral.jpg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/50 pointer-events-none" />

          {/* Urgent Ribbon Bar */}
          <div className="relative z-20 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-black py-2 px-4 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md">
            <Flame className="w-4 h-4 animate-bounce text-black" />
            <span>LIMITED TIME FLASH DEAL • LIMITED STOCK</span>
            <Flame className="w-4 h-4 animate-bounce text-black" />
          </div>

          <button
            onClick={dismiss}
            className="absolute top-10 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Body Content Overlay */}
          <div className="relative z-20 p-6 sm:p-7 space-y-3.5 text-white">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight">
              {config.title || "Mega Flash Deal: Limited Stock"}
            </h2>
            <p className="text-xs text-rose-100/90 max-w-sm mx-auto leading-relaxed">
              {config.subtitle || "Up to 40% OFF on Best Selling Ethnic Sets & Kurtas"}
            </p>

            {config.coupon_code && (
              <div className="max-w-xs mx-auto p-2.5 bg-black/60 backdrop-blur-md border-2 border-dashed border-rose-500 rounded-xl flex items-center justify-between px-3.5 gap-2">
                <div className="text-left">
                  <div className="text-[9px] text-rose-300 font-bold uppercase">PROMO CODE</div>
                  <div className="text-base font-black font-mono text-amber-300">{config.coupon_code}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition"
                >
                  {copied ? "COPIED!" : "COPY"}
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl hover:shadow-rose-600/40 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-white text-white" />
              <span>{config.button_text || "GRAB FLASH DEAL"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TEMPLATE 4: WELCOME GIFT (Framed Showcase Image & Velvet Card)
      ═══════════════════════════════════════════════════ */}
      {templateType === "welcome-gift" && (
        <div
          className="relative w-full max-w-md bg-gradient-to-b from-[#181124] via-[#241738] to-[#0f0919] rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/50 transform transition-all animate-scaleUp z-10 text-center p-6 space-y-4 text-white group"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Framed Circular Image Showcase */}
          <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-purple-500 via-amber-300 to-pink-500 shadow-xl overflow-hidden">
            <img
              src={resolveImageUrl(config.banner_image, "/product_4_coral_pink.jpg")}
              alt=""
              className="w-full h-full object-cover object-top rounded-full group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.src = "/product_4_coral_pink.jpg"; }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1">
              <Gift className="w-3.5 h-3.5 text-amber-300" /> First Order Special Welcome
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {config.title || "Welcome to Nari Pehnawa"}
            </h2>
            <p className="text-xs text-purple-100/80 max-w-xs mx-auto leading-relaxed">
              {config.subtitle || "Get Flat ₹200 OFF on Your First Purchase Above ₹999"}
            </p>
          </div>

          {config.coupon_code && (
            <div className="p-3 bg-purple-950/60 border border-dashed border-amber-300/70 rounded-2xl flex items-center justify-between px-4 shadow-inner">
              <div className="text-left">
                <div className="text-[9px] text-amber-200 uppercase font-bold">VOUCHER CODE</div>
                <div className="text-base font-black font-mono text-white">{config.coupon_code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition"
              >
                {copied ? "COPIED!" : "COPY"}
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
          TEMPLATE 5: FREE SHIPPING (Horizontal Delivery Express with Side Image)
      ═══════════════════════════════════════════════════ */}
      {templateType === "free-shipping" && (
        <div
          className="relative w-full max-w-lg md:max-w-xl bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-sky-400/60 transform transition-all animate-scaleUp z-10 flex flex-col sm:flex-row text-left group"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismiss}
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white hover:scale-110 transition shadow-lg cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Image Showcase */}
          <div className="w-full sm:w-5/12 h-44 sm:h-auto relative overflow-hidden bg-slate-900 flex-shrink-0">
            <img
              src={resolveImageUrl(config.banner_image, "/product_2_olive_bloom.jpg")}
              alt=""
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.target.src = "/product_2_olive_bloom.jpg"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Right Logistics Content */}
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3.5 text-white">
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Pan-India Express Delivery
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {config.title || "Pan-India Free Express Shipping"}
              </h2>
              <p className="text-xs text-sky-100/85 leading-relaxed">
                {config.subtitle || "Zero Shipping Charges & Cash on Delivery on All Orders Above ₹499"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-sky-950/60 border border-sky-500/30 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /> Free Shipping
              </div>
              <div className="p-2 bg-sky-950/60 border border-sky-500/30 rounded-lg flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> Zero COD Fee
              </div>
            </div>

            {config.coupon_code && (
              <div className="p-2 bg-sky-950/70 border border-dashed border-sky-400 rounded-xl flex items-center justify-between px-3">
                <div className="text-left">
                  <span className="text-[9px] text-sky-300 font-bold uppercase">CODE: </span>
                  <span className="font-mono font-black text-white text-xs">{config.coupon_code}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 text-[10px] font-bold rounded-lg transition"
                >
                  {copied ? "COPIED" : "COPY"}
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>{config.button_text || "START SHOPPING NOW"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePopup;
