import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useSellerAuth } from "./SellerAuthContext";
import logoImg from "../assets/logo.png";

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

const SellerRegister = () => {
  const { register } = useSellerAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
      setError("Please enter your pickup street address.");
      return false;
    }
    const cleanPin = formData.pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setError("Please enter a valid 6-digit Indian PIN Code.");
      return false;
    }
    return true;
  };

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

      await register(payload);
      setStep(4);
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Nari Pehnawa" className="h-12 w-auto object-contain" />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Join Nari Pehnawa Seller Community
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Sell your ethnic wear, sarees, lehengas & suits to thousands of verified shoppers
        </p>

        {/* Stepper Tabs */}
        {step < 4 && (
          <div className="mt-6 grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                step >= 1 ? "bg-[#580C1F] text-white" : "text-slate-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? "bg-white text-[#580C1F]" : "bg-slate-200 text-slate-600"
              }`}>1</span>
              <span>Account</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                step >= 2 ? "bg-[#580C1F] text-white" : "text-slate-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? "bg-white text-[#580C1F]" : "bg-slate-200 text-slate-600"
              }`}>2</span>
              <span>Store & Pickup</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                step >= 3 ? "bg-[#580C1F] text-white" : "text-slate-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? "bg-white text-[#580C1F]" : "bg-slate-200 text-slate-600"
              }`}>3</span>
              <span>Bank & KYC</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Account & Credentials */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-900 uppercase tracking-wide">
                <User className="w-4 h-4 text-[#0891b2]" />
                <span>Step 1: Contact Person & Login Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="merchant@example.com"
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Password (min. 6 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <Link to="/seller/login" className="text-xs font-bold text-[#580C1F] hover:underline">
                  Already registered? Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="px-6 py-2.5 bg-[#580C1F] hover:bg-[#430918] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Store Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Store & Pickup */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-900 uppercase tracking-wide">
                <Store className="w-4 h-4 text-[#0891b2]" />
                <span>Step 2: Store Information & Pickup Location</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store / Brand Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="shop_name"
                      required
                      value={formData.shop_name}
                      onChange={handleChange}
                      placeholder="e.g. Royal Banaras Silks"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Type *
                  </label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    <option value="individual">Individual / Proprietorship</option>
                    <option value="partnership">Partnership Firm / LLP</option>
                    <option value="private_limited">Private Limited (Pvt Ltd)</option>
                    <option value="artisan">Handloom Weaver / Artisan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Product Category
                </label>
                <select
                  name="primary_category"
                  value={formData.primary_category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                >
                  {ETHNIC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup / Warehouse Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Shop / Unit Number, Market Name, Street"
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Varanasi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="221001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="px-6 py-2.5 bg-[#580C1F] hover:bg-[#430918] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Bank & KYC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Bank & KYC */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-900 uppercase tracking-wide">
                <CreditCard className="w-4 h-4 text-[#0891b2]" />
                <span>Step 3: Bank & KYC Details (For Daily Payouts)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN (GST Number)
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 09ABCDE1234F1Z5"
                    className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Optional for composite / unregistered sellers under 40L.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    name="pan"
                    maxLength={10}
                    value={formData.pan}
                    onChange={handleChange}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Mandatory for TDS & payout disbursement.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-[#0891b2]" />
                  <span>Settlement Bank Account</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="State Bank of India / HDFC"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={handleChange}
                      placeholder="Matching Bank Account"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="123456789012"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm Account Number</label>
                    <input
                      type="text"
                      name="confirm_account_number"
                      value={formData.confirm_account_number}
                      onChange={handleChange}
                      placeholder="Re-enter Account Number"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    maxLength={11}
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    placeholder="SBIN0001234"
                    className="w-full sm:w-1/2 px-3 py-2 text-xs uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0891b2] bg-white"
                  />
                </div>
              </div>

              {/* Packaging Policy Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreed_packaging_policy"
                  checked={formData.agreed_packaging_policy}
                  onChange={handleChange}
                  className="mt-0.5 rounded text-[#580C1F] focus:ring-[#580C1F]"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I accept the <strong>Nari Pehnawa Merchant Agreement</strong> and agree to use standard official polybag packaging for all dispatched customer orders.
                </span>
              </label>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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

          {/* STEP 4: Success & Login Guidance */}
          {step === 4 && (
            <div className="text-center py-6 px-4 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Merchant Account Created Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
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

              <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-950 max-w-md mx-auto text-left flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#0891b2] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Next Step:</strong> Log in to your Seller Central Dashboard to upload your KYC documents (Aadhaar, Shop photo, Cheque), manage product catalogs, and view sales insights.
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/seller/dashboard")}
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

export default SellerRegister;