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
    description: 'Premium Indian ethnic wear, designer Kurtis, and home decoration items.'
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
    { id: 'flash_sale', label: '⚡ Flash Sale & Events', icon: Flame, description: 'Live Flash sale, timer, discount % & product targeting' },
    { id: 'store', label: 'Store Info', icon: Store, description: 'Branding, contact info & store address' },
    { id: 'pricing', label: 'Pricing & Delivery', icon: IndianRupee, description: 'Currency, tax & automated free delivery rules' },
    { id: 'coupons', label: 'Coupons & Promo Codes', icon: Tag, description: 'Discount codes, usage tracking & cart thresholds' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/40 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">System Configuration</h1>
          <p className="text-sm text-gray-400 mt-1">Manage global website settings: Flash Sales, Store Branding, Free Delivery Rules, and Promo Coupons.</p>
        </div>

        <div className="flex items-center gap-3">
          {showSuccessMessage && (
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl font-bold">
              ✓ Saved Changes
            </span>
          )}
          {activeTab === "coupons" && (
            <button
              onClick={handleExportCSV}
              className="p-2.5 bg-[#111827] border border-gray-800 rounded-xl hover:bg-gray-800 transition text-xs font-semibold text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#d4af37]" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex overflow-x-auto divide-x divide-gray-850">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4.5 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#0f1724] text-[#d4af37] border-b-2 border-[#d4af37]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#0f1724]/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FLASH SALE & FESTIVE EVENT MANAGER */}
      {activeTab === 'flash_sale' && (
        <form onSubmit={handleSaveFlashSale} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1c1318] border-2 border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
            
            {/* Header & Purpose info */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B0000] to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Flash Sale &amp; Festive Event Manager
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      flashSaleConfig.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {flashSaleConfig.is_active ? '● LIVE / ACTIVE' : 'INACTIVE'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    <strong className="text-amber-300">Purpose:</strong> Set live timed flash sales, countdown timers, custom discounts, and select which products/categories to put on sale.
                  </p>
                </div>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-[#0b1220] px-4 py-2 rounded-xl border border-gray-800">
                <input
                  type="checkbox"
                  checked={flashSaleConfig.is_active}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, is_active: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-white">Enable Flash Sale</span>
              </label>
            </div>

            {/* Live Store Preview Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#580C1F] via-[#8B0000] to-[#580C1F] border border-amber-300/40 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-[#8B0000] px-2 py-0.5 rounded-full uppercase">
                  📢 Live Storefront Preview (Shown on /category/sale)
                </span>
                <h4 className="text-lg font-serif font-bold text-white">
                  {flashSaleConfig.title || "Festive Flash Sale"}
                </h4>
                <p className="text-xs text-amber-200">
                  {flashSaleConfig.subtitle || "Limited-Time Exclusive Deals"}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/20">
                <span className="text-xs font-bold text-amber-300">Discount:</span>
                <span className="text-xl font-black text-white font-mono">{flashSaleConfig.discount_percentage}% OFF</span>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Sale / Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festive Flash Sale, Midnight Clearance"
                  value={flashSaleConfig.title}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, title: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Promo Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Up to 50% Off on Handcrafted Kurtis"
                  value={flashSaleConfig.subtitle}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, subtitle: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Quick Duration Presets & Timing */}
            <div className="p-4 rounded-xl bg-[#0b1220] border border-gray-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Quick Timer Presets:
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
                      className="px-2.5 py-1 bg-[#111827] hover:bg-amber-500 hover:text-black border border-gray-700 text-gray-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold text-[11px]">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={flashSaleConfig.start_time ? flashSaleConfig.start_time.slice(0, 16) : ""}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, start_time: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold text-[11px]">End Date &amp; Time (Countdown Timer Target)</label>
                  <input
                    type="datetime-local"
                    value={flashSaleConfig.end_time ? flashSaleConfig.end_time.slice(0, 16) : ""}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, end_time: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Discount & Target Scope */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount % */}
              <div className="bg-[#0b1220] p-4 rounded-xl border border-gray-800 space-y-2">
                <label className="block text-gray-300 font-bold">Discount Percentage</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={flashSaleConfig.discount_percentage}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, discount_percentage: Number(e.target.value) })}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-base font-extrabold text-amber-300 font-mono w-14 text-right">
                    {flashSaleConfig.discount_percentage}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">Applied across all selected sale products.</p>
              </div>

              {/* Target Scope */}
              <div className="md:col-span-2 bg-[#0b1220] p-4 rounded-xl border border-gray-800 space-y-3">
                <label className="block text-gray-300 font-bold">Which Products To Put On Sale?</label>
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
                      className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                        flashSaleConfig.target_type === scope.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                          : "bg-[#111827] border-gray-850 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>

                {/* Category Dropdown if target_type === category */}
                {flashSaleConfig.target_type === "category" && (
                  <div className="pt-2">
                    <label className="block text-gray-400 mb-1 font-semibold">Choose Category:</label>
                    <select
                      value={flashSaleConfig.target_category}
                      onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, target_category: e.target.value })}
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
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
                    <label className="block text-gray-400 font-semibold">
                      Select Products ({flashSaleConfig.target_product_ids?.length || 0} selected):
                    </label>
                    <div className="max-h-48 overflow-y-auto bg-[#111827] border border-gray-700 rounded-xl p-2 space-y-1">
                      {availableProducts.map((p) => {
                        const pid = p._id || p.id;
                        const isChecked = flashSaleConfig.target_product_ids?.includes(pid);
                        return (
                          <label key={pid} className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded-lg cursor-pointer">
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
                              className="w-3.5 h-3.5 accent-amber-400 rounded"
                            />
                            <span className="text-white truncate flex-1">{p.name}</span>
                            <span className="text-amber-400 font-mono">₹{p.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={flashSaleLoading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {flashSaleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 fill-black" />}
                <span>Save &amp; Launch Flash Sale</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: STORE INFO */}
      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <Store className="w-4 h-4 text-[#d4af37]" /> Store General Information
              </h3>
              <p className="text-[11px] text-gray-400 mt-2">
                <strong className="text-amber-300">Purpose:</strong> Configure official store branding, customer support hotline, email, and registered address shown on invoices and footer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Tagline</label>
                <input
                  type="text"
                  value={storeSettings.tagline}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Support Email Address *</label>
                <input
                  type="email"
                  required
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Support Hotline</label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1 font-bold">Corporate Address</label>
                <input
                  type="text"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition">
              <Save className="w-4 h-4" /> Save Store Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PRICING & DELIVERY */}
      {activeTab === 'pricing' && (
        <form onSubmit={handlePricingSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <IndianRupee className="w-4 h-4 text-[#d4af37]" /> Currency &amp; Pricing Rules
              </h3>
              <p className="text-[11px] text-gray-400 mt-2">
                <strong className="text-amber-300">Purpose:</strong> Set store currency symbols, GST tax percentages, standard flat shipping charges, and the cart value threshold for free shipping.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Currency Code</label>
                <input
                  type="text"
                  value={pricingSettings.currency}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, currency: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Tax Rate %</label>
                <input
                  type="number"
                  value={pricingSettings.taxRate}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, taxRate: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Flat Shipping Fee (INR)</label>
                <input
                  type="number"
                  value={pricingSettings.shippingFee}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, shippingFee: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Free Shipping Threshold (INR)</label>
                <input
                  type="number"
                  value={pricingSettings.freeShippingThreshold}
                  onChange={(e) => setPricingSettings({ ...pricingSettings, freeShippingThreshold: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition">
              <Save className="w-4 h-4" /> Save Pricing Config
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <Truck className="w-4 h-4 text-[#d4af37]" /> Free Delivery Rules for Customers (1st, 2nd, 3rd Orders)
              </h3>
              <p className="text-[11px] text-gray-400 mt-2">
                <strong className="text-amber-300">Purpose:</strong> Automate marketing incentive by giving first-time customers free shipping on their first 1, 2, or 3 orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">
                  Free Delivery on Initial N Orders
                </label>
                <select
                  value={deliveryRules.free_delivery_order_count}
                  onChange={(e) => setDeliveryRules({ ...deliveryRules, free_delivery_order_count: parseInt(e.target.value) })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value={0}>0 (No Free Orders - Standard Delivery Fees Apply)</option>
                  <option value={1}>1st Order Free (Recommended)</option>
                  <option value={2}>First 2 Orders Free</option>
                  <option value={3}>First 3 Orders Free</option>
                  <option value={5}>First 5 Orders Free</option>
                </select>
                <p className="text-gray-500 text-[11px] mt-1">
                  New users will automatically get Free Delivery on their first {deliveryRules.free_delivery_order_count} order(s).
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">
                  Default Store Shipping Fee (INR)
                </label>
                <input
                  type="number"
                  value={deliveryRules.default_delivery_charge}
                  onChange={(e) => setDeliveryRules({ ...deliveryRules, default_delivery_charge: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  placeholder="50"
                />
                <p className="text-gray-500 text-[11px] mt-1">
                  Used when product has no custom delivery fee.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDeliveryRules}
              className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-cyan-500 transition"
            >
              <Save className="w-4 h-4" /> Save Delivery Rules
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 text-xs text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Promotional Coupon Codes</h3>
              <p className="text-[11px] text-gray-400 mt-1">
                <strong className="text-amber-300">Purpose:</strong> Create coupon codes that customers can enter at cart/checkout for flat or percentage discounts.
              </p>
            </div>
            <button onClick={() => setShowCouponModal(true)} className="px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#c49f2f] text-black font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
              <Plus className="w-4 h-4" /> Add Code
            </button>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                <tr>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Discount Value</th>
                  <th className="py-4 px-6">Min Order (INR)</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Usage Count</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-300">
                {coupons.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/20 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-white">{c.code}</td>
                    <td className="py-3.5 px-6 text-gray-400">{c.type}</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-400">{c.type === 'Percentage' ? `${c.discount}%` : `₹${c.discount}`}</td>
                    <td className="py-3.5 px-6 font-mono">₹{c.minCart}</td>
                    <td className="py-3.5 px-6 text-gray-400">{c.expiry}</td>
                    <td className="py-3.5 px-6 font-mono">{c.usage} times</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 bg-red-600/10 text-red-400 border border-red-600/20 rounded-xl hover:bg-red-600/20">
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Coupon Modal */}
          {showCouponModal && (
            <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
              <form onSubmit={handleAddCoupon} className="bg-[#0f1724] border border-gray-850 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h4 className="font-bold text-white">Create New Coupon Code</h4>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      placeholder="e.g. MONSOON20"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Discount Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed Amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Min Cart Value (INR)</label>
                    <input
                      type="number"
                      value={newCoupon.minCart}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minCart: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      placeholder="e.g. 999"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold rounded-xl">Save Coupon</button>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 py-2 bg-gray-800 text-white rounded-xl">Cancel</button>
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
