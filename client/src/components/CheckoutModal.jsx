import React, { useState } from "react";
import {
  X,
  MapPin,
  CreditCard,
  Smartphone,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { trackCustomEvent } from "./VisitorTracker";

const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
  "Puducherry",
];

/**
 * CheckoutModal — shared 3-step checkout (Address -> Payment -> Success)
 * used by both the Cart page and "Buy It Now" on the product page.
 *
 * Handles both payment paths end-to-end:
 *   - Razorpay: creates a Razorpay order on the backend, opens the
 *     Razorpay Checkout widget, verifies the signature server-side, then
 *     the backend creates the app order and automatically triggers the
 *     Shiprocket fulfilment pipeline (create shipment -> AWB -> pickup).
 *   - COD: creates the app order directly; Shiprocket fulfilment is
 *     triggered the same way from the backend.
 *
 * Props:
 *   isOpen, onClose
 *   items        — [{ product_id, name, image, price, quantity, size, color }]
 *   subtotal, discount, shipping, total  — pre-computed numbers to display
 *   couponCode   — optional applied coupon code (string) to store on the order
 *   onOrderPlaced(result, paymentMethod) — called after a successful order
 */
const CheckoutModal = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  total,
  couponCode = null,
  onOrderPlaced,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=success
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [address, setAddress] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });
  const [addressErrors, setAddressErrors] = useState({});

  if (!isOpen) return null;

  const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token");

  const validateAddress = () => {
    const errs = {};
    if (!address.full_name.trim()) errs.full_name = "Name required";
    if (!address.phone.trim()) errs.phone = "Phone required";
    if (!address.address_line1.trim()) errs.address_line1 = "Address required";
    if (!address.city.trim()) errs.city = "City required";
    if (!address.state.trim()) errs.state = "State required";
    if (!address.postal_code.trim()) errs.postal_code = "Pincode required";
    else if (!/^\d{6}$/.test(address.postal_code))
      errs.postal_code = "Enter 6-digit pincode";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildOrderPayload = () => ({
    user_id: user?.id || "",
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: item.name,
      product_image: item.image || "",
      quantity: item.quantity,
      size: item.size || "",
      color: item.color || "",
      price: item.price,
      total: item.price * item.quantity,
    })),
    shipping_address: address,
    subtotal,
    discount,
    shipping_cost: shipping,
    tax: 0,
    total_amount: total,
    payment_method: paymentMethod === "razorpay" ? "Razorpay" : "COD",
    coupon_code: couponCode,
    customer_email: user?.email || "",
  });

  const handleRazorpayPayment = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const createRes = await fetch(
        `${API_URL}/payments/razorpay/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: total, currency: "INR" }),
        },
      );
      if (!createRes.ok) throw new Error("Could not create payment order");
      const { razorpay_order_id, key_id } = await createRes.json();

      const options = {
        key: key_id,
        amount: Math.round(total * 100),
        currency: "INR",
        name: "Nari Pehnawa",
        description: `Order of ${items.length} item(s)`,
        order_id: razorpay_order_id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: address.phone,
        },
        theme: { color: "#8B0000" },
        handler: async (response) => {
          const verifyRes = await fetch(`${API_URL}/payments/razorpay/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_data: buildOrderPayload(),
            }),
          });
          if (!verifyRes.ok) throw new Error("Payment verification failed");
          const result = await verifyRes.json();
          trackCustomEvent("conversion", {
            method: "razorpay",
            revenue: result.order?.total_amount || result.total_amount || 0.0,
            order_number: result.order?.order_number || result.order_number || "unknown"
          });
          setOrderResult(result);
          setStep(3);
          setLoading(false);
          onOrderPlaced?.(result, "razorpay");
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            alert("Payment cancelled. Your order was not placed.");
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setLoading(false);
      alert(`Payment error: ${err.message}`);
    }
  };

  const handleCODOrder = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/payments/cod/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildOrderPayload()),
      });
      if (!res.ok) throw new Error("Could not place COD order");
      const result = await res.json();
      trackCustomEvent("conversion", {
        method: "cod",
        revenue: result.order?.total_amount || result.total_amount || 0.0,
        order_number: result.order?.order_number || result.order_number || "unknown"
      });
      setOrderResult(result);
      setStep(3);
      onOrderPlaced?.(result, "cod");
    } catch (err) {
      alert(`Order error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "razorpay") handleRazorpayPayment();
    else handleCODOrder();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 && "Delivery Address"}
              {step === 2 && "Payment Method"}
              {step === 3 && "Order Confirmed!"}
            </h2>
            {step < 3 && (
              <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2</p>
            )}
          </div>
          {step < 3 && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {step < 3 && (
          <div className="flex items-center px-5 py-3 gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-[#8B0000]" : "bg-gray-200"}`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-[#8B0000]" : "bg-gray-200"}`}
            />
          </div>
        )}

        {/* Scrollable Content Wrapper */}
        <div className="overflow-y-auto flex-1 p-1">

        {/* STEP 1: Address */}
        {step === 1 && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Full Name *
                </label>
                <input
                  value={address.full_name}
                  onChange={(e) =>
                    setAddress({ ...address, full_name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.full_name ? "border-red-400" : "border-gray-200"}`}
                />
                {addressErrors.full_name && (
                  <p className="text-xs text-red-500 mt-1">{addressErrors.full_name}</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Phone Number *
                </label>
                <input
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.phone ? "border-red-400" : "border-gray-200"}`}
                />
                {addressErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{addressErrors.phone}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Address Line 1 *
                </label>
                <input
                  value={address.address_line1}
                  onChange={(e) =>
                    setAddress({ ...address, address_line1: e.target.value })
                  }
                  placeholder="Flat/House no., Building, Street"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.address_line1 ? "border-red-400" : "border-gray-200"}`}
                />
                {addressErrors.address_line1 && (
                  <p className="text-xs text-red-500 mt-1">
                    {addressErrors.address_line1}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Address Line 2
                </label>
                <input
                  value={address.address_line2}
                  onChange={(e) =>
                    setAddress({ ...address, address_line2: e.target.value })
                  }
                  placeholder="Area, Colony, Landmark (optional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  City *
                </label>
                <input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.city ? "border-red-400" : "border-gray-200"}`}
                />
                {addressErrors.city && (
                  <p className="text-xs text-red-500 mt-1">{addressErrors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Pincode *
                </label>
                <input
                  value={address.postal_code}
                  onChange={(e) =>
                    setAddress({ ...address, postal_code: e.target.value })
                  }
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.postal_code ? "border-red-400" : "border-gray-200"}`}
                />
                {addressErrors.postal_code && (
                  <p className="text-xs text-red-500 mt-1">
                    {addressErrors.postal_code}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  State *
                </label>
                <select
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B0000] ${addressErrors.state ? "border-red-400" : "border-gray-200"}`}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {addressErrors.state && (
                  <p className="text-xs text-red-500 mt-1">{addressErrors.state}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Items ({items.reduce((n, i) => n + i.quantity, 0)})</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (validateAddress()) setStep(2);
              }}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Continue to Payment →
            </button>
          </div>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <div className="p-5 space-y-5">
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <MapPin className="w-4 h-4 text-[#8B0000] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{address.full_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {address.address_line1},{" "}
                  {address.address_line2 && `${address.address_line2}, `}
                  {address.city}, {address.state} - {address.postal_code}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-[#8B0000] mt-1 underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Select Payment Method
              </p>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "razorpay" ? "border-[#8B0000] bg-[#fff5f5]" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="accent-[#8B0000]"
                  />
                  <CreditCard className="w-5 h-5 text-[#8B0000]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Online Payment</p>
                    <p className="text-xs text-gray-500">
                      UPI, Cards, Net Banking via Razorpay
                    </p>
                  </div>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Recommended
                  </span>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-[#8B0000] bg-[#fff5f5]" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-[#8B0000]"
                  />
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-[#8B0000]/5 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Amount to Pay</span>
              <span className="text-xl font-bold text-[#8B0000]">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                  </>
                ) : paymentMethod === "razorpay" ? (
                  "Pay Now →"
                ) : (
                  "Place Order →"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && orderResult && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Thank you for shopping with Nari Pehnawa. Your order has been confirmed.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Number</span>
                <span className="font-semibold text-gray-900">
                  {orderResult.order_number}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-semibold text-green-600">
                  {paymentMethod === "razorpay" ? "Paid Online" : "COD – Pay on Delivery"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="font-semibold text-gray-900">
                  {address.city}, {address.state}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate("/user/orders");
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                View Orders
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate("/");
                }}
                className="flex-1 py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold rounded-xl transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
