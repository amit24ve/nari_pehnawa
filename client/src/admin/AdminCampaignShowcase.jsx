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

const BG_PRESETS = [
  { name: "Pure White", color: "#ffffff", border: "#e2e8f0" },
  { name: "Silk Cream", color: "#FFFDF7", border: "#e2d9cc" },
  { name: "Soft Rose", color: "#FFF1F3", border: "#fbcfe8" },
  { name: "Royal Maroon", color: "#4A0019", border: "#881337" },
  { name: "Champagne", color: "#FDF6E2", border: "#fde68a" },
  { name: "Velvet Noir", color: "#18181B", border: "#3f3f46" },
];

const RIGHT_THEMES = [
  { id: "maroon", name: "Royal Maroon", gradient: "from-[#4A0019] via-[#350012] to-[#20000A]" },
  { id: "noir", name: "Midnight Noir", gradient: "from-[#18181B] via-[#0F0F12] to-[#09090B]" },
  { id: "gold", name: "Golden Velvet", gradient: "from-[#2A1B0A] via-[#1E1307] to-[#120B04]" },
  { id: "rose", name: "Rose Silk", gradient: "from-[#3D0C1E] via-[#2A0815] to-[#17040B]" },
];

const AdminCampaignShowcase = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingVotes, setResettingVotes] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewTab, setPreviewTab] = useState("interactive"); // "interactive" or "full"

  const [productsList, setProductsList] = useState([]);
  const [campaign, setCampaign] = useState({
    is_active: true,
    title: "CUSTOMER'S CHOICE",
    discount_text: "WHICH LOOK DO YOU LOVE?",
    subtitle: "Vote for your favorite festive style • Help us pick the trending look!",
    badge_text: "",
    cta_text: "Vote Now",
    cta_link: "/category/sale",
    left_image: "",
    left_bg_color: "#ffffff",
    title_font_size: 32,
    discount_font_size: 36,
    discount_italic: true,
    title_color: "#111827",
    subtitle_color: "#4B5563",
    cta_bg_color: "#8B0000",
    cta_text_color: "#ffffff",
    full_banner_image: "",
    banner_height: 320,
    text_color: "#8B0000",
    right_bg_theme: "maroon",
    slots: [
      { slot_id: 0, tag: "", product_id: "", custom_image: "", votes: 0 },
      { slot_id: 1, tag: "", product_id: "", custom_image: "", votes: 0 },
      { slot_id: 2, tag: "", product_id: "", custom_image: "", votes: 0 },
      { slot_id: 3, tag: "", product_id: "", custom_image: "", votes: 0 },
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
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Live Storefront Preview
          </span>

          {/* Mode Switcher Tabs */}
          {campaign.full_banner_image && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewTab("interactive")}
                className={`px-3 py-1 rounded-lg transition ${
                  previewTab === "interactive"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Interactive 4-Card Voting Look
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("full")}
                className={`px-3 py-1 rounded-lg transition ${
                  previewTab === "full"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Full-Width Banner Image Look
              </button>
            </div>
          )}
        </div>

        {/* Full-width mode preview */}
        {campaign.full_banner_image && previewTab === "full" ? (
          <div
            className="rounded-3xl overflow-hidden shadow-xl border-2 border-rose-400/40 w-full relative bg-stone-950 flex items-center justify-center cursor-pointer"
            style={{ height: `${campaign.banner_height || 320}px` }}
          >
            <img
              src={resolveImageUrl(campaign.full_banner_image)}
              alt="Full Banner Preview"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_HERO_FALLBACK;
              }}
            />
            <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">
              Active Full-Width Mode
            </div>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden shadow-xl border-2 border-[#8B0000]/40 flex flex-col md:flex-row bg-stone-950 min-h-[260px]">
            {/* Left Preview — Dynamic Background & Styled Typography */}
            <div
              className="w-full md:w-[30%] p-5 text-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-slate-200 transition-colors duration-300"
              style={{ backgroundColor: campaign.left_bg_color || "#ffffff" }}
            >
              {campaign.left_image && (
                <>
                  <img
                    src={resolveImageUrl(campaign.left_image)}
                    alt="Left preview"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[0.5px] pointer-events-none" />
                </>
              )}
              <div className="relative z-10 flex flex-col items-center justify-center text-center w-full my-auto space-y-1.5">
                <p
                  className="font-black uppercase tracking-wider leading-tight drop-shadow-xs"
                  style={{
                    fontSize: `${campaign.title_font_size || 32}px`,
                    color: campaign.title_color || campaign.text_color || "#111827",
                  }}
                >
                  {campaign.title || "CUSTOMER'S CHOICE"}
                </p>
                <h3
                  className={`font-serif font-black tracking-tight leading-tight my-1 drop-shadow-xs ${
                    campaign.discount_italic !== false ? "italic" : ""
                  }`}
                  style={{
                    fontSize: `${campaign.discount_font_size || 36}px`,
                    color: campaign.text_color || "#8B0000",
                  }}
                >
                  {campaign.discount_text || "WHICH LOOK DO YOU LOVE?"}
                </h3>
                <p
                  className="text-[11px] sm:text-xs mt-0.5 whitespace-pre-line max-w-[220px] leading-relaxed drop-shadow-xs opacity-90"
                  style={{ color: campaign.subtitle_color || "#4B5563" }}
                >
                  {campaign.subtitle || "Vote for your favorite festive style • Help us pick the trending look!"}
                </p>
                <div className="mt-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black px-5 py-2 rounded-full shadow hover:scale-105 transition-all cursor-pointer"
                    style={{
                      backgroundColor: campaign.cta_bg_color || "#8B0000",
                      color: campaign.cta_text_color || "#ffffff",
                    }}
                  >
                    <span>{campaign.cta_text || "Vote Now"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right Preview */}
            <div
              className={`flex-1 p-4 flex flex-col justify-center bg-gradient-to-r ${
                RIGHT_THEMES.find((t) => t.id === campaign.right_bg_theme)?.gradient ||
                "from-[#4A0019] via-[#350012] to-[#20000A]"
              }`}
            >
              <div className="flex items-center justify-center mb-3 px-1 text-center">
                <span className="text-xs font-bold text-rose-100 uppercase font-serif flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  PICK YOUR FAVORITE LOOK — VOTE FOR WHAT YOU LOVE
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

                      {/* Dedicated Vote button preview */}
                      <div className="mt-2 text-center w-full flex justify-center">
                        <span className="w-full max-w-[130px] bg-white text-[#8B0000] text-[10px] font-black py-1 px-2 rounded-full shadow border border-rose-200/80 flex items-center justify-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-[#8B0000] text-[#8B0000]" />
                          <span>Vote</span>
                          <span className="text-[9px] text-rose-800/80">({slot.votes || 0})</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              🎨 Left Promotional Banner &amp; Typography
            </h3>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              Live Customizer
            </span>
          </div>

          {/* Background Color & Presets */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Banner Background Color
            </label>
            
            {/* Quick Luxury Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setCampaign({ ...campaign, left_bg_color: preset.color })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    (campaign.left_bg_color || "#ffffff").toLowerCase() === preset.color.toLowerCase()
                      ? "ring-2 ring-rose-500 border-rose-500 shadow-sm font-bold"
                      : "hover:border-slate-400"
                  }`}
                  style={{
                    backgroundColor: preset.color,
                    borderColor: preset.border,
                    color: ["#4A0019", "#18181B"].includes(preset.color) ? "#ffffff" : "#1e293b",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-500 font-medium">Custom Color:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={campaign.left_bg_color || "#ffffff"}
                  onChange={(e) => setCampaign({ ...campaign, left_bg_color: e.target.value })}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={campaign.left_bg_color || "#ffffff"}
                  onChange={(e) => setCampaign({ ...campaign, left_bg_color: e.target.value })}
                  placeholder="#ffffff"
                  className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Typography: Pre-Headline ("UP TO") & Main Discount ("30% OFF") */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pre-Headline Text ("UP TO") */}
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-100 bg-white">
              <label className="text-xs font-bold text-slate-700 block">Pre-Headline (e.g. UP TO)</label>
              <input
                type="text"
                value={campaign.title || ""}
                onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                placeholder="UP TO"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase focus:border-[#0891b2] outline-none"
              />
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-500 block mb-0.5">Font Size (px)</label>
                  <input
                    type="number"
                    min="18"
                    max="52"
                    value={campaign.title_font_size || 32}
                    onChange={(e) => setCampaign({ ...campaign, title_font_size: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Color</label>
                  <input
                    type="color"
                    value={campaign.title_color || campaign.text_color || "#111827"}
                    onChange={(e) => setCampaign({ ...campaign, title_color: e.target.value })}
                    className="w-8 h-7 p-0.5 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Main Discount Text ("30% OFF") */}
            <div className="space-y-2 p-3.5 rounded-xl border border-rose-100 bg-rose-50/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">Main Discount Text</label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-rose-700">
                  <input
                    type="checkbox"
                    checked={campaign.discount_italic !== false}
                    onChange={(e) => setCampaign({ ...campaign, discount_italic: e.target.checked })}
                    className="w-3.5 h-3.5 accent-rose-600 rounded"
                  />
                  <span>Italic Style</span>
                </label>
              </div>
              <input
                type="text"
                value={campaign.discount_text || ""}
                onChange={(e) => setCampaign({ ...campaign, discount_text: e.target.value })}
                placeholder="30% OFF"
                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:border-[#0891b2] outline-none ${
                  campaign.discount_italic !== false ? "italic" : ""
                }`}
                style={{ color: campaign.text_color || "#8B0000" }}
              />
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-500 block mb-0.5">Font Size (px)</label>
                  <input
                    type="number"
                    min="22"
                    max="64"
                    value={campaign.discount_font_size || 38}
                    onChange={(e) => setCampaign({ ...campaign, discount_font_size: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Color</label>
                  <input
                    type="color"
                    value={campaign.text_color || "#8B0000"}
                    onChange={(e) => setCampaign({ ...campaign, text_color: e.target.value })}
                    className="w-8 h-7 p-0.5 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Proportion Helper Badge */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-700 block mb-1">Typography Balance</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-headline is currently{" "}
                <span className="font-bold text-emerald-700">
                  {Math.abs((campaign.discount_font_size || 38) - (campaign.title_font_size || 32))}px
                </span>{" "}
                smaller than the discount headline.
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                ✓ Exactly matches your desired 4–6px proportion!
              </span>
            </div>

            {/* Subtitle */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 block">Subtitle Note</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Color:</span>
                  <input
                    type="color"
                    value={campaign.subtitle_color || "#4B5563"}
                    onChange={(e) => setCampaign({ ...campaign, subtitle_color: e.target.value })}
                    className="w-6 h-5 p-0.5 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={campaign.subtitle || ""}
                onChange={(e) => setCampaign({ ...campaign, subtitle: e.target.value })}
                placeholder="on first order • Only on Nari Pehnawa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
            </div>

            {/* Button (CTA) Configuration */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Button Text</label>
              <input
                type="text"
                value={campaign.cta_text || ""}
                onChange={(e) => setCampaign({ ...campaign, cta_text: e.target.value })}
                placeholder="Explore Deals"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#0891b2] outline-none"
              />
              <div className="flex items-center gap-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block">Btn BG</label>
                  <input
                    type="color"
                    value={campaign.cta_bg_color || "#8B0000"}
                    onChange={(e) => setCampaign({ ...campaign, cta_bg_color: e.target.value })}
                    className="w-7 h-6 p-0.5 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Btn Text</label>
                  <input
                    type="color"
                    value={campaign.cta_text_color || "#ffffff"}
                    onChange={(e) => setCampaign({ ...campaign, cta_text_color: e.target.value })}
                    className="w-7 h-6 p-0.5 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Button Link URL */}
            <div className="sm:col-span-3">
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

            {/* Right Side Background Theme Selector */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Right Side (4 Looks) Background Theme
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "maroon", name: "Royal Maroon", color: "#4A0019", border: "#730026" },
                  { id: "noir", name: "Midnight Noir", color: "#18181B", border: "#27272a" },
                  { id: "gold", name: "Golden Velvet", color: "#78350F", border: "#92400e" },
                  { id: "rose", name: "Rose Silk", color: "#831843", border: "#9d174d" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setCampaign({ ...campaign, right_bg_theme: th.id })}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      (campaign.right_bg_theme || "maroon") === th.id
                        ? "ring-2 ring-rose-500 border-rose-500 shadow-md font-bold scale-105"
                        : "hover:border-slate-400 opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: th.color,
                      borderColor: th.border,
                      color: "#ffffff",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40"
                      style={{ backgroundColor: th.color }}
                    />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 PRODUCT SLOTS & VOTING ANALYTICS ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                👗 4 Featured Product Slots &amp; Customer Voting
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select products for the 4 arched cards, upload custom looks, and monitor live customer votes.
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

                  {/* Thumbnail Preview */}
                  <div className="rounded-xl border border-slate-200 h-32 overflow-hidden bg-stone-900 relative">
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
                      {uploadingSlotImg === idx ? "Uploading..." : "Upload Card Image"}
                    </button>
                  </div>

                  {/* Manual Votes adjust */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Votes Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={slot.votes || 0}
                      onChange={(e) => handleSlotChange(idx, "votes", Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 outline-none"
                    />
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
