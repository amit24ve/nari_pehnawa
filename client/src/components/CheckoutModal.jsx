import {
  X,
  MapPin,
  CreditCard,
  Smartphone,
  CheckCircle,
  Loader2,
  Coins,
  Sparkles,
  Mail,
  Home,
  Building,
  Check,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { trackCustomEvent } from "./VisitorTracker";
import { trackInitiateCheckout, trackPurchase } from "../utils/metaPixel";

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
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=success
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  const [address, setAddress] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });
  const [addressErrors, setAddressErrors] = useState({});

  const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token");

  // Fetch Saved Addresses & Coins on Modal Open
  React.useEffect(() => {
    if (isOpen && user) {
      const token = getToken();
      if (token) {
        // Fetch Coins
        fetch(`${API_URL}/coins/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && typeof data.coins_balance === "number") {
              setUserCoins(data.coins_balance);
            }
          })
          .catch(() => {});

        // Fetch Saved Addresses
        setLoadingAddresses(true);
        fetch(`${API_URL}/addresses/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((list) => {
            if (Array.isArray(list) && list.length > 0) {
              setSavedAddresses(list);
              const defaultAddr = list.find((a) => a.is_default) || list[0];
              setSelectedAddressId(defaultAddr.id);
              setAddress({
                full_name: defaultAddr.full_name || user?.name || "",
                phone: defaultAddr.phone || user?.phone || "",
                email: defaultAddr.email || user?.email || "",
                address_line1: defaultAddr.address_line1 || "",
                address_line2: defaultAddr.address_line2 || "",
                city: defaultAddr.city || "",
                state: defaultAddr.state || "",
                postal_code: defaultAddr.pincode || defaultAddr.postal_code || "",
                country: "India",
              });
            } else {
              setSavedAddresses([]);
              setSelectedAddressId("new");
              setAddress((prev) => ({
                ...prev,
                full_name: prev.full_name || user?.name || "",
                phone: prev.phone || user?.phone || "",
                email: prev.email || user?.email || "",
              }));
            }
          })
          .catch(() => {
            setSavedAddresses([]);
          })
          .finally(() => {
            setLoadingAddresses(false);
          });
      }
    }
  }, [isOpen, user]);

  React.useEffect(() => {
    if (isOpen && items && items.length > 0) {
      trackInitiateCheckout(items, total);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler when a saved address is picked
  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddress({
      full_name: addr.full_name || user?.name || "",
      phone: addr.phone || user?.phone || "",
      email: addr.email || user?.email || address.email || "",
      address_line1: addr.address_line1 || "",
      address_line2: addr.address_line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: addr.pincode || addr.postal_code || "",
      country: "India",
    });
    setAddressErrors({});
  };

  const handleAddNewAddressOption = () => {
    setSelectedAddressId("new");
    setAddress({
      full_name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || address.email || "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    });
    setAddressErrors({});
  };

  // Max 50% discount from coins (10 Coins = ₹1)
  const maxCoinsAllowed = Math.min(
    userCoins,
    Math.floor(subtotal * 0.5 * 10)
  );
  const coinsToRedeem = useCoins ? maxCoinsAllowed : 0;
  const coinDiscount = Number((coinsToRedeem / 10).toFixed(2));
  const finalPayable = Math.max(0, Number((total - coinDiscount).toFixed(2)));

  // Potential coins to earn (100 for regular, 50 for sale/offer items)
  const potentialCoinsToEarn = items.reduce((sum, it) => {
    const qty = it.quantity || 1;
    const isSale = it.on_sale || (it.discount && it.discount > 0);
    return sum + (isSale ? 50 : 100) * qty;
  }, 0);

  const validateAddress = () => {
    const errs = {};
    if (!address.full_name.trim()) errs.full_name = "Full Name is required";
    if (!address.phone.trim()) {
      errs.phone = "Phone Number is required";
    } else {
      const cleanP = address.phone.replace(/\D/g, "");
      if (cleanP.length !== 10) errs.phone = "Enter valid 10-digit mobile number";
    }
    if (address.email && address.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address.email.trim())) {
        errs.email = "Enter a valid email address";
      }
    }
    if (!address.address_line1.trim()) errs.address_line1 = "Address Line 1 is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!address.postal_code.trim()) {
      errs.postal_code = "Pincode is required";
    } else if (!/^\d{6}$/.test(address.postal_code.trim())) {
      errs.postal_code = "Enter valid 6-digit pincode";
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Auto-sync email & save address to profile
  const syncUserDataAndAddress = async () => {
    const token = getToken();
    if (!token || !user) return;

    try {
      // 1. If email was updated/entered and differs from current user profile, update it in /users/me
      const cleanEmail = address.email ? address.email.trim() : "";
      if (cleanEmail && cleanEmail !== user.email) {
        fetch(`${API_URL}/users/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: cleanEmail }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((updatedUser) => {
            if (updatedUser && updateUserProfile) {
              updateUserProfile(updatedUser);
            }
          })
          .catch(() => {});
      }

      // 2. If it's a new address and saveAddressToProfile is true, save to /addresses/
      if (selectedAddressId === "new" && saveAddressToProfile) {
        fetch(`${API_URL}/addresses/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: address.full_name,
            phone: address.phone,
            email: cleanEmail,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || "",
            city: address.city,
            state: address.state,
            pincode: address.postal_code,
            is_default: savedAddresses.length === 0,
          }),
        }).catch(() => {});
      }
    } catch {
      // Background sync, do not block checkout
    }
  };

  const handleProceedToPayment = () => {
    if (validateAddress()) {
      syncUserDataAndAddress();
      setStep(2);
    }
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
      on_sale: Boolean(item.on_sale || (item.discount && item.discount > 0)),
    })),
    shipping_address: {
      ...address,
      email: address.email || user?.email || "",
    },
    subtotal,
    discount,
    shipping_cost: shipping,
    tax: 0,
    total_amount: finalPayable,
    payment_method: paymentMethod === "razorpay" ? "Razorpay" : "COD",
    coupon_code: couponCode,
    coins_used: coinsToRedeem,
    coin_discount: coinDiscount,
    coins_earned: potentialCoinsToEarn,
    customer_email: address.email || user?.email || "",
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
          body: JSON.stringify({ amount: finalPayable, currency: "INR" }),
        },
      );
      if (!createRes.ok) throw new Error("Could not create payment order");
      const { razorpay_order_id, key_id } = await createRes.json();

      const options = {
        key: key_id,
        amount: Math.round(finalPayable * 100),
        currency: "INR",
        name: "Nari Pehnawa",
        description: `Order of ${items.length} item(s)`,
        order_id: razorpay_order_id,
        prefill: {
          name: address.full_name || user?.name || "",
          email: address.email || user?.email || "",
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
          trackPurchase({
            items,
            total: result.order?.total_amount || result.total_amount || finalPayable || total,
            order_number: result.order?.order_number || result.order_number,
            id: result.order_id || result.id
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
      trackPurchase({
        items,
        total: result.order?.total_amount || result.total_amount || finalPayable || total,
        order_number: result.order?.order_number || result.order_number,
        id: result.order_id || result.id
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
          <div className="p-4 sm:p-5 space-y-4">
            {/* Items Summary Preview Card */}
            {items && items.length > 0 && (
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/80 space-y-2">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <span>🛍️</span> Order Items ({items.reduce((n, i) => n + (i.quantity || 1), 0)})
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-white p-2 rounded-lg border border-amber-100 shadow-2xs">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 mx-auto sm:mx-0">
                        <img
                          src={it.image || it.product_image || "/product_1_sky_bloom.jpg"}
                          alt={it.name || it.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/product_1_sky_bloom.jpg"; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {it.name || it.product_name}
                        </h4>
                        <div className="text-[11px] text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                          {it.size && <span>Size: <strong>{it.size}</strong></span>}
                          <span>Qty: <strong>{it.quantity || 1}</strong></span>
                          <span className="font-bold text-[#8B0000]">₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Addresses Picker (if user has saved addresses) */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Select Saved Address
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3 rounded-xl border-2 text-xs transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-[#8B0000] bg-rose-50/40 shadow-xs"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                              {addr.type === "work" ? (
                                <Building className="w-3.5 h-3.5 text-gray-500" />
                              ) : (
                                <Home className="w-3.5 h-3.5 text-gray-500" />
                              )}
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] bg-rose-100 text-[#8B0000] font-bold px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-[11px] font-medium">
                            📞 {addr.phone}
                          </p>
                          <p className="text-gray-600 text-[11px] line-clamp-2">
                            {addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode || addr.postal_code}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={handleAddNewAddressOption}
                    className={`p-3 rounded-xl border-2 border-dashed text-xs transition cursor-pointer flex items-center justify-center gap-2 min-h-[85px] ${
                      selectedAddressId === "new"
                        ? "border-[#8B0000] bg-rose-50/40 text-[#8B0000] font-bold"
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enter New Address</span>
                  </div>
                </div>
              </div>
            )}

            {/* Address Input Form */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {selectedAddressId === "new" ? "Enter Delivery Details" : "Delivery Details (Editable)"}
                </span>
                {selectedAddressId !== "new" && (
                  <span className="text-[11px] text-gray-500">
                    Selected from saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Receiver Full Name *
                  </label>
                  <input
                    type="text"
                    value={address.full_name}
                    onChange={(e) =>
                      setAddress({ ...address, full_name: e.target.value })
                    }
                    placeholder="Enter receiver full name"
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] ${
                      addressErrors.full_name ? "border-red-400 bg-red-50/30" : "border-gray-200"
                    }`}
                  />
                  {addressErrors.full_name && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.full_name}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="flex rounded-xl border border-gray-200 focus-within:border-[#8B0000] overflow-hidden bg-white">
                    <span className="px-2.5 py-2 bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })
                      }
                      placeholder="10-digit mobile"
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none text-gray-900"
                    />
                  </div>
                  {addressErrors.phone && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.phone}</p>
                  )}
                </div>

                {/* Email Address (Auto-saved and updateable) */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 font-normal">(Auto-saved for Order Updates &amp; Invoice)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="you@example.com (will be saved to your profile)"
                      className={`w-full border rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] ${
                        addressErrors.email ? "border-red-400 bg-red-50/30" : "border-gray-200"
                      }`}
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {addressErrors.email && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.email}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Address Line 1 (Flat, House no., Building, Street) *
                  </label>
                  <input
                    type="text"
                    value={address.address_line1}
                    onChange={(e) =>
                      setAddress({ ...address, address_line1: e.target.value })
                    }
                    placeholder="e.g. Flat 402, Royal Residency, M.G. Road"
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] ${
                      addressErrors.address_line1 ? "border-red-400 bg-red-50/30" : "border-gray-200"
                    }`}
                  />
                  {addressErrors.address_line1 && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.address_line1}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Address Line 2 (Area, Colony, Landmark)
                  </label>
                  <input
                    type="text"
                    value={address.address_line2}
                    onChange={(e) =>
                      setAddress({ ...address, address_line2: e.target.value })
                    }
                    placeholder="e.g. Near City Mall, Sector 15 (Optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                {/* City */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] ${
                      addressErrors.city ? "border-red-400 bg-red-50/30" : "border-gray-200"
                    }`}
                  />
                  {addressErrors.city && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.city}</p>
                  )}
                </div>

                {/* Pincode */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.postal_code}
                    onChange={(e) =>
                      setAddress({ ...address, postal_code: e.target.value.replace(/\D/g, "") })
                    }
                    placeholder="6-digit pincode"
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] ${
                      addressErrors.postal_code ? "border-red-400 bg-red-50/30" : "border-gray-200"
                    }`}
                  />
                  {addressErrors.postal_code && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.postal_code}</p>
                  )}
                </div>

                {/* State */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] bg-white ${
                      addressErrors.state ? "border-red-400 bg-red-50/30" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {addressErrors.state && (
                    <p className="text-[11px] text-red-500 mt-0.5">{addressErrors.state}</p>
                  )}
                </div>
              </div>

              {/* Save address checkbox when entering new address */}
              {selectedAddressId === "new" && user && (
                <label className="flex items-center gap-2 pt-1 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddressToProfile}
                    onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    className="rounded accent-[#8B0000]"
                  />
                  <span>Save this address to my profile for future orders</span>
                </label>
              )}
            </div>

            {/* Price Summary Breakdown */}
            <div className="bg-gray-50 rounded-xl p-3.5 text-xs sm:text-sm space-y-1.5 border border-gray-200/70">
              <div className="flex justify-between text-gray-600">
                <span>Items ({items.reduce((n, i) => n + (i.quantity || 1), 0)})</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>- ₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {coinDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>🪙 Coins Discount ({coinsToRedeem} coins)</span>
                  <span>- ₹{coinDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-sm sm:text-base">
                <span>Total Payable</span>
                <span className="text-[#8B0000]">₹{finalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to Payment</span>
              <span>→</span>
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

            {/* 🪙 REWARD COINS BOX */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-sm">
                    🪙
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      Nari Pehnawa Reward Coins
                      {userCoins > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-semibold">
                          {userCoins} Coins
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-600">
                      10 Coins = ₹1 • Max 50% order discount
                    </p>
                  </div>
                </div>

                {userCoins >= 10 && maxCoinsAllowed >= 10 && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCoins}
                      onChange={(e) => setUseCoins(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                )}
              </div>

              {userCoins >= 10 && maxCoinsAllowed >= 10 ? (
                <div className="text-xs pt-2 border-t border-amber-200 flex justify-between items-center text-amber-900">
                  <span>
                    {useCoins
                      ? `Redeeming ${coinsToRedeem} coins for discount`
                      : `Redeem up to ${maxCoinsAllowed} coins (₹${(maxCoinsAllowed / 10).toFixed(2)} off)`}
                  </span>
                  {useCoins && (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      -₹{coinDiscount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-amber-800 pt-1.5 border-t border-amber-200 flex items-center justify-between">
                  <span>🎉 You will earn <strong>+{potentialCoinsToEarn} Reward Coins</strong> on this order!</span>
                </div>
              )}
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

            {/* Price breakdown in Step 2 */}
            <div className="bg-[#8B0000]/5 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {coinDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>🪙 Coins Discount ({coinsToRedeem} coins)</span>
                  <span>-₹{coinDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#8B0000]/10">
                <span className="text-sm font-semibold text-gray-700">Final Amount to Pay</span>
                <span className="text-xl font-bold text-[#8B0000]">
                  ₹{finalPayable.toLocaleString("en-IN")}
                </span>
              </div>
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
                  `Pay ₹${finalPayable.toLocaleString("en-IN")} →`
                ) : (
                  `Place Order (₹${finalPayable.toLocaleString("en-IN")}) →`
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

            {/* Coins Earned Notification Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-center gap-2 text-amber-900 text-sm font-medium">
              <span>🪙</span>
              <span>
                You earned <strong>+{potentialCoinsToEarn} Reward Coins</strong> on this purchase!
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Number</span>
                <span className="font-semibold text-gray-900 font-mono">
                  {orderResult?.order_number || orderResult?.order?.order_number || orderResult?.order_id || "Confirmed"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-semibold text-green-600">
                  {paymentMethod === "razorpay" ? "Paid Online" : "COD – Pay on Delivery"}
                </span>
              </div>
              {coinDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coins Redeemed</span>
                  <span className="font-semibold text-amber-600">
                    {coinsToRedeem} Coins (Saved ₹{coinDiscount})
                  </span>
                </div>
              )}
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
