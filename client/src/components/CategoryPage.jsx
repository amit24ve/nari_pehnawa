import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { NariHeadingDecoration } from "./NariHeadingDecoration";
import {
  ChevronDown,
  ChevronUp,
  X,
  Heart,
  Star,
  ShoppingBag,
  ArrowUpDown,
  Loader2,
  Check,
  RotateCcw,
  Sliders,
  IndianRupee,
  Layers,
  Palette,
  Sparkles,
  Percent,
} from "lucide-react";
import { useWishlist } from "../context/WishlistProvider";
import useSEO from "../hooks/useSEO";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Organic Pebble fluid curve shapes matching homepage cards
const pebbleShapes = [
  "rounded-[45%_55%_65%_35%/55%_45%_55%_45%]",
  "rounded-[55%_45%_35%_65%/45%_65%_35%_55%]",
  "rounded-[65%_35%_55%_45%/50%_40%_60%_50%]",
  "rounded-[50%_60%_40%_60%/60%_50%_50%_40%]",
];

// ── Inline Product Card ────────────────────────────────────────
const CatProductCard = ({ product, onWishlistToggle, isWishlisted, index = 0 }) => {
  const [hearted, setHearted] = useState(isWishlisted || false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  useEffect(() => setHearted(isWishlisted), [isWishlisted]);

  const discount = product.discount;
  const discountBg = discount >= 50 ? "bg-red-600" : "bg-orange-500";

  // Pick organic pebble shape based on index
  const shapeIndex = typeof index === "number" ? index % pebbleShapes.length : 0;
  const pebbleClass = pebbleShapes[shapeIndex];

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 400)}
      onTouchCancel={() => setIsHovered(false)}
      className={`bg-white p-2 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-2xl active:shadow-2xl transition-all duration-500 ease-in-out hover:-translate-y-1.5 active:-translate-y-1 flex flex-col justify-between ${
        isHovered ? "-translate-y-1.5 shadow-2xl" : ""
      }`}
    >
      <div className={`relative overflow-hidden bg-gradient-to-br from-pink-100/50 to-amber-50/50 ${
        isHovered
            ? "rounded-2xl border-[#8B0000]"
            : `${pebbleClass} border-[#8B0000]/15`
      } group-hover:rounded-2xl group-active:rounded-2xl shadow-md border-2 group-hover:border-[#8B0000] group-active:border-[#8B0000] transition-all duration-500 ease-in-out`}>
        {discount > 0 && (
          <span
            className={`absolute top-2.5 left-2.5 z-20 ${discountBg} text-white text-[10px] font-bold px-2 py-0.5 rounded`}
          >
            {discount}% OFF
          </span>
        )}
        {product.is_new && !discount && (
          <span className="absolute top-2.5 left-2.5 z-20 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            NEW
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setHearted(!hearted);
            onWishlistToggle && onWishlistToggle(product);
          }}
          className="absolute top-2.5 right-2.5 z-30 bg-white/90 hover:bg-white p-1.5 rounded-full shadow border border-gray-100 transition-transform hover:scale-110"
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 ${hearted
                ? "fill-[#8B0000] stroke-[#8B0000]"
                : "stroke-gray-600 fill-none"
              }`}
          />
        </button>

        <img
          src={product.image}
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=600";
          }}
          className={`w-full h-[260px] sm:h-[290px] object-cover transition-transform duration-700 group-hover:scale-105 ${
              isHovered ? "scale-105" : ""
          }`}
        />
      </div>

      <div className="p-3 text-center z-10">
        <h3 className={`text-xs sm:text-sm font-serif font-bold text-gray-900 line-clamp-1 leading-snug mb-1.5 group-hover:text-[#8B0000] transition-colors ${
            isHovered ? "text-[#8B0000]" : ""
        }`}>
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-1 mb-2">
          <div className="flex items-center gap-0.5 bg-emerald-700 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-white">
              {(product.rating || 4.0).toFixed(1)}
            </span>
            <Star className="w-2.5 h-2.5 fill-white text-white" />
          </div>
          <span className="text-[11px] text-gray-500">
            ({(product.review_count || 0).toLocaleString("en-IN")})
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-gray-900 font-sans">
            ₹{(product.price || 0).toLocaleString("en-IN")}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-gray-500 line-through font-sans">
              ₹{product.original_price.toLocaleString("en-IN")}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] font-bold text-[#8B0000]">
              ({discount}% OFF)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main CategoryPage ─────────────────────────────────────────
const CategoryPage = ({ categoryName: propCategoryName }) => {
  const { categoryName: urlSlug } = useParams();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const slug =
    urlSlug || (propCategoryName || "").toLowerCase().replace(/\s+/g, "-");
  const displayName =
    propCategoryName ||
    (urlSlug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useSEO(
    `${displayName} | Nari Pehnawa | Traditional Ka Tadka`,
    `Explore Nari Pehnawa's exclusive collection of premium ${displayName}. Handcrafted designs, sarees, and kurtis in Sultanpur, Uttar Pradesh.`
  );

  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);

  // UI & Filter states
  const [sortBy, setSortBy] = useState("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'price' | 'size' | 'color' | 'fabric' | 'pattern' | 'discount' | null
  const [priceRange, setPriceRange] = useState([0, 25000]);
  const [activeFilters, setActiveFilters] = useState({});

  const filterBarRef = useRef(null);

  // Close floating dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // ── Fetch category info (for hero image) ─────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => r.json())
      .then((cats) => {
        if (!Array.isArray(cats)) return;
        const matched = cats.find((c) => {
          const catSlug = (c.link || "")
            .replace(/^\/category\//, "")
            .toLowerCase();
          return (
            catSlug === slug.toLowerCase() ||
            c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") ===
            slug.toLowerCase()
          );
        });
        if (matched) setCategoryInfo(matched);
      })
      .catch(() => {});
  }, [slug]);

  // ── Fetch products from API ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setApiError(null);
      setProducts([]);
      setActiveFilters({});
      setActiveDropdown(null);
      setSortBy("featured");
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        let url;
        if (slug === "new-arrivals") {
          url = `${API_BASE_URL}/products/?is_new=true&limit=100`;
        } else if (slug === "sale") {
          url = `${API_BASE_URL}/products/?on_sale=true&limit=100`;
        } else {
          const categoryKeyword = slug.replace(/-/g, " ");
          url = `${API_BASE_URL}/products/?category=${encodeURIComponent(
            categoryKeyword,
          )}&limit=100`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        const normalized = data.map((p) => ({ ...p, id: p._id || p.id }));
        setProducts(normalized);
      } catch (e) {
        setApiError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  // ── Dynamic filter config derived from fetched products ──────
  const filterConfig = useMemo(() => {
    if (!products.length) return { priceRange: [0, 25000], sections: [] };

    const prices = products.map((p) => p.price || 0).filter((p) => p > 0);
    const minP = prices.length
      ? Math.floor(Math.min(...prices) / 100) * 100
      : 0;
    const maxP = prices.length
      ? Math.ceil(Math.max(...prices) / 100) * 100
      : 25000;

    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];
    const allSizes = [...new Set(products.flatMap((p) => p.sizes || []))]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (sizeOrder.indexOf(a) === -1 ? 99 : sizeOrder.indexOf(a)) -
          (sizeOrder.indexOf(b) === -1 ? 99 : sizeOrder.indexOf(b)),
      );

    const allColors = [...new Set(products.flatMap((p) => p.colors || []))]
      .filter(Boolean)
      .sort();
    const allFabrics = [
      ...new Set(products.map((p) => p.fabric).filter(Boolean)),
    ].sort();
    const allPatterns = [
      ...new Set(products.map((p) => p.pattern).filter(Boolean)),
    ].sort();

    const sections = [];
    if (allSizes.length > 0)
      sections.push({ id: "size", label: "Size", options: allSizes, icon: Layers });
    if (allColors.length > 0)
      sections.push({ id: "color", label: "Color", options: allColors, icon: Palette });
    if (allFabrics.length > 0)
      sections.push({ id: "fabric", label: "Fabric", options: allFabrics, icon: Sparkles });
    if (allPatterns.length > 0)
      sections.push({
        id: "pattern",
        label: "Pattern",
        options: allPatterns,
        icon: Sliders,
      });
    sections.push({
      id: "discount",
      label: "Discount",
      options: ["10% & above", "25% & above", "40% & above", "50% & above"],
      icon: Percent,
    });

    return { priceRange: [minP, maxP], sections };
  }, [products]);

  // Reset price range when filterConfig changes
  useEffect(() => {
    setPriceRange(filterConfig.priceRange);
  }, [filterConfig.priceRange[0], filterConfig.priceRange[1]]);

  // Fallback gradient colors based on name
  const gradientColors = [
    "from-[#8B0000] via-[#6B0000] to-[#3d0000]",
    "from-[#7c3aed] via-[#5b21b6] to-[#3b0764]",
    "from-[#0369a1] via-[#0c4a6e] to-[#082f49]",
    "from-[#065f46] via-[#064e3b] to-[#022c22]",
    "from-[#92400e] via-[#78350f] to-[#451a03]",
  ];
  const gradientIdx = (displayName?.charCodeAt(0) || 0) % gradientColors.length;
  const fallbackGradient = gradientColors[gradientIdx];

  const toggleFilter = (sectionId, value) => {
    setActiveFilters((prev) => {
      const cur = new Set(prev[sectionId] || []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      return { ...prev, [sectionId]: cur };
    });
  };

  const removeFilter = (sectionId, value) => {
    setActiveFilters((prev) => {
      const cur = new Set(prev[sectionId] || []);
      cur.delete(value);
      return { ...prev, [sectionId]: cur };
    });
  };

  const clearAll = () => {
    setActiveFilters({});
    setPriceRange(filterConfig.priceRange);
    setSortBy("featured");
  };

  const isPriceFiltered =
    priceRange[0] > filterConfig.priceRange[0] ||
    priceRange[1] < filterConfig.priceRange[1];

  const totalActiveCount =
    Object.values(activeFilters).reduce((n, s) => n + s.size, 0) +
    (isPriceFiltered ? 1 : 0);

  // ── Filter + sort products ───────────────────────────────────
  const displayProducts = useMemo(() => {
    let list = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    const sizeF = activeFilters["size"];
    if (sizeF?.size > 0)
      list = list.filter((p) => p.sizes?.some((s) => sizeF.has(s)));

    const colorF = activeFilters["color"];
    if (colorF?.size > 0)
      list = list.filter((p) => p.colors?.some((c) => colorF.has(c)));

    const fabricF = activeFilters["fabric"];
    if (fabricF?.size > 0) list = list.filter((p) => fabricF.has(p.fabric));

    const patternF = activeFilters["pattern"];
    if (patternF?.size > 0) list = list.filter((p) => patternF.has(p.pattern));

    const discountF = activeFilters["discount"];
    if (discountF?.size > 0) {
      const minD = Math.max(...[...discountF].map((d) => parseInt(d)));
      list = list.filter((p) => (p.discount || 0) >= minD);
    }

    switch (sortBy) {
      case "price-low":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "discount":
        list = [...list].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case "newest":
        list = [...list].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        );
        break;
      case "rating":
        list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return list;
  }, [products, sortBy, priceRange, activeFilters]);

  const SORT_OPTIONS = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "discount", label: "Best Discount" },
    { value: "rating", label: "Top Rated" },
  ];

  // ── Render ───────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "#fdf8f5", minHeight: "100vh" }}>
      {/* ── HERO BANNER ── */}
      <div
        className={`cat-hero relative overflow-hidden bg-gradient-to-br ${fallbackGradient}`}
        style={{ height: "460px" }}
      >
        <style>{`@media(min-width:768px){.cat-hero{height:540px!important;}}`}</style>

        {/* Background image */}
        {categoryInfo?.image && (
          <img
            src={categoryInfo.image}
            alt={categoryInfo.name || displayName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        {/* Decorative accents */}
        <div
          className="absolute top-6 right-10 w-40 h-40 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-60 h-40 rounded-full blur-3xl"
          style={{ background: "rgba(139,0,0,0.2)" }}
        />

        {/* ─ Main content ─ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pb-8">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur-sm rounded-full px-5 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="text-white/90 text-xs font-semibold tracking-[0.2em] uppercase">
              {loading
                ? "Loading…"
                : `${displayProducts.length} Styles Available`}
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-white font-bold tracking-tight drop-shadow-lg mb-3 inline-flex items-center justify-center flex-wrap gap-2 text-center"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)", lineHeight: 1.15 }}
          >
            <NariHeadingDecoration className="w-10 h-10 md:w-14 md:h-14" />
            <span>{categoryInfo?.name || displayName}</span>
            <NariHeadingDecoration flip={true} className="w-10 h-10 md:w-14 md:h-14" />
          </h1>

          {/* Tagline */}
          {categoryInfo?.tagline ? (
            <p className="text-white/75 text-sm md:text-base max-w-lg font-light">
              {categoryInfo.tagline}
            </p>
          ) : (
            <p className="text-white/60 text-sm">
              Curated collection just for you
            </p>
          )}

          {/* CTA button */}
          <div className="mt-5 flex gap-3">
            <span className="inline-block bg-white text-[#8B0000] text-xs font-bold px-5 py-2.5 rounded-full shadow-lg tracking-wide">
              Explore Collection
            </span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="absolute bottom-3 left-4 md:left-8 flex items-center gap-1.5 text-xs text-white/50">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white/80 font-medium">
            {categoryInfo?.name || displayName}
          </span>
        </div>
      </div>

      {/* ── LUXURY HORIZONTAL DIRECT DROPDOWN FILTER BAR (Directly Below Hero) ── */}
      <div
        ref={filterBarRef}
        className="sticky top-[60px] md:top-[70px] z-30 bg-white/95 backdrop-blur-xl border-b border-amber-950/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]"
      >
        <div className="max-w-[1440px] mx-auto px-4 xl:px-8 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
            {/* Filter Dropdown Pills (Left / Main) */}
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              
              {/* 1. Price Pill (With Sorting + Range Filter) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "price" ? null : "price")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-2xs ${
                    isPriceFiltered || sortBy === "price-low" || sortBy === "price-high"
                      ? "bg-[#8B0000] text-white border border-[#8B0000] shadow-md shadow-red-950/15"
                      : "bg-stone-50/80 hover:bg-white text-stone-700 border border-stone-200/90 hover:border-[#8B0000]/60 hover:text-[#8B0000]"
                  }`}
                >
                  <IndianRupee className={`w-3.5 h-3.5 ${isPriceFiltered || sortBy.startsWith("price") ? "text-amber-200" : "text-[#8B0000]"}`} />
                  <span>Price</span>
                  {(isPriceFiltered || sortBy === "price-low" || sortBy === "price-high") && (
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === "price" ? "rotate-180 text-amber-200" : "text-stone-400"
                    }`}
                  />
                </button>

                {/* Price Luxury Flyout Card */}
                {activeDropdown === "price" && (
                  <div className="absolute left-0 top-full mt-2.5 w-84 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.16)] border border-amber-950/10 p-5 z-50 animate-fadeIn ring-1 ring-black/5">
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-stone-100">
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-[#8B0000]" /> Price &amp; Sorting
                      </span>
                      {isPriceFiltered && (
                        <button
                          onClick={() => setPriceRange(filterConfig.priceRange)}
                          className="text-[11px] text-[#8B0000] hover:text-[#680000] font-semibold"
                        >
                          Reset Range
                        </button>
                      )}
                    </div>

                    {/* Quick Price Sorting */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Sort by Price</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSortBy("price-low")}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            sortBy === "price-low"
                              ? "bg-[#8B0000] border-[#8B0000] text-white shadow-xs"
                              : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/80"
                          }`}
                        >
                          Low to High
                        </button>
                        <button
                          onClick={() => setSortBy("price-high")}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            sortBy === "price-high"
                              ? "bg-[#8B0000] border-[#8B0000] text-white shadow-xs"
                              : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/80"
                          }`}
                        >
                          High to Low
                        </button>
                      </div>
                    </div>

                    {/* Price Range Slider */}
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex justify-between text-xs text-stone-800 mb-2 font-bold">
                        <span>₹{priceRange[0].toLocaleString("en-IN")}</span>
                        <span>₹{priceRange[1].toLocaleString("en-IN")}</span>
                      </div>
                      <input
                        type="range"
                        min={filterConfig.priceRange[0]}
                        max={filterConfig.priceRange[1]}
                        step={100}
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], Number(e.target.value)])
                        }
                        className="w-full accent-[#8B0000] cursor-pointer"
                      />
                      <div className="flex gap-2 mt-3 mb-3">
                        <div className="flex-1">
                          <span className="text-[10px] text-stone-400 font-semibold block mb-1">Min (₹)</span>
                          <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) =>
                              setPriceRange([Number(e.target.value), priceRange[1]])
                            }
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#8B0000]"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] text-stone-400 font-semibold block mb-1">Max (₹)</span>
                          <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) =>
                              setPriceRange([priceRange[0], Number(e.target.value)])
                            }
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#8B0000]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-stone-100">
                      {[
                        { label: "Under ₹999", max: 999 },
                        { label: "Under ₹1,999", max: 1999 },
                        { label: "Under ₹2,999", max: 2999 },
                        { label: "Under ₹4,999", max: 4999 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setPriceRange([0, p.max])}
                          className={`text-[11px] py-1.5 px-2 rounded-xl border transition-all text-center font-medium ${
                            priceRange[1] === p.max && priceRange[0] === 0
                              ? "bg-[#8B0000]/10 border-[#8B0000] text-[#8B0000] font-bold"
                              : "bg-stone-50/80 border-stone-200 text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveDropdown(null)}
                      className="w-full mt-3.5 py-2.5 bg-[#8B0000] hover:bg-[#720000] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-950/15"
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Dynamic Section Filter Pills (Size, Color, Fabric, Pattern, Discount) */}
              {filterConfig.sections.map((sec) => {
                const selectedCount = (activeFilters[sec.id] || new Set()).size;
                const isOpen = activeDropdown === sec.id;
                const IconComponent = sec.icon || Layers;

                return (
                  <div key={sec.id} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(isOpen ? null : sec.id)
                      }
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-2xs ${
                        selectedCount > 0
                          ? "bg-[#8B0000] text-white border border-[#8B0000] shadow-md shadow-red-950/15"
                          : "bg-stone-50/80 hover:bg-white text-stone-700 border border-stone-200/90 hover:border-[#8B0000]/60 hover:text-[#8B0000]"
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${selectedCount > 0 ? "text-amber-200" : "text-[#8B0000]"}`} />
                      <span>{sec.label}</span>
                      {selectedCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-white text-[#8B0000] text-[11px] font-bold flex items-center justify-center">
                          {selectedCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-amber-200" : "text-stone-400"
                        }`}
                      />
                    </button>

                    {/* Section Flyout Card */}
                    {isOpen && (
                      <div className="absolute left-0 top-full mt-2.5 w-76 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.16)] border border-amber-950/10 p-5 z-50 animate-fadeIn ring-1 ring-black/5">
                        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-stone-100">
                          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                            <IconComponent className="w-4 h-4 text-[#8B0000]" /> Select {sec.label}
                          </span>
                          {selectedCount > 0 && (
                            <button
                              onClick={() => {
                                setActiveFilters((prev) => {
                                  const updated = { ...prev };
                                  delete updated[sec.id];
                                  return updated;
                                });
                              }}
                              className="text-[11px] text-[#8B0000] hover:text-[#680000] font-semibold"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Luxury Grid Layout for Sizes */}
                        {sec.id === "size" ? (
                          <div className="grid grid-cols-4 gap-2 mb-3.5">
                            {sec.options.map((opt) => {
                              const isSelected = (
                                activeFilters[sec.id] || new Set()
                              ).has(opt);

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleFilter(sec.id, opt)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                                    isSelected
                                      ? "bg-[#8B0000] border-[#8B0000] text-white shadow-xs"
                                      : "bg-stone-50 border-stone-200 text-stone-700 hover:border-[#8B0000] hover:bg-[#8B0000]/5"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Standard List with Custom Indicators for Other Sections */
                          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 mb-3.5">
                            {sec.options.map((opt) => {
                              const isSelected = (
                                activeFilters[sec.id] || new Set()
                              ).has(opt);

                              return (
                                <div
                                  key={opt}
                                  onClick={() => toggleFilter(sec.id, opt)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all text-xs ${
                                    isSelected
                                      ? "bg-[#8B0000]/10 text-[#8B0000] font-bold"
                                      : "hover:bg-stone-50 text-stone-700 font-medium"
                                  }`}
                                >
                                  <span className="truncate mr-2">{opt}</span>
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                                      isSelected
                                        ? "bg-[#8B0000] border-[#8B0000]"
                                        : "border-stone-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white stroke-[3]" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="w-full py-2.5 bg-[#8B0000] hover:bg-[#720000] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-950/15"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Reset All Filters Button */}
              {totalActiveCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* Right Side: Products Count & Sort Dropdown */}
            <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
              <span className="text-xs sm:text-sm text-stone-500 font-medium whitespace-nowrap">
                <span className="text-stone-900 font-extrabold text-sm">
                  {displayProducts.length}
                </span>{" "}
                Products
              </span>

              {/* Sort By Pill Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-50/80 hover:bg-white border border-stone-200/90 hover:border-[#8B0000] rounded-full text-xs sm:text-sm font-medium text-stone-700 transition-all justify-between shadow-2xs min-w-[160px] sm:min-w-[190px]"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#8B0000]" />
                    <span className="truncate">
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ||
                        "Sort By"}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                      showSortDropdown ? "rotate-180 text-[#8B0000]" : ""
                    }`}
                  />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-white/98 backdrop-blur-2xl border border-amber-950/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.16)] z-50 overflow-hidden animate-fadeIn ring-1 ring-black/5">
                    <div className="py-1.5">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                            sortBy === opt.value
                              ? "text-[#8B0000] font-bold bg-[#8B0000]/10"
                              : "text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.value && (
                            <Check className="w-3.5 h-3.5 text-[#8B0000]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips Sub-Row */}
          {totalActiveCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2.5 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">
                Active:
              </span>
              {isPriceFiltered && (
                <button
                  type="button"
                  onClick={() => setPriceRange(filterConfig.priceRange)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-xs font-semibold rounded-full hover:bg-[#8B0000]/20 transition-colors"
                >
                  Price: ₹{priceRange[0]} - ₹{priceRange[1]} <X className="w-3 h-3" />
                </button>
              )}
              {Object.entries(activeFilters).map(([secId, vals]) =>
                [...vals].map((v) => (
                  <button
                    key={`${secId}-${v}`}
                    type="button"
                    onClick={() => removeFilter(secId, v)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-xs font-semibold rounded-full hover:bg-[#8B0000]/20 transition-colors"
                  >
                    {v} <X className="w-3 h-3" />
                  </button>
                )),
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-red-600 hover:underline ml-1 font-bold"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FULL WIDTH 4-COLUMN PRODUCT GRID ── */}
      <div className="max-w-[1440px] mx-auto px-4 xl:px-8 py-6 sm:py-8">
        <main className="w-full min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 text-[#8B0000] animate-spin mb-4" />
              <p className="text-gray-500 text-sm font-medium">
                Loading collection…
              </p>
            </div>
          ) : apiError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Could not load products
              </h3>
              <p className="text-gray-400 text-sm">{apiError}</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {totalActiveCount > 0
                  ? "No products match your filters"
                  : "No products found"}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {totalActiveCount > 0
                  ? "Try adjusting or resetting your filter criteria."
                  : "No products have been added to this category yet."}
              </p>
              {totalActiveCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-6 py-2.5 bg-[#8B0000] hover:bg-[#700000] text-white rounded-full text-sm font-semibold transition-colors shadow-md"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            /* 4-column responsive grid matching homepage */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6">
              {displayProducts.map((product, idx) => (
                <CatProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  onWishlistToggle={toggleWishlist}
                  isWishlisted={isInWishlist(product.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
