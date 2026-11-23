import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Crown,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Quote,
  Sparkles,
  BookOpen,
  Award,
  MapPin,
  GraduationCap,
  Heart,
  ShieldCheck
} from "lucide-react";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const OwnerManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const [ownerData, setOwnerData] = useState({
    name: "Pooja Verma",
    role: "Founder",
    tagline: "Traditional Ka Tadka • Handcrafted Luxury Ethnic Wear",
    quote: "My dream has always been to bring the royal elegance of authentic Indian handlooms into everyday life — handcrafted for women, by women, with uncompromised fabric purity, honest pricing, and genuine trust.",
    image: "/pooja-verma.jpg",
    origin: "Deoria & Sultanpur, Uttar Pradesh (Traditional Purvanchal Handloom & Artisan Heartland)",
    education: "Bachelor of Arts (B.A.) • Rishi Raj Mahavidyalaya, Katka, Sultanpur (Dr. Ram Manohar Lohia Avadh University, RMLAU)",
    craft_expertise: "Direct Artisan Loom Sourcing, 100% Breathable Pure Cotton & Thread Count Density Testing",
    core_mission: "Women Self-Reliance, Fair Artisan Livelihoods & Heirloom Handcrafted Luxury at Honest Pricing",
    story_title: "The Journey of Nari Pehnawa",
    story_subtitle: "From Generational Weaving Looms to Wardrobes Across India",
    story_paragraphs: [
      "Nari Pehnawa was born out of a profound dream: to bring genuine, royal Indian ethnic wear into everyday wardrobes with uncompromising authenticity, pure fabric comfort, and honest pricing. Founded by Pooja Verma, the brand represents woman-led entrepreneurship rooted firmly in the rich cultural soil of Purvanchal, Uttar Pradesh.",
      "Having grown up in Deoria and completed her Bachelor of Arts from Rishi Raj Mahavidyalaya, Katka, Sultanpur (affiliated to Dr. Ram Manohar Lohia Avadh University - RMLAU), Pooja observed a critical dilemma in the ethnic wear space. Commercial fast-fashion was flooding wardrobes with synthetic polyester blends and rigid fits, while high-end designer boutiques charged exorbitant prices that ordinary families could not afford.",
      "Refusing to accept compromises on comfort and authenticity, Pooja journeyed directly to traditional handloom artisan clusters across Uttar Pradesh. Working closely alongside generational master weavers and tailors, she personally inspected yarn densities, thread counts, vegetable dye stability, and reinforced lock-stitch seams to ensure lasting durability and effortless drape.",
      "What started as a passionate mission has grown into a beloved ethnic label trusted by women nationwide. Today, Nari Pehnawa connects skilled rural artisans directly to modern households, ensuring fair livelihoods for craft families and heirloom-grade ethnic wear for every customer.",
      "Every single kurti, suit set, and handcrafted ensemble carries Pooja's personal seal of quality, honest pricing, and genuine devotion to Indian handloom pride."
    ],
    trust_title: "The Pillars of Trust | प्रामाणिकता और विश्वास",
    trust_subtitle: "Every thread, every silhouette, and every promise backed by our personal founder commitment.",
    trust_items: [
      {
        title: "100% Pure Breathable Fabric Guarantee",
        desc: "Hand-tested for breathability, pure cotton density, and color-fastness with zero skin-irritating synthetics. Fabrics crafted to breathe with you all day."
      },
      {
        title: "Direct-From-Loom Fair Honest Pricing",
        desc: "We completely eliminate middleman broker markups. Every single rupee goes directly into artisan craft density and premium fabric quality."
      },
      {
        title: "Generous 2-3 Inch Tailored Alteration Margins",
        desc: "Every ensemble features generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian women's body silhouettes."
      },
      {
        title: "Transparent Doorstep Experience",
        desc: "Real product photographs with no deceptive lighting or filters, honest fabric weight disclosures, and dedicated founder-backed customer support."
      },
      {
        title: "Fair Artisan Wages & Women Empowerment",
        desc: "Providing sustainable year-round employment to rural women tailors and multigenerational handloom artisan families across Uttar Pradesh."
      }
    ],
    vision_title: "Our Guiding Promise",
    vision_quote: "To deliver heirloom-grade, breathable, and regal Indian ethnic wear into every household — straight from artisan looms with complete transparency and fair pricing.",
    brand_values: [
      {
        title: "Direct Loom Sourcing",
        desc: "Hand-selecting fabrics directly from artisan clusters across Uttar Pradesh to ensure pure cotton breathability, vivid natural dyes, and heirloom texture."
      },
      {
        title: "True Indian Fit Margins",
        desc: "Generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian body contours, ensuring freedom of movement and graceful drape."
      },
      {
        title: "Accessible Luxury",
        desc: "Eliminating multi-tier distributor markups so that authentic royal craftsmanship remains within honest, transparent reach."
      },
      {
        title: "Artisan Empowerment",
        desc: "Partnering directly with local women tailors and multigenerational artisan families, celebrating sustainable Indian handcraft."
      }
    ]
  });

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("neel_token") ||
      localStorage.getItem("token") ||
      "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setOwnerData((prev) => ({
            ...prev,
            ...data,
            role: data.role || prev.role || "Founder",
            story_paragraphs:
              Array.isArray(data.story_paragraphs) && data.story_paragraphs.length > 0
                ? data.story_paragraphs
                : prev.story_paragraphs,
            trust_items:
              Array.isArray(data.trust_items) && data.trust_items.length > 0
                ? data.trust_items
                : prev.trust_items,
            brand_values:
              Array.isArray(data.brand_values) && data.brand_values.length > 0
                ? data.brand_values
                : prev.brand_values
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load owner profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleInputChange = (field, value) => {
    setOwnerData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParagraphChange = (index, value) => {
    setOwnerData((prev) => {
      const nextParas = [...prev.story_paragraphs];
      nextParas[index] = value;
      return { ...prev, story_paragraphs: nextParas };
    });
  };

  const handleAddParagraph = () => {
    setOwnerData((prev) => ({
      ...prev,
      story_paragraphs: [...prev.story_paragraphs, ""]
    }));
  };

  const handleRemoveParagraph = (index) => {
    if (ownerData.story_paragraphs.length <= 1) return;
    setOwnerData((prev) => ({
      ...prev,
      story_paragraphs: prev.story_paragraphs.filter((_, i) => i !== index)
    }));
  };

  const handleTrustItemChange = (index, key, value) => {
    setOwnerData((prev) => {
      const nextItems = [...prev.trust_items];
      nextItems[index] = { ...nextItems[index], [key]: value };
      return { ...prev, trust_items: nextItems };
    });
  };

  const handleAddTrustItem = () => {
    setOwnerData((prev) => ({
      ...prev,
      trust_items: [...prev.trust_items, { title: "", desc: "" }]
    }));
  };

  const handleRemoveTrustItem = (index) => {
    if (ownerData.trust_items.length <= 1) return;
    setOwnerData((prev) => ({
      ...prev,
      trust_items: prev.trust_items.filter((_, i) => i !== index)
    }));
  };

  const handleBrandValueChange = (index, key, value) => {
    setOwnerData((prev) => {
      const nextVals = [...prev.brand_values];
      nextVals[index] = { ...nextVals[index], [key]: value };
      return { ...prev, brand_values: nextVals };
    });
  };

  const handleAddBrandValue = () => {
    setOwnerData((prev) => ({
      ...prev,
      brand_values: [...prev.brand_values, { title: "", desc: "" }]
    }));
  };

  const handleRemoveBrandValue = (index) => {
    if (ownerData.brand_values.length <= 1) return;
    setOwnerData((prev) => ({
      ...prev,
      brand_values: prev.brand_values.filter((_, i) => i !== index)
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token =
      localStorage.getItem("neel_token") ||
      localStorage.getItem("token") ||
      "";

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/owner/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success && data.image) {
        setOwnerData((prev) => ({ ...prev, image: data.image }));
        setMessage({
          type: "success",
          text: "Owner photograph uploaded and updated successfully!"
        });
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Failed to upload image. Please try again."
        });
      }
    } catch (err) {
      console.error("Upload error", err);
      setMessage({
        type: "error",
        text: "Error uploading image to server."
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/owner/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(ownerData)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Owner & Founder profile updated successfully! The live page is now updated."
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Failed to update profile. Please check all fields."
        });
      }
    } catch (err) {
      console.error("Save error", err);
      setMessage({
        type: "error",
        text: "Failed to connect to backend server."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#780016] mb-3" />
        <p className="text-sm font-medium">Loading Owner Profile Details...</p>
      </div>
    );
  }

  const currentImgUrl = resolveImageUrl(ownerData.image, "/pooja-verma.jpg");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-[#C59B27]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#780016]">
              Executive Profile
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Owner &amp; Founder Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage single owner profile details, upload photographs, and curate the authentic brand story displayed on the public Owner page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/owner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <span>View Live Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#780016] hover:bg-[#5A0010] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </div>

      {/* Status Notice Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Top Grid: Portrait Photo & Core Identification */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Portrait Photo Upload Card */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#780016]" />
              <span>Owner Photograph</span>
            </h3>

            <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 shadow-inner group">
              <img
                src={currentImgUrl}
                alt={ownerData.name || "Owner"}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = "/pooja-verma.jpg";
                }}
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C59B27]" />
                  <span className="text-xs font-semibold">Uploading &amp; Optimizing...</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full py-2.5 px-4 rounded-xl border border-[#780016] text-[#780016] hover:bg-[#780016] hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Photograph</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                High-resolution portrait recommended (Aspect ratio ~3:4). Auto-optimized to WebP.
              </p>
            </div>
          </div>

          {/* Core Identity Info */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#780016]" />
              <span>Basic Identification &amp; Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Pooja Verma"
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Designation * (e.g. Founder or Owner)
                </label>
                <input
                  type="text"
                  required
                  value={ownerData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  placeholder="e.g. Founder"
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={ownerData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="e.g. Traditional Ka Tadka • Handcrafted Luxury Ethnic Wear"
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Roots &amp; Regional Heritage</span>
                </label>
                <input
                  type="text"
                  value={ownerData.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  placeholder="e.g. Deoria & Sultanpur, Uttar Pradesh"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Education &amp; Background</span>
                </label>
                <input
                  type="text"
                  value={ownerData.education}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  placeholder="e.g. Bachelor of Arts (B.A.) • Rishi Raj Mahavidyalaya, Katka, Sultanpur (RMLAU)"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Craft Expertise</span>
                </label>
                <input
                  type="text"
                  value={ownerData.craft_expertise}
                  onChange={(e) => handleInputChange("craft_expertise", e.target.value)}
                  placeholder="e.g. Direct Loom Curation & Pure Cotton Quality Testing"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Core Mission</span>
                </label>
                <input
                  type="text"
                  value={ownerData.core_mission}
                  onChange={(e) => handleInputChange("core_mission", e.target.value)}
                  placeholder="e.g. Women Self-Reliance, Artisan Empowerment & Accessible Luxury"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
                />
              </div>
            </div>

            {/* Featured Quote / My Dream */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#780016]" />
                <span>Featured Personal Quote / My Dream (Prominent Display)</span>
              </label>
              <textarea
                rows={3}
                value={ownerData.quote}
                onChange={(e) => handleInputChange("quote", e.target.value)}
                placeholder="Enter personal vision quote from the owner..."
                className="w-full p-3 text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]"
              />
            </div>
          </div>
        </div>

        {/* Narrative Story Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#780016]" />
              <span>Detailed Origin Story &amp; Brand Journey (The Journey of Nari Pehnawa)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddParagraph}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#780016] hover:text-[#5A0010] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paragraph</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Story Title
              </label>
              <input
                type="text"
                value={ownerData.story_title}
                onChange={(e) => handleInputChange("story_title", e.target.value)}
                placeholder="The Journey of Nari Pehnawa"
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Story Subtitle
              </label>
              <input
                type="text"
                value={ownerData.story_subtitle}
                onChange={(e) => handleInputChange("story_subtitle", e.target.value)}
                placeholder="From Generational Weaving Looms to Wardrobes Across India"
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Story Paragraphs (Clean full-width reading flow):
            </label>
            {ownerData.story_paragraphs.map((para, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-xs font-mono font-bold text-slate-400 mt-2.5 w-6 text-right">
                  {idx + 1}.
                </span>
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  placeholder={`Paragraph ${idx + 1}...`}
                  className="flex-1 p-3 text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveParagraph(idx)}
                  disabled={ownerData.story_paragraphs.length <= 1}
                  className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-20 transition cursor-pointer mt-2"
                  title="Remove this paragraph"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── PILLARS OF TRUST (विश्वास और प्रामाणिकता) SECTION ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Customer Trust &amp; Authenticity Pillars (विश्वास और प्रामाणिकता)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddTrustItem}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#780016] hover:text-[#5A0010] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Trust Pillar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trust Section Title
              </label>
              <input
                type="text"
                value={ownerData.trust_title}
                onChange={(e) => handleInputChange("trust_title", e.target.value)}
                placeholder="The Pillars of Trust | प्रामाणिकता और विश्वास"
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trust Section Subtitle
              </label>
              <input
                type="text"
                value={ownerData.trust_subtitle}
                onChange={(e) => handleInputChange("trust_subtitle", e.target.value)}
                placeholder="Every thread, every silhouette, and every promise backed by our personal founder commitment."
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {ownerData.trust_items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 flex flex-col sm:flex-row gap-3 items-start"
              >
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                    Trust Pillar #{idx + 1} Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleTrustItemChange(idx, "title", e.target.value)
                    }
                    placeholder="e.g. 100% Pure Fabric Guarantee"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-[#780016]"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) =>
                      handleTrustItemChange(idx, "desc", e.target.value)
                    }
                    placeholder="Details about this trust pillar..."
                    className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-[#780016]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTrustItem(idx)}
                  disabled={ownerData.trust_items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-20 transition cursor-pointer self-center mt-4 sm:mt-5"
                  title="Remove this trust pillar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Philosophy & Brand Values */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
              <span>Philosophy &amp; Core Brand Principles</span>
            </h3>
            <button
              type="button"
              onClick={handleAddBrandValue}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#780016] hover:text-[#5A0010] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Principle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Philosophy Section Title
              </label>
              <input
                type="text"
                value={ownerData.vision_title}
                onChange={(e) => handleInputChange("vision_title", e.target.value)}
                placeholder="Our Guiding Promise"
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vision Statement
              </label>
              <input
                type="text"
                value={ownerData.vision_quote}
                onChange={(e) => handleInputChange("vision_quote", e.target.value)}
                placeholder="To deliver heirloom-grade, breathable ethnic wear..."
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#780016]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {ownerData.brand_values.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-start"
              >
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Principle #{idx + 1} Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleBrandValueChange(idx, "title", e.target.value)
                    }
                    placeholder="e.g. Direct Loom Sourcing"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-[#780016]"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) =>
                      handleBrandValueChange(idx, "desc", e.target.value)
                    }
                    placeholder="Short description of this value..."
                    className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-[#780016]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBrandValue(idx)}
                  disabled={ownerData.brand_values.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-20 transition cursor-pointer self-center mt-4 sm:mt-5"
                  title="Remove this principle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/owner"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            Preview Live Owner Page
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#780016] hover:bg-[#5A0010] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerManagement;
