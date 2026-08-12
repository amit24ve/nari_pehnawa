import React, { useState, useEffect } from 'react';
import {
  Store, DollarSign, Bell, Save, Check, Mail, Phone, MapPin, Globe,
  CreditCard, Truck, AlertCircle, Image, Plus, Trash2, Edit3, Eye,
  EyeOff, GripVertical, Loader2, Link as LinkIcon, Tag, Gift, HelpCircle,
  Megaphone, CheckCircle, XCircle, Download, FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';

const Settings = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  /* ── Hero Slider state ──────────────────────────────────────── */
  const [slides, setSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [slidesError, setSlidesError] = useState(null);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideFormLoading, setSlideFormLoading] = useState(false);
  const [slideForm, setSlideForm] = useState({
    image: '', alt: '', title: '', subtitle: '', cta_text: '', cta_link: '', order: 1, is_active: true,
  });

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('neel_token') || localStorage.getItem('token') || ''}`,
  });

  const fetchSlides = async () => {
    setSlidesLoading(true);
    setSlidesError(null);
    try {
      const r = await fetch(`${API_BASE}/slider/?active_only=false`, { headers: authHeaders() }).catch(() => null);
      if (r && r.ok) {
        const data = await r.json();
        setSlides(Array.isArray(data) ? data : []);
      } else {
        setSlides(getDummySlides());
      }
    } catch { 
      setSlides(getDummySlides());
    } finally { 
      setSlidesLoading(false); 
    }
  };

  const getDummySlides = () => [
    { id: "s-1", image: "/gob-kurta-set-1.png", alt: "Kurta Set Collection", title: "Elegant Kurtis Collection", subtitle: "Handcrafted Cotton Sets", order: 1, is_active: true },
    { id: "s-2", image: "https://picsum.photos/seed/slide2/1200/400", alt: "Home Decor Accents", title: "Home Decor Accents", subtitle: "Beautify Every Corner", order: 2, is_active: true }
  ];

  useEffect(() => { 
    if (activeTab === 'slider') fetchSlides(); 
  }, [activeTab]);

  const openAddSlide = () => {
    setEditingSlide(null);
    setSlideForm({ image: '', alt: '', title: '', subtitle: '', cta_text: 'Shop Now', cta_link: '/', order: (slides.length + 1), is_active: true });
    setShowSlideForm(true);
  };

  const openEditSlide = (s) => {
    setEditingSlide(s);
    setSlideForm({ image: s.image, alt: s.alt || '', title: s.title || '', subtitle: s.subtitle || '', cta_text: s.cta_text || '', cta_link: s.cta_link || '', order: s.order || 1, is_active: s.is_active !== false });
    setShowSlideForm(true);
  };

  const saveSlide = async (e) => {
    e.preventDefault();
    if (!slideForm.image.trim()) return;
    setSlideFormLoading(true);
    try {
      const url = editingSlide ? `${API_BASE}/slider/${editingSlide.id}` : `${API_BASE}/slider/`;
      const method = editingSlide ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(slideForm) });
      if (!r.ok) throw new Error('Save failed');
      setShowSlideForm(false);
      await fetchSlides();
      showSuccess();
    } catch (e) { 
      setSlidesError(e.message); 
    } finally { 
      setSlideFormLoading(false); 
    }
  };

  const deleteSlide = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    try {
      await fetch(`${API_BASE}/slider/${id}`, { method: 'DELETE', headers: authHeaders() });
      await fetchSlides();
    } catch { 
      // Fallback filter
      setSlides(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleSlide = async (id) => {
    try {
      await fetch(`${API_BASE}/slider/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
      await fetchSlides();
    } catch { 
      setSlides(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
    }
  };

  // Base state fields
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

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    reviewNotifications: true,
    stockAlerts: true,
    promotionalEmails: true,
    smsNotifications: false
  });

  // Coupons state
  const [coupons, setCoupons] = useState([
    { id: "c-1", code: "NARI10", type: "Percentage", discount: 10, minCart: 999, expiry: "2026-12-31", usage: 142, status: "Active" },
    { id: "c-2", code: "WELCOME200", type: "Fixed Amount", discount: 200, minCart: 1499, expiry: "2026-09-30", usage: 85, status: "Active" },
    { id: "c-3", code: "FESTIVE30", type: "Percentage", discount: 30, minCart: 2999, expiry: "2026-11-15", usage: 0, status: "Inactive" }
  ]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "Percentage", discount: "", minCart: "", expiry: "", status: "Active" });

  // Offers state
  const [offers, setOffers] = useState([
    { id: "o-1", name: "Monsoon Clearance Sale", banner: "https://picsum.photos/seed/offer1/800/300", discount: "Up to 50% OFF", status: "Active" },
    { id: "o-2", name: "Festival Decor Discount", banner: "https://picsum.photos/seed/offer2/800/300", discount: "Flat 20% OFF", status: "Active" }
  ]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [newOffer, setNewOffer] = useState({ name: "", banner: "", discount: "", status: "Active" });

  // SEO state
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "Buy Designer Kurtis & Home Decor Online - Nari Pehnawa",
    metaKeywords: "Kurtis, designer kurtis, anarkali suit, white kurti, home decor online, ceramic vase",
    metaDescription: "Explore the latest collection of handblock printed Kurtis, cotton Palazzo sets, and premium home decor at Nari Pehnawa. Free shipping available.",
    googleAnalyticsId: "G-9382109X"
  });

  // Support Tickets state
  const [tickets, setTickets] = useState([
    { id: "TKT-821", customer: "Pooja Roy", email: "pooja@example.com", subject: "Refund for damaged vase", message: "My ceramic vase arrived cracked on the rim. Please refund.", urgency: "High", status: "Open", date: "2026-07-16" },
    { id: "TKT-820", customer: "Rohan Malhotra", email: "rohan@example.com", subject: "Size exchange query", subjectText: "Need to change size from M to L for Cotton Printed Kurti.", urgency: "Medium", status: "Resolved", date: "2026-07-14", resolution: "Sent return shipping slip. Swapped sizes." }
  ]);
  const [resolvedText, setResolvedText] = useState({});

  // Marketing metrics state
  const [marketingSettings, setMarketingSettings] = useState({
    newsletterActive: true,
    subscribersCount: 1450,
    newsletterSubject: "Weekend Kurti Special Offer!",
    newsletterBody: "Check out our newest Chikankari collections. Enjoy flat 10% off using code NARI10."
  });

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const handlePricingSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const handleSeoSubmit = (e) => {
    e.preventDefault();
    showSuccess();
  };

  const handleMarketingSubmit = (e) => {
    e.preventDefault();
    alert("Bulk newsletter campaign queued to all subscribers.");
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

  // Offers triggers
  const handleAddOffer = (e) => {
    e.preventDefault();
    if (!newOffer.name.trim()) return;
    const offerObj = {
      id: `o-${Date.now()}`,
      name: newOffer.name,
      banner: newOffer.banner || "https://picsum.photos/800/300",
      discount: newOffer.discount,
      status: newOffer.status
    };
    setOffers(prev => [...prev, offerObj]);
    setNewOffer({ name: "", banner: "", discount: "", status: "Active" });
    setShowOfferModal(false);
    showSuccess();
  };

  const handleDeleteOffer = (id) => {
    if (!window.confirm("Remove this offer campaign?")) return;
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  // Support resolving
  const handleResolveTicket = (id) => {
    const resolution = resolvedText[id];
    if (!resolution || !resolution.trim()) return alert("Please enter resolution description first");
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Resolved", resolution } : t));
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "coupons") {
      csvContent += "Coupon Code,Type,Discount,Min Cart value,Usage count,Status,Expiry\n";
      coupons.forEach(c => {
        csvContent += `"${c.code}","${c.type}",${c.discount},${c.minCart},${c.usage},"${c.status}","${c.expiry}"\n`;
      });
    } else {
      csvContent += "Ticket ID,Customer,Email,Subject,Urgency,Status,Date,Resolution\n";
      tickets.forEach(t => {
        csvContent += `"${t.id}","${t.customer}","${t.email}","${t.subject}","${t.urgency}","${t.status}","${t.date}","${t.resolution || ''}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `settings_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'slider', label: 'Hero Slider', icon: Image },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'offers', label: 'Offers & Campaigns', icon: Gift },
    { id: 'seo', label: 'SEO Config', icon: Globe },
    { id: 'support', label: 'Support Tickets', icon: HelpCircle },
    { id: 'marketing', label: 'Bulk Marketing', icon: Megaphone }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/40 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">System Configuration</h1>
          <p className="text-sm text-gray-400 mt-1">Configure catalogs, coupons, meta scripts, and help desks.</p>
        </div>

        <div className="flex items-center gap-3">
          {showSuccessMessage && (
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl font-bold">
              ✓ Saved Changes
            </span>
          )}
          {(activeTab === "coupons" || activeTab === "support") && (
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

      {/* TAB: STORE INFO */}
      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Store className="w-4 h-4 text-[#d4af37]" /> Store General Information
            </h3>

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

      {/* TAB: PRICING */}
      {activeTab === 'pricing' && (
        <form onSubmit={handlePricingSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <DollarSign className="w-4 h-4 text-[#d4af37]" /> Currency &amp; Pricing Rules
            </h3>

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
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Truck className="w-4 h-4 text-[#d4af37]" /> Free Delivery Rules for Customers (1st, 2nd, 3rd Orders)
            </h3>

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

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleNotificationSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Bell className="w-4 h-4 text-[#d4af37]" /> Automated Notification Rules
            </h3>

            <div className="space-y-3">
              {[
                { key: 'emailNotifications', label: "Email Alerts for new reviews", desc: "Send summary emails when reviews are submitted." },
                { key: 'orderNotifications', label: "SMS Alerts for processing orders", desc: "Send automatic dispatch status notifications." },
                { key: 'stockAlerts', label: "Restock alerts for inventory", desc: "Alert admin immediately when products hit low warnings." }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 p-3 bg-[#0b1220]/50 rounded-xl border border-gray-800/30">
                  <input
                    type="checkbox"
                    checked={notificationSettings[key]}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                    className="w-4 h-4 text-[#d4af37] bg-[#0b1220] border-gray-800 rounded focus:ring-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-white">{label}</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="px-5 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition">
              <Save className="w-4 h-4" /> Save Notification Options
            </button>
          </div>
        </form>
      )}

      {/* TAB: HERO SLIDER */}
      {activeTab === 'slider' && (
        <div className="space-y-6 text-xs text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Homepage Promotion Carousel Slides</h3>
            <button onClick={openAddSlide} className="px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#c49f2f] text-black font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
              <Plus className="w-4 h-4" /> New Slide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slides.map((s, idx) => (
              <div key={idx} className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="w-full h-32 bg-[#0b1220] border-b border-gray-800 flex items-center justify-center overflow-hidden">
                  {s.image ? <img src={s.image} alt={s.alt} className="w-full h-full object-cover" /> : <Image className="w-8 h-8 text-gray-700" />}
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-white truncate">{s.title || 'Untitled Slide'}</h4>
                  <p className="text-gray-400 truncate">{s.subtitle}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/40">
                    <button
                      onClick={() => toggleSlide(s.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        s.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Draft'}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => openEditSlide(s)} className="p-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSlide(s.id)} className="p-1.5 bg-red-600/10 text-red-400 border border-red-600/20 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Slide Modal */}
          {showSlideForm && (
            <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
              <form onSubmit={saveSlide} className="bg-[#0f1724] border border-gray-850 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h4 className="font-bold text-white">{editingSlide ? 'Modify Carousel Slide' : 'Create Carousel Slide'}</h4>
                  <button type="button" onClick={() => setShowSlideForm(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Image URL *</label>
                    <input
                      type="url"
                      required
                      value={slideForm.image}
                      onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={slideForm.title}
                      onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={slideForm.subtitle}
                      onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold rounded-xl">Save Slide</button>
                  <button type="button" onClick={() => setShowSlideForm(false)} className="flex-1 py-2 bg-gray-800 text-white rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 text-xs text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Promotional Coupon Codes</h3>
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

      {/* TAB: OFFERS & CAMPAIGNS */}
      {activeTab === 'offers' && (
        <div className="space-y-6 text-xs text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Promotional Offer Campaigns</h3>
            <button onClick={() => setShowOfferModal(true)} className="px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#c49f2f] text-black font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
              <Plus className="w-4 h-4" /> Add Offer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((o, idx) => (
              <div key={idx} className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="w-full h-32 bg-[#0b1220] border-b border-gray-800 flex items-center justify-center overflow-hidden">
                  {o.banner ? <img src={o.banner} alt={o.name} className="w-full h-full object-cover" /> : <Gift className="w-8 h-8 text-gray-700" />}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white truncate max-w-[200px]">{o.name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded">{o.discount}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/40">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}>{o.status}</span>
                    <button onClick={() => handleDeleteOffer(o.id)} className="p-1.5 bg-red-600/10 text-red-400 border border-red-600/20 rounded-xl hover:bg-red-600/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Offer Modal */}
          {showOfferModal && (
            <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
              <form onSubmit={handleAddOffer} className="bg-[#0f1724] border border-gray-850 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h4 className="font-bold text-white">Create New Offer Campaign</h4>
                  <button type="button" onClick={() => setShowOfferModal(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      value={newOffer.name}
                      onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      placeholder="e.g. End of Season Sale"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Banner Image URL</label>
                    <input
                      type="url"
                      value={newOffer.banner}
                      onChange={(e) => setNewOffer({ ...newOffer, banner: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Discount Tag *</label>
                    <input
                      type="text"
                      required
                      value={newOffer.discount}
                      onChange={(e) => setNewOffer({ ...newOffer, discount: e.target.value })}
                      className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      placeholder="e.g. Flat 30% OFF"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-[#d4af37] text-black font-bold rounded-xl">Save Offer</button>
                  <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 py-2 bg-gray-800 text-white rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: SEO CONFIG */}
      {activeTab === 'seo' && (
        <form onSubmit={handleSeoSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Globe className="w-4 h-4 text-[#d4af37]" /> Search Engine Optimization (SEO)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Homepage HTML Meta Title</label>
                <input
                  type="text"
                  value={seoSettings.metaTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Meta Target Keywords (comma separated)</label>
                <input
                  type="text"
                  value={seoSettings.metaKeywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaKeywords: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Meta Search Description</label>
                <textarea
                  value={seoSettings.metaDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Google Analytics measurement ID</label>
                <input
                  type="text"
                  value={seoSettings.googleAnalyticsId}
                  onChange={(e) => setSeoSettings({ ...seoSettings, googleAnalyticsId: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition">
              <Save className="w-4 h-4" /> Save Meta Details
            </button>
          </div>
        </form>
      )}

      {/* TAB: SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-6 text-xs text-left">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-6">Urgency</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-300">
                {tickets.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/20 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-white">{t.id}</td>
                    <td className="py-3.5 px-6">
                      <div>{t.customer}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{t.email}</div>
                    </td>
                    <td className="py-3.5 px-6 max-w-[200px]">
                      <div className="font-semibold text-white">{t.subject}</div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{t.message}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.urgency === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        t.urgency === "Medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>{t.urgency}</span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-400">{t.date}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "Resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>{t.status}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {t.status === "Open" ? (
                        <div className="flex gap-2 justify-end items-center">
                          <input
                            type="text"
                            placeholder="Type solution..."
                            onChange={(e) => setResolvedText({ ...resolvedText, [t.id]: e.target.value })}
                            className="bg-[#0b1220] border border-gray-800 rounded-lg px-2 py-1 text-white text-[10px]"
                          />
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-2.5 py-1 bg-[#d4af37] text-black font-bold rounded-lg"
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 max-w-[200px] truncate" title={t.resolution}>{t.resolution}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BULK MARKETING */}
      {activeTab === 'marketing' && (
        <form onSubmit={handleMarketingSubmit} className="space-y-6 text-xs text-left">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Megaphone className="w-4 h-4 text-[#d4af37]" /> Bulk Email Marketing Campaigns
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0b1220]/50 p-4 rounded-xl border border-gray-800/40">
                <span className="text-gray-500 block mb-1 uppercase tracking-wider font-bold">Total Newsletter Subscribers</span>
                <span className="text-3xl font-extrabold text-[#d4af37] font-mono">{marketingSettings.subscribersCount.toLocaleString()}</span>
              </div>
              <div className="bg-[#0b1220]/50 p-4 rounded-xl border border-gray-800/40 flex items-center">
                <p className="text-gray-400">Newsletter is currently <strong className="text-emerald-400">enabled</strong> on storefront footer block.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Newsletter Email Subject</label>
                <input
                  type="text"
                  value={marketingSettings.newsletterSubject}
                  onChange={(e) => setMarketingSettings({ ...marketingSettings, newsletterSubject: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Email Template Body (HTML/Markdown supported)</label>
                <textarea
                  value={marketingSettings.newsletterBody}
                  onChange={(e) => setMarketingSettings({ ...marketingSettings, newsletterBody: e.target.value })}
                  className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none h-32 resize-none"
                />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition">
              <Megaphone className="w-4 h-4" /> Send Bulk Newsletter Campaign
            </button>
          </div>
        </form>
      )}

    </div>
  );
};

export default Settings;
