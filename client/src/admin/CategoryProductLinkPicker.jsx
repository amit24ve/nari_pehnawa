import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  FolderOpen,
  ShoppingBag,
  ExternalLink,
  Tag,
  Sparkles,
  X,
  Link2
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Fallback / standard subcategories per kurti category
const DEFAULT_SUBCATEGORIES_MAP = {
  "anarkali kurtis": ["Floor Length", "Flared Anarkali", "Wedding Anarkali", "Georgette Anarkali", "Silk Blend", "Festive Special"],
  "straight kurtis": ["Office Wear", "Daily Wear", "Cotton Straight", "Rayon Straight", "Side Slit"],
  "a-line kurtis": ["Casual A-Line", "Party Wear", "Floral Print", "Festive Special"],
  "printed kurtis": ["Handblock Print", "Floral Print", "Geometric Print", "Batik Print", "Zari Print"],
  "embroidered kurtis": ["Zari Work", "Phulkari", "Resham Threadwork", "Mirror Work", "Sequined"],
  "denim kurtis": ["Washed Denim", "Embroidered Denim", "Shirt Style", "Fusion Denim"],
  "kaftan kurtis": ["Printed Kaftan", "Silk Kaftan", "Mirror Work Kaftan", "Resort Wear"],
  "chikankari kurtis": ["Lucknowi Georgette", "Chanderi Chikankari", "Hand Embroidered", "Pastel Shades"],
  "palazzo set kurtis": ["Kurti with Palazzo", "3-Piece Set with Dupatta", "Straight Palazzo Set", "Flared Palazzo Set"],
  "angrakha kurtis": ["Tie-up Angrakha", "Festive Angrakha", "Embroidered Angrakha", "Anarkali Angrakha"]
};

const COMMON_QUICK_LINKS = [
  { label: "⚡ Live Flash Sale Page", link: "/category/sale", badge: "Offer" },
  { label: "🏠 Home Storefront", link: "/", badge: "Main" },
  { label: "👗 All Categories / Catalog", link: "/category/anarkali-kurtis", badge: "Catalog" }
];

/**
 * CategoryProductLinkPicker
 * Reusable dropdown component with checkboxes for Categories, Subcategories, and Products.
 * Automatically appears below the input box when clicked or focused.
 */
