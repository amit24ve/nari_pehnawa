import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Upload,
  Plus,
  Trash2,
  X,
  PackageCheck,
  FolderPlus,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const STANDARD_SIZES = ["Free Size", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const SellerAddProduct = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const navigate = useNavigate();
  const { seller } = useSellerAuth();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customBrandMode, setCustomBrandMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: seller?.shop_name || "Nari Pehnawa",
    seller_price: "499",
    delivery_charge: "50",
    rto_charge: "35",
    handling_fee: "10",
    price: "594",
    discount_price: "",
    description: "",
    fabric: "",
    color: "",
    pattern: "",
    occasion: "Festive & Party",
    wash_care: "Dry Clean Recommended",
    tags: "",
    is_active: true,
  });

  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Size breakdown: array of { size, stock }
  const [sizesList, setSizesList] = useState([
    { size: "Free Size", stock: 10 },
  ]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load categories and brands
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cats, brs] = await Promise.all([
          sellerApi.getCategories().catch(() => []),
          sellerApi.getBrands().catch(() => []),
        ]);
        setCategories(cats || []);
        setBrands(brs || []);

        if (!isEditMode && cats?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category: prev.category || cats[0]?.name || "",
          }));
        }
      } catch (e) {
        console.error("Failed to load categories/brands", e);
      }
    };
    fetchDropdowns();
  }, [isEditMode]);

  // Load existing product if edit mode
  useEffect(() => {
    if (!editId) return;
    const fetchExistingProduct = async () => {
      try {
        setInitialLoading(true);
        const data = await sellerApi.getProduct(editId);
        if (data) {
          setFormData({
            name: data.name || "",
            category: data.category || "",
            brand: data.brand || seller?.shop_name || "",
            price: data.price || "",
            discount_price: data.discount_price || "",
            description: data.description || "",
            fabric: data.fabric || "",
            color: data.color || "",
            pattern: data.pattern || "",
            occasion: data.occasion || "Festive & Party",
            wash_care: data.wash_care || "Dry Clean Recommended",
            tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
            is_active: data.is_active !== undefined ? data.is_active : true,
          });

          if (Array.isArray(data.images) && data.images.length > 0) {
            setImages(data.images);
          } else if (data.image_url) {
            setImages([data.image_url]);
          }

          if (Array.isArray(data.sizes) && data.sizes.length > 0) {
            // Check if sizes is array of objects or array of strings
            if (typeof data.sizes[0] === "object") {
              setSizesList(data.sizes);
            } else {
              const perStock = Math.floor((data.stock || 0) / data.sizes.length) || 5;
              setSizesList(data.sizes.map((s) => ({ size: s, stock: perStock })));
            }
          }
        }
      } catch (err) {
        setError("Failed to load product details: " + err.message);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchExistingProduct();
  }, [editId, seller?.shop_name]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSellerPriceChange = (e) => {
    const val = e.target.value;
    const sPrice = parseFloat(val) || 0;
    const dCharge = parseFloat(formData.delivery_charge) || 0;
    const rCharge = parseFloat(formData.rto_charge) || 0;
    const hFee = parseFloat(formData.handling_fee) || 10;
    const total = sPrice > 0 ? Math.round(sPrice + dCharge + rCharge + hFee) : "";
    setFormData((prev) => ({
      ...prev,
      seller_price: val,
      price: total ? String(total) : "",
    }));
  };

  const handleDeliveryChange = (e) => {
    const val = e.target.value;
    const sPrice = parseFloat(formData.seller_price) || 0;
    const dCharge = parseFloat(val) || 0;
    const rCharge = parseFloat(formData.rto_charge) || 0;
    const hFee = parseFloat(formData.handling_fee) || 10;
    const total = sPrice > 0 ? Math.round(sPrice + dCharge + rCharge + hFee) : "";
    setFormData((prev) => ({
      ...prev,
      delivery_charge: val,
      price: total ? String(total) : "",
    }));
  };

  const handleRtoChange = (e) => {
    const val = e.target.value;
    const sPrice = parseFloat(formData.seller_price) || 0;
    const dCharge = parseFloat(formData.delivery_charge) || 0;
    const rCharge = parseFloat(val) || 0;
    const hFee = parseFloat(formData.handling_fee) || 10;
    const total = sPrice > 0 ? Math.round(sPrice + dCharge + rCharge + hFee) : "";
    setFormData((prev) => ({
      ...prev,
      rto_charge: val,
      price: total ? String(total) : "",
    }));
  };

  const handleCustomerPriceChange = (e) => {
    const val = e.target.value;
    const cPrice = parseFloat(val) || 0;
    const dCharge = parseFloat(formData.delivery_charge) || 0;
    const rCharge = parseFloat(formData.rto_charge) || 0;
    const hFee = parseFloat(formData.handling_fee) || 10;
    const sPrice = Math.max(0, Math.round(cPrice - (dCharge + rCharge + hFee)));
    setFormData((prev) => ({
      ...prev,
      price: val,
      seller_price: String(sPrice),
    }));
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingImage(true);
      setError("");
      for (const file of files) {
        const res = await sellerApi.uploadImage(file);
        if (res.url) {
          setImages((prev) => [...prev, res.url]);
        }
      }
    } catch (err) {
      setError("Failed to upload image: " + err.message);
    } finally {
      setUploadingImage(false);
      // Reset input value so same file can be picked again
      e.target.value = null;
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Size row handlers
  const handleAddSizeRow = () => {
    setSizesList((prev) => [...prev, { size: "M", stock: 10 }]);
  };

  const handleUpdateSizeRow = (index, field, value) => {
    setSizesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveSizeRow = (index) => {
    if (sizesList.length <= 1) return;
    setSizesList((prev) => prev.filter((_, i) => i !== index));
  };

  const totalStock = sizesList.reduce((acc, s) => acc + (parseInt(s.stock) || 0), 0);

  const calculateDiscount = () => {
    const p = parseFloat(formData.price);
    const d = parseFloat(formData.discount_price);
    if (p > 0 && d > 0 && d < p) {
      return Math.round(((p - d) / p) * 100);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Product Title / Name is required");
      return;
    }

    if (!formData.category) {
      setError("Please select a category");
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please provide a valid regular price in ₹");
      return;
    }

    const discountNum = formData.discount_price ? parseFloat(formData.discount_price) : null;
    if (discountNum && discountNum >= priceNum) {
      setError("Special offer/discounted price must be less than the regular price");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one high quality product image");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || seller?.shop_name || "Nari Pehnawa",
        seller_price: parseFloat(formData.seller_price) || priceNum,
        delivery_charge: parseFloat(formData.delivery_charge) || 50,
        rto_charge: parseFloat(formData.rto_charge) || 35,
        handling_fee: parseFloat(formData.handling_fee) || 10,
        price: priceNum,
        discount_price: discountNum,
        description: formData.description.trim(),
        fabric: formData.fabric.trim() || undefined,
        color: formData.color.trim() || undefined,
        pattern: formData.pattern.trim() || undefined,
        occasion: formData.occasion || undefined,
        wash_care: formData.wash_care || undefined,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        images: images,
        image_url: images[0],
        stock: totalStock,
        sizes: sizesList.map((s) => ({
          size: s.size,
          stock: parseInt(s.stock) || 0,
        })),
        is_active: formData.is_active,
      };

      if (isEditMode) {
        await sellerApi.updateProduct(editId, payload);
        setSuccess("Product updated successfully!");
      } else {
        await sellerApi.createProduct(payload);
        setSuccess("Product published successfully to Nari Pehnawa storefront!");
      }

      setTimeout(() => {
        navigate("/seller/products");
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isEditMode ? "Edit Product" : "Upload New Ethnic Product"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Product details will appear directly across Nari Pehnawa customer searches and catalogs
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Card 1: Product Basics */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Basic Product Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title / Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Royal Maroon Silk Anarkali Suit with Zari Embroidery"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category with Request link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/seller/inquiries", {
                        state: { prefillCategory: "Category Expansion Request" },
                      })
                    }
                    className="text-[11px] font-bold text-[#0891b2] hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ Request New</span>
                  </button>
                </div>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Selector / Custom Brand */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Brand Name *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomBrandMode(!customBrandMode)}
                    className="text-[11px] font-bold text-[#0891b2] hover:underline"
                  >
                    {customBrandMode ? "Choose from list" : "+ Enter Custom Brand"}
                  </button>
                </div>

                {customBrandMode ? (
                  <input
                    type="text"
                    name="brand"
                    required
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Enter your registered brand name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                ) : (
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                  >
                    {seller?.shop_name && (
                      <option value={seller.shop_name}>
                        {seller.shop_name} (My Shop Brand)
                      </option>
                    )}
                    <option value="Nari Pehnawa">Nari Pehnawa</option>
                    {brands
                      .filter((b) => b.name !== seller?.shop_name && b.name !== "Nari Pehnawa")
                      .map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Product Description
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Include fabric craftsmanship, styling suggestions, dupatta details, and wash care instructions..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>
          </div>

          {/* Card 2: Advanced Marketplace Pricing (Meesho / Flipkart / Amazon Model) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0891b2]" />
                  <span>Marketplace Automatic Pricing (Meesho / Flipkart Model)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your desired payout is protected. Forward delivery charges + RTO buffer + ₹10 extra packaging are calculated automatically.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-[#0891b2] border border-cyan-200 self-start sm:self-auto">
                Automatic Loss Protection
              </span>
            </div>

            {/* 4 Pricing Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Seller Payout Price */}
              <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-200/80">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  1. Your Desired Payout (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    name="seller_price"
                    required
                    min={1}
                    value={formData.seller_price}
                    onChange={handleSellerPriceChange}
                    placeholder="499"
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">What you earn per sale</span>
              </div>

              {/* 2. Forward Delivery Charge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. Delivery Charges (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+₹</span>
                  <input
                    type="number"
                    name="delivery_charge"
                    min={0}
                    value={formData.delivery_charge}
                    onChange={handleDeliveryChange}
                    placeholder="50"
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Forward courier shipping</span>
              </div>

              {/* 3. RTO Risk Buffer */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. RTO Risk Buffer (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+₹</span>
                  <input
                    type="number"
                    name="rto_charge"
                    min={0}
                    value={formData.rto_charge}
                    onChange={handleRtoChange}
                    placeholder="35"
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Protects from return losses</span>
              </div>

              {/* 4. Mandatory +10 Extra Polybag Fee */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center justify-between">
                  <span>4. NP Packaging (+10)</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Auto</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">+₹</span>
                  <input
                    type="number"
                    name="handling_fee"
                    readOnly
                    value={formData.handling_fee}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold rounded-lg border border-emerald-300 bg-emerald-100/60 text-emerald-900 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-emerald-800 font-semibold mt-1 block">Official security polybag & tape</span>
              </div>
            </div>

            {/* Live Visual Calculation Strip */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-200">
                  <span className="bg-white/10 px-2 py-0.5 rounded">Your Payout: <strong>₹{formData.seller_price || 0}</strong></span>
                  <span>+</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded">Delivery: <strong>₹{formData.delivery_charge || 0}</strong></span>
                  <span>+</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded">RTO: <strong>₹{formData.rto_charge || 0}</strong></span>
                  <span>+</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-bold">
                    NP Polybag: +₹{formData.handling_fee || 10} Extra
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Meesho/Flipkart Formula: Final price is charged to customer. When delivered, shipping & return buffer are absorbed without touching your ₹{formData.seller_price || 0} payout!
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-700 sm:pl-5 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Customer Display Price
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{formData.price || 0}
                </span>
              </div>
            </div>

            {/* Optional Special Offer / Discount Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Regular Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min={1}
                  value={formData.price}
                  onChange={handleCustomerPriceChange}
                  placeholder="594"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Can be manually overridden if needed</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Offer Price (₹ - Optional Sale)
                </label>
                <input
                  type="number"
                  name="discount_price"
                  min={1}
                  value={formData.discount_price}
                  onChange={handleChange}
                  placeholder="Optional, e.g. 499"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {calculateDiscount() ? `${calculateDiscount()}% customer discount will be highlighted` : "Leave blank if no sale discount"}
                </span>
              </div>
            </div>

            {/* Size Breakdown */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Sizes & Quantities in Stock (Total: {totalStock} units)
                </label>
                <button
                  type="button"
                  onClick={handleAddSizeRow}
                  className="text-xs font-bold text-[#0891b2] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>

              <div className="space-y-2">
                {sizesList.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <select
                      value={row.size}
                      onChange={(e) => handleUpdateSizeRow(idx, "size", e.target.value)}
                      className="w-40 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                    >
                      {STANDARD_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={0}
                        value={row.stock}
                        onChange={(e) => handleUpdateSizeRow(idx, "stock", e.target.value)}
                        placeholder="Quantity"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={sizesList.length <= 1}
                      onClick={() => handleRemoveSizeRow(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Images */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Product Images ({images.length} uploaded)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] bg-slate-100">
                  <img src={img} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-[#0891b2] text-white px-2 py-0.5 rounded shadow-xs">
                      Primary
                    </span>
                  )}
                </div>
              ))}

              <label className="border-2 border-dashed border-slate-300 hover:border-[#0891b2] rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition aspect-[3/4] bg-slate-50/50 hover:bg-cyan-50/20">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Upload Image</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingImage && (
              <p className="text-xs text-[#0891b2] font-semibold flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-[#0891b2] border-t-transparent rounded-full animate-spin"></span>
                Uploading images to Nari Pehnawa CDN...
              </p>
            )}
          </div>

          {/* Card 4: Ethnic Specifications */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Fabric, Color & Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fabric
                </label>
                <input
                  type="text"
                  name="fabric"
                  value={formData.fabric}
                  onChange={handleChange}
                  placeholder="e.g. Pure Georgette / Banarasi Chanderi"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g. Rani Pink / Emerald Green"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occasion
                </label>
                <select
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  <option value="Festive & Party">Festive & Party</option>
                  <option value="Wedding & Bridal">Wedding & Bridal</option>
                  <option value="Casual & Daily">Casual & Daily</option>
                  <option value="Office / Workwear">Office / Workwear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="anarkali, partywear, pure silk"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-[#0891b2] focus:ring-[#0891b2]"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                Publish Product Immediately (Visible to buyers on storefront)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/seller/products"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditMode ? "Save Changes" : "Publish Product"}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right 1 Col: Live Preview & Packaging Policy Reminder */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Storefront Preview
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {images.length > 0 ? (
                  <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12 mb-1" />
                    <span className="text-xs font-medium">Image Preview</span>
                  </div>
                )}
                {calculateDiscount() && (
                  <span className="absolute top-2 left-2 text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow-xs">
                    {calculateDiscount()}% OFF
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {formData.brand || seller?.shop_name || "Brand Name"}
                </span>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {formData.name || "Product Name Displayed Here"}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  {formData.discount_price ? (
                    <>
                      <span className="text-sm font-bold text-emerald-700">
                        ₹{formData.discount_price}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{formData.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-900">
                      ₹{formData.price || "0"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default SellerAddProduct;

