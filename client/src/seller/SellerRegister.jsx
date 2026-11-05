import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  Building,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  PackageCheck,
  Check,
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

const SellerRegister = () => {
  const { register } = useSellerAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    shop_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    city: "",
    state: "Uttar Pradesh",
    address: "",
    pincode: "",
    gstin: "",
    pan: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    agreed_packaging_policy: true,
  });

  const [showBankSection, setShowBankSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.agreed_packaging_policy) {
      setError("You must agree to the Nari Pehnawa Packaging Policy (mandatory official polybags).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        city: formData.city.trim(),
        state: formData.state,
        address: formData.address.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        gstin: formData.gstin.trim() || undefined,
        pan: formData.pan.trim() || undefined,
        bank_name: formData.bank_name.trim() || undefined,
        account_number: formData.account_number.trim() || undefined,
        ifsc_code: formData.ifsc_code.trim() || undefined,
        account_holder_name: formData.account_holder_name.trim() || undefined,
      };

      await register(payload);
      navigate("/seller/dashboard", { replace: true });
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
          Join Nari Pehnawa Seller Program
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Sell your ethnic wear, sarees, lehengas & suits to thousands of verified shoppers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Store Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#0891b2]" />
                Store & Merchant Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop / Brand Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="shop_name"
                      required
                      value={formData.shop_name}
                      onChange={handleChange}
                      placeholder="e.g. Banarasi Silks & Suits"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seller@example.com"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      minLength={6}
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Location */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0891b2]" />
                Pickup & Warehouse Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Varanasi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 221001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop / Warehouse Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Plot / Shop No., Market / Building Name, Area"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Optional KYC & Banking toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowBankSection(!showBankSection)}
                className="text-xs font-bold text-[#0891b2] hover:underline flex items-center gap-1.5"
              >
                <span>{showBankSection ? "− Hide" : "+ Add"} GST, PAN & Bank Payout Details (Optional now, can be added later)</span>
              </button>

              {showBankSection && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PAN Number (Optional)
                      </label>
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        name="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={handleChange}
                        placeholder="As in bank records"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleChange}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleChange}
                        placeholder="Bank account number"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={formData.ifsc_code}
                        onChange={handleChange}
                        placeholder="SBIN0001234"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Mandatory Packaging Policy Agreement */}
            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreed_packaging_policy"
                  name="agreed_packaging_policy"
                  checked={formData.agreed_packaging_policy}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-cyan-400 text-[#0891b2] focus:ring-[#0891b2]"
                />
                <label
                  htmlFor="agreed_packaging_policy"
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer"
                >
                  <strong className="text-slate-900 block font-bold mb-0.5">
                    Nari Pehnawa Packaging Policy Agreement (Mandatory)
                  </strong>
                  I agree that all customer dispatches will be packed exclusively inside official
                  <strong> Nari Pehnawa tamper-evident security polybags</strong>. While garments can
                  carry my verified seller brand label, outer packaging belongs to Nari Pehnawa. Official
                  polybags can be requested directly from the Seller Dashboard with 24-48hr support.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0891b2] shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Complete Registration & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already registered as a Seller?{" "}
              <Link to="/seller/login" className="font-bold text-[#0891b2] hover:underline">
                Sign in to your Seller Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister;

