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

  // Mystery Jewelry Jar Launching Offer Config state
  const [mysteryJarConfig, setMysteryJarConfig] = useState({
    is_enabled: true,
    show_in_topbar: true,
    ticker_text: "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!",
    pill_text: "Free Mystery Jewellery Jar",
    pill_subtext: "View Gift →",
    image_url: "/mystery_jewelry_jar.jpg",
    title: "Free Mystery Jewellery Jar 🎁",
    overlay_text: "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!",
    description: "Receive this handcrafted luxury glass jar with red ribbon, filled with premium surprise jewelry inside with your delivery parcel!",
    button_text: "Shop Now & Claim Gift",
    button_link: "/new-arrivals",
  });
  const [savingJar, setSavingJar] = useState(false);
  const [uploadingJarImg, setUploadingJarImg] = useState(false);
  const jarFileInputRef = useRef(null);

  // Top Bar preview rotation
  const [previewIndex, setPreviewIndex] = useState(0);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
    }`,
  });

  // Fetch Announcements, Welcome Modal, & Mystery Jar config
  const fetchAllData = async () => {
    setLoadingAnnouncements(true);
    try {
      const [annRes, welRes, topRes, jarRes] = await Promise.all([
        fetch(`${API_BASE}/announcements/all`, { headers: authHeaders() }),
        fetch(`${API_BASE}/announcements/welcome-modal`),
        fetch(`${API_BASE}/announcements/topbar-settings`),
        fetch(`${API_BASE}/announcements/mystery-jar`),
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
      if (jarRes.ok) {
        const jarData = await jarRes.json();
        if (jarData) setMysteryJarConfig((prev) => ({ ...prev, ...jarData }));
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
      localStorage.setItem("np_topbar_active", String(enableState));
      window.dispatchEvent(new Event("np_announcements_updated"));
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
      badge: "",
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
      window.dispatchEvent(new Event("np_announcements_updated"));
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
        window.dispatchEvent(new Event("np_announcements_updated"));
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
        window.dispatchEvent(new Event("np_announcements_updated"));
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
      localStorage.setItem("np_welcome_modal", JSON.stringify(welcomeConfig));
      window.dispatchEvent(new Event("np_welcome_modal_updated"));
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

  // ── MYSTERY JEWELRY JAR LAUNCHING OFFER ACTIONS ──
  const handleSaveMysteryJar = async (e) => {
    if (e) e.preventDefault();
    setSavingJar(true);
    try {
      const res = await fetch(`${API_BASE}/announcements/mystery-jar`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(mysteryJarConfig),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save mystery jar settings");
      }
      localStorage.setItem("np_mystery_jar", JSON.stringify(mysteryJarConfig));
      window.dispatchEvent(new Event("np_mystery_jar_updated"));
      window.dispatchEvent(new Event("np_announcements_updated"));
      await fetchAllData();
      alert("Mystery Jewelry Jar Launching Offer and Top Bar Ticker updated successfully!");
    } catch (e) {
      alert(e.message || "Error saving mystery jar settings");
    } finally {
      setSavingJar(false);
    }
  };

  const handleJarImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingJarImg(true);
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
        setMysteryJarConfig((prev) => ({ ...prev, image_url: url }));
        alert("Jar image uploaded successfully!");
      }
    } catch (e) {
      alert(`Image upload failed: ${e.message}`);
    } finally {
      setUploadingJarImg(false);
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
                <th className="py-3 px-4">Sequence</th>
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
            {/* Quick Offer Creation Presets */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B0000]" /> 4 Pre-Built Banner Offer Presets
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">1-Click Apply &amp; Customize</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      banner_image: "/nari_post_banner.jpg",
                      title: "Grand Festive Season Sale",
                      subtitle: "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear",
                      coupon_code: "FESTIVE10",
                      button_text: "Explore Collection",
                      button_link: "/category/sale",
                    }))
                  }
                  className="px-2.5 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border bg-white hover:bg-neutral-50 border-slate-200 text-slate-800"
                >
                  <span className="flex items-center gap-1">🌸 Festive Sale</span>
                  <span className="text-[10px] text-[#8B0000] font-mono font-bold">FESTIVE10</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      banner_image: "/product_1_sky_bloom.jpg",
                      title: "New Season Designer Arrivals",
                      subtitle: "Discover Exclusive Pure Cotton & Silk Handcrafted Kurtis",
                      coupon_code: "NEWLAUNCH",
                      button_text: "Shop New Arrivals",
                      button_link: "/new-arrivals",
                    }))
                  }
                  className="px-2.5 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border bg-white hover:bg-neutral-50 border-slate-200 text-slate-800"
                >
                  <span className="flex items-center gap-1">✨ New Arrivals</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">NEWLAUNCH</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      banner_image: "/product_4_coral_pink.jpg",
                      title: "Welcome to Nari Pehnawa",
                      subtitle: "Get Flat ₹200 OFF on Your First Purchase Above ₹999",
                      coupon_code: "WELCOME200",
                      button_text: "Claim Welcome Gift",
                      button_link: "/category/anarkali-kurtis",
                    }))
                  }
                  className="px-2.5 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border bg-white hover:bg-neutral-50 border-slate-200 text-slate-800"
                >
                  <span className="flex items-center gap-1">🎁 Welcome Gift</span>
                  <span className="text-[10px] text-purple-700 font-mono font-bold">WELCOME200</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWelcomeConfig((prev) => ({
                      ...prev,
                      banner_image: "/product_3_black_floral.jpg",
                      title: "Exclusive Seasonal Sale",
                      subtitle: "Up to 40% OFF on Bestselling Ethnic Suits & Kurtis",
                      coupon_code: "SALE40",
                      button_text: "Shop Sale Collection",
                      button_link: "/category/sale",
                    }))
                  }
                  className="px-2.5 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 text-center shadow-xs cursor-pointer border bg-white hover:bg-neutral-50 border-slate-200 text-slate-800"
                >
                  <span className="flex items-center gap-1">🏷️ Season Sale</span>
                  <span className="text-[10px] text-rose-700 font-mono font-bold">SALE40</span>
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
            <div className="space-y-4">
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
                  Offer Subtitle / Description
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
            </div>

            {/* Coupon Code & Button Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Coupon Code (Optional)
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
                  placeholder="Explore Collection"
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                Clean Banner Layout
              </span>
            </div>

            <div className="bg-slate-100 rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-200 relative overflow-hidden flex justify-center">
              {/* Clean Modern Banner Modal Preview */}
              <div className="w-full max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 text-left">
                {/* Banner Image */}
                <div className="w-full h-40 bg-neutral-100 overflow-hidden relative">
                  <img
                    src={resolveImageUrl(welcomeConfig.banner_image, "/nari_post_banner.jpg")}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/nari_post_banner.jpg"; }}
                  />
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5 bg-white">
                  <div>
                    <h4 className="text-sm font-black font-serif text-gray-900 leading-tight">
                      {welcomeConfig.title || "Special Offer"}
                    </h4>
                    {welcomeConfig.subtitle && (
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        {welcomeConfig.subtitle}
                      </p>
                    )}
                  </div>

                  {welcomeConfig.coupon_code && (
                    <div className="flex items-center justify-between py-1.5 px-2.5 bg-neutral-50 rounded-lg border border-gray-200 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Code:</span>
                        <span className="font-mono font-bold text-gray-900">
                          {welcomeConfig.coupon_code}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8B0000]">COPY</span>
                    </div>
                  )}

                  <button className="w-full py-2 bg-[#8B0000] text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1 cursor-pointer">
                    <span>{welcomeConfig.button_text || "Explore Collection"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: MYSTERY JEWELRY JAR LAUNCHING OFFER
      ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Gift className="w-3.5 h-3.5 text-amber-700" />
              Launching Offer: Mystery Jewelry Jar
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Homepage Slider Button &amp; Compact Popup Modal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the rectangular offer box displayed on the homepage slider and the compact gift modal on click.
            </p>
          </div>

          {/* Master Offer Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              {mysteryJarConfig.is_enabled ? "Offer Active" : "Offer Paused"}
            </span>
            <button
              type="button"
              onClick={() =>
                setMysteryJarConfig((prev) => ({
                  ...prev,
                  is_enabled: !prev.is_enabled,
                }))
              }
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                mysteryJarConfig.is_enabled ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  mysteryJarConfig.is_enabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <form onSubmit={handleSaveMysteryJar} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Slider Box Main Text
                </label>
                <input
                  type="text"
                  value={mysteryJarConfig.pill_text}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, pill_text: e.target.value })
                  }
                  placeholder="Free Mystery Jewelry Jar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Slider Box Subtext / Tag
                </label>
                <input
                  type="text"
                  value={mysteryJarConfig.pill_subtext}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, pill_subtext: e.target.value })
                  }
                  placeholder="Top 5 Daily Orders"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Modal Heading / Title
              </label>
              <input
                type="text"
                value={mysteryJarConfig.title}
                onChange={(e) =>
                  setMysteryJarConfig({ ...mysteryJarConfig, title: e.target.value })
                }
                placeholder="Free Mystery Jewelry Jar 🎁"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Image Overlay Text (Displayed on Jar Photo)
              </label>
              <input
                type="text"
                value={mysteryJarConfig.overlay_text}
                onChange={(e) =>
                  setMysteryJarConfig({ ...mysteryJarConfig, overlay_text: e.target.value })
                }
                placeholder="Top 5 Orders of the Day Get a Free Mystery Jewelry Jar!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Offer Description / Eligibility Details
              </label>
              <textarea
                rows={2}
                value={mysteryJarConfig.description}
                onChange={(e) =>
                  setMysteryJarConfig({ ...mysteryJarConfig, description: e.target.value })
                }
                placeholder="Place an order today among the top 5 daily orders and receive this surprise handcrafted luxury jewelry jar with your parcel!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Jar Image Upload & Path */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Jewelry Jar Image (Upload or URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mysteryJarConfig.image_url}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, image_url: e.target.value })
                  }
                  placeholder="/mystery_jewelry_jar.jpg or image URL"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => jarFileInputRef.current?.click()}
                  disabled={uploadingJarImg}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingJarImg ? "Uploading…" : "Upload Jar"}</span>
                </button>
                <input
                  type="file"
                  ref={jarFileInputRef}
                  onChange={handleJarImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={mysteryJarConfig.button_text}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, button_text: e.target.value })
                  }
                  placeholder="Shop Now & Claim Gift"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CTA Button Link
                </label>
                <input
                  type="text"
                  value={mysteryJarConfig.button_link}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, button_link: e.target.value })
                  }
                  placeholder="/new-arrivals or /category/anarkali-kurtis"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Top Bar Ticker Auto-Sync Section */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mysteryJarConfig.show_in_topbar !== false}
                    onChange={(e) =>
                      setMysteryJarConfig({
                        ...mysteryJarConfig,
                        show_in_topbar: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#580C1F] rounded focus:ring-0 cursor-pointer accent-[#580C1F]"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📢</span> Show in Website Top Bar Ticker (जैसे ही ऑफर चालू हो, टॉप बार में भी दिखे)
                  </span>
                </label>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                  Live Sync
                </span>
              </div>

              {mysteryJarConfig.show_in_topbar !== false && (
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Custom Top Bar Ticker Message (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={mysteryJarConfig.ticker_text ?? ""}
                    onChange={(e) =>
                      setMysteryJarConfig({
                        ...mysteryJarConfig,
                        ticker_text: e.target.value,
                      })
                    }
                    placeholder={mysteryJarConfig.overlay_text || "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!"}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-600"
                  />
                  {/* Mini Ticker Preview */}
                  <div className="bg-gradient-to-r from-[#580C1F] via-[#7B1128] to-[#580C1F] text-white p-2 rounded-xl text-[11px] flex items-center justify-center gap-2 shadow-xs border border-[#d4af37]/30">
                    <span>🎁</span>
                    <span className="font-semibold truncate">
                      {mysteryJarConfig.ticker_text || mysteryJarConfig.overlay_text || "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!"}
                    </span>
                    <span className="bg-black/30 text-[#ffe29a] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                      CLAIM GIFT 🎁
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingJar}
                className="w-full py-3 bg-[#580C1F] hover:bg-[#7B1128] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingJar ? "Saving Settings…" : "Save Mystery Jar Offer & Sync Top Bar"}</span>
              </button>
            </div>
          </form>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                Slider Box &amp; Card Modal
              </span>
            </div>

            <div className="bg-slate-100 rounded-3xl p-4 border border-slate-200 space-y-4 text-center">
              {/* Slider Button Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block text-left">Slider Box (Above Dots)</span>
                <div className="inline-flex items-center gap-3 bg-white text-gray-900 border border-black/85 shadow-md rounded-2xl py-2 px-4 text-left">
                  <span className="text-2xl leading-none select-none">🎁</span>
                  <div>
                    <div className="text-xs font-black text-gray-900 leading-tight">
                      {mysteryJarConfig.pill_text || "Free Mystery Jewellery Jar"}
                    </div>
                    <div className="text-[11px] text-[#8B0000] font-bold mt-0.5">
                      <span>View Gift &rarr;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact 200px-style Card Modal Preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block text-left">Compact Card Modal Preview</span>
                <div className="max-w-[280px] mx-auto bg-white rounded-2xl overflow-hidden shadow-xl border border-black/80 text-left">
                  {/* Image with overlay text */}
                  <div className="relative w-full h-44 bg-black">
                    <img
                      src={resolveImageUrl(mysteryJarConfig.image_url, "/mystery_jewelry_jar.jpg")}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "/mystery_jewelry_jar.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="text-[9px] font-black uppercase tracking-wider text-[#ffe29a] bg-[#8B0000]/90 px-1.5 py-0.5 rounded inline-block mb-1">
                        🎁 DAILY TOP 5 ORDERS
                      </div>
                      <h5 className="text-xs font-bold leading-tight drop-shadow">
                        {mysteryJarConfig.overlay_text || "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!"}
                      </h5>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-[10px] text-gray-600 line-clamp-2">
                      {mysteryJarConfig.description}
                    </p>
                    <button className="w-full py-2 bg-[#8B0000] text-white rounded-lg text-xs font-bold shadow text-center flex items-center justify-center gap-1">
                      <span>{mysteryJarConfig.button_text || "Shop Now & Claim Gift"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
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
                    Display Sequence / Position
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
