import React, { useState, useEffect, useRef } from "react";
import {
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
  ExternalLink,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DEFAULT_AD_FORM = {
  image: "",
  title: "",
  subtitle: "",
  badge: "SPECIAL DEAL",
  link: "/category/sale",
  order: 0,
  is_active: true,
  accent_color: "#780016",
};

const AdvertisementManagement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_AD_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/advertisements/?active_only=false`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(Array.isArray(data) ? data : []);
      } else {
        setError("Failed to fetch advertisements from server.");
      }
    } catch (e) {
      setError("Network error fetching advertisements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setFormData({
      ...DEFAULT_AD_FORM,
      order: ads.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      image: ad.image || "",
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      badge: ad.badge || "SPECIAL DEAL",
      link: ad.link || "/category/sale",
      order: ad.order || 0,
      is_active: ad.is_active !== false,
      accent_color: ad.accent_color || "#780016",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData(DEFAULT_AD_FORM);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        const json = await res.json();
        const url = json.url || json.image_url || json.path;
        if (url) {
          setFormData((prev) => ({ ...prev, image: url }));
          setSuccess("Image uploaded successfully!");
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } catch (err) {
      alert("Network error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image.trim()) {
      alert("Please provide an image for the advertisement.");
      return;
    }
    if (!formData.title.trim()) {
      alert("Please enter a title for the advertisement.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = editingAd
        ? `${API_BASE}/advertisements/${editingAd.id}`
        : `${API_BASE}/advertisements/`;
      const method = editingAd ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(
          editingAd
            ? "Advertisement updated successfully!"
            : "Advertisement created successfully!"
        );
        setTimeout(() => setSuccess(null), 3000);
        closeModal();
        fetchAds();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to save advertisement.");
      }
    } catch (err) {
      alert("Network error saving advertisement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/advertisements/${adId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.ok) {
        setSuccess("Advertisement deleted.");
        setTimeout(() => setSuccess(null), 3000);
        fetchAds();
      } else {
        alert("Failed to delete advertisement.");
      }
    } catch (e) {
      alert("Network error deleting advertisement.");
    }
  };

  const handleToggle = async (adId) => {
    try {
      const res = await fetch(`${API_BASE}/advertisements/${adId}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchAds();
      }
    } catch (e) {
      console.error("Toggle error:", e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-wide flex items-center gap-2">
            <span>Advertisement Management</span>
            <span className="text-xs bg-[#780016]/10 text-[#780016] px-2.5 py-0.5 rounded-full font-sans font-bold">
              Homepage Strip
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Create, edit, reorder, and publish promotional cards for the continuous advertisement strip below the hero banner.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#780016] hover:bg-[#8B0000] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Advertisement</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <X className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#780016] animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-stone-300 rounded-2xl p-8 space-y-3">
          <p className="text-stone-600 font-medium text-sm">
            No custom advertisements configured yet.
          </p>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            The homepage advertisement strip is currently showing standard curated fallbacks. Click "Add Advertisement" to publish custom promotions.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#780016] text-white rounded-xl text-xs font-bold shadow hover:bg-[#8B0000] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Ad</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad) => {
            const previewImg = resolveImageUrl(ad.image, DEFAULT_HERO_FALLBACK);
            return (
              <div
                key={ad.id}
                className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden flex flex-col justify-between ${
                  ad.is_active ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
                }`}
              >
                {/* Visual Card Preview */}
                <div className="p-3">
                  <div className="relative w-full h-[140px] rounded-xl overflow-hidden bg-stone-900 border border-stone-200/80 shadow-inner group">
                    <img
                      src={previewImg}
                      alt={ad.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_HERO_FALLBACK;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 z-10 pointer-events-none" />

                    <div className="absolute inset-0 z-20 p-3 flex flex-col justify-between pointer-events-none">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#780016] border border-white/20">
                          {ad.badge || "SPECIAL"}
                        </span>
                        <span className="text-[10px] text-white/90 flex items-center gap-1">
                          Explore <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide line-clamp-1 font-serif">
                          {ad.title}
                        </h4>
                        {ad.subtitle && (
                          <p className="text-[10px] text-stone-200 line-clamp-1 mt-0.5">
                            {ad.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-4 border-t border-stone-100 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-semibold text-stone-700">Display Order:</span>
                      <span className="font-mono bg-stone-100 px-2 py-0.5 rounded">
                        #{ad.order}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 truncate">
                      <span className="font-semibold text-stone-700">Target Link:</span>
                      <span className="text-stone-500 font-mono truncate max-w-[160px]">
                        {ad.link || "/category/sale"}
                      </span>
                    </div>
                  </div>

                  {/* Button bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => handleToggle(ad.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        ad.is_active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                      }`}
                    >
                      {ad.is_active ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(ad)}
                        className="p-1.5 text-stone-600 hover:text-[#780016] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                        title="Edit advertisement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Delete advertisement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-serif font-bold text-[#780016] uppercase tracking-wide">
                {editingAd ? "Edit Advertisement" : "Create New Advertisement"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Image Upload / Input */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-700">
                  Poster Image *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. /uploads/... or https://..."
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ad Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Festive Celebration"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 40% Off on Pure Silk"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                </div>
              </div>

              {/* Badge & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE DEAL, POPULAR"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Destination URL / Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /category/sale or /new-arrivals"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                </div>
              </div>

              {/* Order & Active Status */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-none focus:border-[#780016]"
                  />
                </div>
                <div className="pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#780016] accent-[#780016]"
                    />
                    <span className="font-bold text-stone-700">
                      Active on Homepage
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <label className="block font-bold text-stone-600 uppercase text-[10px] tracking-wider mb-2">
                  Live Strip Card Preview
                </label>
                <div className="relative w-full h-[140px] rounded-2xl overflow-hidden bg-stone-900 border border-stone-300 shadow-md">
                  <img
                    src={resolveImageUrl(formData.image, DEFAULT_HERO_FALLBACK)}
                    alt="Preview"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_HERO_FALLBACK;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 z-10 pointer-events-none" />
                  <div className="absolute inset-0 z-20 p-3.5 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#780016] border border-white/20">
                        {formData.badge || "PROMOTION"}
                      </span>
                      <span className="text-[10px] text-white/90 flex items-center gap-1">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide line-clamp-1 font-serif">
                        {formData.title || "Your Advertisement Title"}
                      </h4>
                      <p className="text-[10px] text-stone-200 line-clamp-1 mt-0.5">
                        {formData.subtitle || "Optional descriptive subtitle"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#780016] hover:bg-[#8B0000] text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingAd ? "Save Changes" : "Publish Ad"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
