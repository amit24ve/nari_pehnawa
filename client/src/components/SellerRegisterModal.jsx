import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Store,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useSellerAuth } from "../seller/SellerAuthContext";
import { useAuth } from "../context/AuthProvider";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const ETHNIC_CATEGORIES = [
  "Sarees (Banarasi, Silk, Chiffon, Georgette)",
  "Suits, Salwars & Anarkalis",
  "Lehengas & Bridal Wear",
  "Kurtis, Tunics & Co-ords",
  "Dupattas & Stoles",
  "Ethnic Jewellery & Accessories",
  "Fabrics & Dress Materials",
];

const SellerRegisterModal = ({ isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const { register } = useSellerAuth();
  const { openLoginModal } = useAuth();
  const navigate = useNavigate();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [step, setStep] = useState(1); // 1: Contact, 2: Business & Pickup, 3: Bank & KYC, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    shop_name: "",
    business_type: "individual",
    primary_category: ETHNIC_CATEGORIES[0],
    address: "",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
    gstin: "",
    pan: "",
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    agreed_packaging_policy: true,
  });

  const [registeredSeller, setRegisteredSeller] = useState(null);

  // Global event listener to open seller registration modal from anywhere
  useEffect(() => {
    const handleOpenEvent = () => {
      setInternalIsOpen(true);
      setError("");
      setStep(1);
    };
    const handleCloseEvent = () => {
      setInternalIsOpen(false);
    };

    window.addEventListener("np_open_seller_register", handleOpenEvent);
    window.addEventListener("np_close_seller_register", handleCloseEvent);
    return () => {
      window.removeEventListener("np_open_seller_register", handleOpenEvent);
      window.removeEventListener("np_close_seller_register", handleCloseEvent);
    };
  }, []);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setError("");
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return false;
    }
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setError("");
    if (!formData.shop_name.trim()) {
      setError("Please enter your Store / Brand Name.");
      return false;
    }
    if (!formData.city.trim()) {
      setError("Please enter your city.");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Please enter your pickup / store street address.");
      return false;
    }
    const cleanPin = formData.pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setError("Please enter a valid 6-digit Indian PIN Code.");
      return false;
    }
    return true;
  };

  // Submit Step 3 (Final Registration)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (formData.pan && formData.pan.trim().length !== 10) {
      setError("PAN card number must be exactly 10 alphanumeric characters (e.g. ABCDE1234F).");
      return;
    }

    if (formData.gstin && formData.gstin.trim().length !== 15) {
      setError("GSTIN must be 15 characters long.");
      return;
    }

    if (formData.account_number && formData.account_number !== formData.confirm_account_number) {
      setError("Bank Account Numbers do not match.");
      return;
    }

    if (!formData.agreed_packaging_policy) {
      setError("You must agree to the Nari Pehnawa Merchant Agreement & Standard Packaging Guidelines.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ""),
        password: formData.password,
        business_type: formData.business_type,
        city: formData.city.trim(),
        state: formData.state,
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : undefined,
        pan: formData.pan.trim() ? formData.pan.trim().toUpperCase() : undefined,
        bank_name: formData.bank_name.trim() || undefined,
        account_number: formData.account_number.trim() || undefined,
        ifsc_code: formData.ifsc_code.trim() ? formData.ifsc_code.trim().toUpperCase() : undefined,
        account_holder_name: formData.account_holder_name.trim() || undefined,
        declaration_accepted: true,
      };

      const res = await register(payload);
      setRegisteredSeller(res);
      setStep(4); // Move to Success state
    } catch (err) {
      setError(err.message || "Registration failed. Please verify your details or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    handleClose();
    navigate("/seller/dashboard");
  };

  const handleOpenLogin = () => {
    handleClose();
    openLoginModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#4A0A19] via-[#630E22] to-[#4A0A19] text-white px-6 py-5">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffe29a] bg-white/10 px-2.5 py-0.5 rounded-full">
              Seller Hub Central
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Register as a Verified Merchant Seller
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 mt-1">
            Sell sarees, suits, lehengas & ethnic wear directly to thousands of verified shoppers
          </p>

          {/* Stepper Progress */}
          {step < 4 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div
                className={`flex items-center gap-2 text-xs font-semibold pb-1 border-b-2 transition-all ${
                  step >= 1 ? "border-[#ffe29a] text-white" : "border-white/20 text-white/50"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 1 ? "bg-[#ffe29a] text-[#4A0A19]" : "bg-white/20 text-white"
                }`}>1</span>
                <span>Account</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs font-semibold pb-1 border-b-2 transition-all ${
                  step >= 2 ? "border-[#ffe29a] text-white" : "border-white/20 text-white/50"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 2 ? "bg-[#ffe29a] text-[#4A0A19]" : "bg-white/20 text-white"
                }`}>2</span>
                <span>Store & Pickup</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs font-semibold pb-1 border-b-2 transition-all ${
                  step >= 3 ? "border-[#ffe29a] text-white" : "border-white/20 text-white/50"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 3 ? "bg-[#ffe29a] text-[#4A0A19]" : "bg-white/20 text-white"
                }`}>3</span>
                <span>Bank & KYC</span>
              </div>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-medium text-red-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Account & Contact ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Step 1 of 3: Primary Contact & Password
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Business Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="merchant@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Password (min. 6 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100 mt-6">
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="text-xs font-bold text-[#580C1F] hover:underline"
                >
                  Already registered as seller? Log In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="px-6 py-2.5 bg-[#580C1F] hover:bg-[#430918] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Store Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Store & Pickup Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Step 2 of 3: Store & Pickup Address (For Courier Dispatches)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Store / Brand Display Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      name="shop_name"
                      required
                      value={formData.shop_name}
                      onChange={handleChange}
                      placeholder="e.g. Royal Banaras Silks"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Business Type *
                  </label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    <option value="individual">Individual / Proprietorship</option>
                    <option value="partnership">Partnership Firm / LLP</option>
                    <option value="private_limited">Private Limited (Pvt Ltd)</option>
                    <option value="artisan">Handloom Weaver / Artisan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Primary Ethnic Category
                </label>
                <select
                  name="primary_category"
                  value={formData.primary_category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                >
                  {ETHNIC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Pickup / Warehouse Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <textarea
                    rows={2}
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Shop / Unit Number, Market Name, Street"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Varanasi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="221001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="px-6 py-2.5 bg-[#580C1F] hover:bg-[#430918] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Bank & KYC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Bank & KYC Details ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Step 3 of 3: Bank & KYC Information (For Daily Payouts)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    GSTIN (GST Number)
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 09ABCDE1234F1Z5"
                    className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <p className="text-[11px] text-stone-500 mt-0.5">Optional for composite / unregistered sellers under 40L.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    name="pan"
                    maxLength={10}
                    value={formData.pan}
                    onChange={handleChange}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <p className="text-[11px] text-stone-500 mt-0.5">Mandatory for TDS & payout disbursement.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-[#0891b2]" />
                  <span>Settlement Bank Account</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="State Bank of India / HDFC"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={handleChange}
                      placeholder="Matching Bank Account"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="123456789012"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Confirm Account Number</label>
                    <input
                      type="text"
                      name="confirm_account_number"
                      value={formData.confirm_account_number}
                      onChange={handleChange}
                      placeholder="Re-enter Account Number"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    maxLength={11}
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    placeholder="SBIN0001234"
                    className="w-full sm:w-1/2 px-3 py-1.5 text-xs uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                  />
                </div>
              </div>

              {/* Policy Acceptance */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreed_packaging_policy"
                  checked={formData.agreed_packaging_policy}
                  onChange={handleChange}
                  className="mt-0.5 rounded text-[#580C1F] focus:ring-[#580C1F]"
                />
                <span className="text-xs text-stone-700">
                  I accept the <strong>Nari Pehnawa Merchant Agreement</strong> and agree to use standard official polybag packaging for all dispatched parcels.
                </span>
              </label>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit & Register Merchant</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Registration Success ── */}
          {step === 4 && (
            <div className="text-center py-6 px-4 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-stone-900">
                  Merchant Account Created Successfully!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Welcome to Nari Pehnawa Seller Community. Your store{" "}
                  <strong className="text-[#580C1F]">{formData.shop_name}</strong> is registered.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Registered Email:</span>
                  <span className="font-bold text-slate-800">{formData.email}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Registered Phone:</span>
                  <span className="font-bold text-slate-800">+91 {formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Initial KYC Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase text-[10px]">
                    Under Verification
                  </span>
                </div>
              </div>

              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-950 max-w-md mx-auto text-left flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#0891b2] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Next Step:</strong> Log in to your Seller Central Dashboard to upload your KYC documents (Aadhaar, Shop photo, Cheque), manage product catalogs, and view sales insights.
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="w-full max-w-md mx-auto py-3 bg-[#580C1F] hover:bg-[#430918] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Seller Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterModal;
