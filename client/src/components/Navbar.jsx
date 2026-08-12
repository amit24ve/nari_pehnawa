import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  X,
  UserCircle,
  Package,
  Heart,
  Gift,
  Bell,
  LogOut,
  Tag,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Star,
  FolderTree,
  Settings,
  ChevronRight,
  Truck,
  RotateCcw,
  MapPin,
  Headphones,
  Globe,
  ChevronDown,
} from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthProvider";
import { useWishlist } from "../context/WishlistProvider";
import { useCart } from "../context/CartProvider";

import { trackCustomEvent } from "./VisitorTracker";
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Navbar = () => {
  const { user, logout, isLoginModalOpen, openLoginModal, closeLoginModal, loginModalMode } = useAuth();
  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchProducts, setSearchProducts] = useState([]);
  // Mobile drawer submenu navigation (3 levels deep):
  //   null                  → top-level menu
  //   "new-arrivals"        → New Arrivals submenu (level 1)
  //   "category"            → Category submenu: choose Women Fashion / Home Decor (level 1)
  //   "category-fashion"    → actual Fashion categories list (level 2)
  //   "category-home"       → actual Home Decor categories list (level 2)
  const [mobileSubmenu, setMobileSubmenu] = useState(null);

  // Which sliding panel (0, 1, 2) should be visible right now.
  const submenuStep =
    mobileSubmenu === "category-fashion" || mobileSubmenu === "category-home"
      ? 2
      : mobileSubmenu
        ? 1
        : 0;

  // Going "back" one level from wherever we currently are.
  const goBackSubmenu = () => {
    if (submenuStep === 2) setMobileSubmenu("category");
    else setMobileSubmenu(null);
  };

  const headerRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // ── Fetch categories from backend (dynamic navbar) ──
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  // ── Fetch search products from backend (debounced) ──
  useEffect(() => {
    if (!searchQuery.trim()) {
      // clear outside the early-return path to avoid lint warning
      const id = setTimeout(() => setSearchProducts([]), 0);
      return () => clearTimeout(id);
    }
    const timer = setTimeout(() => {
      trackCustomEvent("search", { query: searchQuery.trim() });
      fetch(
        `${API_BASE_URL}/products/?search=${encodeURIComponent(searchQuery)}&limit=8`,
      )
        .then((r) => r.json())
        .then((data) => setSearchProducts(Array.isArray(data) ? data : []))
        .catch(() => { });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      )
        setIsProfileDropdownOpen(false);
    };
    if (isProfileDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    await logout();
  };

  /* ── Dynamic nav links built from backend categories ── */
  const buildCategoryPath = (cat) =>
    cat.link ||
    `/category/${cat.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  const navLinks = [
    { name: "New Arrivals", path: "/new-arrivals", isNew: true },
    ...categories.map((cat) => ({
      name: cat.name,
      path: buildCategoryPath(cat),
    })),
    { divider: true },
    { name: "SALE", path: "/category/sale", isSale: true },
  ];

  /* ── Search products fetched from API ── */
  const filteredProducts = searchProducts.map((p) => ({
    id: p._id || p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    image: p.image,
  }));

  /* ── Profile Dropdown Content ── */
  const adminMenuItems = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Admin Dashboard",
    },
    {
      to: "/admin/products",
      icon: <ShoppingBag className="w-4 h-4" />,
      label: "Products",
    },
    {
      to: "/admin/categories",
      icon: <FolderTree className="w-4 h-4" />,
      label: "Categories",
    },
    {
      to: "/admin/orders",
      icon: <Package className="w-4 h-4" />,
      label: "Orders",
    },
    { to: "/admin/users", icon: <Users className="w-4 h-4" />, label: "Users" },
    {
      to: "/admin/reviews",
      icon: <Star className="w-4 h-4" />,
      label: "Reviews",
    },
    {
      to: "/admin/settings",
      icon: <Settings className="w-4 h-4" />,
      label: "Settings",
    },
  ];
  const userMenuItems = [
    {
      to: "/user/profile",
      icon: <UserCircle className="w-4 h-4" />,
      label: "My Profile",
    },
    {
      to: "/user/orders",
      icon: <Package className="w-4 h-4" />,
      label: "My Orders",
    },
  ];

  /* ── Separate categories into Fashion & Home Decor for 2-row nav ── */
  const HOME_DECOR_KEYWORDS = [
    "wall",
    "vase",
    "cushion",
    "candle",
    "pooja",
    "home-decor",
    "home-living",
    "decor",
    "gifting",
    "hamper",
    "pot",
  ];
  const isHomeDecor = (cat) =>
    HOME_DECOR_KEYWORDS.some(
      (kw) =>
        (cat.link || "").toLowerCase().includes(kw) ||
        (cat.name || "").toLowerCase().includes(kw),
    );

  // Filter out the special display_order=0 (New Arrivals) and display_order=99 (Sale)
  const regularCats = categories.filter(
    (c) => c.display_order !== 0 && c.display_order !== 99,
  );
  const fashionCats = regularCats.filter((c) => !isHomeDecor(c));
  const homeDecorCats = regularCats.filter((c) => isHomeDecor(c));

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.10)]" : "shadow-sm"
        }`}
    >
      {/* ══════════════════════════════════════
          1.  REDESIGNED TOP BAR
      ══════════════════════════════════════ */}
      <div 
        className="relative w-full z-50 select-none border-b border-white/10" 
        style={{ background: "linear-gradient(90deg, #5B0612 0%, #7A0C1E 50%, #5B0612 100%)" }}
      >
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between max-w-7xl mx-auto h-[36px] px-6 text-white text-[11px] font-medium tracking-wide">
          {/* Left: Promos */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-white" />
              <span><span className="font-bold text-[#FFE066]">FREE</span> Shipping on Orders ₹999+</span>
            </div>
            <span className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>7 Days Easy Returns</span>
            </div>
            <span className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-white" />
              <span>FLAT 10% OFF | <span className="font-bold text-[#FFE066]">Code: WELCOME10</span></span>
            </div>
            <span className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
              <span>25,000+ Happy Customers</span>
            </div>
          </div>

          {/* Right: Utilities */}
          <div className="flex items-center gap-4">
            <Link to="/user/orders" className="flex items-center gap-1.5 hover:text-[#FFE066] transition-colors">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>Track Order</span>
            </Link>
            <span className="w-px h-3 bg-white/20" />
            <Link to="/support/faqs" className="flex items-center gap-1.5 hover:text-[#FFE066] transition-colors">
              <Headphones className="w-3.5 h-3.5 text-white" />
              <span>Help Center</span>
            </Link>
            <span className="w-px h-3 bg-white/20" />
            <div className="relative group cursor-pointer flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-white" />
              <span><span className="font-bold text-[#FFE066]">English</span></span>
              <ChevronDown className="w-3 h-3 text-white ml-0.5 transition-transform group-hover:rotate-180" />
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
                <div className="w-28 bg-white border border-gray-100 rounded-lg shadow-xl py-1 text-gray-800 text-xs">
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#fff5f5] hover:text-[#8B0000] font-bold text-[#8B0000]">English</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#fff5f5] hover:text-[#8B0000]">Hindi</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout (Single Message Carousel) */}
        <div className="lg:hidden flex items-center justify-center h-[34px] px-4 text-center">
          <div className="relative w-full overflow-hidden h-full flex items-center justify-center">
            {/* Slide 1 */}
            <div className={`absolute inset-0 flex items-center justify-center gap-2 text-white text-[10.5px] font-medium transition-all duration-700 ease-in-out ${
              currentPromoIndex === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}>
              <Truck className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span><span className="font-bold text-[#FFE066]">FREE</span> Shipping on Orders ₹999+</span>
            </div>
            {/* Slide 2 */}
            <div className={`absolute inset-0 flex items-center justify-center gap-2 text-white text-[10.5px] font-medium transition-all duration-700 ease-in-out ${
              currentPromoIndex === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}>
              <RotateCcw className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span>7 Days Easy Returns</span>
            </div>
            {/* Slide 3 */}
            <div className={`absolute inset-0 flex items-center justify-center gap-2 text-white text-[10.5px] font-medium transition-all duration-700 ease-in-out ${
              currentPromoIndex === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}>
              <Gift className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span>FLAT 10% OFF | <span className="font-bold text-[#FFE066]">Code: WELCOME10</span></span>
            </div>
            {/* Slide 4 */}
            <div className={`absolute inset-0 flex items-center justify-center gap-2 text-white text-[10.5px] font-medium transition-all duration-700 ease-in-out ${
              currentPromoIndex === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}>
              <Star className="w-3.5 h-3.5 text-white fill-white flex-shrink-0" />
              <span>25,000+ Happy Customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          2.  MAIN BAR — Logo (left) | Search + Icons (right)
      ══════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full pl-[30px] pr-4 xl:pr-8">
          <div className="flex items-center justify-between h-[80px] gap-4">
            {/* ═ Logo — left ═ */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/logo.png"
                alt="Nari Pehnawa"
                className="h-[66px] w-auto object-contain"
              />
            </Link>

            {/* ═ Search Bar — flex-1 fills space between logo and icons ═ */}
            <div className="relative hidden lg:flex flex-1 justify-center">
              <div className="flex items-center border-2 border-gray-200 hover:border-[#8B0000] focus-within:border-[#8B0000] rounded-full overflow-hidden transition-all duration-200 bg-gray-50 focus-within:bg-white w-full max-w-[850px] mx-auto">
                <Search className="w-4 h-5 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search Kurtis, Home Decor…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                  className="flex-1 px-3 py-2.5 bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="px-5 py-2.5 bg-[#8B0000] hover:bg-[#6B0000] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  SEARCH
                </button>
              </div>

              {/* Desktop Search Dropdown */}
              {isSearchOpen && searchQuery.trim() && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-full min-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onMouseDown={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#fff5f5] border-b border-gray-50 last:border-0 text-left transition-colors"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400">{p.category}</p>
                        </div>
                        <p className="text-sm font-bold text-[#8B0000] flex-shrink-0">
                          ₹{p.price.toLocaleString("en-IN")}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-6 text-center text-sm text-gray-400">
                      No results for "
                      <span className="text-gray-700 font-medium">
                        {searchQuery}
                      </span>
                      "
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thin separator — desktop */}
            <div className="hidden lg:block w-px h-9 bg-gray-200" />

            {/* ═ Icon Group ═ */}
            <div className="flex items-center">
              {/* Mobile: Search Icon */}
              <button
                className="lg:hidden p-2.5 text-gray-600 hover:text-[#8B0000] transition-colors"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
              >
                <Search className="w-7 h-7" />
              </button>

              {/* Mobile: Wishlist Icon */}
              <Link
                to="/wishlist"
                className="md:hidden p-2 text-gray-600 hover:text-[#8B0000] transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-7 h-7" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Mobile: Cart Icon */}
              <Link
                to="/cart"
                className="md:hidden p-2 text-gray-600 hover:text-[#8B0000] transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account / Login */}
              {user ? (
                <div
                  className="relative hidden md:block"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex flex-col items-center gap-1 px-3.5 py-2 text-gray-600 hover:text-[#8B0000] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide leading-none">
                      {user.name?.split(" ")[0] || "Account"}
                    </span>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-[#fff5f5] to-white border-b border-gray-100">
                        <div className="w-11 h-11 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="py-1">
                        {(user.role === "admin" || user.is_admin
                          ? adminMenuItems
                          : userMenuItems
                        ).map(({ to, icon, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-[13px] text-gray-600 hover:bg-[#fff5f5] hover:text-[#8B0000] transition-colors"
                          >
                            <span className="text-gray-400">{icon}</span>
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openLoginModal()}
                  className="flex flex-col items-center gap-1 px-2.5 py-2 text-gray-600 hover:text-[#8B0000] transition-colors"
                  aria-label="Login"
                >
                  <User className="w-7 h-7" />
                  <span className="hidden md:inline text-[11px] font-semibold tracking-wide leading-none">
                    Login
                  </span>
                </button>
              )}

              {/* Wishlist — fixed link to /wishlist */}
              <Link
                to="/wishlist"
                className="relative hidden md:flex flex-col items-center gap-1 px-3.5 py-2 text-gray-600 hover:text-[#8B0000] transition-colors"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="w-7 h-7" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-wide leading-none">
                  Wishlist
                </span>
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative hidden md:flex flex-col items-center gap-1 px-3.5 py-2 text-gray-600 hover:text-[#8B0000] transition-colors"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-7 h-7" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-wide leading-none">
                  Cart
                </span>
              </Link>

              {/* Mobile Hamburger — right aligned */}
              <button
                className="lg:hidden p-2.5 ml-auto text-gray-600 hover:text-[#8B0000] hover:bg-[#fff0f0] rounded-xl transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
              3. CATEGORY NAV STRIP
              A single-line horizontally scrolling strip.
              Fashion categories, then Home Decor categories,
              are placed inline one after another and the
              whole thing scrolls together as ONE row/line.
              Counts are fully dynamic.
          ══════════════════════ */}
      <div className="bg-white border-b border-gray-100 hidden md:block">
        <div
          className="flex items-center h-[38px] overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* ── Fashion group ── */}
          <span className="flex-shrink-0 px-3 h-full flex items-center text-[9px] font-black text-[#8B0000] uppercase tracking-[0.15em] whitespace-nowrap bg-[#8B0000]/5">
            Fashion
          </span>

          <Link
            to="/new-arrivals"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 h-full text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-[#8B0000] hover:bg-[#8B0000]/5 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] flex-shrink-0" />
            NEW ARRIVALS
          </Link>

          {fashionCats.map((cat) => (
            <Link
              key={cat._id || cat.id}
              to={buildCategoryPath(cat)}
              className="flex-shrink-0 flex items-center px-3 h-full text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-gray-600 hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-all"
            >
              {cat.name.toUpperCase()}
            </Link>
          ))}

          <Link
            to="/category/sale"
            className="flex-shrink-0 flex items-center px-3 h-full text-[11px] font-black tracking-[0.08em] whitespace-nowrap text-[#dc2626] hover:bg-red-50 transition-all"
          >
            SALE
          </Link>

          {/* ── Home Decor group ── */}
          {homeDecorCats.length > 0 && (
            <>
              <span className="flex-shrink-0 w-px h-4 bg-gray-200 mx-1" />
              <span className="flex-shrink-0 px-3 h-full flex items-center text-[9px] font-black text-amber-800 uppercase tracking-[0.15em] whitespace-nowrap bg-amber-50">
                Home Decor
              </span>
              {homeDecorCats.map((cat) => (
                <Link
                  key={cat._id || cat.id}
                  to={buildCategoryPath(cat)}
                  className="flex-shrink-0 flex items-center px-3 h-full text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-amber-800 hover:text-amber-900 hover:bg-amber-50 transition-all"
                >
                  {cat.name.toUpperCase()}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE SEARCH OVERLAY
      ══════════════════════════════════════ */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search Kurtis, Home Decor…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() && filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fff5f5] border-b border-gray-100"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-11 h-11 object-cover rounded-xl"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <p className="text-sm font-bold text-[#8B0000]">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                No results for "{searchQuery}"
              </div>
            ) : (
              <div className="px-4 py-6 text-sm text-gray-400">
                Start typing to search…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setMobileSubmenu(null);
            }}
          />
          <div className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white z-50 flex flex-col overflow-hidden">
            {/* ═══ Drawer header — swaps title when inside a submenu ═══ */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              {mobileSubmenu ? (
                <button
                  onClick={goBackSubmenu}
                  className="flex items-center gap-2 text-gray-800 font-semibold text-sm"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  {mobileSubmenu === "new-arrivals" && "New Arrivals"}
                  {mobileSubmenu === "category" && "Category"}
                  {mobileSubmenu === "category-fashion" && "Women Fashion"}
                  {mobileSubmenu === "category-home" && "Home Decor"}
                </button>
              ) : (
                <img
                  src="/logo.png"
                  alt="Nari Pehnawa"
                  className="h-12 w-auto object-contain"
                />
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setMobileSubmenu(null);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ═══ Sliding panel container (3 panels: top-level → submenu → sub-submenu) ═══ */}
            <div className="flex-1 overflow-y-auto relative">
              <div
                className="flex w-[300%] h-full transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${submenuStep * (100 / 3)}%)`,
                }}
              >
                {/* ── PANEL 1: Top-level menu (matches reference layout) ── */}
                <div className="w-1/3 flex-shrink-0 flex flex-col">
                  {user ? (
                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase() ||
                          user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 font-semibold text-sm truncate">
                          {user.name || "User"}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-4">
                      <button
                        onClick={() => {
                          openLoginModal();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                      >
                        Login / Sign Up
                      </button>
                    </div>
                  )}

                  <nav className="flex-1">
                    {/* HOME */}
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      Home
                    </Link>

                    {/* NEW ARRIVALS — expandable submenu */}
                    <button
                      onClick={() => setMobileSubmenu("new-arrivals")}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      New Arrivals
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* CATEGORY — expandable submenu (lists all real categories) */}
                    <button
                      onClick={() => setMobileSubmenu("category")}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      Category
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* BEST SELLERS */}
                    <Link
                      to="/category/sale"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      Best Sellers
                    </Link>

                    {/* OUR STORY */}
                    <Link
                      to="/owner"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      Our Story
                    </Link>

                    {/* CONTACT */}
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      Contact
                    </Link>

                    {/* TRACK ORDER */}
                    <Link
                      to="/user/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-gray-500" />
                      Track Order
                    </Link>

                    {/* HELP CENTER */}
                    <Link
                      to="/support/faqs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                    >
                      <Headphones className="w-4 h-4 text-gray-500" />
                      Help Center
                    </Link>
                  </nav>

                  {!user && (
                    <div className="px-5 py-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openLoginModal("🔐 Please sign in or create an account to start shopping");
                        }}
                        className="flex items-center gap-3 py-3.5 text-sm font-semibold text-gray-700 hover:text-[#8B0000] w-full border-b border-gray-100 text-left"
                      >
                        <UserCircle className="w-5 h-5 text-gray-400" /> Sign In / Register
                      </button>
                    </div>
                  )}

                  {user && (
                    <div className="px-5 py-4 border-t border-gray-100 mt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        My Account
                      </p>
                      {user.role === "admin" || user.is_admin ? (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm text-gray-700 hover:text-[#8B0000] border-b border-gray-100"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-400" />{" "}
                            Admin Dashboard
                          </Link>
                          <Link
                            to="/admin/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm text-gray-700 hover:text-[#8B0000] border-b border-gray-100"
                          >
                            <Package className="w-4 h-4 text-gray-400" />{" "}
                            Orders
                          </Link>
                          <Link
                            to="/admin/products"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm text-gray-700 hover:text-[#8B0000] border-b border-gray-100"
                          >
                            <ShoppingBag className="w-4 h-4 text-gray-400" />{" "}
                            Products
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/user/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm text-gray-700 hover:text-[#8B0000] border-b border-gray-100"
                          >
                            <UserCircle className="w-4 h-4 text-gray-400" /> My
                            Profile
                          </Link>
                          <Link
                            to="/user/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm text-gray-700 hover:text-[#8B0000] border-b border-gray-100"
                          >
                            <Package className="w-4 h-4 text-gray-400" /> My
                            Orders
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 py-3 text-sm text-red-600 hover:text-red-700 w-full"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* ── PANEL 2: Submenu (New Arrivals links OR Category's 2 sub-categories) ── */}
                <div className="w-1/3 flex-shrink-0">
                  {mobileSubmenu === "new-arrivals" && (
                    <nav>
                      <Link
                        to="/new-arrivals"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setMobileSubmenu(null);
                        }}
                        className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                      >
                        All New Arrivals
                      </Link>
                      <Link
                        to="/category/sale"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setMobileSubmenu(null);
                        }}
                        className="flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                      >
                        Sale
                      </Link>
                    </nav>
                  )}

                  {/* Category → 2 sub-categories: Women Fashion & Home Decor */}
                  {mobileSubmenu === "category" && (
                    <nav>
                      <button
                        onClick={() => setMobileSubmenu("category-fashion")}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#8B0000] border-b border-gray-100 hover:bg-[#fff5f5] transition-colors"
                      >
                        Women Fashion
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setMobileSubmenu("category-home")}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-amber-800 border-b border-gray-100 hover:bg-amber-50 transition-colors"
                      >
                        Home Decor
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </nav>
                  )}
                </div>

                {/* ── PANEL 3: Actual category list for the chosen sub-category ── */}
                <div className="w-1/3 flex-shrink-0">
                  {mobileSubmenu === "category-fashion" && (
                    <nav>
                      {fashionCats.map((cat) => (
                        <Link
                          key={cat._id || cat.id}
                          to={buildCategoryPath(cat)}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setMobileSubmenu(null);
                          }}
                          className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100 hover:bg-[#fff5f5] hover:text-[#8B0000] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      {fashionCats.length === 0 && (
                        <p className="px-5 py-6 text-sm text-gray-400 text-center">
                          No categories available
                        </p>
                      )}
                    </nav>
                  )}

                  {mobileSubmenu === "category-home" && (
                    <nav>
                      {homeDecorCats.map((cat) => (
                        <Link
                          key={cat._id || cat.id}
                          to={buildCategoryPath(cat)}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setMobileSubmenu(null);
                          }}
                          className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      {homeDecorCats.length === 0 && (
                        <p className="px-5 py-6 text-sm text-gray-400 text-center">
                          No categories available
                        </p>
                      )}
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <LoginModal
        key={isLoginModalOpen ? loginModalMode : "closed"}
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />
    </header>
  );
};

export default Navbar;
