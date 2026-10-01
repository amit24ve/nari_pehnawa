import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  IndianRupee,
  Save,
  Truck,
  Flame,
  Tag,
  Megaphone,
  ArrowRight,
  Gift,
  CheckCircle,
  Loader2,
  ExternalLink
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Settings = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("store");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
    }`,
  });

  const showSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Base store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Nari Pehnawa",
    tagline: "Traditional Ka Tadka • Handcrafted Luxury Ethnic Wear",
    email: "support@naripehnawa.com",
    phone: "+91 98765 43210",
    address: "Sultanpur, Uttar Pradesh, India",
    website: "https://naripehnawa.com",
    description: "Handcrafted designer Kurtis, luxury ethnic wear, and festive collections.",
  });

  const [pricingSettings, setPricingSettings] = useState({
    currency: "INR",
    currencySymbol: "₹",
    taxRate: "5",
    shippingFee: "99",
    freeShippingThreshold: "1499",
    enableTax: true,
    enableShipping: true,
  });

  const [deliveryRules, setDeliveryRules] = useState({
    free_delivery_order_count: 0,
    default_delivery_charge: 99,
  });

  const fetchDeliverySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/delivery`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryRules({
          free_delivery_order_count: data.free_delivery_order_count ?? 0,
          default_delivery_charge: data.default_delivery_charge ?? 99,
        });
      }
    } catch (e) {
      console.error("Failed to load delivery settings", e);
    }
  };

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  const handleSaveDeliveryRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/delivery`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(deliveryRules),
      });
      if (res.ok) {
        showSuccess();
      } else {
        alert("Failed to save delivery rules");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving delivery rules");
    }
  };

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("store_settings", JSON.stringify(storeSettings));
    showSuccess();
  };

  const handlePricingSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("pricing_settings", JSON.stringify(pricingSettings));
    showSuccess();
  };

  const tabs = [
    { id: "store", label: "Store Info & Contact", icon: Store },
    { id: "pricing", label: "Pricing & Delivery Rules", icon: IndianRupee },
  ];

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            System Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage store branding, contact hotline, currency and default delivery rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showSuccessMessage && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold shadow-xs">
              ✓ Saved Changes
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs">
        <div className="flex overflow-x-auto gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#0891b2] text-white shadow-sm shadow-[#0891b2]/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#0891b2]"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STORE GENERAL INFORMATION */}
      {activeTab === "store" && (
        <form onSubmit={handleStoreSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Store className="w-5 h-5 text-[#0891b2]" /> Store Branding &amp; Contact Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Official store branding, customer support contact hotline, email, and registered address shown on invoices and footer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Tagline
                </label>
                <input
                  type="text"
                  value={storeSettings.tagline}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Support Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Support Hotline
                </label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Corporate Address
                </label>
                <input
                  type="text"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-black" /> Save Store Details
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: PRICING & DELIVERY */}
      {activeTab === "pricing" && (
        <form onSubmit={handlePricingSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <IndianRupee className="w-5 h-5 text-[#0891b2]" /> Currency &amp; Pricing Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure GST tax percentages and shipping thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={pricingSettings.currency}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Tax Rate %
                </label>
                <input
                  type="number"
                  value={pricingSettings.taxRate}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, taxRate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Flat Shipping Fee (INR)
                </label>
                <input
                  type="number"
                  value={pricingSettings.shippingFee}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, shippingFee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Free Shipping Threshold (INR)
                </label>
                <input
                  type="number"
                  value={pricingSettings.freeShippingThreshold}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, freeShippingThreshold: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-black" /> Save Pricing Rules
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-[#0891b2]" /> Standard Delivery Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure default shipping charges applied at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Default Store Shipping Fee (INR)
                </label>
                <input
                  type="number"
                  value={deliveryRules.default_delivery_charge}
                  onChange={(e) =>
                    setDeliveryRules({
                      ...deliveryRules,
                      default_delivery_charge: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs font-medium"
                  placeholder="99"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveDeliveryRules}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-black" /> Save Delivery Rules
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
