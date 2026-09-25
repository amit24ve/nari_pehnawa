import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  Tag,
  Link2,
  Copy,
  Check,
  Eye,
  CheckCircle,
  X,
  ArrowRight,
  ShoppingBag,
  Gift,
  Truck,
  Flame,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const AdminAnnouncementsModal = () => {
  // Top Bar Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [topbarEnabled, setTopbarEnabled] = useState(true);
  const [togglingTopbar, setTogglingTopbar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = new, or object
  const [announcementForm, setAnnouncementForm] = useState({
    text: "",
    sub_text: "",
    link: "",
    badge: "FESTIVE",
    icon: "✨",
    is_active: true,
    display_order: 1,
  });

  // Welcome Offer Modal Config state
  const [welcomeConfig, setWelcomeConfig] = useState({
    is_enabled: true,
    template_type: "festive-royal",
    banner_image: "/nari_post_banner.jpg",
    title: "Grand Festive Season Sale",
    subtitle: "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear",
    coupon_code: "FESTIVE10",
    discount_badge: "FLAT 10% OFF",
    button_text: "EXPLORE COLLECTION",
    button_link: "/new-arrivals",
    show_on_mobile: true,
    delay_seconds: 3,
  });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [welcomeImgTab, setWelcomeImgTab] = useState("upload");
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);

  // Top Bar preview rotation
  const [previewIndex, setPreviewIndex] = useState(0);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
    }`,
  });

  // Fetch Announcements & Welcome Modal config
  const fetchAllData = async () => {
    setLoadingAnnouncements(true);
    try {
      const [annRes, welRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/announcements/all`, { headers: authHeaders() }),
        fetch(`${API_BASE}/announcements/welcome-modal`),
        fetch(`${API_BASE}/announcements/topbar-settings`),
      ]);

      if (annRes.ok) {
        const data = await annRes.json();
        if (Array.isArray(data)) setAnnouncements(data);
      }
      if (welRes.ok) {
        const data = await welRes.json();
        if (data) setWelcomeConfig((prev) => ({ ...prev, ...data }));
      }
      if (topRes.ok) {
        const topData = await topRes.json();
        setTopbarEnabled(topData.is_enabled !== false);
      }
    } catch (e) {
      
      console.error("Failed to fetch announcements/modal config:", e);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleToggleTopbarMaster = async (enableState) => {
    setTogglingTopbar(true);
    try {
      const res = await fetch(`${API_BASE}/announcements/topbar-settings`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_enabled: enableState }),
      });
      if (!res.ok) throw new Error("Failed to update topbar settings");
      setTopbarEnabled(enableState);
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    } finally {
      setTogglingTopbar(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Top Bar Preview Auto-Rotation
  useEffect(() => {
    const activeList = announcements.filter((a) => a.is_active);
    if (activeList.length <= 1) return;

    const t = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeList.length);
    }, 3500);

    return () => clearInterval(t);
  }, [announcements]);

  // ── ANNOUNCEMENT ACTIONS ──
  const handleOpenCreate = () => {
    setEditingItem(null);
    setAnnouncementForm({
      text: "",
      sub_text: "",
      link: "/category/sale",
      badge: "OFFER",
      icon: "✨",
      is_active: true,
      display_order: announcements.length + 1,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setAnnouncementForm({
      text: item.text || "",
      sub_text: item.sub_text || "",
      link: item.link || "",
      badge: item.badge || "",
      icon: item.icon || "✨",
      is_active: item.is_active ?? true,
      display_order: item.display_order || 1,
    });
    setShowAddModal(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.text.trim()) {
      alert("Please enter the announcement text.");
      return;
    }

    try {
      let endpoint = `${API_BASE}/announcements/`;
      let method = "POST";

      if (editingItem && (editingItem.id || editingItem._id)) {
        const id = editingItem.id || editingItem._id;
        endpoint = `${API_BASE}/announcements/${id}`;
        method = "PUT";
      }

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(announcementForm),
      });

      if (!res.ok) throw new Error("Failed to save announcement");
      setShowAddModal(false);
      fetchAllData();
    } catch (e) {
      alert(e.message || "Error saving announcement");
    }
  };

  const handleToggleActive = async (item) => {
    const id = item.id || item._id;
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            (a.id || a._id) === id ? { ...a, is_active: !a.is_active } : a
          )
        );
      }
    } catch (e) {
      alert("Failed to toggle status");
    }
  };

  const handleDeleteAnnouncement = async (item) => {
    const id = item.id || item._id;
    if (!window.confirm(`Delete announcement: "${item.text}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => (a.id || a._id) !== id));
      }
    } catch (e) {
      alert("Failed to delete announcement");
    }
  };

  // ── WELCOME OFFER MODAL ACTIONS ──
  const handleSaveWelcomeModal = async (e) => {
    if (e) e.preventDefault();
    setSavingWelcome(true);
    try {
      const res = await fetch(`${API_BASE}/announcements/welcome-modal`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(welcomeConfig),
      });
      if (!res.ok) throw new Error("Failed to save welcome modal");
      alert("Welcome Offer Modal settings updated successfully!");
    } catch (e) {
      alert(e.message || "Error saving welcome modal");
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Image upload failed");
      }
      const data = await res.json();
      const url = data.url || data.file_url || data.image_url;
      if (url) {
        setWelcomeConfig((prev) => ({ ...prev, banner_image: url }));
        alert("Banner image uploaded successfully!");
      }
    } catch (e) {
      alert(`Image upload failed: ${e.message}`);
    } finally {
      setUploadingImg(false);
    }
  };

  const activeAnnouncements = announcements.filter((a) => a.is_active);
  const currentPreview =
    activeAnnouncements.length > 0
      ? activeAnnouncements[previewIndex % activeAnnouncements.length]
      : {
          badge: "FESTIVE",
          icon: "✨",
          text: "Grand Festive Sale: Flat 10% OFF on First Order",
          sub_text: "Use Code: FESTIVE10",
        };

  return (
    <div className="space-y-8 text-left">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: TOP BAR ANNOUNCEMENT SLIDER
      ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#580C1F]/10 text-[#580C1F] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#580C1F]" />
              Top Bar Announcement Slider
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Live Offers &amp; Ticker Messages
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These announcement lines slide automatically above the website
              header. Admin can add, edit, reorder, or pause any message.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={topbarEnabled}
                onChange={(e) => handleToggleTopbarMaster(e.target.checked)}
                disabled={togglingTopbar}
                className="w-4 h-4 text-[#580C1F] rounded accent-[#580C1F] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                {topbarEnabled ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Top Bar Active
                  </span>
                ) : (
                  <span className="text-slate-400">Top Bar Paused</span>
                )}
              </span>
            </label>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-[#580C1F] hover:bg-[#7B1128] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-[#d4af37]" /> Add New Announcement
            </button>
          </div>
        </div>

        {/* Live TopBar Preview */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#0891b2]" /> Live Website Top
            Bar Preview
          </div>
          <div className="bg-gradient-to-r from-[#580C1F] via-[#7B1128] to-[#580C1F] text-white border border-[#d4af37]/40 rounded-2xl p-3 flex items-center justify-between shadow-md">
            <button
              onClick={() =>
                setPreviewIndex(
                  (prev) =>
                    (prev - 1 + activeAnnouncements.length) %
                    (activeAnnouncements.length || 1)
                )
              }
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide">
              {currentPreview.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-[#580C1F]">
                  {currentPreview.icon || "✨"} {currentPreview.badge}
                </span>
              )}
              <span className="font-semibold text-white/95 truncate">
                {currentPreview.text}
              </span>
              {currentPreview.sub_text && (
                <span className="px-1.5 py-0.5 rounded bg-white/15 border border-white/20 text-[#ffe29a] font-bold text-[11px]">
                  {currentPreview.sub_text}
                </span>
              )}
            </div>

            <button
              onClick={() =>
                setPreviewIndex(
                  (prev) => (prev + 1) % (activeAnnouncements.length || 1)
                )
              }
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Badge / Icon</th>
                <th className="py-3 px-4">Announcement Text</th>
                <th className="py-3 px-4">Subtext / Code</th>
                <th className="py-3 px-4">Destination Link</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingAnnouncements ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0891b2] mb-1" />
                    Loading announcements…
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No custom announcements created. Default store offers are
                    currently showing.
                  </td>
                </tr>
              ) : (
                announcements.map((item, idx) => {
                  const id = item.id || item._id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{item.display_order || idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {item.icon || "✨"} {item.badge || "OFFER"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 max-w-xs truncate">
                        {item.text}
                      </td>
                      <td className="py-3 px-4">
                        {item.sub_text ? (
                          <span className="px-2 py-0.5 bg-slate-100 font-mono text-slate-700 rounded font-semibold text-[11px]">
                            {item.sub_text}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {item.link || "/"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            item.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {item.is_active ? "● Active" : "○ Paused"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: FIRST-VISIT WELCOME OFFER MODAL
      ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              First-Time Visitor Welcome Offer Modal
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Welcome Offer Banner &amp; First-Order Discount
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Displays a beautiful promotional banner modal for first-time
              visitors with a coupon code and direct Shop Now button (does not
              force login).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={welcomeConfig.is_enabled}
                onChange={(e) =>
                  setWelcomeConfig({
                    ...welcomeConfig,
                    is_enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#580C1F] rounded accent-[#580C1F] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                {welcomeConfig.is_enabled ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Modal Active
                  </span>
                ) : (
                  <span className="text-slate-400">Modal Paused</span>
                )}
              </span>
            </label>

            <button
              type="button"
              onClick={handleSaveWelcomeModal}
              disabled={savingWelcome}
              className="px-5 py-2.5 bg-[#580C1F] hover:bg-[#7B1128] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingWelcome ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
              ) : (
                <Save className="w-4 h-4 text-[#d4af37]" />
              )}
              {savingWelcome ? "Saving..." : "Save Modal Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Offer Creation Templates */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" /> 5 Pre-Built eCommerce Offer Templates
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">1-Click Apply &amp; Customize</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      template_type: "festive-royal",
                      banner_image: "/nari_post_banner.jpg",
                      title: "Grand Festive Season Sale",
                      subtitle: "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear",
                      discount_badge: "FLAT 10% OFF",
                      coupon_code: "FESTIVE10",
                      button_text: "EXPLORE FESTIVE COLLECTION",
                      button_link: "/category/sale",
                    }))
                  }
                  className={`px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border ${
                    (welcomeConfig.template_type || "festive-royal") === "festive-royal"
                      ? "bg-amber-100/90 border-[#580C1F] text-[#580C1F] ring-2 ring-[#580C1F]/40 shadow-sm"
                      : "bg-white hover:bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="flex items-center gap-1">🌸 Festive Royal</span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">FESTIVE10</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      template_type: "new-launch",
                      banner_image: "/product_1_sky_bloom.jpg",
                      title: "New Season Designer Arrivals",
                      subtitle: "Discover Exclusive Pure Cotton & Silk Handcrafted Kurtis",
                      discount_badge: "NEW LAUNCH 15% OFF",
                      coupon_code: "NEWLAUNCH",
                      button_text: "SHOP NEW ARRIVALS",
                      button_link: "/new-arrivals",
                    }))
                  }
                  className={`px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border ${
                    welcomeConfig.template_type === "new-launch"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/40 shadow-sm"
                      : "bg-white hover:bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="flex items-center gap-1">✨ New Launch</span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">NEWLAUNCH</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      template_type: "welcome-gift",
                      banner_image: "/product_4_coral_pink.jpg",
                      title: "Welcome to Nari Pehnawa",
                      subtitle: "Get Flat ₹200 OFF on Your First Purchase Above ₹999",
                      discount_badge: "₹200 WELCOME GIFT",
                      coupon_code: "WELCOME200",
                      button_text: "CLAIM WELCOME GIFT",
                      button_link: "/category/anarkali-kurtis",
                    }))
                  }
                  className={`px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border ${
                    welcomeConfig.template_type === "welcome-gift"
                      ? "bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-500/40 shadow-sm"
                      : "bg-white hover:bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="flex items-center gap-1">🎁 First Order</span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">WELCOME200</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      template_type: "flash-sale",
                      banner_image: "/product_3_black_floral.jpg",
                      title: "Mega Flash Deal: Limited Stock",
                      subtitle: "Up to 40% OFF on Best Selling Ethnic Sets & Kurtas",
                      discount_badge: "UP TO 40% OFF",
                      coupon_code: "FLASH40",
                      button_text: "GRAB FLASH DEAL",
                      button_link: "/category/sale",
                    }))
                  }
                  className={`px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border ${
                    welcomeConfig.template_type === "flash-sale"
                      ? "bg-rose-50 border-rose-600 text-rose-950 ring-2 ring-rose-500/40 shadow-sm"
                      : "bg-white hover:bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="flex items-center gap-1">⚡ Flash Deal</span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">FLASH40</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      template_type: "free-shipping",
                      banner_image: "/product_2_olive_bloom.jpg",
                      title: "Pan-India Free Express Shipping",
                      subtitle: "Zero Shipping Charges & Cash on Delivery on All Orders Above ₹499",
                      discount_badge: "FREE EXPRESS SHIPPING",
                      coupon_code: "FREESHIP",
                      button_text: "START SHOPPING NOW",
                      button_link: "/new-arrivals",
                    }))
                  }
                  className={`px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border col-span-2 sm:col-span-1 ${
                    welcomeConfig.template_type === "free-shipping"
                      ? "bg-sky-50 border-sky-600 text-sky-950 ring-2 ring-sky-500/40 shadow-sm"
                      : "bg-white hover:bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="flex items-center gap-1">🚚 Free Shipping</span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">FREESHIP</span>
                </button>
              </div>
            </div>

            {/* Banner Image Selection */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#580C1F]" /> Offer Banner Image
                </label>
                {welcomeConfig.banner_image && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Image Loaded
                  </span>
                )}
              </div>

              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white p-1">
                <button
                  type="button"
                  onClick={() => setWelcomeImgTab("upload")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    welcomeImgTab === "upload"
                      ? "bg-[#580C1F] text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1" /> Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeImgTab("url")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    welcomeImgTab === "url"
                      ? "bg-[#580C1F] text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 inline mr-1" /> Image URL / Path
                </button>
              </div>

              {welcomeImgTab === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-[#580C1F] rounded-2xl text-xs font-bold text-slate-600 hover:text-[#580C1F] transition flex flex-col items-center justify-center gap-1 bg-white cursor-pointer"
                  >
                    {uploadingImg ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#580C1F]" />
                    ) : (
                      <Upload className="w-5 h-5 text-[#580C1F]" />
                    )}
                    <span>
                      {uploadingImg
                        ? "Uploading banner..."
                        : "Click to choose and upload promotional banner"}
                    </span>
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={welcomeConfig.banner_image || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      banner_image: e.target.value,
                    })
                  }
                  placeholder="/nari_post_banner.jpg or https://..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              )}

              {welcomeConfig.banner_image && (
                <div className="relative h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-between px-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImageUrl(welcomeConfig.banner_image, "/nari_post_banner.jpg")}
                      alt=""
                      className="w-24 h-14 object-cover rounded-lg border border-slate-300"
                      onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                        {welcomeConfig.banner_image.split("/").pop()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Active Banner Image
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Offer Title
                </label>
                <input
                  type="text"
                  value={welcomeConfig.title || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      title: e.target.value,
                    })
                  }
                  placeholder="Grand Festive Season Sale"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Discount Badge
                </label>
                <input
                  type="text"
                  value={welcomeConfig.discount_badge || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      discount_badge: e.target.value,
                    })
                  }
                  placeholder="FLAT 10% OFF"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Offer Subtitle
              </label>
              <input
                type="text"
                value={welcomeConfig.subtitle || ""}
                onChange={(e) =>
                  setWelcomeConfig({
                    ...welcomeConfig,
                    subtitle: e.target.value,
                  })
                }
                placeholder="Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#580C1F]"
              />
            </div>

            {/* Coupon Code & Button Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Coupon Code (1-Click Copy)
                </label>
                <input
                  type="text"
                  value={welcomeConfig.coupon_code || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      coupon_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="FESTIVE10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#580C1F] focus:outline-none focus:border-[#580C1F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={welcomeConfig.button_text || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      button_text: e.target.value,
                    })
                  }
                  placeholder="EXPLORE COLLECTION"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Destination Link
                </label>
                <input
                  type="text"
                  value={welcomeConfig.button_link || ""}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      button_link: e.target.value,
                    })
                  }
                  placeholder="/new-arrivals or /category/sale"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Popup Delay (Seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={welcomeConfig.delay_seconds || 3}
                  onChange={(e) =>
                    setWelcomeConfig({
                      ...welcomeConfig,
                      delay_seconds: parseInt(e.target.value, 10) || 3,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>
            </div>
          </div>

          {/* Live Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#0891b2]" /> Live Modal Interactive Preview
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-mono">
                Theme: {welcomeConfig.template_type || "festive-royal"}
              </span>
            </div>

            <div className="bg-slate-950 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800 relative overflow-hidden">
              {/* 1. Festive Royal Preview */}
              {(welcomeConfig.template_type || "festive-royal") === "festive-royal" && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-[#d4af37]/70 bg-gradient-to-br from-[#3d0815] via-[#580C1F] to-[#20040b] min-h-[360px] flex flex-col sm:flex-row text-left text-white">
                  {/* Left Poster */}
                  <div className="w-full sm:w-5/12 h-36 sm:h-auto relative overflow-hidden flex-shrink-0 bg-black">
                    <img
                      src={resolveImageUrl(welcomeConfig.banner_image, "/nari_post_banner.jpg")}
                      alt=""
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/70 sm:from-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Right Text Content */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <div className="text-[10px] text-[#ffe29a] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#d4af37]" /> Festive Edition
                      </div>
                      <h4 className="font-black font-serif text-white text-base leading-tight">
                        {welcomeConfig.title || "Grand Festive Season Sale"}
                      </h4>
                      <p className="text-[10px] text-amber-100/85 leading-relaxed">
                        {welcomeConfig.subtitle}
                      </p>
                    </div>

                    {welcomeConfig.coupon_code && (
                      <div className="p-2 bg-black/50 border border-dashed border-[#d4af37] rounded-xl flex items-center justify-between px-2.5">
                        <div>
                          <div className="text-[8px] font-bold text-[#ffe29a]">OFFER CODE</div>
                          <div className="text-xs font-black font-mono text-white">{welcomeConfig.coupon_code}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-[#d4af37] text-[#580C1F] text-[9px] font-bold rounded">
                          COPY
                        </span>
                      </div>
                    )}

                    <button className="w-full py-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#580C1F] rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1">
                      <span>{welcomeConfig.button_text || "EXPLORE FESTIVE COLLECTION"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. New Launch Preview */}
              {welcomeConfig.template_type === "new-launch" && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-emerald-500/50 min-h-[360px] flex flex-col text-center bg-slate-950">
                  {/* Top Image */}
                  <div className="w-full h-40 sm:h-44 relative overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={resolveImageUrl(welcomeConfig.banner_image, "/product_1_sky_bloom.jpg")}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.target.src = "/product_1_sky_bloom.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Bottom Content */}
                  <div className="p-3.5 space-y-2 text-white bg-slate-950">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> New Season Arrivals
                    </div>
                    <h4 className="font-black text-white text-base leading-tight">
                      {welcomeConfig.title || "New Season Designer Arrivals"}
                    </h4>
                    <p className="text-[10px] text-slate-300">
                      {welcomeConfig.subtitle}
                    </p>
                    {welcomeConfig.coupon_code && (
                      <div className="flex items-center justify-between max-w-xs mx-auto p-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2.5">
                        <span className="text-[9px] text-emerald-400 font-bold">CODE: {welcomeConfig.coupon_code}</span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded">COPY</span>
                      </div>
                    )}
                    <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1">
                      <span>{welcomeConfig.button_text || "SHOP NEW ARRIVALS"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Flash Sale Preview */}
              {welcomeConfig.template_type === "flash-sale" && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-rose-600 min-h-[360px] flex flex-col justify-between text-center group">
                  <img
                    src={resolveImageUrl(welcomeConfig.banner_image, "/product_3_black_floral.jpg")}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => { e.target.src = "/product_3_black_floral.jpg"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/50 pointer-events-none" />

                  {/* Urgent Header */}
                  <div className="relative z-10 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-black py-1 px-3 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md">
                    <Flame className="w-3.5 h-3.5 animate-bounce text-black" /> FLASH DEAL: LIMITED HOURS
                  </div>

                  <div className="relative z-10 p-4 space-y-2 text-white">
                    <h4 className="font-black text-white text-lg uppercase leading-tight">
                      {welcomeConfig.title || "Mega Flash Deal: Limited Stock"}
                    </h4>
                    <p className="text-[10px] text-rose-100/90">
                      {welcomeConfig.subtitle}
                    </p>
                    {welcomeConfig.coupon_code && (
                      <div className="max-w-xs mx-auto p-2 bg-black/60 backdrop-blur-md border border-dashed border-rose-500 rounded-xl flex items-center justify-between px-3">
                        <span className="text-[9px] text-rose-300 font-bold uppercase">CODE: {welcomeConfig.coupon_code}</span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded">COPY</span>
                      </div>
                    )}
                    <button className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{welcomeConfig.button_text || "GRAB FLASH DEAL"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Welcome Gift Preview */}
              {welcomeConfig.template_type === "welcome-gift" && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-purple-400/50 bg-gradient-to-b from-[#181124] via-[#241738] to-[#0f0919] min-h-[360px] flex flex-col justify-between text-center p-4 text-white">
                  {/* Framed Image */}
                  <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-purple-500 via-amber-300 to-pink-500 shadow-lg overflow-hidden">
                    <img
                      src={resolveImageUrl(welcomeConfig.banner_image, "/product_4_coral_pink.jpg")}
                      alt=""
                      className="w-full h-full object-cover object-top rounded-full"
                      onError={(e) => { e.target.src = "/product_4_coral_pink.jpg"; }}
                    />
                  </div>

                  <div className="space-y-1 my-auto">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1">
                      <Gift className="w-3 h-3 text-amber-300" /> First Order Special Welcome
                    </div>
                    <h4 className="font-black text-white text-base">
                      {welcomeConfig.title || "Welcome to Nari Pehnawa"}
                    </h4>
                    <p className="text-[10px] text-purple-100/80">
                      {welcomeConfig.subtitle}
                    </p>
                    {welcomeConfig.coupon_code && (
                      <div className="p-2 bg-purple-950/60 border border-dashed border-amber-300/70 rounded-xl flex items-center justify-between px-3">
                        <span className="text-[9px] text-amber-200 font-mono font-bold">VOUCHER: {welcomeConfig.coupon_code}</span>
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded">COPY</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1">
                    <span>{welcomeConfig.button_text || "CLAIM WELCOME GIFT"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* 5. Free Shipping Preview */}
              {welcomeConfig.template_type === "free-shipping" && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-sky-400/60 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 min-h-[360px] flex flex-col sm:flex-row text-left text-white">
                  {/* Left Image */}
                  <div className="w-full sm:w-5/12 h-36 sm:h-auto relative overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={resolveImageUrl(welcomeConfig.banner_image, "/product_2_olive_bloom.jpg")}
                      alt=""
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { e.target.src = "/product_2_olive_bloom.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Right Content */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Pan-India Express Delivery
                      </div>
                      <h4 className="font-black text-white text-base leading-tight">
                        {welcomeConfig.title || "Pan-India Free Express Shipping"}
                      </h4>
                      <p className="text-[10px] text-sky-100/85">
                        {welcomeConfig.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                      <div className="p-1 bg-sky-950/60 border border-sky-500/30 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-400" /> Free Shipping
                      </div>
                      <div className="p-1 bg-sky-950/60 border border-sky-500/30 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Zero COD
                      </div>
                    </div>

                    {welcomeConfig.coupon_code && (
                      <div className="p-1.5 bg-sky-950/70 border border-dashed border-sky-400 rounded-lg flex items-center justify-between px-2">
                        <span className="text-[9px] text-sky-300 font-mono font-bold">CODE: {welcomeConfig.coupon_code}</span>
                        <span className="px-2 py-0.5 bg-sky-400 text-slate-950 text-[9px] font-bold rounded">COPY</span>
                      </div>
                    )}

                    <button className="w-full py-2 bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1">
                      <span>{welcomeConfig.button_text || "START SHOPPING NOW"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: ADD / EDIT ANNOUNCEMENT
      ═══════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#580C1F]" />
                {editingItem ? "Edit Announcement" : "Create New Announcement"}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Main Announcement Text *
                </label>
                <input
                  type="text"
                  required
                  value={announcementForm.text}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      text: e.target.value,
                    })
                  }
                  placeholder="🌸 Grand Festive Sale: Flat 10% OFF on First Order"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={announcementForm.badge}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        badge: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="FESTIVE / SALE / NEW"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Icon / Emoji
                  </label>
                  <input
                    type="text"
                    value={announcementForm.icon}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        icon: e.target.value,
                      })
                    }
                    placeholder="✨ or 🎁 or 🚚"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#580C1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Subtext / Coupon Code
                  </label>
                  <input
                    type="text"
                    value={announcementForm.sub_text}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        sub_text: e.target.value,
                      })
                    }
                    placeholder="Use Code: FESTIVE10"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#580C1F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={announcementForm.display_order}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        display_order: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#580C1F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Destination Link
                </label>
                <input
                  type="text"
                  value={announcementForm.link}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      link: e.target.value,
                    })
                  }
                  placeholder="/category/sale or /new-arrivals"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#580C1F]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_active}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#580C1F] rounded accent-[#580C1F]"
                  />
                  <span>Active &amp; Visible on Top Bar</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#580C1F] hover:bg-[#7B1128] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                  >
                    {editingItem ? "Update Announcement" : "Create Announcement"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsModal;
