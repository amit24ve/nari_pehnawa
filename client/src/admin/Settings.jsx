import React, { useState, useEffect, useRef } from 'react';
import {
  Store, IndianRupee, Save, Truck, Plus, Trash2,
  Tag, Flame, Clock, Loader2, X, Download, Info,
  Calendar, CheckCircle, RefreshCw, Zap, Eye, Play, Pause,
  Image, Upload, Link2, Sparkles, Check
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

const API_BASE = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';

const Settings = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('flash_sale');

  /* ── Flash Sale & Event Manager state ── */
  const [flashSaleConfig, setFlashSaleConfig] = useState({
    is_active: true,
    title: 'Grand Festive Flash Sale',
    subtitle: 'Exclusive Handcrafted Luxury Ethnic Wear',
    deal_type: 'percentage', // 'percentage' | 'bogo' | 'buy2get1' | 'buy3get1'
    deal_text: '',
    buy_qty: 1,
    get_free_qty: 1,
    discount_percentage: 30,
    target_type: 'all', // 'all' | 'category' | 'custom_products'
    target_category: '',
    target_product_ids: [],
    start_time: '',
    end_time: '',
    banner_image: ''
  });
  const [saleImgTab, setSaleImgTab] = useState('upload'); // 'upload' | 'url'
  const [saleUploading, setSaleUploading] = useState(false);
  const saleFileInputRef = useRef(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [currentIstTime, setCurrentIstTime] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState(null); // null = active_sale, "new" = create new, or id
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [categoryProductSearch, setCategoryProductSearch] = useState('');
  const [customProductSearch, setCustomProductSearch] = useState('');
  const [customCategoryFilter, setCustomCategoryFilter] = useState('all');
  const [categorySpecificSelection, setCategorySpecificSelection] = useState(false);

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
    free_delivery_order_count: 3,
    default_delivery_charge: 99
  });

  const fetchDeliverySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/delivery`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryRules({
          free_delivery_order_count: data.free_delivery_order_count ?? 3,
          default_delivery_charge: data.default_delivery_charge ?? 99
        });
      }
    } catch (e) {
      console.error("Failed to load delivery settings", e);
    }
  };

  /* ── Welcome / Login Popup Modal state ── */
  const [welcomePopupConfig, setWelcomePopupConfig] = useState({
    is_enabled: true,
    image: '',
    discount_title: '10%',
    discount_subtitle: 'OFF',
    order_text: 'YOUR FIRST ORDER',
    sub_text: 'Authentic Kurtis, Suits & Ethnic Wear',
  });
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [welcomeImgTab, setWelcomeImgTab] = useState('upload'); // 'upload' | 'url'
  const [welcomeUploading, setWelcomeUploading] = useState(false);
  const welcomeFileInputRef = useRef(null);

  const fetchWelcomePopupConfig = async () => {
    try {
      setWelcomeLoading(true);
      const res = await fetch(`${API_BASE}/admin/welcome-popup`);
      if (res.ok) {
        const data = await res.json();
        setWelcomePopupConfig((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (e) {
      console.error("Failed to load welcome popup settings", e);
    } finally {
      setWelcomeLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverySettings();
    fetchWelcomePopupConfig();
  }, []);

  const handleSaveWelcomePopup = async (e) => {
    if (e) e.preventDefault();
    try {
      setWelcomeSaving(true);
      const res = await fetch(`${API_BASE}/admin/welcome-popup`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(welcomePopupConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setWelcomePopupConfig((prev) => ({ ...prev, ...updated }));
        showSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to save Welcome Popup settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving Welcome Popup settings");
    } finally {
      setWelcomeSaving(false);
    }
  };

  const handleWelcomeImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setWelcomeUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('neel_token') || localStorage.getItem('token') || ''}`,
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.image_url;
        if (url) {
          setWelcomePopupConfig((prev) => ({ ...prev, image: url }));
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    } finally {
      setWelcomeUploading(false);
    }
  };

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
        if (data.target_type === 'category' && Array.isArray(data.target_product_ids) && data.target_product_ids.length > 0) {
          setCategorySpecificSelection(true);
        } else {
          setCategorySpecificSelection(false);
        }
      }
    } catch (e) {
      console.warn("Could not load flash sale config:", e);
    }
  };

  const fetchAllCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sales`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllCampaigns(data.sales || []);
        if (data.current_ist_time) setCurrentIstTime(data.current_ist_time);
      }
    } catch (e) {
      console.warn("Could not load campaigns:", e);
    }
  };

  const fetchCategoriesAndProducts = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/categories/?is_active=true`),
        fetch(`${API_BASE}/products/?limit=500`)
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
      fetchAllCampaigns();
      fetchCategoriesAndProducts();
    }
  }, [activeTab]);

  // Auto-sync deal text and quantities (Buy X Get Y Free)
  const handleDealTextChange = (text) => {
    const next = { ...flashSaleConfig, deal_text: text };
    const bogoMatch = text.match(/buy\s*(\d+)\s*(?:get)?\s*(\d+)/i);
    if (bogoMatch) {
      const buy = parseInt(bogoMatch[1], 10);
      const free = parseInt(bogoMatch[2], 10);
      if (!isNaN(buy) && buy > 0) next.buy_qty = buy;
      if (!isNaN(free) && free > 0) next.get_free_qty = free;
      next.deal_type = "bogo";
    } else {
      const pctMatch = text.match(/(\d+)\s*%/);
      if (pctMatch) {
        const pct = parseInt(pctMatch[1], 10);
        if (!isNaN(pct) && pct > 0) next.discount_percentage = pct;
        next.deal_type = "percentage";
      }
    }
    setFlashSaleConfig(next);
  };

  const handleBuyQtyChange = (val) => {
    const buy = Math.max(1, Number(val) || 1);
    const free = flashSaleConfig.get_free_qty || 1;
    const next = { ...flashSaleConfig, buy_qty: buy };
    if (/buy\s*\d+\s*(?:get)?\s*\d+/i.test(flashSaleConfig.deal_text || '')) {
      next.deal_text = `Buy ${buy} Get ${free} Free`;
    }
    setFlashSaleConfig(next);
  };

  const handleFreeQtyChange = (val) => {
    const free = Math.max(1, Number(val) || 1);
    const buy = flashSaleConfig.buy_qty || 1;
    const next = { ...flashSaleConfig, get_free_qty: free };
    if (/buy\s*\d+\s*(?:get)?\s*\d+/i.test(flashSaleConfig.deal_text || '')) {
      next.deal_text = `Buy ${buy} Get ${free} Free`;
    }
    setFlashSaleConfig(next);
  };

  const applyDurationPreset = (hours) => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFlashSaleConfig(prev => ({
      ...prev,
      start_time: toLocal(now),
      end_time: toLocal(end)
    }));
  };

  const handleSaleImageUpload = async (file) => {
    if (!file) return;
    setSaleUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem('neel_token') || localStorage.getItem('token') || ''}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setFlashSaleConfig(prev => ({ ...prev, banner_image: fullUrl }));
    } catch (e) {
      alert(`Banner image upload failed: ${e.message}`);
    } finally {
      setSaleUploading(false);
    }
  };

  const handleCreateNewCampaign = () => {
    setEditingCampaignId("new");
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFlashSaleConfig({
      title: "Festive Flash Sale",
      subtitle: "Limited Time Exclusive Ethnic Deals",
      deal_type: "bogo",
      deal_text: "Buy 1 Get 1 Free",
      buy_qty: 1,
      get_free_qty: 1,
      discount_percentage: 30,
      target_type: "all",
      target_category: "",
      target_product_ids: [],
      start_time: toLocal(now),
      end_time: toLocal(end),
      banner_image: "",
      is_active: true
    });
    setCategorySpecificSelection(false);
    setShowCampaignModal(true);
  };

  const handleSelectCampaign = (c) => {
    const cId = c.id || c._id;
    setEditingCampaignId(cId);
    setFlashSaleConfig({
      id: cId,
      _id: cId,
      key: c.key,
      title: c.title || "",
      subtitle: c.subtitle || "",
      deal_type: c.deal_type || "bogo",
      deal_text: c.deal_text || "",
      buy_qty: c.buy_qty || 1,
      get_free_qty: c.get_free_qty || 1,
      discount_percentage: c.discount_percentage || 30,
      target_type: c.target_type || "all",
      target_category: c.target_category || "",
      target_product_ids: c.target_product_ids || [],
      start_time: c.start_time ? c.start_time.slice(0, 16) : "",
      end_time: c.end_time ? c.end_time.slice(0, 16) : "",
      banner_image: c.banner_image || c.image || "",
      is_active: c.is_active !== false
    });
    if (c.target_type === 'category' && Array.isArray(c.target_product_ids) && c.target_product_ids.length > 0) {
      setCategorySpecificSelection(true);
    } else {
      setCategorySpecificSelection(false);
    }
    setShowCampaignModal(true);
  };

  const handleDeleteCampaign = async (cId) => {
    if (!window.confirm("Are you sure you want to delete this promotional campaign?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sales/${cId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      alert("Campaign deleted successfully!");
      await Promise.all([fetchAllCampaigns(), fetchFlashSaleConfig()]);
      setEditingCampaignId(null);
      setShowCampaignModal(false);
    } catch (e) {
      alert(e.message || "Error deleting campaign");
    }
  };

  const handleToggleCampaignActive = async (camp) => {
    try {
      const cId = camp.id || camp._id;
      const nextActive = !camp.is_active;
      const res = await fetch(`${API_BASE}/admin/flash-sales/${cId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...camp, is_active: nextActive })
      });
      if (!res.ok) throw new Error("Failed to update campaign status");
      await Promise.all([fetchAllCampaigns(), fetchFlashSaleConfig()]);
    } catch (e) {
      alert(e.message || "Error updating campaign status");
    }
  };

  const handleSaveFlashSale = async (e) => {
    e.preventDefault();
    setFlashSaleLoading(true);
    try {
      let endpoint = `${API_BASE}/admin/flash-sale`;
      let method = 'PUT';
      if (editingCampaignId === "new") {
        endpoint = `${API_BASE}/admin/flash-sales`;
        method = 'POST';
      } else if (editingCampaignId) {
        endpoint = `${API_BASE}/admin/flash-sales/${editingCampaignId}`;
        method = 'PUT';
      }

      const res = await fetch(endpoint, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(flashSaleConfig)
      });
      if (!res.ok) throw new Error('Failed to save promotional campaign');
      const data = await res.json();
      showSuccess();
      alert(`Promotional Campaign saved successfully! ${data.affected_products || 0} products synchronized.`);
      await Promise.all([fetchAllCampaigns(), fetchFlashSaleConfig()]);
      if (data.sale && (data.sale.id || data.sale._id)) {
        setEditingCampaignId(data.sale.id || data.sale._id);
      }
      setShowCampaignModal(false);
    } catch (e) {
      alert(e.message || 'Error saving flash sale');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const tabs = [
    { id: 'flash_sale', label: '⚡ Flash Sale & Events', icon: Flame },
    { id: 'welcome_popup', label: '✨ Welcome / Login Popup', icon: Sparkles },
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
        <div className="space-y-6">
          {/* Active & Scheduled Promotional Campaigns Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#0891b2]" />
                  Active &amp; Scheduled Promotional Campaigns
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule multiple concurrent offers (e.g. 2-Hour Flash Deal, 24-Hour Festive Sale) in <strong>Indian Standard Time (IST)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewCampaign}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-black" /> Create New Offer
                </button>
              </div>
            </div>

            {/* Campaigns Grid */}
            {allCampaigns && allCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {allCampaigns.map((camp) => {
                  const cId = camp.id || camp._id;
                  const isSelected = editingCampaignId === cId;
                  const isLive = camp.is_currently_live;
                  const status = camp.status || (isLive ? "live" : "inactive");
                  return (
                    <div
                      key={cId}
                      className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-50/40 ring-2 ring-cyan-400/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            status === 'live'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'upcoming'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'expired'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              status === 'live' ? 'bg-emerald-600 animate-ping' : status === 'upcoming' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {status === 'live' ? '● Live Now (IST)' : status === 'upcoming' ? 'Upcoming' : status === 'expired' ? 'Expired' : 'Paused'}
                          </span>

                          <span className="text-[11px] font-bold text-cyan-800 font-mono bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            {camp.deal_text || `${camp.discount_percentage}% OFF`}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{camp.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{camp.subtitle || "Exclusive Handcrafted Luxury Ethnic Wear"}</p>
                        
                        {camp.banner_image && (
                          <div className="h-14 rounded-lg overflow-hidden border border-slate-200 relative my-1.5 shadow-2xs">
                            <img src={camp.banner_image} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                              🖼️ Banner
                            </span>
                          </div>
                        )}
                        
                        <div className="text-[11px] text-slate-600 pt-1 space-y-0.5">
                          <div>
                            <strong className="text-slate-700">Target:</strong>{" "}
                            {camp.target_type === 'all'
                              ? 'All Products'
                              : camp.target_type === 'category'
                              ? `Category: ${camp.target_category || 'All'}`
                              : `${camp.target_product_ids?.length || 0} Selected Items`}
                          </div>
                          {camp.end_time && (
                            <div className="text-slate-500 text-[10px]">
                              Ends: {new Date(camp.end_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Campaign Card Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleSelectCampaign(camp)}
                          className="flex-1 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg text-xs font-extrabold transition cursor-pointer text-center shadow-sm"
                        >
                          Edit Campaign
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCampaignActive(camp)}
                          className={`p-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            camp.is_active
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={camp.is_active ? "Pause Campaign" : "Activate Campaign"}
                        >
                          {camp.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(cId)}
                          className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                No active or scheduled campaigns found. Click "+ Create New Offer" to start one!
              </div>
            )}
          </div>

          {/* ── DEDICATED MODAL: EDIT / CREATE PROMOTIONAL CAMPAIGN ── */}
          {showCampaignModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-4xl p-5 sm:p-7 relative shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-400 flex items-center justify-center text-black font-bold shadow-sm">
                      <Flame className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        {editingCampaignId && editingCampaignId !== 'new' ? "Edit Promotional Campaign" : "Create New Promotional Campaign"}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          flashSaleConfig.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {flashSaleConfig.is_active ? '● Active' : 'Paused'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure offer deals, countdown schedules (IST), product targets, and custom banners
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="p-2 text-slate-400 hover:text-black rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveFlashSale} className="space-y-6 text-left">
                  {/* Status Toggle & Top Controls */}
                  <div className="flex items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-700 font-medium">Turn campaign on or off immediately across storefront:</span>
                    <label className="flex items-center gap-2.5 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-300 hover:border-cyan-400 transition shadow-2xs">
                      <input
                        type="checkbox"
                        checked={flashSaleConfig.is_active}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, is_active: e.target.checked })}
                        className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">Enable Campaign</span>
                    </label>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title *</label>
                      <input
                        type="text"
                        required
                        value={flashSaleConfig.title}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                        placeholder="e.g. Grand Festive Flash Sale"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={flashSaleConfig.subtitle}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, subtitle: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                        placeholder="e.g. Up to 50% Off on Handcrafted Kurtis"
                      />
                    </div>
                  </div>

                  {/* Deal Type Selection Presets */}
                  <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-cyan-600" /> Promotional Offer Mechanism *
                      </label>
                      <span className="text-[11px] font-bold text-cyan-800 bg-white px-2.5 py-0.5 rounded-full border border-cyan-200">
                        ⚡ Customizable
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { id: 'percentage', label: 'Flat % Discount', text: 'FLAT 30% OFF', desc: 'Flat % off qualifying items', buy: 1, get: 0 },
                        { id: 'bogo', label: 'Buy 1 Get 1 FREE', text: 'BUY 1 GET 1 FREE', desc: 'Add 2, get 1 cheapest FREE', buy: 1, get: 1 },
                        { id: 'buy2get1', label: 'Buy 2 Get 1 FREE', text: 'BUY 2 GET 1 FREE', desc: 'Add 3, get 1 cheapest FREE', buy: 2, get: 1 },
                        { id: 'buy3get1', label: 'Buy 3 Get 1 FREE', text: 'BUY 3 GET 1 FREE', desc: 'Add 4, get 1 cheapest FREE', buy: 3, get: 1 },
                        { id: 'custom_deal', label: 'Buy 5 Get 2 FREE', text: 'Buy 5 Get 2 Free', desc: 'Add 7, get 2 cheapest FREE', buy: 5, get: 2 },
                      ].map((dt) => (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => setFlashSaleConfig(prev => ({
                            ...prev,
                            deal_type: dt.id,
                            deal_text: dt.text,
                            buy_qty: dt.buy,
                            get_free_qty: dt.get
                          }))}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            (flashSaleConfig.deal_type || 'percentage') === dt.id
                              ? 'bg-cyan-400 border-cyan-400 text-black font-extrabold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <p className="font-bold text-xs">{dt.label}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{dt.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-cyan-100">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Live Deal Badge / Title *:
                        </label>
                        <input
                          type="text"
                          value={flashSaleConfig.deal_text || ''}
                          onChange={(e) => handleDealTextChange(e.target.value)}
                          placeholder="e.g. Buy 1 Get 1 Free, Flat 40% OFF"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      {flashSaleConfig.deal_type !== 'percentage' && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Buy Qty:</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={flashSaleConfig.buy_qty || 1}
                              onChange={(e) => handleBuyQtyChange(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center text-xs font-bold"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Free Qty:</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={flashSaleConfig.get_free_qty || 1}
                              onChange={(e) => handleFreeQtyChange(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center text-xs font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule IST */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cyan-600" /> Quick Duration Presets:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "2 Hours", hours: 2 },
                          { label: "6 Hours", hours: 6 },
                          { label: "12 Hours", hours: 12 },
                          { label: "24 Hours (1 Day)", hours: 24 },
                          { label: "48 Hours", hours: 48 },
                          { label: "3 Days", hours: 72 },
                          { label: "7 Days", hours: 168 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyDurationPreset(preset.hours)}
                            className="px-2.5 py-1 bg-white hover:bg-cyan-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date &amp; Time (IST)</label>
                        <input
                          type="datetime-local"
                          value={flashSaleConfig.start_time ? flashSaleConfig.start_time.slice(0, 16) : ""}
                          onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, start_time: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">End Date &amp; Time (IST)</label>
                        <input
                          type="datetime-local"
                          value={flashSaleConfig.end_time ? flashSaleConfig.end_time.slice(0, 16) : ""}
                          onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, end_time: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Scope */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Target Product Scope
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "all", label: "🌟 All Products" },
                        { id: "category", label: "👗 Specific Category" },
                        { id: "custom_products", label: "🏷️ Selected Products" }
                      ].map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setFlashSaleConfig({ ...flashSaleConfig, target_type: scope.id })}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            flashSaleConfig.target_type === scope.id
                              ? "bg-cyan-400 border-cyan-400 text-black font-extrabold shadow-sm"
                              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>

                    {flashSaleConfig.target_type === "category" && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Select Category:</label>
                        <select
                          value={flashSaleConfig.target_category}
                          onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, target_category: e.target.value, target_product_ids: [] })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium"
                        >
                          <option value="">-- Select a Category --</option>
                          {availableCategories.map((cat) => (
                            <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Banner Image */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Image className="w-4 h-4 text-cyan-600" /> Event Banner Image (Optional)
                      </label>
                      {flashSaleConfig.banner_image && (
                        <button
                          type="button"
                          onClick={() => setFlashSaleConfig(prev => ({ ...prev, banner_image: "" }))}
                          className="text-xs text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-slate-300 w-full sm:w-64">
                      <button
                        type="button"
                        onClick={() => setSaleImgTab("upload")}
                        className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          saleImgTab === "upload" ? "bg-cyan-400 text-black" : "bg-white text-slate-600"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaleImgTab("url")}
                        className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          saleImgTab === "url" ? "bg-cyan-400 text-black" : "bg-white text-slate-600"
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" /> Paste URL
                      </button>
                    </div>
                    {saleImgTab === "upload" ? (
                      <div
                        onClick={() => saleFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-cyan-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition"
                      >
                        {saleUploading ? (
                          <span className="text-xs text-slate-500 font-medium">Uploading banner...</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-700">Click to upload banner image</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        placeholder="https://..."
                        value={flashSaleConfig.banner_image}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, banner_image: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    )}
                    {flashSaleConfig.banner_image && (
                      <div className="h-24 rounded-xl overflow-hidden border border-slate-200 relative">
                        <img src={flashSaleConfig.banner_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowCampaignModal(false)}
                      className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-black font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={flashSaleLoading}
                      className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 text-xs"
                    >
                      {flashSaleLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Flame className="w-4 h-4 text-black" />}
                      <span>{editingCampaignId && editingCampaignId !== 'new' ? 'Update Campaign' : 'Create & Launch Campaign'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

            {/* Live Store Preview Card — Ultra-Premium Banner with Image & Overlays */}
            <div className="relative overflow-hidden rounded-2xl min-h-[170px] shadow-xl border border-cyan-900/30 flex flex-col justify-end p-6 text-white group">
              {flashSaleConfig.banner_image ? (
                <>
                  <img
                    src={flashSaleConfig.banner_image}
                    alt="Flash Sale Banner"
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/80 backdrop-blur-[1px]" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#0891b2] via-[#0e7490] to-[#0891b2]" />
              )}

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      📢 Live Storefront Banner (On /category/sale)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      ⚡ LIVE FESTIVE EVENT
                    </span>
                  </div>
                  <h4 className="text-xl md:text-2xl font-black text-white tracking-wide drop-shadow-md">
                    {flashSaleConfig.title || "Grand Festive Flash Sale"}
                  </h4>
                  <p className="text-xs md:text-sm text-cyan-100 font-medium drop-shadow">
                    {flashSaleConfig.subtitle || "Exclusive Handcrafted Luxury Ethnic Wear"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/95 text-slate-900 px-5 py-3 rounded-2xl shadow-xl border border-white/60 backdrop-blur-md">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Promotional Offer</span>
                    <span className="text-lg md:text-xl font-black text-[#0891b2] font-mono tracking-tight">
                      {flashSaleConfig.deal_text ||
                       (flashSaleConfig.deal_type === 'bogo' ? '🎁 BUY 1 GET 1 FREE' :
                        flashSaleConfig.deal_type === 'buy2get1' ? '🎁 BUY 2 GET 1 FREE' :
                        flashSaleConfig.deal_type === 'buy3get1' ? '🎁 BUY 3 GET 1 FREE' :
                        `${flashSaleConfig.discount_percentage}% OFF`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Event Hero Banner Image (Upload or URL) ── */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-[#0891b2]" /> Event Hero Banner Image
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload an eye-catching banner image. It appears as the hero banner on the sale page (/category/sale) and homepage events!
                  </p>
                </div>
                {flashSaleConfig.banner_image && (
                  <button
                    type="button"
                    onClick={() => setFlashSaleConfig(prev => ({ ...prev, banner_image: "" }))}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Image
                  </button>
                )}
              </div>

              {/* Tab Switcher: Upload vs URL */}
              <div className="flex rounded-lg overflow-hidden border border-slate-300 w-full sm:w-64">
                <button
                  type="button"
                  onClick={() => setSaleImgTab("upload")}
                  className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    saleImgTab === "upload" ? "bg-[#0891b2] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setSaleImgTab("url")}
                  className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    saleImgTab === "url" ? "bg-[#0891b2] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Paste URL
                </button>
              </div>

              {/* Upload Drop Area */}
              {saleImgTab === "upload" ? (
                <div
                  onClick={() => saleFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-white group"
                >
                  {saleUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#0891b2] animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Uploading banner image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-[#0891b2] transition" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#0891b2] transition">
                        Click to select and upload banner image
                      </span>
                      <span className="text-[11px] text-slate-400">JPEG, PNG, WebP — High Resolution</span>
                    </div>
                  )}
                  <input
                    ref={saleFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSaleImageUpload(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={flashSaleConfig.banner_image || ""}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, banner_image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-xxx or /uploads/banner.jpg"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0891b2] text-xs font-mono"
                />
              )}

              {/* Preview Thumbnail if set */}
              {flashSaleConfig.banner_image && (
                <div className="relative rounded-xl overflow-hidden h-32 border border-slate-200 bg-slate-100 shadow-inner">
                  <img
                    src={flashSaleConfig.banner_image}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <span>✓ Active Banner Image</span>
                  </div>
                </div>
              )}
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

            {/* Deal Type Selection (BOGO / Buy 2 Get 1 / Buy 3 Get 1 / Percentage / Custom) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/70 to-sky-50/70 border border-cyan-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#0891b2]" /> Promotional Offer Type &amp; Deal Mechanism *
                </label>
                <span className="text-[11px] font-semibold text-[#0891b2] bg-white px-2.5 py-0.5 rounded-full border border-cyan-200 shadow-2xs">
                  ⚡ Fully Dynamic &amp; Customizable
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'percentage', label: 'Flat % Discount', text: 'FLAT 30% OFF', desc: 'Flat % off qualifying items', buy: 1, get: 0 },
                  { id: 'bogo', label: 'Buy 1 Get 1 FREE', text: 'BUY 1 GET 1 FREE', desc: 'Add 2, get 1 cheapest FREE', buy: 1, get: 1 },
                  { id: 'buy2get1', label: 'Buy 2 Get 1 FREE', text: 'BUY 2 GET 1 FREE', desc: 'Add 3, get 1 cheapest FREE', buy: 2, get: 1 },
                  { id: 'buy3get1', label: 'Buy 3 Get 1 FREE', text: 'BUY 3 GET 1 FREE', desc: 'Add 4, get 1 cheapest FREE', buy: 3, get: 1 },
                  { id: 'custom_deal', label: 'Buy 5 Get 2 FREE', text: 'Buy 5 Get 2 Free', desc: 'Add 7, get 2 cheapest FREE', buy: 5, get: 2 },
                ].map((dt) => (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setFlashSaleConfig(prev => ({
                      ...prev,
                      deal_type: dt.id,
                      deal_text: dt.text,
                      buy_qty: dt.buy,
                      get_free_qty: dt.get
                    }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (flashSaleConfig.deal_type || 'percentage') === dt.id
                        ? 'bg-[#0891b2] border-[#0891b2] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-xs">{dt.label}</p>
                    <p className={`text-[11px] mt-0.5 ${(flashSaleConfig.deal_type || 'percentage') === dt.id ? 'text-cyan-100' : 'text-slate-500'}`}>
                      {dt.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs: Custom Deal Text & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-cyan-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Live Deal Badge / Title (Type to Customize Dynamically) *:
                  </label>
                  <input
                    type="text"
                    value={flashSaleConfig.deal_text || ''}
                    onChange={(e) => handleDealTextChange(e.target.value)}
                    placeholder="e.g. Buy 5 Get 2 Free, Buy 2 Get 1 Free, Flat 40% OFF"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0891b2] shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Typing "Buy 5 Get 2 Free" automatically updates the Buy Qty and Free Qty inputs below!
                  </p>
                </div>

                {flashSaleConfig.deal_type !== 'percentage' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Buy Qty (X):</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={flashSaleConfig.buy_qty || 1}
                        onChange={(e) => handleBuyQtyChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-center text-xs font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Free Qty (Y):</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={flashSaleConfig.get_free_qty || 1}
                        onChange={(e) => handleFreeQtyChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-center text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Duration Presets & Timing */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0891b2]" /> Quick Timer &amp; Duration Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "2 Hours (Lightning)", hours: 2 },
                    { label: "6 Hours (Flash)", hours: 6 },
                    { label: "12 Hours", hours: 12 },
                    { label: "24 Hours (1 Day)", hours: 24 },
                    { label: "48 Hours (Weekend)", hours: 48 },
                    { label: "3 Days (Festive)", hours: 72 },
                    { label: "7 Days (Mega Sale)", hours: 168 },
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
              {/* Discount % (shown primarily if percentage deal or as secondary base) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  {flashSaleConfig.deal_type === 'percentage' ? 'Discount Percentage *' : 'Base Badge % (Display)'}
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
                <p className="text-[11px] text-slate-500">
                  {flashSaleConfig.deal_type === 'percentage'
                    ? 'Applied across all selected sale products.'
                    : 'Display discount percentage badge for products in this collection.'}
                </p>
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

                {/* Category Selection if target_type === category */}
                {flashSaleConfig.target_type === "category" && (
                  <div className="pt-2 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Category:</label>
                      <select
                        value={flashSaleConfig.target_category}
                        onChange={(e) => {
                          const catName = e.target.value;
                          setFlashSaleConfig({
                            ...flashSaleConfig,
                            target_category: catName,
                            target_product_ids: []
                          });
                        }}
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

                    {flashSaleConfig.target_category && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="cat_scope"
                              checked={!categorySpecificSelection}
                              onChange={() => {
                                setCategorySpecificSelection(false);
                                setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: [] });
                              }}
                              className="accent-[#0891b2]"
                            />
                            <span>All products in "{flashSaleConfig.target_category}"</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="cat_scope"
                              checked={categorySpecificSelection}
                              onChange={() => setCategorySpecificSelection(true)}
                              className="accent-[#0891b2]"
                            />
                            <span>Select specific products from "{flashSaleConfig.target_category}" ({flashSaleConfig.target_product_ids?.length || 0} selected)</span>
                          </label>
                        </div>

                        {categorySpecificSelection && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={categoryProductSearch}
                                onChange={(e) => setCategoryProductSearch(e.target.value)}
                                placeholder={`Search products in ${flashSaleConfig.target_category}...`}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#0891b2]"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const catProds = availableProducts.filter(p => (p.category || '').toLowerCase() === flashSaleConfig.target_category.toLowerCase());
                                    const allIds = catProds.map(p => p._id || p.id);
                                    setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: allIds });
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium cursor-pointer"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: [] })}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="max-h-52 overflow-y-auto bg-slate-50/50 border border-slate-200 rounded-xl p-2 space-y-1">
                              {availableProducts
                                .filter(p => (p.category || '').toLowerCase() === flashSaleConfig.target_category.toLowerCase())
                                .filter(p => !categoryProductSearch || (p.name || '').toLowerCase().includes(categoryProductSearch.toLowerCase()))
                                .map((p) => {
                                  const pid = p._id || p.id;
                                  const isChecked = flashSaleConfig.target_product_ids?.includes(pid);
                                  return (
                                    <label key={pid} className="flex items-center gap-2.5 p-2 bg-white hover:bg-cyan-50/50 rounded-lg cursor-pointer border border-slate-200/80 shadow-2xs">
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
                                      {p.image ? (
                                        <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded border" />
                                      ) : (
                                        <div className="w-9 h-9 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">No img</div>
                                      )}
                                      <span className="text-slate-800 text-xs font-semibold truncate flex-1">{p.name}</span>
                                      <span className="text-[#0891b2] font-mono font-bold text-xs">₹{p.price}</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Products Multi-Select with Category Filter & Search if target_type === custom_products */}
                {flashSaleConfig.target_type === "custom_products" && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Select Products ({flashSaleConfig.target_product_ids?.length || 0} selected):
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = availableProducts.filter(p => {
                              const matchCat = customCategoryFilter === 'all' || (p.category || '').toLowerCase() === customCategoryFilter.toLowerCase();
                              const matchSearch = !customProductSearch || (p.name || '').toLowerCase().includes(customProductSearch.toLowerCase());
                              return matchCat && matchSearch;
                            });
                            const newIds = Array.from(new Set([...(flashSaleConfig.target_product_ids || []), ...filtered.map(p => p._id || p.id)]));
                            setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: newIds });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium cursor-pointer"
                        >
                          Select Filtered
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: [] })}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex gap-2">
                      <select
                        value={customCategoryFilter}
                        onChange={(e) => setCustomCategoryFilter(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                      >
                        <option value="all">All Categories</option>
                        {availableCategories.map(cat => (
                          <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={customProductSearch}
                        onChange={(e) => setCustomProductSearch(e.target.value)}
                        placeholder="Search products by title..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#0891b2]"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto bg-white border border-slate-300 rounded-xl p-2 space-y-1">
                      {availableProducts
                        .filter(p => customCategoryFilter === 'all' || (p.category || '').toLowerCase() === customCategoryFilter.toLowerCase())
                        .filter(p => !customProductSearch || (p.name || '').toLowerCase().includes(customProductSearch.toLowerCase()))
                        .map((p) => {
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
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded border" />
                              ) : (
                                <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">No img</div>
                              )}
                              <span className="text-slate-800 text-xs font-medium truncate flex-1">{p.name}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.category}</span>
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
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 text-xs"
              >
                {flashSaleLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Flame className="w-4 h-4 text-black" />}
                <span>{editingCampaignId && editingCampaignId !== 'new' ? 'Update Campaign' : 'Save & Launch Flash Sale'}</span>
              </button>
            </div>
          </div>
        </form>
        </div>
      )}

      {/* TAB: WELCOME / LOGIN POPUP CUSTOMIZER */}
      {activeTab === 'welcome_popup' && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Welcome &amp; Login Popup Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize the left-side promotional image, discount headline, and captions displayed on the <strong>Welcome / Sign-In Modal</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={welcomePopupConfig.is_enabled}
                  onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, is_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#0891b2] rounded accent-[#0891b2] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  {welcomePopupConfig.is_enabled ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Popup Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Popup Paused</span>
                  )}
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveWelcomePopup}
                disabled={welcomeSaving}
                className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {welcomeSaving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                {welcomeSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7 COLS: FORM CONTROLS */}
            <div className="lg:col-span-7 space-y-6">
              {/* Image Configuration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Image className="w-4 h-4 text-[#0891b2]" />
                    Popup Left Banner Image
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload an ethnic wear model or promotional outfit photo.
                  </p>
                </div>

                {/* Tab Switcher: Upload vs URL */}
                <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setWelcomeImgTab("upload")}
                    className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg transition ${
                      welcomeImgTab === "upload" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setWelcomeImgTab("url")}
                    className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg transition ${
                      welcomeImgTab === "url" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Direct Image URL
                  </button>
                </div>

                {welcomeImgTab === "upload" ? (
                  <div
                    onClick={() => welcomeFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-cyan-50/20 transition group"
                  >
                    <input
                      ref={welcomeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleWelcomeImageUpload}
                      className="hidden"
                    />
                    {welcomeUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-6 h-6 text-[#0891b2] animate-spin" />
                        <span className="text-xs text-slate-600 font-medium">Uploading image to server...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-[#0891b2] group-hover:scale-110 transition">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 pt-1">Click to upload or drag image here</span>
                        <span className="text-[11px] text-slate-400">Supports PNG, JPG, WebP (Vertical / Portrait recommended)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/model-photo.jpg"
                      value={welcomePopupConfig.image || ""}
                      onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, image: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                    />
                  </div>
                )}

                {/* Current Image Preview & Reset */}
                {welcomePopupConfig.image && (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <img
                      src={resolveImageUrl(welcomePopupConfig.image)}
                      alt="Thumbnail"
                      className="w-12 h-14 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{welcomePopupConfig.image}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ready &amp; Loaded</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWelcomePopupConfig({ ...welcomePopupConfig, image: "" })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Text & Discount Customization */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#0891b2]" />
                    Promotional Overlay Texts
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize discount numbers, condition, and tagline shown over the image.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Quick Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { title: "10%", subtitle: "OFF", order: "YOUR FIRST ORDER", sub: "Authentic Kurtis, Suits & Ethnic Wear" },
                      { title: "15%", subtitle: "OFF", order: "FESTIVE FIRST ORDER", sub: "Handcrafted Luxury Indian Outfits" },
                      { title: "20%", subtitle: "OFF", order: "LIMITED WELCOME DEAL", sub: "Premium Designer Kurtis & Sarees" },
                      { title: "FLAT ₹200", subtitle: "OFF", order: "ON ORDERS ABOVE ₹1499", sub: "Exclusive New Member Gift" },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setWelcomePopupConfig((prev) => ({
                            ...prev,
                            discount_title: p.title,
                            discount_subtitle: p.subtitle,
                            order_text: p.order,
                            sub_text: p.sub,
                          }))
                        }
                        className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-200 border border-slate-200 rounded-xl transition cursor-pointer"
                      >
                        {p.title} {p.subtitle}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Title (Gold Text)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10% or FLAT ₹500"
                      value={welcomePopupConfig.discount_title || ""}
                      onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, discount_title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Subtitle (White Text)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OFF"
                      value={welcomePopupConfig.discount_subtitle || ""}
                      onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, discount_subtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order / Condition Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. YOUR FIRST ORDER"
                      value={welcomePopupConfig.order_text || ""}
                      onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, order_text: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs font-bold uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subtitle / Category Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Authentic Kurtis, Suits & Ethnic Wear"
                      value={welcomePopupConfig.sub_text || ""}
                      onChange={(e) => setWelcomePopupConfig({ ...welcomePopupConfig, sub_text: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0891b2] text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveWelcomePopup}
                    disabled={welcomeSaving}
                    className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl transition cursor-pointer text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {welcomeSaving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                    {welcomeSaving ? "Saving Settings..." : "Save Popup Settings"}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: LIVE REALISTIC PREVIEW */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#0891b2]" /> Live Modal Preview
                    </h4>
                    <p className="text-[11px] text-slate-500">Exact live preview of the popup left side</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    welcomePopupConfig.is_enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {welcomePopupConfig.is_enabled ? "● Enabled" : "○ Disabled"}
                  </span>
                </div>

                {/* Card mockup */}
                <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-black aspect-[3/4]">
                  {/* Model Image */}
                  <img
                    src={resolveImageUrl(welcomePopupConfig.image, "/hero_model_1.png")}
                    alt="Welcome Preview"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.target.src = "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1";
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(to top, rgba(50,0,0,0.95) 0%, rgba(50,0,0,0.45) 45%, transparent 70%),
                        linear-gradient(to right, rgba(0,0,0,0.25) 0%, transparent 60%)
                      `,
                    }}
                  />

                  {/* Gold vertical bar */}
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: "linear-gradient(to bottom, transparent, #d4af37, transparent)" }}
                  />

                  {/* Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-4xl font-black leading-none drop-shadow-lg"
                          style={{ color: "#d4af37", fontFamily: "Georgia, serif" }}
                        >
                          {welcomePopupConfig.discount_title || "10%"}
                        </span>
                        <span
                          className="text-xl font-black text-white tracking-wider drop-shadow-md"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {welcomePopupConfig.discount_subtitle || "OFF"}
                        </span>
                      </div>

                      <div
                        className="w-12 h-0.5 my-2"
                        style={{ background: "linear-gradient(to right, #d4af37, transparent)" }}
                      />

                      <p className="text-white font-bold text-xs uppercase tracking-widest drop-shadow-md">
                        {welcomePopupConfig.order_text || "YOUR FIRST ORDER"}
                      </p>

                      <p className="text-amber-100/90 text-[11px] font-medium drop-shadow-sm pt-0.5 line-clamp-2">
                        {welcomePopupConfig.sub_text || "Authentic Kurtis, Suits & Ethnic Wear"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  ✨ Updated instantaneously for all visitors on home/catalog pages.
                </p>
              </div>
            </div>
          </div>
        </div>
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
              <button type="submit" className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs">
                <Save className="w-4 h-4 text-black" /> Save Store Settings
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
              <button type="submit" className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs">
                <Save className="w-4 h-4 text-black" /> Save Pricing Config
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
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-black" /> Save Delivery Rules
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
            <button onClick={() => setShowCouponModal(true)} className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer text-xs">
              <Plus className="w-4 h-4 text-black" /> Add Code
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
                  <button type="submit" className="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl transition cursor-pointer text-xs shadow-md">Save Coupon</button>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-black font-bold rounded-xl transition cursor-pointer text-xs">Cancel</button>
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
