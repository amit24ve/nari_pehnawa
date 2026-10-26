import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Layers,
  ArrowRight,
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Gift,
  Flame,
  Tag,
  Clock,
  ChevronRight
} from "lucide-react";
import logoImg from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const WOMEN_ETHNIC_CATEGORIES = [
  "Kurta Sets",
  "Anarkali Suits",
  "Designer Sarees",
  "Bridal & Festive Lehengas",
  "Co-ord Sets",
  "Sharara & Gharara",
  "Ethnic Gowns & Dresses",
  "Dupattas & Shawls",
  "Indo-Western Fusion"
];

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'add_product' | 'my_products' | 'guidelines'
  const [sellerToken, setSellerToken] = useState(() => localStorage.getItem("np_seller_token") || "");
  const [sellerProfile, setSellerProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("np_seller_profile") || "null");
    } catch (_) {
      return null;
    }
  });

  // Auth Mode: 'register' | 'login'
  const [authMode, setAuthMode] = useState("register");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Register Form
  const [regForm, setRegForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    password: "",
    gstin: "",
    city: "Sultanpur",
    state: "Uttar Pradesh",
    pin_code: "228151",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    category_specialty: "Women's Ethnic Wear"
  });

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Dashboard Stats & Products
  const [stats, setStats] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Add Product Form (Focused purely on Women's Ethnic Fashion for Nari Pehnawa)
  const initialProductState = {
    name: "",
    category: "Kurta Sets",
    department: "Clothing",
    price: "",
    original_price: "",
    discount: "",
    image: "",
    images: [],
    sizes: "S,M,L,XL",
    size_stock: { "S": 10, "M": 10, "L": 10, "XL": 10 },
    fabric: "Pure Cotton Mulmul",
    pattern: "Floral Handblock Print",
    sleeve_type: "3/4 Sleeves",
    fit_type: "Regular Comfort Fit",
    occasion: "Festive, Casual, Office Wear",
    description: "",
    is_bogo: false,
    deal_type: "none",
    deal_text: "",
    highlights: ""
  };
  const [productForm, setProductForm] = useState(initialProductState);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productSuccess, setProductSuccess] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Check login and fetch data
  useEffect(() => {
    if (sellerToken) {
      fetchSellerData();
    }
  }, [sellerToken]);

  const fetchSellerData = async () => {
    if (!sellerToken) return;
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${sellerToken}` };
      const [statsRes, prodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/seller/dashboard-stats`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/seller/products`, { headers }).catch(() => null)
      ]);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (prodsRes && prodsRes.ok) {
        const prodsData = await prodsRes.json();
        setSellerProducts(Array.isArray(prodsData) ? prodsData : []);
      }
    } catch (e) {
      console.warn("Seller data fetch error:", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/seller/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed. Please check your details.");

      localStorage.setItem("np_seller_token", data.token);
      localStorage.setItem("np_seller_profile", JSON.stringify(data.seller));
      setSellerToken(data.token);
      setSellerProfile(data.seller);
      setAuthSuccess("Registration successful! Welcome to Nari Pehnawa Seller Hub.");
      setTimeout(() => setActiveTab("overview"), 600);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/seller/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid login credentials.");

      localStorage.setItem("np_seller_token", data.token);
      localStorage.setItem("np_seller_profile", JSON.stringify(data.seller));
      setSellerToken(data.token);
      setSellerProfile(data.seller);
      setAuthSuccess("Logged in successfully!");
      setTimeout(() => setActiveTab("overview"), 600);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("np_seller_token");
    localStorage.removeItem("np_seller_profile");
    setSellerToken("");
    setSellerProfile(null);
    setStats(null);
    setSellerProducts([]);
  };

  // Image upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingPhoto(true);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${API_BASE_URL.replace(/\/api\/?$/, "")}${data.url.startsWith("/") ? "" : "/"}${data.url}`;

      setProductForm(prev => {
        const nextImgs = [...(prev.images || [])];
        if (!nextImgs.includes(fullUrl)) nextImgs.push(fullUrl);
        return {
          ...prev,
          image: prev.image || fullUrl,
          images: nextImgs
        };
      });
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSizeQtyChange = (size, qty) => {
    const val = qty === "" ? "" : Math.max(0, parseInt(qty) || 0);
    setProductForm(prev => ({
      ...prev,
      size_stock: { ...(prev.size_stock || {}), [size]: val }
    }));
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return alert("Please enter product name");
    if (!productForm.price || Number(productForm.price) <= 0) return alert("Please enter valid price");
    if (!productForm.image && (!productForm.images || productForm.images.length === 0)) {
      return alert("Please upload at least one product photo");
    }

    setSubmittingProduct(true);
    setProductSuccess("");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`
      };

      const parsedSizes = productForm.sizes ? productForm.sizes.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) : ["S", "M", "L", "XL"];
      const payload = {
        name: productForm.name,
        category: productForm.category,
        department: "Clothing",
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : parseFloat(productForm.price) * 1.3,
        discount: productForm.discount ? parseInt(productForm.discount) : 25,
        image: productForm.image || productForm.images[0],
        images: productForm.images.length > 0 ? productForm.images : [productForm.image],
        sizes: parsedSizes,
        size_stock: productForm.size_stock,
        fabric: productForm.fabric,
        pattern: productForm.pattern,
        sleeve_type: productForm.sleeve_type,
        fit_type: productForm.fit_type,
        occasion: productForm.occasion,
        description: productForm.description,
        is_bogo: productForm.is_bogo,
        deal_type: productForm.is_bogo ? "bogo" : productForm.deal_type,
        deal_text: productForm.is_bogo ? "BUY 1 GET 1 FREE" : productForm.deal_text,
        highlights: productForm.highlights ? productForm.highlights.split("\n").map(h => h.trim()).filter(Boolean) : []
      };

      const res = await fetch(`${API_BASE_URL}/seller/products`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to publish product.");

      setProductSuccess("✨ Product published successfully to Nari Pehnawa Women's Ethnic Collection!");
      setProductForm(initialProductState);
      fetchSellerData();
      setTimeout(() => setActiveTab("my_products"), 1500);
    } catch (err) {
      alert(`Error publishing product: ${err.message}`);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // ── Authentication View (Register / Login) ──────────────────────────────────
  if (!sellerToken) {
    return (
      <div className="min-h-screen bg-[#FAF6EC] py-10 px-4 flex flex-col justify-center items-center">
        {/* Brand Header */}
        <div className="text-center mb-8 max-w-xl">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <img src={logoImg} alt="Nari Pehnawa" className="h-12 w-auto object-contain mx-auto" />
          </Link>
          <span className="inline-block bg-[#F4ECDA] text-[#785A18] text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-[#E8DCB8] tracking-widest mb-2">
            👑 Artisan & Seller Partner Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
            Grow Your Women’s Ethnic Fashion Business
          </h1>
          <p className="text-sm text-[#574B38] mt-2">
            Sell authentic Kurtis, Sarees, Lehengas & Ethnic Wear to thousands of luxury shoppers across India on Nari Pehnawa.
          </p>
        </div>

        {/* Card Box */}
        <div className="w-full max-w-xl bg-[#FFFDF8] border border-[#E8DCB8] rounded-3xl p-6 sm:p-8 shadow-md">
          {/* Toggle Register / Login */}
          <div className="flex bg-[#F8F3E4] p-1.5 rounded-2xl mb-6 border border-[#E8DCB8]">
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                authMode === "register"
                  ? "bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black shadow-sm"
                  : "text-[#574B38] hover:text-[#1C1917]"
              }`}
            >
              ✨ Register New Seller
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                authMode === "login"
                  ? "bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black shadow-sm"
                  : "text-[#574B38] hover:text-[#1C1917]"
              }`}
            >
              🔐 Existing Seller Login
            </button>
          </div>

          {authError && (
            <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authMode === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regForm.full_name}
                    onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                    placeholder="e.g. Meera Sharma"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Brand / Boutique Name</label>
                  <input
                    type="text"
                    required
                    value={regForm.business_name}
                    onChange={(e) => setRegForm({ ...regForm, business_name: e.target.value })}
                    placeholder="e.g. Royal Bunkar Handlooms"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="seller@boutique.com"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Mobile Number (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2 text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">City / Town</label>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={regForm.state}
                    onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={regForm.pin_code}
                    onChange={(e) => setRegForm({ ...regForm, pin_code: e.target.value })}
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF5E8] rounded-xl border border-[#E8DCB8] text-[11px] text-[#574B38] space-y-1">
                <span className="font-extrabold text-[#785A18] block">👑 Partner Agreement Highlights:</span>
                <p>• Only authentic handcrafted & premium Women's Ethnic Fashion items are approved.</p>
                <p>• Fast order fulfillment via Shiprocket logistics from verified UP hubs.</p>
                <p>• 100% transparent payouts directly to your registered bank account every week.</p>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] hover:brightness-105 text-black font-extrabold rounded-xl shadow-md shadow-[#D4AF37]/30 transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Sparkles className="w-4 h-4 text-black" />}
                <span>{authLoading ? "Creating Seller Account..." : "Complete Instant Registration & Start Selling"}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">Registered Email or Mobile</label>
                <input
                  type="text"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="seller@boutique.com or 9876543210"
                  className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] hover:brightness-105 text-black font-extrabold rounded-xl shadow-md shadow-[#D4AF37]/30 transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <ArrowRight className="w-4 h-4 text-black" />}
                <span>{authLoading ? "Verifying..." : "Sign In to Seller Dashboard"}</span>
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-[#E8DCB8]/60 pt-4">
            <Link to="/" className="text-xs text-[#785A18] font-bold hover:underline flex items-center justify-center gap-1">
              ← Return to Nari Pehnawa Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged In Seller Dashboard ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF6EC] text-gray-800 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#FFFDF8] border-b border-[#E8DCB8] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logoImg} alt="Nari Pehnawa" className="h-8 object-contain" />
              <div>
                <span className="font-extrabold text-base leading-none block tracking-wide" style={{ color: "#B8860B" }}>
                  Seller Portal
                </span>
                <span className="text-[10px] text-[#8C7A58] font-semibold block">Nari Pehnawa Partner</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-[#FAF5E8] border border-[#E8DCB8] px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E6C25B] to-[#B8860B] flex items-center justify-center font-extrabold text-xs text-black">
                {(sellerProfile?.business_name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-xs font-extrabold text-[#1C1917] block truncate max-w-[140px]">
                  {sellerProfile?.business_name || "Artisan Partner"}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Seller
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Logout from Seller Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-[#E8DCB8]/60 bg-[#FAF5E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto custom-scrollbar py-1">
            {[
              { id: "overview", label: "Dashboard Overview", icon: TrendingUp },
              { id: "add_product", label: "+ Add Women's Ethnic Wear", icon: Plus, highlight: true },
              { id: "my_products", label: "My Product Catalog", icon: Package, badge: sellerProducts.length },
              { id: "guidelines", label: "Seller Quality & Dispatch Rules", icon: ShieldCheck }
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black shadow-xs"
                      : t.highlight
                      ? "text-[#785A18] bg-white border border-[#E8DCB8] hover:bg-[#F3EBD3]"
                      : "text-[#574B38] hover:bg-[#F3EBD3] hover:text-[#1C1917]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span className="text-[10px] bg-white text-black px-1.5 py-0.2 rounded-full font-extrabold border border-[#E8DCB8]">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#FFFDF8] via-[#FAF5E8] to-[#F8F2DF] border border-[#E8DCB8] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-[#8C6D15] uppercase tracking-wider block">
                  NAMASTE, {sellerProfile?.full_name || "SELLER"} 🙏
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] mt-0.5">
                  {sellerProfile?.business_name || "Your Artisan Boutique"}
                </h2>
                <p className="text-xs text-[#574B38] mt-1 max-w-xl">
                  Your products are listed on Nari Pehnawa's marketplace. Orders are dispatched directly from verified UP dispatch warehouses.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("add_product")}
                className="px-4 py-2.5 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] hover:brightness-105 text-black font-extrabold rounded-xl shadow-md shadow-[#D4AF37]/30 text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Add Women's Product</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#8C7A58] mb-2">
                  <span className="text-xs font-bold uppercase">Total Products</span>
                  <Package className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div className="text-2xl font-extrabold text-[#1C1917] font-mono">
                  {stats?.total_products ?? sellerProducts.length}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Active on Nari Pehnawa</span>
              </div>

              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#8C7A58] mb-2">
                  <span className="text-xs font-bold uppercase">Total Stock</span>
                  <Layers className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div className="text-2xl font-extrabold text-[#1C1917] font-mono">
                  {stats?.total_stock_units ?? 0} <span className="text-xs font-normal text-gray-500">units</span>
                </div>
                <span className="text-[10px] text-blue-700 font-bold mt-1 block">Ready to Dispatch</span>
              </div>

              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#8C7A58] mb-2">
                  <span className="text-xs font-bold uppercase">Units Sold</span>
                  <ShoppingBag className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div className="text-2xl font-extrabold text-[#1C1917] font-mono">
                  {stats?.units_sold ?? 0}
                </div>
                <span className="text-[10px] text-purple-700 font-bold mt-1 block">Customer Deliveries</span>
              </div>

              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#8C7A58] mb-2">
                  <span className="text-xs font-bold uppercase">Gross Earnings</span>
                  <IndianRupee className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div className="text-2xl font-extrabold text-[#B8860B] font-mono">
                  ₹{Number(stats?.gross_earnings ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Weekly Direct Payout</span>
              </div>
            </div>

            {/* Quick Actions & Guidelines Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-5 shadow-xs space-y-3">
                <span className="text-sm font-extrabold text-[#1C1917] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B8860B]" /> Nari Pehnawa Seller Standards
                </span>
                <p className="text-xs text-[#574B38] leading-relaxed">
                  Every product listed on Nari Pehnawa goes through our automated fabric & styling check. Sellers maintain quality control, accurate sizing, and high-resolution garment imagery.
                </p>
                <button
                  onClick={() => setActiveTab("guidelines")}
                  className="text-xs font-bold text-[#B8860B] hover:underline flex items-center gap-1"
                >
                  Read Seller Guidelines & Quality Handbook <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-5 shadow-xs space-y-3">
                <span className="text-sm font-extrabold text-[#1C1917] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B8860B]" /> Automated Warehouse Dispatch
                </span>
                <p className="text-xs text-[#574B38] leading-relaxed">
                  You don’t have to worry about split warehouse inventory! When an order is placed, Nari Pehnawa logistics selects the nearest fulfillment center (Sultanpur or Allahabad) for rapid 24-48h dispatch.
                </p>
                <button
                  onClick={() => setActiveTab("add_product")}
                  className="text-xs font-bold text-[#B8860B] hover:underline flex items-center gap-1"
                >
                  Publish New Listing Now <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD PRODUCT (TAILORED EXCLUSIVELY FOR WOMEN'S ETHNIC WEAR) */}
        {activeTab === "add_product" && (
          <div className="max-w-4xl mx-auto bg-[#FFFDF8] border border-[#E8DCB8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#E8DCB8] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E6C25B] to-[#B8860B] text-black font-extrabold flex items-center justify-center text-xs">
                  👗
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917]">
                  Publish Women’s Ethnic Wear Listing
                </h2>
              </div>
              <p className="text-xs text-[#574B38] mt-1">
                Add handcrafted designer Kurtis, Sarees, Lehengas, or Anarkalis. Listing will automatically be attributed to your brand!
              </p>
            </div>

            {productSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{productSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-5">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                  Garment Name / Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Royal Blush Handblock Pure Cotton Anarkali Set"
                  className="w-full bg-white border border-[#E8DCB8] rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                    Women’s Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#D4AF37] outline-none cursor-pointer"
                  >
                    {WOMEN_ETHNIC_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Women's Clothing & Ethnic Couture"
                    className="w-full bg-[#FAF5E8] border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#785A18]"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                    Selling Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => {
                      const p = e.target.value;
                      const orig = productForm.original_price || (p ? Number(p) * 1.3 : "");
                      const disc = orig && p ? Math.round(((orig - p) / orig) * 100) : "";
                      setProductForm({ ...productForm, price: p, discount: disc });
                    }}
                    placeholder="2499"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-extrabold text-slate-900 focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                    MRP / Original Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.original_price}
                    onChange={(e) => {
                      const orig = e.target.value;
                      const p = productForm.price;
                      const disc = orig && p ? Math.round(((orig - p) / orig) * 100) : "";
                      setProductForm({ ...productForm, original_price: orig, discount: disc });
                    }}
                    placeholder="3499"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-extrabold text-slate-900 focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#1C1917] mb-1.5">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={productForm.discount}
                    onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                    placeholder="28"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-extrabold text-emerald-700 focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Photos Upload & Preview */}
              <div className="p-4 bg-white border border-[#E8DCB8] rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-[#1C1917] block">
                  Product Photos (Front, Back & Close-up) *
                </span>
                
                {/* Upload Button */}
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E8DCB8] hover:border-[#D4AF37] rounded-xl cursor-pointer bg-[#FAF6EC] transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#B8860B]" />
                  ) : (
                    <Upload className="w-4 h-4 text-[#B8860B]" />
                  )}
                  <span className="text-xs font-bold text-[#785A18]">
                    {uploadingPhoto ? "Uploading Photo..." : "Click to Upload Photo from Device"}
                  </span>
                </label>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] text-[#574B38] font-bold mb-1">Or paste Image URL:</label>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => {
                      const url = e.target.value;
                      setProductForm(prev => ({
                        ...prev,
                        image: url,
                        images: url && !prev.images.includes(url) ? [url, ...prev.images] : prev.images
                      }));
                    }}
                    placeholder="https://..."
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-[#D4AF37] outline-none"
                  />
                </div>

                {/* Photos Preview */}
                {productForm.images && productForm.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {productForm.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8DCB8]">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white text-center font-bold">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes and Simple Direct Stock Inputs */}
              <div className="p-4 bg-[#FAF5E8] border border-[#E8DCB8] rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-[#1C1917] block">
                      Size Quantities Available *
                    </span>
                    <span className="text-[11px] text-[#574B38]">
                      Enter quantity per size. Automatic total calculated!
                    </span>
                  </div>
                  <div className="text-right bg-white px-3 py-1 rounded-xl border border-[#E8DCB8]">
                    <span className="text-[9px] text-[#8C7A58] uppercase font-bold block">Total Units</span>
                    <span className="text-xs font-extrabold text-[#B8860B] font-mono">
                      {Object.values(productForm.size_stock || {}).reduce((a, b) => a + (Number(b) || 0), 0)} units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {["XS", "S", "M", "L", "XL", "XXL"].map(sz => (
                    <div key={sz} className="text-center bg-white p-2.5 rounded-xl border border-[#E8DCB8]">
                      <span className="text-xs font-extrabold text-[#1C1917] font-mono block mb-1">
                        {sz}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={productForm.size_stock?.[sz] ?? 0}
                        onChange={(e) => handleSizeQtyChange(sz, e.target.value)}
                        className="w-full bg-[#FAF6EC] border border-[#E8DCB8] rounded-lg py-1 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotional Deal (BOGO) */}
              <div className="p-4 bg-white border border-[#E8DCB8] rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_bogo}
                    onChange={(e) => setProductForm({ ...productForm, is_bogo: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-[#E8DCB8] focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-[#1C1917] flex items-center gap-1.5">
                      🎁 Offer Buy 1 Get 1 Free (BOGO) Deal on This Product
                    </span>
                    <span className="text-[11px] text-[#574B38] block">
                      Enables the BOGO promo ribbon on product detail page.
                    </span>
                  </div>
                </label>
              </div>

              {/* Fabric & Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Fabric Details</label>
                  <input
                    type="text"
                    value={productForm.fabric}
                    onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                    placeholder="e.g. Pure Cotton, Chanderi"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Pattern / Work</label>
                  <input
                    type="text"
                    value={productForm.pattern}
                    onChange={(e) => setProductForm({ ...productForm, pattern: e.target.value })}
                    placeholder="e.g. Zari Embroidered"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">Occasion</label>
                  <input
                    type="text"
                    value={productForm.occasion}
                    onChange={(e) => setProductForm({ ...productForm, occasion: e.target.value })}
                    placeholder="e.g. Festive, Wedding"
                    className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3 py-2 text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">Garment Description & Styling Notes</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe the silhouette, handcrafting technique, dupatta details, styling pairing suggestions..."
                  className="w-full bg-white border border-[#E8DCB8] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="w-full py-3.5 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] hover:brightness-105 text-black font-extrabold rounded-xl shadow-md shadow-[#D4AF37]/30 transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingProduct ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-4 h-4 text-black" />
                )}
                <span>{submittingProduct ? "Publishing to Nari Pehnawa..." : "Publish Product Listing Now"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MY PRODUCTS */}
        {activeTab === "my_products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-[#1C1917]">Your Active Listings</h2>
                <p className="text-xs text-[#574B38]">
                  Products currently live and discoverable on Nari Pehnawa.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("add_product")}
                className="px-3.5 py-2 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {loadingData ? (
              <div className="p-12 text-center bg-white border border-[#E8DCB8] rounded-2xl">
                <RefreshCw className="w-8 h-8 animate-spin text-[#B8860B] mx-auto mb-2" />
                <span className="text-xs text-[#785A18] font-bold">Loading your catalog...</span>
              </div>
            ) : sellerProducts.length === 0 ? (
              <div className="p-12 text-center bg-[#FFFDF8] border border-[#E8DCB8] rounded-3xl space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF5E8] border border-[#E8DCB8] flex items-center justify-center mx-auto text-2xl">
                  👗
                </div>
                <h3 className="text-base font-extrabold text-[#1C1917]">No Products Listed Yet</h3>
                <p className="text-xs text-[#574B38] max-w-sm mx-auto">
                  Add your first designer Kurta set, Saree, or Anarkali to start receiving orders across India.
                </p>
                <button
                  onClick={() => setActiveTab("add_product")}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish First Listing</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellerProducts.map(p => {
                  const pid = p.id || p._id;
                  const totalStock = p.stock_quantity ?? p.stock ?? 0;
                  return (
                    <div key={pid} className="bg-[#FFFDF8] border border-[#E8DCB8] rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="flex gap-3">
                        <img
                          src={p.image || (p.images && p.images[0]) || logoImg}
                          alt={p.name}
                          className="w-18 h-22 rounded-xl object-cover border border-[#E8DCB8] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-extrabold uppercase text-[#8C6D15] bg-[#FAF5E8] px-2 py-0.5 rounded border border-[#E8DCB8]">
                            {p.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#1C1917] mt-1.5 line-clamp-2">
                            {p.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1 font-mono">
                            <span className="text-sm font-extrabold text-[#B8860B]">
                              ₹{Number(p.price || 0).toLocaleString()}
                            </span>
                            {p.original_price > p.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{Number(p.original_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#E8DCB8]/60 pt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[#574B38] font-bold">
                          Stock: <strong className="text-[#1C1917] font-mono">{totalStock} units</strong>
                        </span>
                        <Link
                          to={`/product/${pid}`}
                          target="_blank"
                          className="text-[#785A18] hover:text-[#B8860B] font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Live
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GUIDELINES & DISPATCH RULES */}
        {activeTab === "guidelines" && (
          <div className="max-w-4xl mx-auto bg-[#FFFDF8] border border-[#E8DCB8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#E8DCB8] pb-4">
              <span className="text-xs font-extrabold text-[#8C6D15] uppercase tracking-wider block">
                PARTNER HANDBOOK
              </span>
              <h2 className="text-xl font-extrabold text-[#1C1917] mt-1">
                Quality Standards & Dispatch Protocol
              </h2>
              <p className="text-xs text-[#574B38] mt-1">
                Guidelines every seller follows to maintain Nari Pehnawa's 5-star customer experience.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#FAF5E8] border border-[#E8DCB8] rounded-2xl flex items-start gap-3">
                <span className="text-xl">🧵</span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#1C1917]">Authentic Fabric & Thread Fastness</h4>
                  <p className="text-xs text-[#574B38] mt-0.5">
                    All fabrics (Pure Cotton, Chanderi, Georgette, Silk, Rayon) must be pre-shrunk with color fastness guaranteed. No bleeding dyes or loose threads.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5E8] border border-[#E8DCB8] rounded-2xl flex items-start gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#1C1917]">24-Hour Dispatch SLA</h4>
                  <p className="text-xs text-[#574B38] mt-0.5">
                    Orders must be handed over to Shiprocket pickup executive within 24 hours of notification to ensure fast delivery across tier 1 & 2 cities.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5E8] border border-[#E8DCB8] rounded-2xl flex items-start gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#1C1917]">Eco-Friendly Luxury Packaging</h4>
                  <p className="text-xs text-[#574B38] mt-0.5">
                    Pack neatly inside Nari Pehnawa branded polybags with a thank-you note and wash-care instruction card inside.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5E8] border border-[#E8DCB8] rounded-2xl flex items-start gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#1C1917]">Weekly Settlement Schedule</h4>
                  <p className="text-xs text-[#574B38] mt-0.5">
                    Payments for delivered items are processed every Tuesday directly to your verified bank account without deduction surprises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SellerDashboard;
