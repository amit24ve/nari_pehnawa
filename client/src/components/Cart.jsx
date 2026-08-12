import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthProvider";
import { useWishlist } from "../context/WishlistProvider";
import CheckoutModal from "./CheckoutModal";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

const COUPON_CODES = {
  NARI10: { type: "percent", value: 10, label: "10% off" },
  SAVE100: { type: "flat", value: 100, label: "₹100 off" },
  FREESHIP: { type: "shipping", value: 0, label: "Free Shipping" },
};

// ─────────────────────────────────────────────────────────────────────────────

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    cartTotal,
    cartCount,
    loading,
  } = useCart();
  const { user, openLoginModal, pendingCheckout, clearPendingCheckout } = useAuth();
  const { toggleWishlist } = useWishlist();

  /* coupon */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  /* checkout modal (shared component handles address/payment/success) */
  const [showCheckout, setShowCheckout] = useState(false);

  const [deliveryRules, setDeliveryRules] = useState({
    free_delivery_order_count: 1,
    default_delivery_charge: 50,
  });

  React.useEffect(() => {
    if (user && pendingCheckout && pendingCheckout.type === "cart") {
      setShowCheckout(true);
    }
  }, [user, pendingCheckout]);

  React.useEffect(() => {
    const API_URL =
      import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    fetch(`${API_URL}/admin/settings/delivery`)
      .then((res) => res.json())
      .then((data) => {
        setDeliveryRules({
          free_delivery_order_count: data.free_delivery_order_count ?? 1,
          default_delivery_charge: data.default_delivery_charge ?? 50,
        });
      })
      .catch(() => {});
  }, []);

  // ── Price calculations ───────────────────────────────────────────────
  const subtotal = cartTotal;
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : appliedCoupon.type === "flat"
        ? Math.min(appliedCoupon.value, subtotal)
        : 0
    : 0;
  const afterDiscount = subtotal - couponDiscount;

  const calculateDeliveryFee = () => {
    const userOrderCount = user?.orders_count || 0;
    if (userOrderCount < deliveryRules.free_delivery_order_count) {
      return 0; // Free delivery for initial order(s)
    }
    let totalCustomCharge = 0;
    let hasCustom = false;
    cartItems.forEach((item) => {
      if (item.delivery_charge && item.delivery_charge > 0) {
        totalCustomCharge += item.delivery_charge * item.quantity;
        hasCustom = true;
      }
    });
    if (hasCustom) return totalCustomCharge;
    return afterDiscount >= SHIPPING_THRESHOLD
      ? 0
      : deliveryRules.default_delivery_charge;
  };

  const shipping =
    appliedCoupon?.type === "shipping" ? 0 : calculateDeliveryFee();
  const totalAmount = afterDiscount + shipping;

  // ── Coupon helpers ───────────────────────────────────────────────────
  const applyCoupon = () => {
    setCouponError("");
    setCouponSuccess("");
    const code = couponInput.trim().toUpperCase();
    const coupon = COUPON_CODES[code];
    if (!coupon) {
      setCouponError("Invalid code. Try NARI10, SAVE100 or FREESHIP.");
      return;
    }
    setAppliedCoupon({ ...coupon, code });
    setCouponSuccess(`"${code}" applied — ${coupon.label}!`);
    setCouponInput("");
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess("");
  };

  const handleMoveToWishlist = (item) => {
    toggleWishlist({
      id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    removeItem(item.product_id, item.size);
  };

  // ── Open checkout (address/payment/Shiprocket handled by CheckoutModal) ──
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!user) {
      openLoginModal(
        "🔐 Please sign in or create an account to proceed to checkout",
        { type: "cart" }
      );
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderPlaced = () => {
    clearCart();
    clearPendingCheckout();
    setShowCheckout(false);
  };

  // ─────────────────────────────────────────────────────────────────────
  // EMPTY CART
  if (cartItems.length === 0 && !showCheckout) {
    return (
      <div className="min-h-screen bg-[#fdf8f5] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-sm">
          <div className="w-28 h-28 bg-[#fff0f0] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-14 h-14 text-[#8B0000]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            Explore our ethnic wear collection!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#8B0000] hover:bg-[#6B0000] text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fdf8f5] py-6 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Shopping Cart
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" /> Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Free shipping progress */}
            {shipping > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-[#8B0000]" />
                  <p className="text-sm text-gray-700">
                    Add{" "}
                    <span className="font-bold text-[#8B0000]">
                      ₹
                      {(SHIPPING_THRESHOLD - afterDiscount).toLocaleString(
                        "en-IN",
                      )}
                    </span>{" "}
                    more for <span className="font-bold">FREE Delivery</span>
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#8B0000] h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (afterDiscount / SHIPPING_THRESHOLD) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            {cartItems.map((item) => (
              <div
                key={`${item.product_id}-${item.size}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex-shrink-0 w-24 h-32 md:w-28 md:h-36 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.image || "/logo.png"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/logo.png";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base leading-snug line-clamp-2">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {item.size && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Size: <strong>{item.size}</strong>
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id, item.size)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product_id,
                              item.size,
                              item.quantity - 1,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-gray-800 border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product_id,
                              item.size,
                              item.quantity + 1,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8B0000] transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" /> Move to Wishlist
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-[#8B0000] hover:text-[#6B0000] font-medium transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Continue Shopping
            </Link>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-[172px]">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>− ₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        {(user?.orders_count || 0) < deliveryRules.free_delivery_order_count
                          ? "FREE (First Order Special!)"
                          : "FREE"}
                      </span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-gray-900">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                {couponDiscount > 0 && (
                  <p className="text-green-600 text-xs font-medium bg-green-50 rounded-lg px-3 py-2">
                    🎉 You save ₹{couponDiscount.toLocaleString("en-IN")} on
                    this order!
                  </p>
                )}
              </div>

              {/* Coupon */}
              <div className="mt-5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs text-green-600">
                        ({appliedCoupon.label})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="Coupon code"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] text-gray-700"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2.5 bg-[#8B0000] hover:bg-[#6B0000] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-1.5">
                        {couponError}
                      </p>
                    )}
                    {couponSuccess && (
                      <p className="text-xs text-green-600 mt-1.5">
                        {couponSuccess}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      Try: NARI10, SAVE100, FREESHIP
                    </p>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
                className="w-full mt-5 bg-[#8B0000] hover:bg-[#6B0000] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wide shadow-md"
              >
                PROCEED TO CHECKOUT
              </button>

              {!user && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  Please{" "}
                  <button className="text-[#8B0000] font-medium underline">
                    login
                  </button>{" "}
                  to checkout
                </p>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                {[
                  { Icon: Shield, label: "Secure\nPayment" },
                  { Icon: RotateCcw, label: "15-Day\nReturn" },
                  { Icon: Truck, label: "Fast\nDelivery" },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 bg-[#fff5f5] rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#8B0000]" />
                    </div>
                    <span className="text-[10px] text-gray-500 leading-tight whitespace-pre-line">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment icons */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {["UPI", "Cards", "NetBanking", "COD"].map((m) => (
                  <span
                    key={m}
                    className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHECKOUT MODAL (shared: address -> Razorpay/COD -> Shiprocket) ── */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={cartItems}
        subtotal={subtotal}
        discount={couponDiscount}
        shipping={shipping}
        total={totalAmount}
        couponCode={appliedCoupon?.code || null}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
};

export default Cart;
