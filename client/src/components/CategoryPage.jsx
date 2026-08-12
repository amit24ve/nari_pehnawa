import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { NariHeadingDecoration } from "./NariHeadingDecoration";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  SlidersHorizontal,
  Heart,
  Star,
  ShoppingBag,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { useWishlist } from "../context/WishlistProvider";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// ── Inline Product Card ────────────────────────────────────────
const CatProductCard = ({ product, onWishlistToggle, isWishlisted }) => {
  const [hearted, setHearted] = useState(isWishlisted || false);
  const [selectedSize, setSelectedSize] = useState(null);
  const navigate = useNavigate();
  useEffect(() => setHearted(isWishlisted), [isWishlisted]);

  const discount = product.discount;
  const discountBg = discount >= 50 ? "bg-red-600" : "bg-orange-500";
  const sizes = product.sizes?.length > 0 ? product.sizes : [];

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-xl overflow-hidden group cursor-pointer hover:shadow-[0_8px_32px_rgba(139,0,0,0.15)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden bg-gray-100">
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
          className="absolute top-2.5 right-2.5 z-20 bg-white/90 hover:bg-white p-1.5 rounded-full shadow transition-transform hover:scale-110"
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
          className="w-full h-[260px] sm:h-[280px] object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Size overlay on hover — only if product has sizes */}
        {sizes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/55 backdrop-blur-sm py-2.5 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <p className="text-[10px] text-gray-300 text-center mb-1.5 font-medium">
              Select Size
            </p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(selectedSize === s ? null : s);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-all ${selectedSize === s
                      ? "bg-white text-gray-900 border border-white"
                      : "border border-white/60 text-gray-100 hover:border-white hover:bg-white/10"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-[11px] text-gray-500 mb-0.5">
          {product.brand || "Nari Pehnawa"}
        </p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1.5">
          {product.name}
        </p>
        <div className="flex items-center gap-1 mb-2">
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-900">
            Rs.{(product.price || 0).toLocaleString("en-IN")}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-gray-500 line-through">
              Rs.{product.original_price.toLocaleString("en-IN")}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[11px] font-semibold text-orange-400">
              {discount}% off
            </span>
          )}
        </div>
        {selectedSize && (
          <p className="text-[11px] text-[#8B0000] font-semibold mt-1.5">
            Size: {selectedSize} ✓
          </p>
        )}
      </div>
    </div>
  );
};

