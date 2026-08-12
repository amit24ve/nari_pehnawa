import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star } from "lucide-react";

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
    index = 0
}) => {
    const [hearted, setHearted] = useState(isWishlisted || false);
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

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
            navigate(`/product/${product.id}`);
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
                {/* Sale / New Badge - Always 100% visible on top left */}
                {discount > 0 ? (
                    <span className="absolute top-3 left-3 z-30 bg-[#8B0000] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                        Sale
                    </span>
                ) : (product.isNew || product.is_new) ? (
                    <span className="absolute top-3 left-3 z-30 bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                        NEW
                    </span>
                ) : null}

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

                {/* Product Photo */}
                <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                            "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=600";
                    }}
                    className={`w-full h-[270px] sm:h-[290px] object-cover transition-transform duration-700 group-hover:scale-105 ${
                        isHovered ? "scale-105" : ""
                    }`}
                />
            </div>

            {/* Product Details - Always 100% Front & Visible */}
            <div className="p-3 text-center z-10">
                <h3 className={`text-xs sm:text-sm font-serif font-bold text-gray-900 line-clamp-1 leading-snug mb-1.5 group-hover:text-[#8B0000] transition-colors ${
                    isHovered ? "text-[#8B0000]" : ""
                }`}>
                    {product.name}
                </h3>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
                        <span className="text-[10px] font-bold text-gray-800">
                            {(product.rating || 4.2).toFixed(1)}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                        ({(product.review_count || 12).toLocaleString("en-IN")})
                    </span>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-gray-900 font-sans">
                        ₹{(product.price || 0).toLocaleString("en-IN")}
                    </span>
                    {(product.originalPrice || product.original_price) > product.price && (
                        <span className="text-xs text-gray-400 line-through font-sans">
                            ₹{(product.originalPrice || product.original_price).toLocaleString("en-IN")}
                        </span>
                    )}
                    {discount > 0 && (
                        <span className="text-[10px] font-bold text-[#8B0000]">
                          ({discount}% OFF)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
