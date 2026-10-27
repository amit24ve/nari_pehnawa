import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Flame, Zap, Share2 } from "lucide-react";
import ProductShareModal from "./ProductShareModal";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

// Organic Pebble fluid curve shapes inspired by Image 2
const pebbleShapes = [
  "rounded-[45%_55%_65%_35%/55%_45%_55%_45%]",
  "rounded-[55%_45%_35%_65%/45%_65%_35%_55%]",
  "rounded-[65%_35%_55%_45%/50%_40%_60%_50%]",
  "rounded-[50%_60%_40%_60%/60%_50%_50%_40%]",
];

const ProductCard = ({
    product,
    onProductClick,
    onWishlistToggle,
    isWishlisted,
    index = 0,
    isSalePage = false,
}) => {
    const [hearted, setHearted] = useState(isWishlisted || false);
    const [isHovered, setIsHovered] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const navigate = useNavigate();

    // Special sale pricing only active when on sale page
    const isSpecialSale = Boolean(isSalePage && product.mega_sale_price);
    const displayPrice = isSpecialSale ? product.mega_sale_price : (product.price || 0);
    const strikePrice = isSpecialSale
        ? (product.original_price || product.price)
        : (product.originalPrice || product.original_price);

    // Collect all product images for smooth slideshow
    const rawImages = [
        product.image,
        ...(Array.isArray(product.images) ? product.images : [])
    ].filter(Boolean);
    const allImages = Array.from(new Set(rawImages));
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    // Auto-slide through images when card is hovered/touched
    useEffect(() => {
        if (!isHovered || allImages.length <= 1) {
            setCurrentImgIndex(0);
            return;
        }
        const timer = setInterval(() => {
            setCurrentImgIndex(prev => (prev + 1) % allImages.length);
        }, 1500);
        return () => clearInterval(timer);
    }, [isHovered, allImages.length]);

    useEffect(() => setHearted(isWishlisted), [isWishlisted]);

    const discount = product.discount;

    // Pick organic pebble shape based on index or product id
    const shapeIndex = typeof index === "number" ? index % pebbleShapes.length : (product.id ? String(product.id).charCodeAt(0) % pebbleShapes.length : 0);
    const pebbleClass = pebbleShapes[shapeIndex];

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        setHearted(!hearted);
        if (onWishlistToggle) {
            onWishlistToggle(product);
        }
    };

    const handleCardClick = () => {
        if (onProductClick) {
            onProductClick(product);
        } else {
            navigate(`/product/${product.id}${isSalePage ? '?sale=1' : ''}`);
        }
    };

    return (
        <div
            className={`bg-white p-2 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-2xl active:shadow-2xl transition-all duration-500 ease-in-out hover:-translate-y-1.5 active:-translate-y-1 flex flex-col justify-between ${
                isHovered ? "-translate-y-1.5 shadow-2xl" : ""
            }`}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 400)}
            onTouchCancel={() => setIsHovered(false)}
        >
            {/* Organic Pebble Image Container -> Morphs to Rectangular on Hover & Mobile Touch */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-pink-100/50 to-amber-50/50 ${
                isHovered
                    ? "rounded-2xl border-[#8B0000]"
                    : `${pebbleClass} border-[#8B0000]/15`
            } group-hover:rounded-2xl group-active:rounded-2xl shadow-md border-2 group-hover:border-[#8B0000] group-active:border-[#8B0000] transition-all duration-500 ease-in-out`}>
                {/* Sale / Deal Badge - Deal badge ONLY visible on Mega Sale page */}
                {isSalePage && product.deal_text ? (
                    <span className="absolute top-3 left-3 z-30 bg-gradient-to-r from-[#8B0000] via-rose-700 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/30 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 fill-white text-white" />
                        {product.deal_text}
                    </span>
                ) : discount > 0 ? (
                    <span className="absolute top-3 left-3 z-30 bg-[#8B0000] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                        Sale {discount}%
                    </span>
                ) : (product.isNew || product.is_new) ? (
                    <span className="absolute top-3 left-3 z-30 bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                        NEW
                    </span>
                ) : null}

                {/* Share Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowShareModal(true);
                    }}
                    className="absolute top-3 right-12 z-30 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-transform hover:scale-110 border border-gray-100 text-gray-700 hover:text-[#8B0000] cursor-pointer"
                    aria-label="Share product"
                    title="Share product"
                >
                    <Share2 className="w-4 h-4" />
                </button>

                {/* Wishlist Button - Always 100% visible on top right */}
                <button
                    onClick={handleWishlistClick}
                    className="absolute top-3 right-3 z-30 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-transform hover:scale-110 border border-gray-100"
                    aria-label="Wishlist"
                >
                    <Heart
                        className={`w-4 h-4 ${
                            hearted
                                ? "fill-[#8B0000] stroke-[#8B0000]"
                                : "stroke-gray-600 fill-none"
                        }`}
                    />
                </button>

                {/* Product Photo with Smooth Image Slider */}
                <img
                    src={resolveImageUrl(allImages[currentImgIndex] || product.image, DEFAULT_FALLBACK_IMAGE)}
                    alt={product.name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                    className={`w-full h-[270px] sm:h-[290px] object-cover transition-all duration-700 group-hover:scale-105 ${
                        isHovered ? "scale-105" : ""
                    }`}
                />

                {/* Multiple Image Slide Indicators */}
                {allImages.length > 1 && isHovered && (
                    <div className="absolute bottom-2.5 left-0 right-0 z-20 flex items-center justify-center gap-1 pointer-events-none">
                        {allImages.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    i === currentImgIndex ? "w-4 bg-white shadow-md" : "w-1.5 bg-white/50"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Details - Always 100% Front & Visible */}
            <div className="p-3 text-center z-10">
                <h3 className={`text-xs sm:text-sm font-serif font-bold text-gray-900 line-clamp-1 leading-snug mb-1 group-hover:text-[#8B0000] transition-colors ${
                    isHovered ? "text-[#8B0000]" : ""
                }`}>
                    {product.name}
                </h3>

                {/* Event / Flash Sale Campaign Tag - only on sale page */}
                {isSalePage && product.sale_title && (
                    <div className="text-[10px] font-bold text-[#8B0000] truncate flex items-center justify-center gap-1 mb-1 bg-rose-50/70 py-0.5 px-2 rounded-full border border-rose-100/80">
                        <Zap className="w-2.5 h-2.5 fill-[#8B0000] text-[#8B0000]" />
                        <span>{product.sale_title}</span>
                    </div>
                )}
                <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
                        <span className="text-[10px] font-bold text-gray-800">
                            {Number(product.rating || 0).toFixed(1)}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                        ({(Number(product.review_count) || 0).toLocaleString("en-IN")})
                    </span>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-gray-900 font-sans">
                        ₹{(displayPrice || 0).toLocaleString("en-IN")}
                    </span>
                    {strikePrice && strikePrice > displayPrice && (
                        <span className="text-xs text-gray-400 line-through font-sans">
                            ₹{strikePrice.toLocaleString("en-IN")}
                        </span>
                    )}
                    {discount > 0 && !isSalePage && (
                        <span className="text-[10px] font-bold text-[#8B0000]">
                          ({discount}% OFF)
                        </span>
                    )}
                </div>
            </div>
            {/* Product Share & Copy Link Modal */}
            <ProductShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                product={product}
            />
        </div>
    );
};

export default ProductCard;
