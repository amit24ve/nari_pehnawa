import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  Heart,
  Star,
  Award,
  Check,
  X,
  Loader2,
  ExternalLink,
  Flame,
  ArrowRight
} from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DEFAULT_TAGS = ["Special Pick", "Festive Favorite", "Budget Buy", "Daily Essential"];

const AdminCampaignShowcase = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingVotes, setResettingVotes] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [productsList, setProductsList] = useState([]);
  const [campaign, setCampaign] = useState({
    is_active: true,
    title: "Up to",
    discount_text: "30% OFF",
    subtitle: "on first order • Only on Nari Pehnawa",
    badge_text: "",
    cta_text: "Explore Deals",
    cta_link: "/category/sale",
    left_image: "",
    full_banner_image: "",
    banner_height: 320,
    text_color: "#111827",
    slots: [
      { slot_id: 0, tag: DEFAULT_TAGS[0], product_id: "", custom_image: "", votes: 182, rating: 4.8 },
      { slot_id: 1, tag: DEFAULT_TAGS[1], product_id: "", custom_image: "", votes: 147, rating: 4.8 },
      { slot_id: 2, tag: DEFAULT_TAGS[2], product_id: "", custom_image: "", votes: 112, rating: 4.9 },
      { slot_id: 3, tag: DEFAULT_TAGS[3], product_id: "", custom_image: "", votes: 77, rating: 4.7 },
    ]
  });

  const [uploadingLeftImg, setUploadingLeftImg] = useState(false);
  const [uploadingFullBanner, setUploadingFullBanner] = useState(false);
  const [uploadingSlotImg, setUploadingSlotImg] = useState(null);

  const leftImgFileRef = useRef(null);
  const fullBannerFileRef = useRef(null);
  const slotImgFileRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Fetch campaign config and product options
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/campaign/admin/config`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch campaign configuration");
      const data = await res.json();
      if (data.campaign) {
        setCampaign({
          ...data.campaign,
          slots: data.campaign.slots || [],
        });
      }
      if (Array.isArray(data.products)) {
        setProductsList(data.products);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Upload image helper
  const handleUploadImage = async (file, type, slotIdx = null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      if (type === "left") setUploadingLeftImg(true);
      else if (type === "full") setUploadingFullBanner(true);
      else if (type === "slot") setUploadingSlotImg(slotIdx);

      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Image upload failed");
      }

      const data = await res.json();
      const fullUrl = data.url;

      if (type === "left") {
        setCampaign((prev) => ({ ...prev, left_image: fullUrl }));
      } else if (type === "full") {
        setCampaign((prev) => ({ ...prev, full_banner_image: fullUrl }));
      } else if (type === "slot" && slotIdx !== null) {
        setCampaign((prev) => {
          const updatedSlots = [...prev.slots];
          updatedSlots[slotIdx].custom_image = fullUrl;
          return { ...prev, slots: updatedSlots };
        });
      }
      setSuccess("Image uploaded successfully!");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingLeftImg(false);
      setUploadingFullBanner(false);
      setUploadingSlotImg(null);
    }
  };

  // Save campaign updates
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/campaign/admin/config`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(campaign),
      });

      if (!res.ok) throw new Error("Failed to save campaign settings");
      setSuccess("Campaign banner updated successfully!");
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset votes
  const handleResetVotes = async () => {
    if (!window.confirm("Are you sure you want to reset all votes for this campaign to 0?")) return;
    setResettingVotes(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/campaign/admin/reset-votes`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to reset votes");
      setSuccess("All campaign votes have been reset to 0!");
      await fetchConfig();
    } catch (e) {
      setError(e.message);
    } finally {
      setResettingVotes(false);
    }
  };

  // Update slot helper
  const handleSlotChange = (index, field, value) => {
    setCampaign((prev) => {
      const newSlots = [...prev.slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, slots: newSlots };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
      </div>
    );
  }

  // Calculate highest voted for preview
  const maxVotes = Math.max(...(campaign.slots?.map((s) => Number(s.votes) || 0) || [0]));

  return (
    <div className="space-y-8 text-slate-800">
      {/* ── HEADER ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Interactive 4-Card Campaign &amp; Rating Showcase
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage the promo deal, 4 featured outfit slots, customer rating/voting, and custom campaign banners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetVotes}
            disabled={resettingVotes}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Votes
          </button>

          <button
            type="button"
            onClick={handleSaveCampaign}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-black transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Campaign
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── LIVE PREVIEW BANNER ── */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          Live Storefront Preview
        </span>

        <div className="rounded-3xl overflow-hidden shadow-xl border-2 border-[#8B0000]/40 flex flex-col md:flex-row bg-stone-950 min-h-[260px]">
          {/* Left Preview — Clean White Background */}
          <div className="w-full md:w-[28%] bg-white p-5 text-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-slate-200">
            {campaign.left_image && (
              <img
                src={resolveImageUrl(campaign.left_image)}
                alt=""
                onError={(e) => { e.target.style.display = "none"; }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center w-full">
              <p className="text-slate-500 text-xs font-bold tracking-wider uppercase">
                {campaign.title || "UP TO"}
              </p>
              <h3
                className="text-3xl font-serif font-black leading-tight my-1"
                style={{ color: campaign.text_color || "#111827" }}
              >
                {campaign.discount_text || "30% OFF"}
              </h3>
              <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-line max-w-[200px] leading-relaxed">
                {campaign.subtitle}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 bg-[#8B0000] text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow hover:bg-[#6e0000] cursor-pointer">
                  <span>{campaign.cta_text || "Explore Deals"}</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </div>
            </div>
          </div>

          {/* Right Preview */}
          <div className="flex-1 bg-gradient-to-r from-[#4A0019] via-[#350012] to-[#20000A] p-4 flex flex-col justify-center">
            <div className="flex items-center justify-center mb-3 px-1 text-center">
              <span className="text-xs font-bold text-rose-100 uppercase font-serif flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                PICK ANY 1 OF 4 — VOTE FOR YOUR FAVORITE LOOK
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {campaign.slots?.map((slot) => {
                const prod = productsList.find((p) => String(p.id) === String(slot.product_id)) || {};
                const imgSrc = slot.custom_image || prod.image;

                return (
                  <div key={slot.slot_id} className="flex flex-col items-center">
                    {/* Pure Arched Image Card */}
                    <div className="w-full rounded-2xl overflow-hidden border-2 border-rose-300/40 relative bg-stone-900 shadow-md">
                      <div className="h-32 w-full bg-stone-800">
                        {imgSrc ? (
                          <img src={resolveImageUrl(imgSrc)} alt="" className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            No product
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dedicated Rate Now button preview */}
                    <div className="mt-2 text-center w-full flex justify-center">
                      <span className="w-full max-w-[130px] bg-white text-[#8B0000] text-[10px] font-black py-1 px-2 rounded-full shadow border border-rose-200/80 flex items-center justify-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-[#8B0000] text-[#8B0000]" />
                        <span>Rate Now</span>
                        <span className="text-[9px] text-rose-800/80">({slot.votes || 0})</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS FORM ── */}
      <form onSubmit={handleSaveCampaign} className="space-y-8">
        {/* Toggle & Dimensions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            ⚙️ Campaign Status &amp; Dimensions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={campaign.is_active}
                onChange={(e) => setCampaign({ ...campaign, is_active: e.target.checked })}
                className="w-4 h-4 text-[#0891b2] rounded"
              />
              <div>
                <span className="text-sm font-bold text-slate-800 block">Active on Homepage</span>
                <span className="text-xs text-slate-500">Show this campaign below Categories on Homepage</span>
              </div>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Banner Height (px)
              </label>
              <input
                type="number"
                min="260"
                max="450"
                value={campaign.banner_height || 320}
                onChange={(e) => setCampaign({ ...campaign, banner_height: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#0891b2] outline-none"
              />
              <span className="text-[10px] text-slate-400">Default: 320px (Recommended: 300px - 350px)</span>
            </div>
          </div>
        </div>

        {/* Left Promotional Banner Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            🎨 Left Promotional Text &amp; Button
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Pre-Headline</label>
              <input
                type="text"
                value={campaign.title || ""}
                onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                placeholder="Up to"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Main Discount Text</label>
              <input
                type="text"
                value={campaign.discount_text || ""}
                onChange={(e) => setCampaign({ ...campaign, discount_text: e.target.value })}
                placeholder="30% OFF or BUY 1 GET 1 FREE"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-[#0891b2] outline-none"
                style={{ color: campaign.text_color || "#111827" }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Discount Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={campaign.text_color || "#111827"}
                  onChange={(e) => setCampaign({ ...campaign, text_color: e.target.value })}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={campaign.text_color || "#111827"}
                  onChange={(e) => setCampaign({ ...campaign, text_color: e.target.value })}
                  placeholder="#111827"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Subtitle Note</label>
              <textarea
                rows={2}
                value={campaign.subtitle || ""}
                onChange={(e) => setCampaign({ ...campaign, subtitle: e.target.value })}
                placeholder="on first order • Only on Nari Pehnawa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Button Text</label>
              <input
                type="text"
                value={campaign.cta_text || ""}
                onChange={(e) => setCampaign({ ...campaign, cta_text: e.target.value })}
                placeholder="Explore Deals"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Button Link URL</label>
              <input
                type="text"
                value={campaign.cta_link || ""}
                onChange={(e) => setCampaign({ ...campaign, cta_link: e.target.value })}
                placeholder="/category/sale"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
            </div>
          </div>

          {/* Image Uploads */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left Column Image */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Optional: Left Side Background Image
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={leftImgFileRef}
                  onChange={(e) => handleUploadImage(e.target.files[0], "left")}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => leftImgFileRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingLeftImg ? "Uploading..." : "Upload Left Image"}
                </button>
                {campaign.left_image && (
                  <button
                    type="button"
                    onClick={() => setCampaign({ ...campaign, left_image: "" })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {campaign.left_image && (
                <div className="h-16 w-32 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <img src={resolveImageUrl(campaign.left_image)} alt="Left preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Full-width Banner Image Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Optional: Full-Width Campaign Image Banner (BOGO / Sale Cover)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fullBannerFileRef}
                  onChange={(e) => handleUploadImage(e.target.files[0], "full")}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fullBannerFileRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingFullBanner ? "Uploading..." : "Upload Full Banner"}
                </button>
                {campaign.full_banner_image && (
                  <button
                    type="button"
                    onClick={() => setCampaign({ ...campaign, full_banner_image: "" })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold"
                    title="Remove full banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {campaign.full_banner_image && (
                <div className="h-16 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <img src={resolveImageUrl(campaign.full_banner_image)} alt="Full banner preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 PRODUCT SLOTS & VOTING ANALYTICS ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                👗 4 Featured Product Slots &amp; Customer Ratings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select products for the 4 arched cards, customize pill badges, and track live customer votes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {campaign.slots?.map((slot, idx) => {
              const selectedProd = productsList.find((p) => String(p.id) === String(slot.product_id));
              const isTop = (Number(slot.votes) || 0) === maxVotes && maxVotes > 0;

              return (
                <div
                  key={slot.slot_id}
                  className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/40 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-700">
                      Card #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {slot.votes || 0} Votes
                    </span>
                  </div>

                  {/* Product Selector Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Choose Product
                    </label>
                    <select
                      value={slot.product_id || ""}
                      onChange={(e) => handleSlotChange(idx, "product_id", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-[#0891b2] outline-none"
                    >
                      <option value="">-- Select Product --</option>
                      {productsList.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (₹{prod.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Tag */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Pill Badge Tag
                    </label>
                    <input
                      type="text"
                      value={slot.tag || ""}
                      onChange={(e) => handleSlotChange(idx, "tag", e.target.value)}
                      placeholder={DEFAULT_TAGS[idx]}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:border-[#0891b2] outline-none"
                    />
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="rounded-xl border border-slate-200 h-28 overflow-hidden bg-stone-900 relative">
                    {slot.custom_image || selectedProd?.image ? (
                      <img
                        src={resolveImageUrl(slot.custom_image || selectedProd?.image)}
                        alt="Product preview"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Custom image upload for this slot */}
                  <div>
                    <input
                      type="file"
                      ref={slotImgFileRefs[idx]}
                      onChange={(e) => handleUploadImage(e.target.files[0], "slot", idx)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => slotImgFileRefs[idx].current?.click()}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      {uploadingSlotImg === idx ? "Uploading..." : "Custom Card Image"}
                    </button>
                  </div>

                  {/* Manual Votes & Rating adjust */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block">
                        Votes Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={slot.votes || 0}
                        onChange={(e) => handleSlotChange(idx, "votes", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-rose-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block">
                        Star Rating
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={slot.rating || 4.8}
                        onChange={(e) => handleSlotChange(idx, "rating", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-amber-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-sm font-black transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCampaignShowcase;
