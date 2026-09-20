import React, { useState, useEffect } from "react";
import { X, Sparkles, Flame, Copy, Check, ArrowRight, Tag, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const DISMISS_KEY = "nari_floating_offer_dismissed_v1";

const FloatingOfferCard = () => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch (_) {
      return false;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [offerData, setOfferData] = useState({
    title: "Festive Grand Sale",
    deal_text: "BUY 1 GET 1 FREE",
    coupon_code: "FESTIVE30",
    discount: "30% OFF",
    image: "/placeholder-product.webp",
    link: "/category/sale"
  });

  // Fetch live campaign or flash sale product data for dynamic styling
  useEffect(() => {
    let isMounted = true;

    // Fetch product / campaign / flash sale data
    Promise.all([
      fetch(`${API_BASE_URL}/admin/flash-sale`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API_BASE_URL}/campaign/active`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API_BASE_URL}/products/?limit=1`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([flash, camp, prods]) => {
      if (!isMounted) return;

      const fallbackProdImg = (Array.isArray(prods) && prods[0]?.image) ? prods[0].image : "";
      const campImg = camp?.left_image || camp?.slots?.[0]?.product?.image || camp?.full_banner_image || "";
      const finalImage = (flash?.banner_image && flash.banner_image.trim()) || campImg || fallbackProdImg;

      const deal =
        flash?.deal_text ||
        (flash?.deal_type === "buy5get2" ? "BUY 5 GET 2 FREE" : "") ||
        camp?.discount_text ||
        "BUY 5 GET 2 FREE";

      setOfferData((prev) => ({
        ...prev,
        title: flash?.title || camp?.title || prev.title,
        deal_text: deal,
        image: finalImage || prev.image,
        link: camp?.cta_link || "/category/sale"
      }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch (_) {}
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(offerData.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleShopNow = () => {
    setShowModal(false);
    navigate(offerData.link || "/category/sale");
  };

  if (isDismissed) return null;

  return (
    <>
      {/* ── 100px x 100px FLOATING CARD (BOTTOM-LEFT) - ZERO BADGES, CLEAN DESIGN ── */}
      <div
        className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 group pointer-events-auto"
        style={{ width: "100px", height: "100px" }}
      >
        {/* Subtle Ambient Gold Halo */}
        <div className="absolute -inset-1 bg-amber-400/50 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300 pointer-events-none" />

        {/* 100px x 100px Card Body */}
        <div
          onClick={() => setShowModal(true)}
          className="relative w-[100px] h-[100px] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400 bg-slate-950 cursor-pointer flex flex-col justify-end transition-transform duration-300 group-hover:scale-105 active:scale-95"
          title="Click to view Festive Offer"
        >
          {/* Background Real Product / Festive Outfit Image */}
          {offerData.image ? (
            <img
              src={resolveImageUrl(offerData.image, DEFAULT_FALLBACK_IMAGE)}
              alt="Festive Offer"
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4A0019] via-[#8B0000] to-[#2D0A14]" />
          )}

          {/* Contrast Gradient on Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

          {/* Bottom Pure Text Deal Label - Clean, High Legibility, No Clutter */}
          <div className="relative z-10 w-full p-1 bg-black/75 backdrop-blur-sm border-t border-white/15 text-center">
            <p className="text-[9px] font-black text-amber-300 uppercase leading-tight tracking-tight font-mono truncate">
              {offerData.deal_text || "BUY 5 GET 2 FREE"}
            </p>
          </div>
        </div>

        {/* Prominent Cross (X) Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer z-30 transition hover:scale-110 active:scale-90"
          title="Close Offer Card"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>

      {/* ── EXCLUSIVE OFFER LUXURY MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-gradient-to-b from-[#250610] via-[#1A030A] to-[#100105] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-400/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Flares */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />

            {/* Modal Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title & Subtitle - Clean without generic badges */}
            <div className="text-center space-y-1 mb-5 pt-1">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow">
                {offerData.title || "Grand Festive Sale"}
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                Authentic Handcrafted Kurtis, Suits & Saree Collection
              </p>
            </div>

            {/* Deal Highlight Box */}
            <div className="bg-white/10 border border-amber-400/40 rounded-2xl p-4 text-center my-4 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block mb-1">
                Special Limited Celebration Offer
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow">
                {offerData.deal_text || "BUY 1 GET 1 FREE"}
              </div>
              <p className="text-[11px] text-gray-300 mt-1">
                Applicable on all eligible festival catalog collections!
              </p>
            </div>

            {/* Coupon Code Strip */}
            <div className="bg-black/60 border border-dashed border-amber-400/60 rounded-xl p-3 flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] uppercase text-gray-400 block font-semibold">
                    Use Coupon Code
                  </span>
                  <span className="font-mono font-black text-amber-300 tracking-wider text-sm sm:text-base">
                    {offerData.coupon_code}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3 py-2 rounded-lg transition active:scale-95 shadow cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-800 stroke-[3]" />
                    <span className="text-emerald-950 font-extrabold">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleShopNow}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm py-3 px-5 rounded-xl shadow-xl transition-transform active:scale-98 cursor-pointer"
              >
                <span>Shop Festive Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="text-center text-xs text-gray-400 hover:text-white py-1 transition cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingOfferCard;
