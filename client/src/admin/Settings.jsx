import React, { useState, useEffect } from 'react';
import {
  Store, IndianRupee, Save, Truck, Plus, Trash2,
  Tag, Flame, Clock, Loader2, X, Download, Info
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';

const Settings = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('flash_sale');

  /* ── Flash Sale & Event Manager state ── */
  const [flashSaleConfig, setFlashSaleConfig] = useState({
    is_active: true,
    title: 'Grand Festive Flash Sale',
    subtitle: 'Exclusive Handcrafted Luxury Ethnic Wear',
    discount_percentage: 30,
    target_type: 'all', // 'all' | 'category' | 'custom_products'
    target_category: '',
    target_product_ids: [],
    start_time: '',
    end_time: ''
  });
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('neel_token') || localStorage.getItem('token') || ''}`,
  });

  // Base store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Nari Pehnawa',
    tagline: 'Comfort Meets Everyday Elegance',
    email: 'support@naripehnawa.com',
    phone: '+91 98765 43210',
    address: '45, Fashion Avenue, Sector 5, HSR Layout, Bangalore, KA, 560102',
    website: 'https://naripehnawa.com',
    description: 'Premium Indian ethnic wear, designer Kurtis, and women fashion collections.'
  });

  const [pricingSettings, setPricingSettings] = useState({
    currency: 'INR',
    currencySymbol: '₹',
    taxRate: '12',
    shippingFee: '99',
    freeShippingThreshold: '1499',
    enableTax: true,
    enableShipping: true
  });

  const [deliveryRules, setDeliveryRules] = useState({
    free_delivery_order_count: 1,
    default_delivery_charge: 50
  });

  const fetchDeliverySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/delivery`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryRules({
          free_delivery_order_count: data.free_delivery_order_count ?? 1,
          default_delivery_charge: data.default_delivery_charge ?? 50
        });
      }
    } catch (e) {
      console.error("Failed to load delivery settings", e);
    }
  };

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  const handleSaveDeliveryRules = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/settings/delivery`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(deliveryRules)
      });
      if (res.ok) {
        showSuccess();
      } else {
        alert("Failed to save delivery settings");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Coupons state
  const [coupons, setCoupons] = useState([
    { id: "c-1", code: "NARI10", type: "Percentage", discount: 10, minCart: 999, expiry: "2026-12-31", usage: 142, status: "Active" },
    { id: "c-2", code: "WELCOME200", type: "Fixed Amount", discount: 200, minCart: 1499, expiry: "2026-09-30", usage: 85, status: "Active" },
    { id: "c-3", code: "FESTIVE30", type: "Percentage", discount: 30, minCart: 2999, expiry: "2026-11-15", usage: 0, status: "Inactive" }
  ]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "Percentage", discount: "", minCart: "", expiry: "", status: "Active" });

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const handlePricingSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const showSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Coupons triggers
  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    const couponObj = {
      id: `c-${Date.now()}`,
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      discount: parseFloat(newCoupon.discount),
      minCart: parseFloat(newCoupon.minCart || 0),
      expiry: newCoupon.expiry || "2026-12-31",
      usage: 0,
      status: newCoupon.status
    };
    setCoupons(prev => [...prev, couponObj]);
    setNewCoupon({ code: "", type: "Percentage", discount: "", minCart: "", expiry: "", status: "Active" });
    setShowCouponModal(false);
    showSuccess();
  };

  const handleDeleteCoupon = (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Coupon Code,Type,Discount,Min Cart value,Usage count,Status,Expiry\n";
    coupons.forEach(c => {
      csvContent += `"${c.code}","${c.type}",${c.discount},${c.minCart},${c.usage},"${c.status}","${c.expiry}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `settings_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Flash Sale & Event Manager Handlers ── */
  const fetchFlashSaleConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sale`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFlashSaleConfig(data);
      }
    } catch (e) {
      console.warn("Could not load flash sale config:", e);
    }
  };

  const fetchCategoriesAndProducts = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/categories/?is_active=true`),
        fetch(`${API_BASE}/products/?limit=100`)
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData)) setAvailableCategories(cData);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData)) setAvailableProducts(pData);
      }
    } catch (e) {
      console.warn("Could not load categories/products:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'flash_sale') {
      fetchFlashSaleConfig();
      fetchCategoriesAndProducts();
    }
  }, [activeTab]);

  const applyDurationPreset = (hours) => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setFlashSaleConfig(prev => ({
      ...prev,
      start_time: now.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16)
    }));
  };

  const handleSaveFlashSale = async (e) => {
    e.preventDefault();
    setFlashSaleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sale`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(flashSaleConfig)
      });
      if (!res.ok) throw new Error('Failed to save flash sale');
      const data = await res.json();
      showSuccess();
      alert(`Flash Sale configuration saved successfully! ${data.affected_products || 0} products updated.`);
      await fetchFlashSaleConfig();
    } catch (e) {
      alert(e.message || 'Error saving flash sale');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const tabs = [
    { id: 'flash_sale', label: '⚡ Flash Sale & Events', icon: Flame },
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'pricing', label: 'Pricing & Delivery', icon: IndianRupee },
    { id: 'coupons', label: 'Coupons & Promo Codes', icon: Tag },
  ];

  return (
    <div className="space-y-6 text-slate-800 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage global website settings: Flash Sales, Store Branding, Free Delivery Rules, and Promo Coupons.</p>
        </div>

        <div className="flex items-center gap-3">
          {showSuccessMessage && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold shadow-xs">
              ✓ Saved Changes
            </span>
          )}
          {activeTab === "coupons" && (
            <button
              onClick={handleExportCSV}
              className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#0891b2]" /> Export CSV
            </button>
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
                    ? 'bg-[#0891b2] text-white shadow-sm shadow-[#0891b2]/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#0891b2]'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FLASH SALE & FESTIVE EVENT MANAGER */}
      {activeTab === 'flash_sale' && (
        <form onSubmit={handleSaveFlashSale} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* Header & Purpose info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0891b2] flex items-center justify-center text-white shadow-md shadow-[#0891b2]/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                    Flash Sale &amp; Festive Event Manager
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      flashSaleConfig.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {flashSaleConfig.is_active ? '● LIVE / ACTIVE' : 'INACTIVE'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong className="text-[#0891b2]">Purpose:</strong> Set live timed flash sales, countdown timers, custom discounts, and select which products/categories to put on sale.
                  </p>
                </div>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-300 hover:border-[#0891b2] transition">
                <input
                  type="checkbox"
                  checked={flashSaleConfig.is_active}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#0891b2] rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Enable Flash Sale</span>
              </label>
            </div>

            {/* Live Store Preview Card — High Contrast Clean Banner */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#0891b2] via-[#0e7490] to-[#0891b2] text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center md:text-left">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  📢 Live Storefront Banner (On /category/sale)
                </span>
                <h4 className="text-xl font-bold text-white tracking-wide">
                  {flashSaleConfig.title || "Grand Festive Flash Sale"}
                </h4>
                <p className="text-xs text-cyan-100 font-medium">
                  {flashSaleConfig.subtitle || "Exclusive Handcrafted Luxury Ethnic Wear"}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white text-[#0891b2] px-5 py-3 rounded-xl shadow-md border border-white/40">
                <span className="text-xs font-bold text-slate-700">Discount:</span>
                <span className="text-2xl font-black text-[#0891b2] font-mono">{flashSaleConfig.discount_percentage}% OFF</span>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Sale / Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festive Flash Sale, Midnight Clearance"
                  value={flashSaleConfig.title}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] text-sm font-semibold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Promo Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Up to 50% Off on Handcrafted Kurtis"
                  value={flashSaleConfig.subtitle}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, subtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] text-sm transition"
                />
              </div>
            </div>

            {/* Quick Duration Presets & Timing */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0891b2]" /> Quick Timer Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "1 Hour", hours: 1 },
                    { label: "2 Hours", hours: 2 },
                    { label: "3 Hours", hours: 3 },
                    { label: "6 Hours", hours: 6 },
                    { label: "Today (24h)", hours: 24 },
                    { label: "Weekend (48h)", hours: 48 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyDurationPreset(preset.hours)}
                      className="px-3 py-1.5 bg-white hover:bg-[#0891b2] hover:text-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={flashSaleConfig.start_time ? flashSaleConfig.start_time.slice(0, 16) : ""}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, start_time: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#0891b2] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date &amp; Time (Countdown Timer Target)</label>
                  <input
                    type="datetime-local"
                    value={flashSaleConfig.end_time ? flashSaleConfig.end_time.slice(0, 16) : ""}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, end_time: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#0891b2] text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Discount & Target Scope */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Discount % */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Discount Percentage
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={flashSaleConfig.discount_percentage}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, discount_percentage: Number(e.target.value) })}
                    className="flex-1 accent-[#0891b2] cursor-pointer"
                  />
                  <span className="text-base font-black text-[#0891b2] font-mono w-14 text-right">
                    {flashSaleConfig.discount_percentage}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Applied across all selected sale products.</p>
              </div>

              {/* Target Scope */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Which Products To Put On Sale?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "🌟 All Store Products" },
                    { id: "category", label: "👗 Specific Category" },
                    { id: "custom_products", label: "🏷️ Selected Products" }
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setFlashSaleConfig({ ...flashSaleConfig, target_type: scope.id })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        flashSaleConfig.target_type === scope.id
                          ? "bg-[#0891b2] border-[#0891b2] text-white shadow-sm"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>

                {/* Category Dropdown if target_type === category */}
                {flashSaleConfig.target_type === "category" && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Category:</label>
                    <select
                      value={flashSaleConfig.target_category}
                      onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, target_category: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#0891b2] text-xs font-medium"
                    >
                      <option value="">-- Select a Category --</option>
                      {availableCategories.map((cat) => (
                        <option key={cat._id || cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Products Multi-Select if target_type === custom_products */}
                {flashSaleConfig.target_type === "custom_products" && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Products ({flashSaleConfig.target_product_ids?.length || 0} selected):
                    </label>
                    <div className="max-h-48 overflow-y-auto bg-white border border-slate-300 rounded-xl p-2 space-y-1">
                      {availableProducts.map((p) => {
                        const pid = p._id || p.id;
                        const isChecked = flashSaleConfig.target_product_ids?.includes(pid);
                        return (
                          <label key={pid} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-100 last:border-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentIds = flashSaleConfig.target_product_ids || [];
                                const updated = e.target.checked
                                  ? [...currentIds, pid]
                                  : currentIds.filter(id => id !== pid);
                                setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: updated });
                              }}
                              className="w-4 h-4 accent-[#0891b2] rounded cursor-pointer"
                            />
                            <span className="text-slate-800 text-xs font-medium truncate flex-1">{p.name}</span>
                            <span className="text-[#0891b2] font-mono font-bold text-xs">₹{p.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="submit"
                disabled={flashSaleLoading}
                className="px-6 py-2.5 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#0891b2]/20 transition cursor-pointer disabled:opacity-50 text-xs"
              >
                {flashSaleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 text-white" />}
                <span>Save &amp; Launch Flash Sale</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: STORE INFO */}
      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Store className="w-5 h-5 text-[#0891b2]" /> Store General Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-[#0891b2]">Purpose:</strong> Configure official store branding, customer support hotline, email, and registered address shown on invoices and footer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Tagline</label>
                <input
                  type="text"
                  value={storeSettings.tagline}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Support Email Address *</label>
                <input
                  type="email"
                  required
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Support Hotline</label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Corporate Address</label>
                <input
                  type="text"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button type="submit" className="px-6 py-2.5 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#0891b2]/20 transition cursor-pointer text-xs">
                <Save className="w-4 h-4 text-white" /> Save Store Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PRICING & DELIVERY */}
      {activeTab === 'pricing' && (
        <form onSubmit={handlePricingSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <IndianRupee className="w-5 h-5 text-[#0891b2]" /> Currency &amp; Pricing Rules
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-[#0891b2]">Purpose:</strong> Set store currency symbols, GST tax percentages, standard flat shipping charges, and the cart value threshold for free shipping.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Currency Code</label>
                <input
                  type="text"
                  value={pricingSettings.currency}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Tax Rate %</label>
                <input
                  type="number"
                  value={pricingSettings.taxRate}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, taxRate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Flat Shipping Fee (INR)</label>
                <input
                  type="number"
                  value={pricingSettings.shippingFee}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, shippingFee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Free Shipping Threshold (INR)</label>
                <input
                  type="number"
                  value={pricingSettings.freeShippingThreshold}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, freeShippingThreshold: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button type="submit" className="px-6 py-2.5 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#0891b2]/20 transition cursor-pointer text-xs">
                <Save className="w-4 h-4 text-white" /> Save Pricing Config
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-[#0891b2]" /> Free Delivery Rules for Customers (1st, 2nd, 3rd Orders)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-[#0891b2]">Purpose:</strong> Automate marketing incentive by giving first-time customers free shipping on their first 1, 2, or 3 orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Free Delivery on Initial N Orders
                </label>
                <select
                  value={deliveryRules.free_delivery_order_count}
                  onChange={(e) => setDeliveryRules({ ...deliveryRules, free_delivery_order_count: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm font-medium"
                >
                  <option value={0}>0 (No Free Orders - Standard Delivery Fees Apply)</option>
                  <option value={1}>1st Order Free (Recommended)</option>
                  <option value={2}>First 2 Orders Free</option>
                  <option value={3}>First 3 Orders Free</option>
                  <option value={5}>First 5 Orders Free</option>
                </select>
                <p className="text-slate-500 text-xs mt-1">
                  New users will automatically get Free Delivery on their first {deliveryRules.free_delivery_order_count} order(s).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Default Store Shipping Fee (INR)
                </label>
                <input
                  type="number"
                  value={deliveryRules.default_delivery_charge}
                  onChange={(e) => setDeliveryRules({ ...deliveryRules, default_delivery_charge: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-sm font-medium"
                  placeholder="50"
                />
                <p className="text-slate-500 text-xs mt-1">
                  Used when product has no custom delivery fee.
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveDeliveryRules}
                className="px-6 py-2.5 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#0891b2]/20 transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-white" /> Save Delivery Rules
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Promotional Coupon Codes</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-[#0891b2]">Purpose:</strong> Create coupon codes that customers can enter at cart/checkout for flat or percentage discounts.
              </p>
            </div>
            <button onClick={() => setShowCouponModal(true)} className="px-4 py-2 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-[#0891b2]/20 transition cursor-pointer text-xs">
              <Plus className="w-4 h-4 text-white" /> Add Code
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Discount Value</th>
                  <th className="py-3.5 px-5">Min Order (INR)</th>
                  <th className="py-3.5 px-5">Expiry Date</th>
                  <th className="py-3.5 px-5">Usage Count</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                {coupons.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-5 font-mono font-bold text-[#0891b2]">{c.code}</td>
                    <td className="py-3 px-5 text-slate-600">{c.type}</td>
                    <td className="py-3 px-5 font-bold text-emerald-600">{c.type === 'Percentage' ? `${c.discount}%` : `₹${c.discount}`}</td>
                    <td className="py-3 px-5 font-mono">₹{c.minCart}</td>
                    <td className="py-3 px-5 text-slate-500">{c.expiry}</td>
                    <td className="py-3 px-5 font-mono">{c.usage} times</td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Coupon Modal */}
          {showCouponModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[99] flex items-center justify-center p-4">
              <form onSubmit={handleAddCoupon} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-base text-slate-900">Create New Coupon Code</h4>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                      placeholder="e.g. MONSOON20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed Amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Min Cart Value (INR)</label>
                    <input
                      type="number"
                      value={newCoupon.minCart}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minCart: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                      placeholder="e.g. 999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="submit" className="flex-1 py-2.5 bg-[#0891b2] hover:bg-cyan-700 text-white font-bold rounded-xl transition cursor-pointer text-xs">Save Coupon</button>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Settings;
