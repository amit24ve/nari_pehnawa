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
  Check,
  Eye,
  CheckCircle,
  X,
  ArrowRight,
  ShoppingBag,
  Gift,
  Flame,
  Zap,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Search,
  Calendar,
  Layers,
  Percent,
  Play,
  Pause
} from "lucide-react";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const AdminAnnouncementsModal = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("topbar"); // 'topbar' | 'launch_offer' | 'flash_sale' | 'coupons' | 'welcome_modal'

  // Global Toast / Feedback
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
    }`,
  });

  // Shared Data: Categories & Products
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/categories/?is_active=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((cats) => {
        if (Array.isArray(cats)) setAvailableCategories(cats);
      })
      .catch(() => {});

    fetch(`${API_BASE}/products/?limit=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((prods) => {
        if (Array.isArray(prods)) setAvailableProducts(prods);
      })
      .catch(() => {});
  }, []);

  /* ─────────────────────────────────────────────────────────────
     TAB 1: TOP BAR ANNOUNCEMENTS SLIDER
  ───────────────────────────────────────────────────────────── */
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [topbarEnabled, setTopbarEnabled] = useState(true);
  const [togglingTopbar, setTogglingTopbar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    text: "",
    sub_text: "",
    link: "/new-arrivals",
    badge: "",
    icon: "✨",
    is_active: true,
    display_order: 1,
  });
  const [previewIndex, setPreviewIndex] = useState(0);

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const [annRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/announcements/all`, { headers: authHeaders() }),
        fetch(`${API_BASE}/announcements/topbar-settings`),
      ]);
      if (annRes.ok) {
        const data = await annRes.json();
        if (Array.isArray(data)) setAnnouncements(data);
      }
      if (topRes.ok) {
        const topData = await topRes.json();
        setTopbarEnabled(topData.is_enabled !== false);
      }
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
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
      showToast(enableState ? "Top Bar activated on store!" : "Top Bar disabled on store.");
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    } finally {
      setTogglingTopbar(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setAnnouncementForm({
      text: "",
      sub_text: "",
      link: "/new-arrivals",
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
      link: item.link || "/new-arrivals",
      badge: item.badge || "",
      icon: item.icon || "✨",
      is_active: item.is_active !== false,
      display_order: item.display_order || 1,
    });
    setShowAddModal(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.text.trim()) {
      alert("Announcement text is required");
      return;
    }

    try {
      let endpoint = `${API_BASE}/announcements/`;
      let method = "POST";
      const id = editingItem ? editingItem.id || editingItem._id : null;

      if (id) {
        endpoint = `${API_BASE}/announcements/${id}`;
        method = "PUT";
      }

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(announcementForm),
      });

      if (!res.ok) throw new Error("Failed to save announcement");
      const saved = await res.json();

      if (id) {
        setAnnouncements((prev) =>
          prev.map((a) => ((a.id || a._id) === id ? saved : a))
        );
        showToast("Announcement slide updated!");
      } else {
        setAnnouncements((prev) => [...prev, saved]);
        showToast("New announcement slide added!");
      }

      setShowAddModal(false);
      window.dispatchEvent(new Event("np_announcements_updated"));
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleToggleItemStatus = async (item) => {
    const id = item.id || item._id;
    const newStatus = !item.is_active;

    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");

      setAnnouncements((prev) =>
        prev.map((a) =>
          (a.id || a._id) === id ? { ...a, is_active: newStatus } : a
        )
      );
      window.dispatchEvent(new Event("np_announcements_updated"));
      showToast(newStatus ? "Slide activated!" : "Slide paused.");
    } catch (e) {
      alert(`Toggle failed: ${e.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this announcement slide permanently?")) return;

    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");

      setAnnouncements((prev) => prev.filter((a) => (a.id || a._id) !== id));
      window.dispatchEvent(new Event("np_announcements_updated"));
      showToast("Announcement slide deleted.");
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  // Auto-rotate live preview
  useEffect(() => {
    const activeList = announcements.filter((a) => a.is_active);
    if (activeList.length <= 1) return;
    const t = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeList.length);
    }, 4000);
    return () => clearInterval(t);
  }, [announcements]);

  /* ─────────────────────────────────────────────────────────────
     TAB 2: GRAND LAUNCH OFFER (MYSTERY JAR + FREE JHUMKA)
  ───────────────────────────────────────────────────────────── */
  const [mysteryJarConfig, setMysteryJarConfig] = useState({
    is_enabled: true,
    show_in_topbar: true,
    ticker_text: "Grand Launch Offer: First 5 Orders Get a Free Mystery Jewellery Jar! 🎁",
    pill_text: "Free Mystery Jewellery Jar",
    pill_subtext: "View Gift →",
    image_url: "/mystery_jewelry_jar.webp",
    title: "Free Mystery Jewellery Jar 🎁",
    overlay_text: "First 5 Customer Orders Get a Free Handcrafted Mystery Jewellery Jar!",
    description: "Grand Launching Celebration: The first 5 customer orders receive a handcrafted luxury glass jar filled with surprise jewelry! PLUS, receive a complimentary matching Jhumka Set with every single kurti in your order!",
    button_text: "Shop Kurtis & Claim Gift",
    button_link: "/new-arrivals",
  });
  const [savingJar, setSavingJar] = useState(false);
  const [uploadingJarImg, setUploadingJarImg] = useState(false);
  const jarFileInputRef = useRef(null);

  const fetchJarData = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements/mystery-jar`);
      if (res.ok) {
        const data = await res.json();
        if (data) setMysteryJarConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load jar config", e);
    }
  };

  const handleSaveMysteryJar = async (e) => {
    e.preventDefault();
    setSavingJar(true);
    try {
      const res = await fetch(`${API_BASE}/announcements/mystery-jar`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(mysteryJarConfig),
      });
      if (!res.ok) throw new Error("Failed to update Grand Launch offer");
      const saved = await res.json();
      setMysteryJarConfig((prev) => ({ ...prev, ...saved }));
      window.dispatchEvent(new Event("np_mystery_jar_updated"));
      window.dispatchEvent(new Event("np_announcements_updated"));
      showToast("Grand Launch Offer updated successfully!");
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSavingJar(false);
    }
  };

  const handleUploadJarImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingJarImg(true);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
          }`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE.replace(/\/api\/?$/, "")}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
      setMysteryJarConfig((prev) => ({ ...prev, image_url: fullUrl }));
      showToast("Gift image uploaded!");
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingJarImg(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     TAB 3: FLASH SALE & EVENTS MANAGER
  ───────────────────────────────────────────────────────────── */
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [flashSaleConfig, setFlashSaleConfig] = useState({
    is_active: true,
    title: "Grand Festive Flash Sale",
    subtitle: "Exclusive Handcrafted Luxury Ethnic Wear",
    deal_type: "percentage",
    deal_text: "",
    buy_qty: 1,
    get_free_qty: 1,
    discount_percentage: 30,
    target_type: "all",
    target_category: "",
    target_product_ids: [],
    start_time: "",
    end_time: "",
    banner_image: "",
  });
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [saleImgTab, setSaleImgTab] = useState("upload");
  const [saleUploading, setSaleUploading] = useState(false);
  const saleFileInputRef = useRef(null);
  const [customProductSearch, setCustomProductSearch] = useState("");

  const fetchFlashSales = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        fetch(`${API_BASE}/admin/flash-sales`, { headers: authHeaders() }),
        fetch(`${API_BASE}/admin/flash-sale`),
      ]);
      if (allRes.ok) {
        const data = await allRes.json();
        if (Array.isArray(data)) setAllCampaigns(data);
      }
      if (activeRes.ok) {
        const data = await activeRes.json();
        if (data && data.key === "active_sale") setFlashSaleConfig(data);
      }
    } catch (e) {
      console.error("Failed to load flash sale data", e);
    }
  };

  const handleOpenNewCampaign = () => {
    setEditingCampaignId("new");
    setFlashSaleConfig({
      is_active: true,
      title: "Grand Launch Flash Deal",
      subtitle: "Limited Time Exclusive Offer on Handcrafted Kurtis",
      deal_type: "percentage",
      deal_text: "FLAT 30% OFF",
      buy_qty: 1,
      get_free_qty: 1,
      discount_percentage: 30,
      target_type: "all",
      target_category: "",
      target_product_ids: [],
      start_time: new Date().toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      banner_image: "",
    });
    setShowCampaignModal(true);
  };

  const handleOpenEditCampaign = (camp) => {
    const cId = camp.id || camp._id;
    setEditingCampaignId(cId);
    setFlashSaleConfig({
      is_active: camp.is_active !== false,
      title: camp.title || "",
      subtitle: camp.subtitle || "",
      deal_type: camp.deal_type || "percentage",
      deal_text: camp.deal_text || "",
      buy_qty: camp.buy_qty || 1,
      get_free_qty: camp.get_free_qty || 1,
      discount_percentage: camp.discount_percentage || 30,
      target_type: camp.target_type || "all",
      target_category: camp.target_category || "",
      target_product_ids: camp.target_product_ids || [],
      start_time: camp.start_time ? camp.start_time.slice(0, 16) : "",
      end_time: camp.end_time ? camp.end_time.slice(0, 16) : "",
      banner_image: camp.banner_image || "",
    });
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setFlashSaleLoading(true);
    try {
      let endpoint = `${API_BASE}/admin/flash-sales`;
      let method = "POST";

      if (editingCampaignId && editingCampaignId !== "new") {
        endpoint = `${API_BASE}/admin/flash-sales/${editingCampaignId}`;
        method = "PUT";
      }

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(flashSaleConfig),
      });

      if (!res.ok) throw new Error("Failed to save flash sale campaign");
      await fetchFlashSales();
      setShowCampaignModal(false);
      showToast("Flash sale campaign saved successfully!");
    } catch (e) {
      alert(`Save error: ${e.message}`);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Delete this promotional campaign?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sales/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchFlashSales();
      showToast("Campaign deleted.");
    } catch (e) {
      alert(`Delete error: ${e.message}`);
    }
  };

  const handleToggleCampaignStatus = async (camp) => {
    const id = camp.id || camp._id;
    const newStatus = !camp.is_active;
    try {
      const res = await fetch(`${API_BASE}/admin/flash-sales/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...camp, is_active: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchFlashSales();
      showToast(newStatus ? "Campaign activated!" : "Campaign paused.");
    } catch (e) {
      alert(`Toggle failed: ${e.message}`);
    }
  };

  const handleUploadSaleBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setSaleUploading(true);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
          }`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE.replace(/\/api\/?$/, "")}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
      setFlashSaleConfig((prev) => ({ ...prev, banner_image: fullUrl }));
      showToast("Banner image uploaded!");
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setSaleUploading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     TAB 4: COUPONS & PROMO CODES
  ───────────────────────────────────────────────────────────── */
  const [couponsList, setCouponsList] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percent",
    value: 10,
    description: "",
    min_order_value: 0,
    max_discount: null,
    usage_limit: null,
    usage_limit_per_user: 1,
    is_active: true,
  });

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch(`${API_BASE}/coupons/`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCouponsList(data);
      }
    } catch (e) {
      console.error("Failed to fetch coupons", e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: "",
      type: "percent",
      value: 10,
      description: "Grand Launch Promo Discount",
      min_order_value: 0,
      max_discount: null,
      usage_limit: null,
      usage_limit_per_user: 1,
      is_active: true,
    });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (c) => {
    const id = c.id || c._id;
    setEditingCouponId(id);
    setCouponForm({
      code: c.code || "",
      type: c.type || "percent",
      value: c.value || 0,
      description: c.description || "",
      min_order_value: c.min_order_value || 0,
      max_discount: c.max_discount || null,
      usage_limit: c.usage_limit || null,
      usage_limit_per_user: c.usage_limit_per_user || 1,
      is_active: c.is_active !== false,
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      alert("Coupon code is required");
      return;
    }

    try {
      let endpoint = `${API_BASE}/coupons/`;
      let method = "POST";

      if (editingCouponId) {
        endpoint = `${API_BASE}/coupons/${editingCouponId}`;
        method = "PUT";
      }

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...couponForm,
          code: couponForm.code.trim().toUpperCase(),
          value: Number(couponForm.value),
          min_order_value: Number(couponForm.min_order_value || 0),
          max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null,
          usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save coupon");
      }

      await fetchCoupons();
      setShowCouponModal(false);
      showToast(editingCouponId ? "Coupon updated successfully!" : "New Coupon created!");
    } catch (e) {
      alert(`Coupon Error: ${e.message}`);
    }
  };

  const handleToggleCouponStatus = async (c) => {
    const id = c.id || c._id;
    const newStatus = !c.is_active;
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update coupon status");
      await fetchCoupons();
      showToast(newStatus ? "Coupon activated!" : "Coupon paused.");
    } catch (e) {
      alert(`Status update error: ${e.message}`);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Permanently delete this coupon?")) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCoupons();
      showToast("Coupon deleted.");
    } catch (e) {
      alert(`Delete error: ${e.message}`);
    }
  };

  const handleExportCouponsCSV = () => {
    if (!couponsList.length) {
      alert("No coupons to export");
      return;
    }
    let csv = "Coupon Code,Type,Discount Value,Min Order,Times Used,Status\n";
    couponsList.forEach((c) => {
      csv += `"${c.code}","${c.type}","${c.value}","${c.min_order_value}","${c.times_used || 0}","${c.is_active ? "Active" : "Inactive"}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nari_coupons_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  /* ─────────────────────────────────────────────────────────────
     TAB 5: WELCOME OFFER MODAL
  ───────────────────────────────────────────────────────────── */
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

  const fetchWelcomeData = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements/welcome-modal`);
      if (res.ok) {
        const data = await res.json();
        if (data) setWelcomeConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load welcome modal config", e);
    }
  };

  const handleSaveWelcome = async (e) => {
    e.preventDefault();
    setSavingWelcome(true);
    try {
      const res = await fetch(`${API_BASE}/announcements/welcome-modal`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(welcomeConfig),
      });
      if (!res.ok) throw new Error("Failed to save welcome modal config");
      showToast("Welcome modal settings saved!");
    } catch (e) {
      alert(`Save error: ${e.message}`);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleUploadWelcomeImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingImg(true);

    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("neel_token") || localStorage.getItem("token") || ""
          }`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE.replace(/\/api\/?$/, "")}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
      setWelcomeConfig((prev) => ({ ...prev, banner_image: fullUrl }));
      showToast("Welcome banner uploaded!");
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImg(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchAnnouncements();
    fetchJarData();
    fetchFlashSales();
    fetchCoupons();
    fetchWelcomeData();
  }, []);

  const activeAnnouncements = announcements.filter((a) => a.is_active);
  const currentPreview =
    activeAnnouncements.length > 0
      ? activeAnnouncements[previewIndex % activeAnnouncements.length]
      : { text: "No active announcements", icon: "✨" };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-[#0891b2]" />
            Promotions &amp; Offers Central Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Top Bar Announcement Sliders, Grand Launch Offers (Mystery Jar &amp; Free Jhumka), Flash Sales, and Promo Coupons in one central place.
          </p>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs">
        <div className="flex overflow-x-auto gap-1.5">
          {[
            { id: "topbar", label: "📢 Top Bar Slider", icon: Sparkles },
            { id: "launch_offer", label: "🎁 Grand Launch Offer", icon: Gift },
            { id: "flash_sale", label: "⚡ Flash Sale & Events", icon: Flame },
            { id: "coupons", label: "🎟️ Coupons & Promo Codes", icon: Tag },
            { id: "welcome_modal", label: "🎉 Welcome Popup Modal", icon: Layers },
          ].map((tab) => {
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: TOP BAR ANNOUNCEMENTS SLIDER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "topbar" && (
        <div className="space-y-6">
          {/* Top Bar Master Toggle & Live Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0891b2]" />
                  Store Top Bar Announcement Bar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The slim golden-maroon banner running at the top of every page. Toggle active slides or add custom offers.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={topbarEnabled}
                    onChange={(e) => handleToggleTopbarMaster(e.target.checked)}
                    disabled={togglingTopbar}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-[#0891b2]"></div>
                  <span className="ml-2.5 text-xs font-bold text-slate-700">
                    {topbarEnabled ? "● Top Bar Active" : "Top Bar Paused"}
                  </span>
                </label>

                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-black" /> Add New Slide
                </button>
              </div>
            </div>

            {/* Live Website Preview */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#0891b2]" /> Live Website Top Bar Preview
              </div>
              <div className="bg-gradient-to-r from-[#580C1F] via-[#7B1128] to-[#580C1F] text-white border border-[#d4af37]/40 rounded-xl p-2.5 flex items-center justify-between shadow-md">
                <button
                  onClick={() =>
                    setPreviewIndex(
                      (prev) => (prev - 1 + activeAnnouncements.length) % (activeAnnouncements.length || 1)
                    )
                  }
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium tracking-wide text-center truncate px-2">
                  <span className="text-base">{currentPreview.icon || "✨"}</span>
                  <span className="font-semibold text-white/95 truncate">{currentPreview.text}</span>
                  {currentPreview.link && (
                    <span className="text-[#ffe29a] font-bold text-[11px] underline ml-1 cursor-pointer">
                      Shop Now &rarr;
                    </span>
                  )}
                </div>

                <button
                  onClick={() =>
                    setPreviewIndex((prev) => (prev + 1) % (activeAnnouncements.length || 1))
                  }
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Announcement Slides Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Active &amp; Scheduled Slider Announcements</h3>
              <span className="text-xs text-slate-500 font-medium">
                {announcements.length} total slides ({activeAnnouncements.length} live)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Offer Announcement Text</th>
                    <th className="py-3 px-4">Redirection Link</th>
                    <th className="py-3 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAnnouncements ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0891b2] mb-2" />
                        Loading announcement slides...
                      </td>
                    </tr>
                  ) : announcements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        No announcement slides created yet. Click "Add New Slide" above.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((item) => {
                      const id = item.id || item._id;
                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={item.is_active !== false}
                              onChange={() => handleToggleItemStatus(item)}
                              className="w-4 h-4 rounded text-[#0891b2] cursor-pointer"
                              title={item.is_active ? "Click to Pause" : "Click to Activate"}
                            />
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.icon || "✨"}</span>
                              <span className="line-clamp-2">{item.text}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {item.link ? (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {item.link}
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Edit Slide"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
                              title="Delete Slide"
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

          {/* Add / Edit Announcement Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
              <form
                onSubmit={handleSaveAnnouncement}
                className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-800"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0891b2]" />
                    {editingItem ? "Edit Top Bar Announcement" : "Create Top Bar Announcement"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Offer Text * (Clean, self-contained heading)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grand Launch Special: Free Matching Jhumka Set with Every Kurti Order! ✨"
                      value={announcementForm.text}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, text: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:border-[#0891b2] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Icon Emoji</label>
                      <input
                        type="text"
                        value={announcementForm.icon}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, icon: e.target.value })
                        }
                        placeholder="🎁, ✨, 👗, 👑"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        min="1"
                        value={announcementForm.display_order}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            display_order: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Link / Page Redirection
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={announcementForm.link}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, link: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      >
                        <option value="/new-arrivals">🌟 All Kurtis &amp; New Arrivals (/new-arrivals)</option>
                        {availableCategories.map((c) => (
                          <option key={c._id || c.id} value={c.link || `/category/${(c.name || "").toLowerCase().replace(/\s+/g, "-")}`}>
                            👗 Category: {c.name} ({c.link})
                          </option>
                        ))}
                        <option value="/category/sale">⚡ Mega Sale (/category/sale)</option>
                        <option value="/">🏠 Home Page (/)</option>
                      </select>
                      <input
                        type="text"
                        value={announcementForm.link}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, link: e.target.value })
                        }
                        placeholder="Or custom link: /new-arrivals"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-1.5 text-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="slide_active"
                      checked={announcementForm.is_active}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })
                      }
                      className="w-4 h-4 text-[#0891b2] rounded cursor-pointer"
                    />
                    <label htmlFor="slide_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Activate this slide immediately
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Save Slide
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: GRAND LAUNCH OFFER (MYSTERY JAR + FREE JHUMKA)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "launch_offer" && (
        <form onSubmit={handleSaveMysteryJar} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#0891b2]" />
                  Grand Launch Celebration Offer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1) <strong>First 5 Orders</strong> receive Free Handcrafted Mystery Jewellery Jar. 2) <strong>Every Kurti Order</strong> gets a Free Matching Jhumka Set.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mysteryJarConfig.is_enabled}
                  onChange={(e) =>
                    setMysteryJarConfig({ ...mysteryJarConfig, is_enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-[#0891b2]"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700">
                  {mysteryJarConfig.is_enabled ? "● Offer Active" : "Offer Disabled"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={mysteryJarConfig.title}
                    onChange={(e) =>
                      setMysteryJarConfig({ ...mysteryJarConfig, title: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hero Section Badge / Pill Text
                  </label>
                  <input
                    type="text"
                    value={mysteryJarConfig.pill_text}
                    onChange={(e) =>
                      setMysteryJarConfig({ ...mysteryJarConfig, pill_text: e.target.value })
                    }
                    placeholder="🎁 Launch Offer | Free Jhumka with Every Kurti"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Offer Highlight / Overlay Text
                  </label>
                  <input
                    type="text"
                    value={mysteryJarConfig.overlay_text}
                    onChange={(e) =>
                      setMysteryJarConfig({ ...mysteryJarConfig, overlay_text: e.target.value })
                    }
                    placeholder="First 5 Orders Get Free Mystery Jar + Free Jhumka Set with Every Kurti!"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Offer Description (Modal Popup)
                  </label>
                  <textarea
                    rows={4}
                    value={mysteryJarConfig.description}
                    onChange={(e) =>
                      setMysteryJarConfig({ ...mysteryJarConfig, description: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={mysteryJarConfig.button_text}
                      onChange={(e) =>
                        setMysteryJarConfig({ ...mysteryJarConfig, button_text: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={mysteryJarConfig.button_link}
                      onChange={(e) =>
                        setMysteryJarConfig({ ...mysteryJarConfig, button_link: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Image & Live Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gift Box / Jar Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mysteryJarConfig.image_url}
                      onChange={(e) =>
                        setMysteryJarConfig({ ...mysteryJarConfig, image_url: e.target.value })
                      }
                      placeholder="Image URL or upload"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                    <input
                      type="file"
                      ref={jarFileInputRef}
                      onChange={handleUploadJarImage}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => jarFileInputRef.current?.click()}
                      disabled={uploadingJarImg}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {uploadingJarImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </button>
                  </div>
                </div>

                {/* Offer Card Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 shadow-sm space-y-3">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Customer Modal Preview
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-md text-center space-y-2.5">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 p-1 border-2 border-amber-400 overflow-hidden shadow-inner">
                      <img
                        src={resolveImageUrl(mysteryJarConfig.image_url, "/mystery_jewelry_jar.webp")}
                        alt="Gift Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{mysteryJarConfig.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {mysteryJarConfig.description}
                    </p>
                    <div className="inline-block bg-[#8B0000] text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm">
                      {mysteryJarConfig.button_text} &rarr;
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingJar}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {savingJar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Grand Launch Offer
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: FLASH SALE & EVENTS MANAGER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "flash_sale" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#0891b2]" />
                  Promotional Campaigns &amp; Flash Sales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule live festive deals (BOGO, Percentage Discount, Buy 2 Get 1) in <strong>Indian Standard Time (IST)</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewCampaign}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4 text-black" /> Create New Flash Deal
              </button>
            </div>

            {/* Campaigns Grid */}
            {allCampaigns && allCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCampaigns.map((camp) => {
                  const cId = camp.id || camp._id;
                  const isActive = camp.is_active !== false;
                  return (
                    <div
                      key={cId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-white border-slate-200 shadow-sm"
                          : "bg-slate-50/70 border-slate-200 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isActive ? "● LIVE / ACTIVE" : "PAUSED"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleCampaignStatus(camp)}
                            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title={isActive ? "Pause" : "Activate"}
                          >
                            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditCampaign(camp)}
                            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(cId)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs mb-1 line-clamp-1">{camp.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{camp.subtitle}</p>

                      <div className="text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Deal:</span>
                          <span className="font-bold text-cyan-800">{camp.deal_text || `${camp.discount_percentage || 0}% OFF`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target:</span>
                          <span className="font-semibold text-slate-700 capitalize">{camp.target_type || "All Products"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active promotional campaigns. Click "Create New Flash Deal" to schedule one.
              </div>
            )}
          </div>

          {/* Create / Edit Campaign Modal */}
          {showCampaignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <form
                onSubmit={handleSaveCampaign}
                className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 my-8 text-slate-800 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#0891b2]" />
                    {editingCampaignId && editingCampaignId !== "new"
                      ? "Edit Flash Sale Campaign"
                      : "Create New Flash Sale Deal"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Deal Title *</label>
                      <input
                        type="text"
                        required
                        value={flashSaleConfig.title}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, title: e.target.value })}
                        placeholder="e.g. Grand Festive Flash Deal"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={flashSaleConfig.subtitle}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, subtitle: e.target.value })}
                        placeholder="e.g. Extra Savings on Handcrafted Ethnic Wear"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Deal Type</label>
                      <select
                        value={flashSaleConfig.deal_type}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, deal_type: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="bogo">BOGO (Buy 1 Get 1)</option>
                        <option value="buy2get1">Buy 2 Get 1 Free</option>
                        <option value="buy3get1">Buy 3 Get 1 Free</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={flashSaleConfig.discount_percentage}
                        onChange={(e) =>
                          setFlashSaleConfig({ ...flashSaleConfig, discount_percentage: parseInt(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Deal Badge / Text</label>
                      <input
                        type="text"
                        value={flashSaleConfig.deal_text}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, deal_text: e.target.value })}
                        placeholder="FLAT 30% OFF"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Target Scope */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Apply Deal To:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "all", label: "🌟 All Kurtis" },
                        { id: "category", label: "👗 Specific Category" },
                        { id: "custom_products", label: "🏷️ Selected Products" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFlashSaleConfig({ ...flashSaleConfig, target_type: s.id })}
                          className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            flashSaleConfig.target_type === s.id
                              ? "bg-cyan-400 border-cyan-400 text-black font-extrabold shadow-xs"
                              : "bg-white border-slate-300 text-slate-700"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {flashSaleConfig.target_type === "category" && (
                      <div className="mt-2">
                        <select
                          value={flashSaleConfig.target_category}
                          onChange={(e) =>
                            setFlashSaleConfig({ ...flashSaleConfig, target_category: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                        >
                          <option value="">-- Choose Category --</option>
                          {availableCategories.map((cat) => (
                            <option key={cat._id || cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {flashSaleConfig.target_type === "custom_products" && (
                      <div className="mt-2 space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter products..."
                            value={customProductSearch}
                            onChange={(e) => setCustomProductSearch(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {availableProducts
                            .filter((p) =>
                              (p.name || "").toLowerCase().includes(customProductSearch.toLowerCase())
                            )
                            .map((p) => {
                              const pId = p.id || p._id;
                              const isChecked = (flashSaleConfig.target_product_ids || []).includes(pId);
                              return (
                                <label
                                  key={pId}
                                  className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const currentIds = flashSaleConfig.target_product_ids || [];
                                      const nextIds = isChecked
                                        ? currentIds.filter((id) => id !== pId)
                                        : [...currentIds, pId];
                                      setFlashSaleConfig({ ...flashSaleConfig, target_product_ids: nextIds });
                                    }}
                                    className="w-3.5 h-3.5 text-[#0891b2] rounded"
                                  />
                                  <span className="truncate text-slate-800">{p.name} (₹{p.price})</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scheduling (IST) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Start Time (IST)</label>
                      <input
                        type="datetime-local"
                        value={flashSaleConfig.start_time}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, start_time: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">End Time (IST)</label>
                      <input
                        type="datetime-local"
                        value={flashSaleConfig.end_time}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, end_time: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Banner Image (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL or upload"
                        value={flashSaleConfig.banner_image}
                        onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, banner_image: e.target.value })}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                      <input
                        type="file"
                        ref={saleFileInputRef}
                        onChange={handleUploadSaleBanner}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => saleFileInputRef.current?.click()}
                        disabled={saleUploading}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {saleUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={flashSaleLoading}
                    className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {flashSaleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Campaign
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: COUPONS & PROMO CODES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#0891b2]" />
                  Active Promotional Coupons &amp; Discount Codes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create coupon codes that customers can enter at cart/checkout for flat or percentage discounts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCouponsCSV}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#0891b2]" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddCoupon}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-black" /> Create New Coupon
                </button>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min. Cart Value</th>
                    <th className="py-3 px-4">Usage Count</th>
                    <th className="py-3 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCoupons ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0891b2] mb-2" />
                        Loading coupons...
                      </td>
                    </tr>
                  ) : couponsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No coupons found. Click "Create New Coupon" to add your first promo code.
                      </td>
                    </tr>
                  ) : (
                    couponsList.map((c) => {
                      const id = c.id || c._id;
                      const isActive = c.is_active !== false;
                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleToggleCouponStatus(c)}
                              className="w-4 h-4 rounded text-[#0891b2] cursor-pointer"
                              title={isActive ? "Pause Coupon" : "Activate Coupon"}
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-xs">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {c.type === "percent"
                              ? `${c.value}% OFF`
                              : c.type === "flat"
                              ? `₹${c.value} FLAT OFF`
                              : "FREE SHIPPING"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {c.min_order_value > 0 ? `₹${c.min_order_value}` : "No Minimum"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {c.times_used || 0} times
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditCoupon(c)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Edit Coupon"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
                              title="Delete Coupon"
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

          {/* Create / Edit Coupon Modal */}
          {showCouponModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <form
                onSubmit={handleSaveCoupon}
                className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-800 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#0891b2]" />
                    {editingCouponId ? "Edit Coupon Code" : "Create New Coupon Code"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAUNCH10"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono font-bold tracking-wider uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                      <select
                        value={couponForm.type}
                        onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Discount Value</label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.value}
                        onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min. Order Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.min_order_value}
                        onChange={(e) =>
                          setCouponForm({ ...couponForm, min_order_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Optional"
                        value={couponForm.max_discount || ""}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            max_discount: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description / Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. 10% discount on entire ethnic wear collection"
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="coupon_active"
                      checked={couponForm.is_active}
                      onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#0891b2] rounded cursor-pointer"
                    />
                    <label htmlFor="coupon_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Active and usable by customers immediately
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Save Coupon
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: WELCOME POPUP MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "welcome_modal" && (
        <form onSubmit={handleSaveWelcome} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0891b2]" />
                  First-Time Visitor Welcome Offer Modal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Engaging popup dialog shown to new visitors with welcome discounts and quick shopping links.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={welcomeConfig.is_enabled}
                  onChange={(e) =>
                    setWelcomeConfig({ ...welcomeConfig, is_enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-[#0891b2]"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700">
                  {welcomeConfig.is_enabled ? "● Popup Active" : "Popup Disabled"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Headline Title</label>
                  <input
                    type="text"
                    value={welcomeConfig.title}
                    onChange={(e) => setWelcomeConfig({ ...welcomeConfig, title: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offer Subtitle</label>
                  <input
                    type="text"
                    value={welcomeConfig.subtitle}
                    onChange={(e) => setWelcomeConfig({ ...welcomeConfig, subtitle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Promo Coupon Code</label>
                    <input
                      type="text"
                      value={welcomeConfig.coupon_code}
                      onChange={(e) =>
                        setWelcomeConfig({ ...welcomeConfig, coupon_code: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Delay (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={welcomeConfig.delay_seconds || 3}
                      onChange={(e) =>
                        setWelcomeConfig({
                          ...welcomeConfig,
                          delay_seconds: parseInt(e.target.value) || 3,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={welcomeConfig.button_text}
                      onChange={(e) =>
                        setWelcomeConfig({ ...welcomeConfig, button_text: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={welcomeConfig.button_link}
                      onChange={(e) =>
                        setWelcomeConfig({ ...welcomeConfig, button_link: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Image & Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Banner Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload"
                      value={welcomeConfig.banner_image}
                      onChange={(e) =>
                        setWelcomeConfig({ ...welcomeConfig, banner_image: e.target.value })
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadWelcomeImage}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </button>
                  </div>
                </div>

                {/* Clean Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-2 text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Popup Live Preview
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-md space-y-2">
                    <h4 className="font-bold text-sm text-slate-900">{welcomeConfig.title}</h4>
                    <p className="text-xs text-slate-600">{welcomeConfig.subtitle}</p>
                    {welcomeConfig.coupon_code && (
                      <div className="inline-block bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                        CODE: {welcomeConfig.coupon_code}
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="inline-block bg-[#8B0000] text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm">
                        {welcomeConfig.button_text} &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingWelcome}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {savingWelcome ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Welcome Modal Settings
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminAnnouncementsModal;
