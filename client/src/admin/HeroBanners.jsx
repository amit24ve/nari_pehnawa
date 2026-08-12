import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  Upload,
  Link2,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Heart
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const HeroBanners = () => {
  const [activeTab, setActiveTab] = useState("home-slider"); // "home-slider" | "category-banners" | "reels" | "celeb-looks"
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* ────────────────────────────────────────────────────────────────────────
     TAB 1: Homepage Slider State & CRUD
     ──────────────────────────────────────────────────────────────────────── */
  const [slides, setSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideSubmitting, setSlideSubmitting] = useState(false);

  const initialSlideState = {
    image: "",
    alt: "",
    title: "",
    subtitle: "",
    cta_text: "Shop Now",
    cta_link: "/",
    order: 1,
    is_active: true,
  };
  const [slideForm, setSlideForm] = useState(initialSlideState);
  const [slideImgTab, setSlideImgTab] = useState("upload");
  const [slideUploading, setSlideUploading] = useState(false);
  const slideFileRef = useRef(null);

  const fetchSlides = async () => {
    setSlidesLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/slider/?active_only=false`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch slider items");
      const data = await res.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Slider load: ${e.message}`);
    } finally {
      setSlidesLoading(false);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideForm.image.trim()) {
      setError("Please provide a slide image URL or upload one.");
      return;
    }
    setSlideSubmitting(true);
    setError(null);
    try {
      const url = editingSlide
        ? `${API_BASE}/slider/${editingSlide.id}`
        : `${API_BASE}/slider/`;
      const method = editingSlide ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...slideForm,
          order: Number(slideForm.order) || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to save slide");
      setSuccess("Slide saved successfully!");
      setShowSlideModal(false);
      setSlideForm(initialSlideState);
      setEditingSlide(null);
      await fetchSlides();
    } catch (e) {
      setError(`Save slide: ${e.message}`);
    } finally {
      setSlideSubmitting(false);
    }
  };

  const handleEditSlideClick = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      image: slide.image,
      alt: slide.alt || "",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      cta_text: slide.cta_text || "Shop Now",
      cta_link: slide.cta_link || "/",
      order: slide.order || 0,
      is_active: slide.is_active !== false,
    });
    setSlideImgTab("upload");
    setShowSlideModal(true);
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/slider/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete slide");
      setSuccess("Slide deleted successfully!");
      await fetchSlides();
    } catch (e) {
      setError(`Delete slide: ${e.message}`);
    }
  };

  const handleToggleSlide = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/slider/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to toggle slide state");
      setSuccess("Slide status updated!");
      await fetchSlides();
    } catch (e) {
      setError(`Toggle slide: ${e.message}`);
    }
  };

  const handleSlideImageUpload = async (file) => {
    if (!file) return;
    setSlideUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setSlideForm((prev) => ({ ...prev, image: fullUrl }));
      setSuccess("Slide image uploaded!");
    } catch (e) {
      setError(`Image upload: ${e.message}`);
    } finally {
      setSlideUploading(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     TAB 2: Category Hero Banners State & CRUD
     ──────────────────────────────────────────────────────────────────────── */
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catForm, setCatForm] = useState({ tagline: "", image: "" });
  const [catImgTab, setCatImgTab] = useState("upload");
  const [catUploading, setCatUploading] = useState(false);
  const catFileRef = useRef(null);

  const fetchCategories = async () => {
    setCatsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/categories/`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Categories load: ${e.message}`);
    } finally {
      setCatsLoading(false);
    }
  };

  const handleEditCatClick = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      tagline: cat.tagline || "",
      image: cat.image || "",
    });
    setCatImgTab("upload");
    setShowCatModal(true);
  };

  const handleSaveCategoryBanner = async (e) => {
    e.preventDefault();
    setCatSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/categories/${editingCategory.id || editingCategory._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          tagline: catForm.tagline,
          image: catForm.image,
        }),
      });
      if (!res.ok) throw new Error("Failed to update category banner");
      setSuccess("Category hero banner updated!");
      setShowCatModal(false);
      await fetchCategories();
    } catch (e) {
      setError(`Save category banner: ${e.message}`);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCatImageUpload = async (file) => {
    if (!file) return;
    setCatUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setCatForm((prev) => ({ ...prev, image: fullUrl }));
      setSuccess("Category image uploaded!");
    } catch (e) {
      setError(`Image upload: ${e.message}`);
    } finally {
      setCatUploading(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     TAB 3: Watch & Buy Video Reels State & CRUD
     ──────────────────────────────────────────────────────────────────────── */
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [reelSubmitting, setReelSubmitting] = useState(false);

  const initialReelState = {
    title: "",
    video_url: "",
    thumbnail: "",
    price: "",
    original_price: "",
    product_link: "/category/anarkali-kurtis",
    views: "1.2L",
    order: 1,
    is_active: true
  };
  const [reelForm, setReelForm] = useState(initialReelState);
  const [reelVideoTab, setReelVideoTab] = useState("upload");
  const [reelThumbTab, setReelThumbTab] = useState("upload");
  const [reelVideoUploading, setReelVideoUploading] = useState(false);
  const [reelThumbUploading, setReelThumbUploading] = useState(false);
  const reelVideoRef = useRef(null);
  const reelThumbRef = useRef(null);

  const handleReelVideoUpload = async (file) => {
    if (!file) return;
    setReelVideoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setReelForm((prev) => ({ ...prev, video_url: fullUrl }));
      setSuccess("Reel video uploaded!");
    } catch (e) {
      setError(`Video upload: ${e.message}`);
    } finally {
      setReelVideoUploading(false);
    }
  };

  const handleReelThumbUpload = async (file) => {
    if (!file) return;
    setReelThumbUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setReelForm((prev) => ({ ...prev, thumbnail: fullUrl }));
      setSuccess("Reel thumbnail uploaded!");
    } catch (e) {
      setError(`Thumbnail upload: ${e.message}`);
    } finally {
      setReelThumbUploading(false);
    }
  };

  const fetchReels = async () => {
    setReelsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reels/?active_only=false`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch reels");
      const data = await res.json();
      setReels(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Reels load: ${e.message}`);
    } finally {
      setReelsLoading(false);
    }
  };

  const handleSaveReel = async (e) => {
    e.preventDefault();
    if (!reelForm.video_url.trim() || !reelForm.title.trim()) {
      setError("Title and Video URL are required.");
      return;
    }
    setReelSubmitting(true);
    setError(null);
    try {
      const url = editingReel ? `${API_BASE}/reels/${editingReel.id}` : `${API_BASE}/reels/`;
      const method = editingReel ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...reelForm,
          price: Number(reelForm.price) || 0,
          original_price: reelForm.original_price ? Number(reelForm.original_price) : null,
          order: Number(reelForm.order) || 0
        })
      });
      if (!res.ok) throw new Error("Failed to save reel video");
      setSuccess("Watch & Buy reel saved!");
      setShowReelModal(false);
      setReelForm(initialReelState);
      setEditingReel(null);
      await fetchReels();
    } catch (e) {
      setError(`Save reel: ${e.message}`);
    } finally {
      setReelSubmitting(false);
    }
  };

  const handleEditReelClick = (reel) => {
    setEditingReel(reel);
    setReelForm({
      title: reel.title || "",
      video_url: reel.video_url || "",
      thumbnail: reel.thumbnail || "",
      price: reel.price || "",
      original_price: reel.original_price || "",
      product_link: reel.product_link || "/category/anarkali-kurtis",
      views: reel.views || "1.2L",
      order: reel.order || 0,
      is_active: reel.is_active !== false
    });
    setReelVideoTab("upload");
    setReelThumbTab("upload");
    setShowReelModal(true);
  };

  const handleDeleteReel = async (id) => {
    if (!window.confirm("Delete this reel video?")) return;
    try {
      const res = await fetch(`${API_BASE}/reels/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete reel");
      setSuccess("Reel deleted!");
      await fetchReels();
    } catch (e) {
      setError(`Delete reel: ${e.message}`);
    }
  };

  const handleToggleReel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reels/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to toggle reel status");
      setSuccess("Reel status updated!");
      await fetchReels();
    } catch (e) {
      setError(`Toggle reel: ${e.message}`);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     TAB 4: Celeb Approved Looks State & CRUD
     ──────────────────────────────────────────────────────────────────────── */
  const [celebLooks, setCelebLooks] = useState([]);
  const [celebLoading, setCelebLoading] = useState(false);
  const [showCelebModal, setShowCelebModal] = useState(false);
  const [editingCeleb, setEditingCeleb] = useState(null);
  const [celebSubmitting, setCelebSubmitting] = useState(false);

  const initialCelebState = {
    name: "",
    image: "",
    price: "",
    tag: "Festive Favorite",
    link: "/category/anarkali-kurtis",
    order: 1,
    is_active: true
  };
  const [celebForm, setCelebForm] = useState(initialCelebState);
  const [celebImgTab, setCelebImgTab] = useState("upload");
  const [celebUploading, setCelebUploading] = useState(false);
  const celebFileRef = useRef(null);

  const handleCelebImageUpload = async (file) => {
    if (!file) return;
    setCelebUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      const fullUrl = `${API_BASE}${data.url}`;
      setCelebForm((prev) => ({ ...prev, image: fullUrl }));
      setSuccess("Celeb outfit image uploaded!");
    } catch (e) {
      setError(`Image upload: ${e.message}`);
    } finally {
      setCelebUploading(false);
    }
  };

  const fetchCelebLooks = async () => {
    setCelebLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/celeb-looks/?active_only=false`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch celeb looks");
      const data = await res.json();
      setCelebLooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Celeb looks load: ${e.message}`);
    } finally {
      setCelebLoading(false);
    }
  };

  const handleSaveCelebLook = async (e) => {
    e.preventDefault();
    if (!celebForm.name.trim() || !celebForm.image.trim()) {
      setError("Outfit Name and Image URL are required.");
      return;
    }
    setCelebSubmitting(true);
    setError(null);
    try {
      const url = editingCeleb ? `${API_BASE}/celeb-looks/${editingCeleb.id}` : `${API_BASE}/celeb-looks/`;
      const method = editingCeleb ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...celebForm,
          price: Number(celebForm.price) || 0,
          order: Number(celebForm.order) || 0
        })
      });
      if (!res.ok) throw new Error("Failed to save Celeb look");
      setSuccess("Celeb Approved Look saved!");
      setShowCelebModal(false);
      setCelebForm(initialCelebState);
      setEditingCeleb(null);
      await fetchCelebLooks();
    } catch (e) {
      setError(`Save celeb look: ${e.message}`);
    } finally {
      setCelebSubmitting(false);
    }
  };

  const handleEditCelebClick = (look) => {
    setEditingCeleb(look);
    setCelebForm({
      name: look.name || "",
      image: look.image || "",
      price: look.price || "",
      tag: look.tag || "Celebrity Favorite",
      link: look.link || "/category/anarkali-kurtis",
      order: look.order || 0,
      is_active: look.is_active !== false
    });
    setCelebImgTab("upload");
    setShowCelebModal(true);
  };

  const handleDeleteCeleb = async (id) => {
    if (!window.confirm("Delete this Celeb Approved Look?")) return;
    try {
      const res = await fetch(`${API_BASE}/celeb-looks/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete Celeb look");
      setSuccess("Celeb look deleted!");
      await fetchCelebLooks();
    } catch (e) {
      setError(`Delete celeb look: ${e.message}`);
    }
  };

  const handleToggleCeleb = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/celeb-looks/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setSuccess("Status updated!");
      await fetchCelebLooks();
    } catch (e) {
      setError(`Toggle status: ${e.message}`);
    }
  };

  /* Initial loading */
  useEffect(() => {
    if (activeTab === "home-slider") {
      fetchSlides();
    } else if (activeTab === "category-banners") {
      fetchCategories();
    } else if (activeTab === "reels") {
      fetchReels();
    } else if (activeTab === "celeb-looks") {
      fetchCelebLooks();
    }
  }, [activeTab]);

  /* Auto-clear success messages */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0891b2]" />
            Hero Sections &amp; Dynamic Content
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Homepage sliders, Category hero banners, Watch &amp; Buy video reels, and Celeb Approved outfit looks.
          </p>
        </div>

        {activeTab === "home-slider" && (
          <button
            onClick={() => {
              setEditingSlide(null);
              setSlideForm({
                ...initialSlideState,
                order: slides.length + 1,
              });
              setSlideImgTab("upload");
              setShowSlideModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0891b2]/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        )}

        {activeTab === "reels" && (
          <button
            onClick={() => {
              setEditingReel(null);
              setReelForm({ ...initialReelState, order: reels.length + 1 });
              setReelVideoTab("upload");
              setReelThumbTab("upload");
              setShowReelModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0891b2]/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Reel Video
          </button>
        )}

        {activeTab === "celeb-looks" && (
          <button
            onClick={() => {
              setEditingCeleb(null);
              setCelebForm({ ...initialCelebState, order: celebLooks.length + 1 });
              setCelebImgTab("upload");
              setShowCelebModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0891b2]/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Celeb Look
          </button>
        )}
      </div>

      {/* ── NOTIFICATIONS ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-rose-400 hover:text-rose-600" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4 text-emerald-400 hover:text-emerald-600" />
          </button>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex flex-wrap border border-slate-200 bg-slate-100/80 p-1.5 rounded-xl shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("home-slider")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === "home-slider"
              ? "bg-[#0891b2] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Homepage Sliders
        </button>
        <button
          onClick={() => setActiveTab("category-banners")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === "category-banners"
              ? "bg-[#0891b2] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Category Hero Sections
        </button>
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === "reels"
              ? "bg-[#0891b2] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Video className="w-4 h-4" />
          Watch &amp; Buy Reels
        </button>
        <button
          onClick={() => setActiveTab("celeb-looks")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === "celeb-looks"
              ? "bg-[#0891b2] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Heart className="w-4 h-4" />
          Celeb Approved Looks
        </button>
      </div>

      {/* ── TAB 1: HOMEPAGE SLIDERS ── */}
      {activeTab === "home-slider" && (
        slidesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">No slider images configured. Click 'Add Slide' to publish one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`bg-white border ${
                  slide.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
                } rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
              >
                <div className="aspect-[21/9] bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-200">
                  {slide.image ? (
                    <img src={slide.image} alt={slide.alt || ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">No image provided</span>
                  )}
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md border border-cyan-400 uppercase">
                    Order: {slide.order}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                      Slide #{slide.order}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 truncate font-mono">
                      {slide.image ? slide.image.split("/").pop() : "No image"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleToggleSlide(slide.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        slide.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {slide.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {slide.is_active ? "Active" : "Inactive"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSlideClick(slide)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-[#0891b2]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── TAB 2: CATEGORY HERO SECTIONS ── */}
      {activeTab === "category-banners" && (
        catsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Tagline (Hero Subtitle)</th>
                    <th className="px-6 py-4">Hero Banner Image</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id || cat._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                          {cat.tagline || <span className="text-slate-400 font-normal">No custom tagline</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {cat.image ? (
                          <div className="flex items-center gap-3">
                            <img src={cat.image} alt={cat.name} className="w-16 h-10 object-cover rounded-lg border border-slate-200" />
                            <span className="text-[10px] text-slate-500 truncate max-w-[200px] block font-mono">
                              {cat.image}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No banner uploaded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditCatClick(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-lg text-xs font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Banner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── TAB 3: WATCH & BUY REELS ── */}
      {activeTab === "reels" && (
        reelsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
          </div>
        ) : reels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">No Watch &amp; Buy reels found. Click 'Add Reel Video' to publish one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className={`bg-white border ${
                  reel.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
                } rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}
              >
                <div className="h-48 bg-black relative overflow-hidden flex items-center justify-center">
                  <video src={reel.video_url} className="w-full h-full object-cover" poster={reel.thumbnail} muted />
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md border border-cyan-400 uppercase">
                    Order: {reel.order}
                  </div>
                  <div className="absolute top-3 left-3 bg-[#0891b2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {reel.views || "1.2L"} Views
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{reel.title}</h3>
                    <p className="text-xs font-bold text-[#0891b2] mt-1">₹{Number(reel.price || 0).toLocaleString("en-IN")}</p>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">Link: {reel.product_link}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleToggleReel(reel.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        reel.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {reel.is_active ? "Active" : "Inactive"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditReelClick(reel)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReel(reel.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── TAB 4: CELEB APPROVED LOOKS ── */}
      {activeTab === "celeb-looks" && (
        celebLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
          </div>
        ) : celebLooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">No Celeb Approved looks found. Click 'Add Celeb Look' to publish one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {celebLooks.map((look) => (
              <div
                key={look.id}
                className={`bg-white border ${
                  look.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
                } rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}
              >
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  <img src={look.image} alt={look.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-[#8B0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {look.tag}
                  </div>
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md border border-cyan-400 uppercase">
                    Order: {look.order}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{look.name}</h3>
                    <p className="text-xs font-bold text-[#0891b2] mt-1">₹{Number(look.price || 0).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleToggleCeleb(look.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        look.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {look.is_active ? "Active" : "Inactive"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCelebClick(look)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCeleb(look.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── MODAL: HOMEPAGE SLIDE ── */}
      {showSlideModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0891b2]" />
                {editingSlide ? "Edit Homepage Slide" : "Add Homepage Slide"}
              </h2>
              <button onClick={() => setShowSlideModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Slide Image</label>
                <div className="flex border-b border-slate-200 mb-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setSlideImgTab("upload")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      slideImgTab === "upload"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideImgTab("url")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      slideImgTab === "url"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {slideImgTab === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={slideFileRef}
                        onChange={(e) => handleSlideImageUpload(e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => slideFileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Upload className="w-4 h-4" />
                        {slideUploading ? "Uploading..." : "Choose Image"}
                      </button>
                      {slideForm.image && (
                        <span className="text-xs text-slate-500 truncate max-w-[250px]">
                          {slideForm.image.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {slideForm.image && (
                      <div className="mt-2 relative w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={slideForm.image} alt="Preview" className="h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={slideForm.image}
                    onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0891b2]"
                    placeholder="Enter full image URL"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Slide Order (क्रम)</label>
                <input
                  type="number"
                  value={slideForm.order}
                  onChange={(e) => setSlideForm({ ...slideForm, order: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="e.g. 1"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowSlideModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={slideSubmitting} className="px-5 py-2.5 bg-[#0891b2] text-white rounded-xl text-sm font-semibold">
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REEL VIDEO ── */}
      {showReelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-[#0891b2]" />
                {editingReel ? "Edit Watch & Buy Reel" : "Add Watch & Buy Reel"}
              </h2>
              <button onClick={() => setShowReelModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReel} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Product Title</label>
                <input
                  type="text"
                  value={reelForm.title}
                  onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="e.g. Blush Pink Anarkali Suit"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Video MP4</label>
                <div className="flex border-b border-slate-200 mb-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setReelVideoTab("upload")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      reelVideoTab === "upload"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upload Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setReelVideoTab("url")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      reelVideoTab === "url"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Video URL
                  </button>
                </div>

                {reelVideoTab === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={reelVideoRef}
                        onChange={(e) => handleReelVideoUpload(e.target.files[0])}
                        accept="video/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => reelVideoRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Upload className="w-4 h-4" />
                        {reelVideoUploading ? "Uploading..." : "Choose Video"}
                      </button>
                      {reelForm.video_url && (
                        <span className="text-xs text-slate-500 truncate max-w-[250px]">
                          {reelForm.video_url.split("/").pop()}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={reelForm.video_url}
                    onChange={(e) => setReelForm({ ...reelForm, video_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="e.g. https://.../video.mp4"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Thumbnail Cover Image</label>
                <div className="flex border-b border-slate-200 mb-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setReelThumbTab("upload")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      reelThumbTab === "upload"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upload Thumbnail
                  </button>
                  <button
                    type="button"
                    onClick={() => setReelThumbTab("url")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      reelThumbTab === "url"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Thumbnail URL
                  </button>
                </div>

                {reelThumbTab === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={reelThumbRef}
                        onChange={(e) => handleReelThumbUpload(e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => reelThumbRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Upload className="w-4 h-4" />
                        {reelThumbUploading ? "Uploading..." : "Choose Thumbnail"}
                      </button>
                      {reelForm.thumbnail && (
                        <span className="text-xs text-slate-500 truncate max-w-[250px]">
                          {reelForm.thumbnail.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {reelForm.thumbnail && (
                      <div className="mt-2 relative w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={reelForm.thumbnail} alt="Preview" className="h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={reelForm.thumbnail}
                    onChange={(e) => setReelForm({ ...reelForm, thumbnail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="e.g. https://.../image.jpg"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={reelForm.price}
                    onChange={(e) => setReelForm({ ...reelForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="4500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={reelForm.original_price}
                    onChange={(e) => setReelForm({ ...reelForm, original_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="5200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category / Product Link</label>
                  <input
                    type="text"
                    value={reelForm.product_link}
                    onChange={(e) => setReelForm({ ...reelForm, product_link: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="/category/anarkali-kurtis"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Display Views</label>
                  <input
                    type="text"
                    value={reelForm.views}
                    onChange={(e) => setReelForm({ ...reelForm, views: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="2.4L"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowReelModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={reelSubmitting} className="px-5 py-2.5 bg-[#0891b2] text-white rounded-xl text-sm font-semibold">
                  Save Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CELEB LOOK ── */}
      {showCelebModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#0891b2]" />
                {editingCeleb ? "Edit Celeb Approved Look" : "Add Celeb Approved Look"}
              </h2>
              <button onClick={() => setShowCelebModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCelebLook} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Outfit Name</label>
                <input
                  type="text"
                  value={celebForm.name}
                  onChange={(e) => setCelebForm({ ...celebForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="e.g. Haldi Georgette Suit Set"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Outfit Image</label>
                <div className="flex border-b border-slate-200 mb-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setCelebImgTab("upload")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      celebImgTab === "upload"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCelebImgTab("url")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      celebImgTab === "url"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {celebImgTab === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={celebFileRef}
                        onChange={(e) => handleCelebImageUpload(e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => celebFileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Upload className="w-4 h-4" />
                        {celebUploading ? "Uploading..." : "Choose Image"}
                      </button>
                      {celebForm.image && (
                        <span className="text-xs text-slate-500 truncate max-w-[250px]">
                          {celebForm.image.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {celebForm.image && (
                      <div className="mt-2 relative w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={celebForm.image} alt="Preview" className="h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={celebForm.image}
                    onChange={(e) => setCelebForm({ ...celebForm, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="e.g. https://.../image.jpg"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={celebForm.price}
                    onChange={(e) => setCelebForm({ ...celebForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="4500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={celebForm.tag}
                    onChange={(e) => setCelebForm({ ...celebForm, tag: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                    placeholder="Festive Favorite"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category / Product Link</label>
                <input
                  type="text"
                  value={celebForm.link}
                  onChange={(e) => setCelebForm({ ...celebForm, link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                  placeholder="/category/anarkali-kurtis"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowCelebModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={celebSubmitting} className="px-5 py-2.5 bg-[#0891b2] text-white rounded-xl text-sm font-semibold">
                  Save Celeb Look
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CATEGORY BANNER ── */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#0891b2]" />
                Edit Category Hero: {editingCategory?.name}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryBanner} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tagline</label>
                <input
                  type="text"
                  value={catForm.tagline}
                  onChange={(e) => setCatForm({ ...catForm, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Banner Image</label>
                <div className="flex border-b border-slate-200 mb-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setCatImgTab("upload")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      catImgTab === "upload"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatImgTab("url")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                      catImgTab === "url"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {catImgTab === "upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={catFileRef}
                        onChange={(e) => handleCatImageUpload(e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => catFileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Upload className="w-4 h-4" />
                        {catUploading ? "Uploading..." : "Choose Image"}
                      </button>
                      {catForm.image && (
                        <span className="text-xs text-slate-500 truncate max-w-[250px]">
                          {catForm.image.split("/").pop()}
                        </span>
                      )}
                    </div>
                    {catForm.image && (
                      <div className="mt-2 relative w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={catForm.image} alt="Preview" className="h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0891b2]"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={catSubmitting} className="px-5 py-2.5 bg-[#0891b2] text-white rounded-xl text-sm font-semibold">
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBanners;