// ── Filter accordion section ──────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 text-left"
      >
        <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && children}
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

  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  // Category info from backend (for hero image)
  const [categoryInfo, setCategoryInfo] = useState(null);

  // UI state
  const [sortBy, setSortBy] = useState("featured");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 25000]);
  const [activeFilters, setActiveFilters] = useState({});
  const [showMoreMap, setShowMoreMap] = useState({});
  const [showMobileSort, setShowMobileSort] = useState(false);

  // ── Fetch category info (for hero image) ─────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => r.json())
      .then((cats) => {
        if (!Array.isArray(cats)) return;
        // Match by link field or by name similarity
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
      .catch(() => { });
  }, [slug]);

  // ── Fetch products from API ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setApiError(null);
      setProducts([]);
      setActiveFilters({});
      setShowMoreMap({});
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
      sections.push({ id: "size", label: "Size", options: allSizes });
    if (allColors.length > 0)
      sections.push({ id: "color", label: "Color", options: allColors });
    if (allFabrics.length > 0)
      sections.push({ id: "fabric", label: "Fabric", options: allFabrics });
    if (allPatterns.length > 0)
      sections.push({
        id: "pattern",
        label: "Pattern",
        options: allPatterns,
      });
    sections.push({
      id: "discount",
      label: "Discount",
      options: ["10% & above", "25% & above", "40% & above", "50% & above"],
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
  };

  const totalActiveCount = Object.values(activeFilters).reduce(
    (n, s) => n + s.size,
    0,
  );

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

  // ── Filter Panel ─────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-0">
      <FilterSection title="Price Range">
        <div className="px-1">
          <div className="flex justify-between text-sm text-gray-600 mb-3">
            <span>Rs.{priceRange[0].toLocaleString("en-IN")}</span>
            <span>Rs.{priceRange[1].toLocaleString("en-IN")}</span>
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
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([Number(e.target.value), priceRange[1]])
              }
              placeholder="Min"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#8B0000]"
            />
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              placeholder="Max"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#8B0000]"
            />
          </div>
        </div>
      </FilterSection>

      {filterConfig.sections.map((sec, idx) => (
        <FilterSection key={sec.id} title={sec.label} defaultOpen={idx < 2}>
          <div className="space-y-2">
            {(showMoreMap[sec.id] ? sec.options : sec.options.slice(0, 8)).map(
              (opt) => {
                const selected = (activeFilters[sec.id] || new Set()).has(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => toggleFilter(sec.id, opt)}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected
                          ? "bg-[#8B0000] border-[#8B0000]"
                          : "border-gray-300 group-hover:border-[#8B0000]"
                        }`}
                    >
                      {selected && (
                        <span className="text-white text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[13px] leading-snug transition-colors ${selected
                          ? "text-[#8B0000] font-medium"
                          : "text-gray-600 group-hover:text-gray-800"
                        }`}
                    >
                      {opt}
                    </span>
                  </label>
                );
              },
            )}
            {sec.options.length > 8 && (
              <button
                onClick={() =>
                  setShowMoreMap((m) => ({
                    ...m,
                    [sec.id]: !m[sec.id],
                  }))
                }
                className="text-[12px] text-[#8B0000] hover:text-[#a52a2a] font-medium mt-1"
              >
                {showMoreMap[sec.id]
                  ? "- Show Less"
                  : `+ ${sec.options.length - 8} More`}
              </button>
            )}
          </div>
        </FilterSection>
      ))}
    </div>
  );

  // ── Render ───────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "#fdf8f5", minHeight: "100vh" }}>
      {/* ── HERO BANNER ── */}
      {/* Height: 500px mobile, 588px desktop (+200px from original) */}
      <div
        className={`cat-hero relative overflow-hidden bg-gradient-to-br ${fallbackGradient}`}
        style={{ height: "500px" }}
      >
        <style>{`@media(min-width:768px){.cat-hero{height:588px!important;}}`}</style>

        {/* Background image — always attempt, fallback to gradient */}
        {categoryInfo?.image && (
          <img
            src={categoryInfo.image}
            alt={categoryInfo.name || displayName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
            onError={(e) => {
              // hide broken image; gradient shows through
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Dark gradient overlay for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)",
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

      {/* ── MOBILE: sticky Filter / Sort bar, right below the hero.
          top-[110px] matches the fixed mobile navbar height (see
          MainLayout's `pt-[110px]` in App.jsx) so this bar sticks
          directly under the navbar instead of being hidden behind it. ── */}
      <div className="lg:hidden sticky top-[110px] z-20 bg-white border-b border-gray-200 flex divide-x divide-gray-200 shadow-sm">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-700 active:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#8B0000]" />
          Filter
          {totalActiveCount > 0 && (
            <span className="bg-[#8B0000] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalActiveCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowMobileSort(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-700 active:bg-gray-50 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4 text-[#8B0000]" />
          Sort
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 xl:px-8 py-6">
        {/* Toolbar — desktop/tablet only (mobile uses the sticky bar above) */}
        <div className="hidden lg:flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="text-sm text-gray-600">
            <span className="text-gray-900 font-semibold">
              {displayProducts.length}
            </span>{" "}
            products found
          </span>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#8B0000] transition-colors min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#8B0000]" />
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ||
                  "Sort By"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === opt.value
                        ? "text-[#8B0000] font-semibold bg-[#8B0000]/10"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: product count only (Filter/Sort now live in the sticky bar) */}
        <p className="lg:hidden text-sm text-gray-600 mb-4">
          <span className="text-gray-900 font-semibold">
            {displayProducts.length}
          </span>{" "}
          products found
        </p>

        {/* Active Filter Chips */}
        {totalActiveCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(activeFilters).map(([secId, vals]) =>
              [...vals].map((v) => (
                <button
                  key={`${secId}-${v}`}
                  onClick={() => removeFilter(secId, v)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#8B0000]/10 border border-[#8B0000]/40 text-[#8B0000] text-xs rounded-full hover:bg-[#8B0000]/20 transition-colors"
                >
                  {v} <X className="w-3 h-3" />
                </button>
              )),
            )}
            <button
              onClick={clearAll}
              className="px-3 py-1 text-xs text-gray-500 hover:text-red-600 underline underline-offset-2 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
            <div className="sticky top-40 bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#8B0000]" /> Filters
                </h2>
                {totalActiveCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear ({totalActiveCount})
                  </button>
                )}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#8B0000] animate-spin" />
                </div>
              ) : (
                <FilterPanel />
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-12 h-12 text-[#8B0000] animate-spin mb-4" />
                <p className="text-gray-500 text-sm font-medium">
                  Loading products…
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
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {totalActiveCount > 0
                    ? "No products match your filters"
                    : "No products found"}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {totalActiveCount > 0
                    ? "Try adjusting your filters."
                    : "No products have been added to this category yet."}
                </p>
                {totalActiveCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-6 py-2.5 bg-[#8B0000] hover:bg-[#700000] text-white rounded-full text-sm font-semibold transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {displayProducts.map((product) => (
                  <CatProductCard
                    key={product.id}
                    product={product}
                    onWishlistToggle={toggleWishlist}
                    isWishlisted={isInWishlist(product.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sort Bottom Sheet (standard mobile e-commerce pattern) */}
      {showMobileSort && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setShowMobileSort(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 lg:hidden rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#8B0000]" /> Sort By
              </h2>
              <button
                onClick={() => setShowMobileSort(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setShowMobileSort(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-colors ${sortBy === opt.value
                      ? "text-[#8B0000] font-semibold bg-[#8B0000]/5"
                      : "text-gray-700"
                    }`}
                >
                  {opt.label}
                  {sortBy === opt.value && (
                    <span className="w-2 h-2 rounded-full bg-[#8B0000]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 lg:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#8B0000]" /> Filters
                {totalActiveCount > 0 && (
                  <span className="bg-[#8B0000] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalActiveCount}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterPanel />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={clearAll}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 bg-[#8B0000] hover:bg-[#700000] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Apply ({displayProducts.length} items)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryPage;
