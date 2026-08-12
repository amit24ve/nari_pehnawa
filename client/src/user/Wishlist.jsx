import React, { useState } from "react";
import {
  Heart,
  Trash2,
  ShoppingCart,
  Star,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistProvider";
import { useCart } from "../context/CartProvider";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Organic Pebble fluid curve shapes matching homepage cards
const pebbleShapes = [
  "rounded-[45%_55%_65%_35%/55%_45%_55%_45%]",
  "rounded-[55%_45%_35%_65%/45%_65%_35%_55%]",
  "rounded-[65%_35%_55%_45%/50%_40%_60%_50%]",
  "rounded-[50%_60%_40%_60%/60%_50%_50%_40%]",
];

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, loading } = useCart();
  const navigate = useNavigate();

  // Size picker state
  const [sizePickerItem, setSizePickerItem] = useState(null); // item that needs size
  const [selectedSize, setSelectedSize] = useState("");
  const [addedItemId, setAddedItemId] = useState(null); // for success animation

  const openSizePicker = (item) => {
    setSizePickerItem(item);
    setSelectedSize("M"); // default
  };

  const handleAddToCart = async () => {
    if (!sizePickerItem || !selectedSize) return;
    const success = await addToCart({
      product_id: String(sizePickerItem.id),
      name: sizePickerItem.name,
      price: sizePickerItem.price,
      image: sizePickerItem.image,
      size: selectedSize,
      color: "",
      quantity: 1,
    });
    if (success) {
      setAddedItemId(sizePickerItem.id);
      setSizePickerItem(null);
      setTimeout(() => setAddedItemId(null), 2000);
    }
  };

  /* ── Empty Wishlist ── */
  if (wishlist.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-14 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#fff0f0] rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-[#8B0000]" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Your Wishlist is Empty
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Save your favourite Kurtis and Home Décor items here!
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-full font-semibold text-sm transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#8B0000] fill-[#8B0000]" />
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <button
          onClick={clearWishlist}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item, idx) => {
          const shapeIndex = idx % pebbleShapes.length;
          const pebbleClass = pebbleShapes[shapeIndex];
          return (
            <div
              key={item.id}
              className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer flex flex-col justify-between"
              onClick={() => navigate(`/product/${item.id}`)}
            >
              {/* Image */}
              <div className={`relative h-52 sm:h-64 bg-gradient-to-br from-pink-100/50 to-amber-50/50 ${pebbleClass} border-[#8B0000]/15 border-2 group-hover:rounded-2xl group-active:rounded-2xl shadow-md group-hover:border-[#8B0000] group-active:border-[#8B0000] transition-all duration-500 ease-in-out overflow-hidden`}>
                <img
                  src={item.image || "/gob-kurta-set-1.png"}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              {/* Remove button */}
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition-colors shadow-md"
              >
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
              </button>
              {item.discount && (
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#8B0000] text-white text-xs font-bold rounded-full">
                  {item.discount}% OFF
                </div>
              )}
              {/* Added to cart success indicator */}
              {/* Added to cart success indicator */}
              {addedItemId === item.id && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="bg-white rounded-full p-3 shadow-lg">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 text-center z-10" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif font-bold text-gray-800 text-sm line-clamp-1 mb-2">
                {item.name}
              </h3>

              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">4.0</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-lg font-bold text-gray-900">
                  ₹{item.price?.toLocaleString("en-IN")}
                </span>
                {item.originalPrice && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{item.originalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-green-600 font-semibold">
                      {Math.round((1 - item.price / item.originalPrice) * 100)}%
                      off
                    </span>
                  </>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSizePicker(item);
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        );})}
      </div>

      {/* Size Picker Modal */}
      {sizePickerItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Select Size</h3>
              <button
                onClick={() => setSizePickerItem(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Product info */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <img
                src={sizePickerItem.image || "/gob-kurta-set-1.png"}
                alt={sizePickerItem.name}
                className="w-14 h-14 object-cover rounded-xl"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                  {sizePickerItem.name}
                </p>
                <p className="text-sm font-bold text-[#8B0000]">
                  ₹{sizePickerItem.price?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Sizes */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Choose Size
            </p>
            <div className="flex gap-2 flex-wrap mb-6">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-10 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedSize === size
                      ? "border-[#8B0000] bg-[#8B0000] text-white"
                      : "border-gray-200 text-gray-700 hover:border-[#8B0000]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={loading || !selectedSize}
              className="w-full py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {loading ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
