import React, { useState, useEffect } from "react";
import {
  Building2,
  Store,
  Mail,
  Phone,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Upload,
  Save,
  FileText,
  Image as ImageIcon,
  Truck,
  Box,
  Trash2,
  ExternalLink,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const SellerProfile = () => {
  const { seller, refreshSeller } = useSellerAuth();

  const [formData, setFormData] = useState({
    name: "",
    shop_name: "",
    phone: "",
    city: "",
    state: "Uttar Pradesh",
    address: "",
    pincode: "",
    gstin: "",
    pan: "",
    tax_profile: "unregistered",
    gst_enrolment_id: "",
    turnover_declaration: true,
    aadhaar_number: "",
    aadhaar_front_url: "",
    aadhaar_back_url: "",
    pan_number: "",
    pan_card_url: "",
    shop_image_url: "",
    brand_logo_url: "",
    seller_photo_url: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    account_holder_name: "",
  });

  const [uploadingField, setUploadingField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || "",
        shop_name: seller.shop_name || "",
        phone: seller.phone || "",
        city: seller.city || "",
        state: seller.state || "Uttar Pradesh",
        address: seller.address || "",
        pincode: seller.pincode || "",
        gstin: seller.gstin || "",
        pan: seller.pan || seller.pan_number || "",
        tax_profile: seller.tax_profile || (seller.gstin ? "regular_gst" : "unregistered"),
        gst_enrolment_id: seller.gst_enrolment_id || "",
        turnover_declaration: seller.turnover_declaration !== undefined ? Boolean(seller.turnover_declaration) : true,
        aadhaar_number: seller.aadhaar_number || "",
        aadhaar_front_url: seller.aadhaar_front_url || "",
        aadhaar_back_url: seller.aadhaar_back_url || "",
        pan_number: seller.pan_number || seller.pan || "",
        pan_card_url: seller.pan_card_url || "",
        shop_image_url: seller.shop_image_url || "",
        brand_logo_url: seller.brand_logo_url || "",
        seller_photo_url: seller.seller_photo_url || "",
        bank_name: seller.bank_name || "",
        account_number: seller.account_number || "",
        ifsc_code: seller.ifsc_code || "",
        account_holder_name: seller.account_holder_name || "",
      });
    }
  }, [seller]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadImageField = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(fieldName);
      setError("");
      const res = await sellerApi.uploadImage(file);
      if (res.url) {
        setFormData((prev) => ({ ...prev, [fieldName]: res.url }));
        // Instantly save to profile in background
        await sellerApi.updateProfile({ [fieldName]: res.url });
        await refreshSeller();
      }
    } catch (err) {
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveImageField = async (fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
    try {
      await sellerApi.updateProfile({ [fieldName]: "" });
      await refreshSeller();
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        state: formData.state,
        address: formData.address.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        gstin: formData.gstin.trim() || undefined,
        pan: formData.pan_number.trim() || formData.pan.trim() || undefined,
        pan_number: formData.pan_number.trim() || undefined,
        aadhaar_number: formData.aadhaar_number.trim() || undefined,
        aadhaar_front_url: formData.aadhaar_front_url || undefined,
        aadhaar_back_url: formData.aadhaar_back_url || undefined,
        pan_card_url: formData.pan_card_url || undefined,
        shop_image_url: formData.shop_image_url || undefined,
        brand_logo_url: formData.brand_logo_url || undefined,
        bank_name: formData.bank_name.trim() || undefined,
        account_number: formData.account_number.trim() || undefined,
        ifsc_code: formData.ifsc_code.trim() || undefined,
        account_holder_name: formData.account_holder_name.trim() || undefined,
      };

      await sellerApi.updateProfile(payload);
      await refreshSeller();
      setSuccess("Shop profile & KYC details saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = seller?.kyc_status || "pending";
  const welcomeKitStatus = seller?.welcome_kit_status || "not_dispatched";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891b2]">
              Seller Settings
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Compliance & KYC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Shop Profile & KYC Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your store information, Aadhaar & PAN verification, bank account, and welcome kit status.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KYC Status Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              kycStatus === "approved"
                ? "bg-emerald-50 text-emerald-600"
                : kycStatus === "rejected"
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {kycStatus === "approved" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : kycStatus === "rejected" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">KYC Verification Status:</h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  kycStatus === "approved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : kycStatus === "rejected"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {kycStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {kycStatus === "approved"
                ? "Your merchant account is fully verified. Payouts and packaging welcome kits are active."
                : kycStatus === "rejected"
                ? `Remarks: ${seller?.kyc_remarks || "Please re-upload clearer Aadhaar, PAN or Shop photo."}`
                : "Aadhaar, PAN & Shop photo are reviewed by Nari Pehnawa admin within 24-48 hours. Your products remain active."}
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Kit & Packaging Dispatch Info (Admin Managed) */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-[#0891b2] flex items-center justify-center flex-shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Nari Pehnawa Welcome Kit & Packaging Bags
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    welcomeKitStatus === "delivered"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : welcomeKitStatus === "dispatched"
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {welcomeKitStatus === "delivered"
                    ? "Delivered"
                    : welcomeKitStatus === "dispatched"
                    ? "Dispatched"
                    : "Processing after KYC"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin dispatches the official Welcome Kit containing security polybags and packaging guidelines.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Packaging Kit Inclusions
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              Official Tamper-Evident Polybags
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Packed & provided directly by Nari Pehnawa
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Courier Tracking AWB
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              {seller?.welcome_kit_awb || "Tracking details will be posted once dispatched"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Shiprocket / Delivery partner
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Admin Dispatch Notes
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              {seller?.welcome_kit_notes || "Delivered to shop address upon KYC approval"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Support SLA: 24-48 hours
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Shop & Personal Details */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#0891b2]" />
            <span>Store & Merchant Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop / Brand Display Name *
              </label>
              <input
                type="text"
                name="shop_name"
                required
                value={formData.shop_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={seller?.email || ""}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Pickup & Dispatch Address
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete shop address for courier order pickup"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                maxLength={6}
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6 digits pincode"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            {/* GST & Non-GST Tax Profile Classification */}
            <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Tax Compliance & Enrolment Profile *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "unregistered", title: "Non-GST Seller", desc: "Turnover < ₹20/40 Lakhs (PAN based)" },
                    { id: "regular_gst", title: "Registered GSTIN", desc: "Full interstate & intrastate sales" },
                    { id: "composition", title: "Composition Scheme", desc: "Compounded tax rate merchant" },
                  ].map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tax_profile: tp.id }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.tax_profile === tp.id
                          ? "bg-cyan-50/80 border-[#0891b2] text-[#0891b2] ring-1 ring-[#0891b2]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-bold block">{tp.title}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{tp.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.tax_profile === "regular_gst" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    15-Digit GSTIN Number *
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    maxLength={15}
                    required
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 09AAAAA0000A1Z5"
                    className="w-full max-w-sm px-3.5 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter valid 15-digit GST identification number matching your business PAN.
                  </p>
                </div>
              )}

              {formData.tax_profile === "unregistered" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GST Enrolment ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="gst_enrolment_id"
                      value={formData.gst_enrolment_id}
                      onChange={handleChange}
                      placeholder="e.g. UEN09XXXXXXXXX"
                      className="w-full max-w-sm px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.turnover_declaration}
                      onChange={(e) => setFormData((prev) => ({ ...prev, turnover_declaration: e.target.checked }))}
                      className="mt-0.5 rounded text-[#0891b2] focus:ring-[#0891b2]"
                    />
                    <span className="text-[11px] text-slate-700 leading-snug">
                      <strong>Statutory Non-GST Declaration:</strong> I declare that my aggregate business turnover in the current and preceding financial year does not exceed the threshold limit for registration under Section 22(1) of the CGST Act, 2017. I supply ethnic wear products intra-state in accordance with Notification No. 34/2023–Central Tax.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: KYC Mandatory Documents (Aadhaar, PAN & Shop Image) */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0891b2]" />
              <span>KYC Verification Documents (Aadhaar, PAN & Shop Photo)</span>
            </h3>
            <span className="text-xs text-slate-500">Required for official verification</span>
          </div>

          {/* Section A: Aadhaar Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>1. Aadhaar Card Details</span>
              </span>
              <span className="text-[11px] text-slate-500">Front & Back photo</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aadhaar Card Number
              </label>
              <input
                type="text"
                name="aadhaar_number"
                maxLength={14}
                value={formData.aadhaar_number}
                onChange={handleChange}
                placeholder="XXXX XXXX XXXX (12 digits)"
                className="w-full max-w-sm px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Aadhaar Front */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 mb-1">
                  Aadhaar Card Front Photo
                </span>
                {formData.aadhaar_front_url ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                    <img
                      src={formData.aadhaar_front_url}
                      alt="Aadhaar Front"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a
                        href={formData.aadhaar_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField("aadhaar_front_url")}
                        className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-video bg-white hover:bg-cyan-50/20">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload Aadhaar Front</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageField(e, "aadhaar_front_url")}
                      disabled={uploadingField === "aadhaar_front_url"}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingField === "aadhaar_front_url" && (
                  <p className="text-xs text-[#0891b2] mt-1">Uploading Aadhaar Front...</p>
                )}
              </div>

              {/* Aadhaar Back */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 mb-1">
                  Aadhaar Card Back Photo
                </span>
                {formData.aadhaar_back_url ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                    <img
                      src={formData.aadhaar_back_url}
                      alt="Aadhaar Back"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a
                        href={formData.aadhaar_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField("aadhaar_back_url")}
                        className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-video bg-white hover:bg-cyan-50/20">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload Aadhaar Back</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageField(e, "aadhaar_back_url")}
                      disabled={uploadingField === "aadhaar_back_url"}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingField === "aadhaar_back_url" && (
                  <p className="text-xs text-[#0891b2] mt-1">Uploading Aadhaar Back...</p>
                )}
              </div>
            </div>
          </div>

          {/* Section B: PAN Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>2. PAN Card Details</span>
              </span>
              <span className="text-[11px] text-slate-500">Document photo</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Card Number
              </label>
              <input
                type="text"
                name="pan_number"
                maxLength={10}
                value={formData.pan_number || formData.pan}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    pan_number: e.target.value.toUpperCase(),
                    pan: e.target.value.toUpperCase(),
                  }));
                }}
                placeholder="ABCDE1234F"
                className="w-full max-w-sm px-3.5 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div className="max-w-sm pt-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">
                PAN Card Document Photo
              </span>
              {formData.pan_card_url ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                  <img
                    src={formData.pan_card_url}
                    alt="PAN Card"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <a
                      href={formData.pan_card_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveImageField("pan_card_url")}
                      className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-video bg-white hover:bg-cyan-50/20">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Upload PAN Card</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImageField(e, "pan_card_url")}
                    disabled={uploadingField === "pan_card_url"}
                    className="hidden"
                  />
                </label>
              )}
              {uploadingField === "pan_card_url" && (
                <p className="text-xs text-[#0891b2] mt-1">Uploading PAN Card...</p>
              )}
            </div>
          </div>

          {/* Section C: Shop / Brand Photo */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>3. Shop Front / Workshop Photo or Brand Logo</span>
              </span>
              <span className="text-[11px] text-slate-500">Any one image</span>
            </div>
            <p className="text-xs text-slate-500">
              Upload a clear photo of your storefront, manufacturing unit, or your registered brand logo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Shop Front Photo */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 mb-1">
                  Shop / Storefront Photo
                </span>
                {formData.shop_image_url ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                    <img
                      src={formData.shop_image_url}
                      alt="Shop Front"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a
                        href={formData.shop_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField("shop_image_url")}
                        className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-video bg-white hover:bg-cyan-50/20">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload Shop Photo</span>
                    <span className="text-[10px] text-slate-400">Storefront or Workshop</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageField(e, "shop_image_url")}
                      disabled={uploadingField === "shop_image_url"}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingField === "shop_image_url" && (
                  <p className="text-xs text-[#0891b2] mt-1">Uploading Shop Photo...</p>
                )}
              </div>

              {/* Brand Logo (Optional) */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 mb-1">
                  Brand Logo / Brand Tag (Optional)
                </span>
                {formData.brand_logo_url ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                    <img
                      src={formData.brand_logo_url}
                      alt="Brand Logo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a
                        href={formData.brand_logo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField("brand_logo_url")}
                        className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-video bg-white hover:bg-cyan-50/20">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload Brand Logo</span>
                    <span className="text-[10px] text-slate-400">PNG / Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageField(e, "brand_logo_url")}
                      disabled={uploadingField === "brand_logo_url"}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingField === "brand_logo_url" && (
                  <p className="text-xs text-[#0891b2] mt-1">Uploading Brand Logo...</p>
                )}
              </div>
            </div>
          </div>

          {/* Section D: Merchant Owner Personal Photo / Selfie (खुद की फोटो) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>4. Merchant Owner Photo / Selfie (खुद की फोटो)</span>
              </span>
              <span className="text-[11px] text-slate-500">Identity verification</span>
            </div>
            <p className="text-xs text-slate-500">
              Upload a clear front-facing photo or selfie of yourself (business owner/authorized signatory).
            </p>

            <div className="max-w-xs pt-2">
              {formData.seller_photo_url ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square max-w-[200px] bg-white">
                  <img
                    src={formData.seller_photo_url}
                    alt="Merchant Owner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <a
                      href={formData.seller_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveImageField("seller_photo_url")}
                      className="p-1.5 bg-red-600 text-white rounded-lg text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-square max-w-[200px] bg-white hover:bg-cyan-50/20">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Upload Owner Photo</span>
                  <span className="text-[10px] text-slate-400">Clear selfie / photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImageField(e, "seller_photo_url")}
                    disabled={uploadingField === "seller_photo_url"}
                    className="hidden"
                  />
                </label>
              )}
              {uploadingField === "seller_photo_url" && (
                <p className="text-xs text-[#0891b2] mt-1">Uploading Owner Photo...</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Bank Payout Details */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0891b2]" />
            <span>Bank Account for Order Payouts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                name="account_holder_name"
                value={formData.account_holder_name}
                onChange={handleChange}
                placeholder="Name as printed in bank passbook"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
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
                placeholder="Enter bank account number"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                placeholder="HDFC0001234"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-sm font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile & KYC</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerProfile;