const CategoryProductLinkPicker = ({
  value = "",
  onChange,
  placeholder = "/category/anarkali-kurtis",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("categories"); // "categories" | "products" | "common"
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load Categories & Products on initial render or first open
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories/?is_active=true`).catch(() => null),
          fetch(`${API_BASE_URL}/products/?limit=100`).catch(() => null)
        ]);

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (isMounted && Array.isArray(catData)) setCategories(catData);
        }

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (isMounted && Array.isArray(prodData)) setProducts(prodData);
        }
      } catch (err) {
        console.warn("Could not load categories/products for LinkPicker:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Toggle category expand/collapse
  const toggleCategoryExpand = (catId, e) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Helper to format slug from category name if cat.link isn't provided
  const getCategoryLink = (cat) => {
    if (cat.link && cat.link.startsWith("/")) return cat.link;
    const slug = (cat.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    return `/category/${slug}`;
  };

  // Select a category link
  const handleSelectCategory = (cat) => {
    const link = getCategoryLink(cat);
    onChange && onChange(link);
    setIsOpen(false);
  };

  // Select a subcategory link
  const handleSelectSubcategory = (cat, subcat) => {
    const baseLink = getCategoryLink(cat);
    const subSlug = encodeURIComponent(subcat);
    const fullLink = `${baseLink}?sub_category=${subSlug}`;
    onChange && onChange(fullLink);
    setIsOpen(false);
  };

  // Select a product link
  const handleSelectProduct = (product) => {
    const pId = product._id || product.id;
    const link = `/product/${pId}`;
    onChange && onChange(link);
    setIsOpen(false);
  };

  // Filtered categories and their subcategories based on search
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;

    return categories.filter((cat) => {
      const nameMatch = (cat.name || "").toLowerCase().includes(q);
      const tagMatch = (cat.tagline || "").toLowerCase().includes(q);
      const subcats = cat.subcategories || DEFAULT_SUBCATEGORIES_MAP[(cat.name || "").toLowerCase()] || [];
      const subcatMatch = subcats.some((sub) => sub.toLowerCase().includes(q));
      return nameMatch || tagMatch || subcatMatch;
    });
  }, [categories, searchQuery]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;

    return products.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(q);
      const catMatch = (p.category || "").toLowerCase().includes(q);
      return nameMatch || catMatch;
    });
  }, [products, searchQuery]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Main Input Box ── */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-20 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0891b2] focus:bg-white transition-all shadow-2xs ${className}`}
        />

        {/* Action icons inside input (Clear + Dropdown Toggle) */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => onChange && onChange("")}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              title="Clear Link"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isOpen
                ? "bg-[#0891b2] text-white border-[#0891b2]"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title="Pick Category or Product Link"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Dropdown Panel (Opens below input on click) ── */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 text-left w-[360px] sm:w-[440px] max-w-[calc(100vw-3rem)] overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Search Header */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category, subcategory, or product..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex border-b border-slate-100 pb-2 mb-2 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "categories"
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FolderOpen className="w-3 h-3" /> Categories &amp; Subcategories
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "products"
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ShoppingBag className="w-3 h-3" /> Specific Products ({filteredProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("common")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "common"
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Quick Links
            </button>
          </div>

          {/* ── TAB 1: Categories & Subcategories with Hierarchical Checkboxes ── */}
          {activeTab === "categories" && (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const catLink = getCategoryLink(cat);
                  const isCatSelected = value === catLink;
                  const catKey = (cat.name || "").toLowerCase();
                  const subcategories =
                    cat.subcategories || DEFAULT_SUBCATEGORIES_MAP[catKey] || [];
                  const isExpanded = expandedCategories[cat._id || cat.name] || searchQuery.length > 0;

                  return (
                    <div key={cat._id || cat.name} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50/50">
                      {/* Category Row with Checkbox */}
                      <div
                        onClick={() => handleSelectCategory(cat)}
                        className={`flex items-center justify-between p-2 cursor-pointer transition ${
                          isCatSelected ? "bg-cyan-50 border-cyan-200 text-[#0891b2]" : "hover:bg-slate-100/80 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isCatSelected
                                ? "bg-[#0891b2] border-[#0891b2] text-white"
                                : "border-slate-300 bg-white hover:border-[#0891b2]"
                            }`}
                          >
                            {isCatSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-6 h-6 object-cover rounded shrink-0 border" />
                          ) : (
                            <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                          )}

                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs truncate block">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate block">{catLink}</span>
                          </div>
                        </div>

                        {/* Expand / Collapse Subcategories Toggle */}
                        {subcategories.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleCategoryExpand(cat._id || cat.name, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition shrink-0 ml-1"
                            title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Nested Subcategories List with Nested Checkboxes */}
                      {isExpanded && subcategories.length > 0 && (
                        <div className="bg-white pl-8 pr-2 py-1.5 border-t border-slate-100 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Subcategories &amp; Styles:
                          </span>
                          {subcategories.map((subcat, sIdx) => {
                            const subLink = `${catLink}?sub_category=${encodeURIComponent(subcat)}`;
                            const isSubSelected = value === subLink;
                            return (
                              <div
                                key={sIdx}
                                onClick={() => handleSelectSubcategory(cat, subcat)}
                                className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition text-xs ${
                                  isSubSelected
                                    ? "bg-cyan-50 font-bold text-[#0891b2]"
                                    : "hover:bg-slate-50 text-slate-600"
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition shrink-0 ${
                                    isSubSelected
                                      ? "bg-[#0891b2] border-[#0891b2] text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSubSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate flex-1">{subcat}</span>
                                <span className="text-[9px] text-slate-400 font-mono">?sub_category={subcat}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {loading ? "Loading categories..." : "No matching categories found."}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Specific Products with Checkboxes ── */}
          {activeTab === "products" && (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const pId = p._id || p.id;
                  const pLink = `/product/${pId}`;
                  const isProdSelected = value === pLink;
                  return (
                    <div
                      key={pId}
                      onClick={() => handleSelectProduct(p)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                        isProdSelected
                          ? "bg-cyan-50 border-cyan-200 text-[#0891b2]"
                          : "border-slate-100 hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isProdSelected
                              ? "bg-[#0891b2] border-[#0891b2] text-white"
                              : "border-slate-300 bg-white hover:border-[#0891b2]"
                          }`}
                        >
                          {isProdSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-7 h-7 object-cover rounded border shrink-0" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0" />
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-xs text-[#0891b2] font-mono">₹{p.price}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {loading ? "Loading products..." : "No matching products found."}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: Common Quick Store Links ── */}
          {activeTab === "common" && (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {COMMON_QUICK_LINKS.map((ql, idx) => {
                const isSelected = value === ql.link;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange && onChange(ql.link);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-cyan-50 border-cyan-200 text-[#0891b2]"
                        : "border-slate-100 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? "bg-[#0891b2] border-[#0891b2] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold">{ql.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{ql.link}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer note & helper */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Click any checkbox to apply link</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#0891b2] hover:underline font-bold"
            >
              Close Dropdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProductLinkPicker;
