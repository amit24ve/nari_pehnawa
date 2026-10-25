import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

/**
 * ProductShareModal
 * Modern, high-converting product sharing modal for Nari Pehnawa.
 * Supports:
 * - Native Web Share API (WhatsApp, Facebook, Telegram, System share)
 * - Copy canonical product URL with instant confirmation toast
 * - Social platform direct fallbacks (WhatsApp, Facebook, Telegram, X, Email)
 * - Rich preview card matching WhatsApp / Open Graph card
 */
const ProductShareModal = ({ isOpen, onClose, product }) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  if (!isOpen || !product) return null;

  // Canonical Product ID and URL
  const productId = product._id || product.id || "";
  const canonicalUrl = `https://naripehnawa.com/product/${productId}`;

  // Pricing & genuine discount
  const rawPrice = Number(product.price ?? product.selling_price ?? 0);
  const rawOriginalPrice = Number(product.original_price ?? product.originalPrice ?? 0);
  const hasDiscount = rawOriginalPrice > rawPrice;
  const discountPct = Number(
    product.discount ??
      (hasDiscount && rawOriginalPrice > 0
        ? Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100)
        : 0)
  );

  const priceText = `₹${rawPrice.toLocaleString("en-IN")}`;
  const mrpText = hasDiscount ? `₹${rawOriginalPrice.toLocaleString("en-IN")}` : null;
  const discountText = discountPct > 0 ? `${discountPct}% OFF` : null;

  // Share text
  let pricingSummary = priceText;
  if (mrpText && discountText) {
    pricingSummary = `Price: ${priceText} | MRP: ${mrpText} | ${discountText}`;
  }
  const shareText = `Check out "${product.name || "Designer Kurti"}" on Nari Pehnawa • ${pricingSummary}`;

  // Product Image
  const rawImage = product.image || (product.images && product.images[0]) || "";
  const imageUrl = resolveImageUrl(rawImage, DEFAULT_FALLBACK_IMAGE);

  // Copy canonical URL to clipboard
  const handleCopyLink = async (e) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = canonicalUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Native Web Share API
  const handleNativeShare = async (e) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name || "Nari Pehnawa",
          text: shareText,
          url: canonicalUrl,
        });
        setShareFeedback("Shared successfully!");
        setTimeout(() => setShareFeedback(""), 2500);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Web share failed:", err);
          // Fallback to copy link
          handleCopyLink();
        }
      }
    } else {
      // Fallback: trigger WhatsApp web share or copy
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        shareText + "\n" + canonicalUrl
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Social direct link handlers
  const socialChannels = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366] text-white hover:bg-[#20ba59]",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        shareText + "\n" + canonicalUrl
      )}`,
    },
    {
      name: "Facebook",
      icon: ExternalLink,
      color: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-[#0088cc] text-white hover:bg-[#007ab8]",
      url: `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X (Twitter)",
      icon: ExternalLink,
      color: "bg-black text-white hover:bg-neutral-800",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-700 text-white hover:bg-gray-800",
      url: `mailto:?subject=${encodeURIComponent(product.name || "Nari Pehnawa")}&body=${encodeURIComponent(shareText + "\n\nView here: " + canonicalUrl)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />

      {/* Modal Dialog */}
      <div
        className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Royal Maroon accent */}
        <div className="bg-gradient-to-r from-[#8B0000] via-[#A00000] to-[#700000] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif font-bold text-lg tracking-wide">Share Product</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Rich Link Preview Card (Shows exactly what will appear on WhatsApp / Facebook) */}
          <div className="bg-gradient-to-br from-amber-50/40 via-rose-50/30 to-gray-50 rounded-2xl p-3 border border-amber-200/50 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Link Preview Card</span>
            </div>
            <div className="flex gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-20 h-24 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
              <div className="flex flex-col justify-between overflow-hidden">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 block truncate">
                    naripehnawa.com
                  </span>
                  <h4 className="text-xs font-serif font-bold text-gray-900 line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-gray-900 font-sans">
                    {priceText}
                  </span>
                  {mrpText && (
                    <span className="text-[11px] text-gray-400 line-through font-sans">
                      {mrpText}
                    </span>
                  )}
                  {discountText && (
                    <span className="text-[10px] font-bold text-[#8B0000] bg-rose-50 px-1.5 py-0.5 rounded">
                      {discountText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action 1: Share Product */}
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Product</span>
          </button>

          {/* Primary Action 2: Copy Product Link */}
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all border-2 active:scale-98 cursor-pointer ${
              copied
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "border-[#8B0000] text-[#8B0000] hover:bg-rose-50/50 bg-white shadow-xs"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Product Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Product Link</span>
              </>
            )}
          </button>

          {/* URL Input Box with Copy Button */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <input
              type="text"
              readOnly
              value={canonicalUrl}
              className="flex-1 bg-transparent text-xs text-gray-600 font-mono focus:outline-none px-2 select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 hover:bg-black text-white"
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Social Channels Fallback Grid */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2 text-center">
              Or Share Directly Via
            </span>
            <div className="grid grid-cols-5 gap-2">
              {socialChannels.map((channel) => {
                const IconComponent = channel.icon;
                return (
                  <a
                    key={channel.name}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all shadow-xs active:scale-95 text-center ${channel.color}`}
                    title={`Share on ${channel.name}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[9px] font-medium truncate w-full">
                      {channel.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Feedback message */}
          {shareFeedback && (
            <p className="text-center text-xs font-bold text-emerald-600 animate-in fade-in">
              ✓ {shareFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductShareModal;
