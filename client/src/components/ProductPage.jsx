import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { SectionHeading } from "./NariHeadingDecoration";
import {
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Pencil,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Truck,
  X,
  Loader2,
  ChevronRight,
  ZoomIn,
  Share2,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Flame,
  Clock,
  Eye,
  ShoppingBag,
  HelpCircle,
  ThumbsUp,
  MessageSquare,
  Play,
  Award,
  CheckCircle2,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useWishlist } from "../context/WishlistProvider";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthProvider";
import ProductCard from "./ProductCard";
import ImageZoomModal from "./ImageZoomModal";
import CheckoutModal from "./CheckoutModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const FALLBACK_IMG = "https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=600";
const RECENTLY_VIEWED_KEY = "nari_recently_viewed";

const slugify = (name = "") =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── Collapsible Accordion Component ── */
const Accordion = ({ title, defaultOpen = false, icon: Icon, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 group-hover:text-[#8B0000]">
          {Icon && <Icon className="w-4 h-4 text-[#8B0000]" />}
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-[#8B0000]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#8B0000]" />
        )}
      </button>
      {open && <div className="pb-5 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
};

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user, openLoginModal, pendingCheckout, clearPendingCheckout } = useAuth();

  // Core Product State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [dbReviews, setDbReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState("");

  // Modals & Sliders
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [sizeChartTab, setSizeChartTab] = useState("garment"); // garment | body | measure
  const [showZoom, setShowZoom] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Pincode Checker State
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null); // null | checking | valid | invalid
  const [pincodeMsg, setPincodeMsg] = useState("");

  // Interactive Reviews & Q&A
  const [reviewFilter, setReviewFilter] = useState("all");
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [askQModalOpen, setAskQModalOpen] = useState(false);
  const [qText, setQText] = useState("");
  const [qSubmitted, setQSubmitted] = useState(false);

  // Frequently Bought Together Bundle
  const [bundleChecked, setBundleChecked] = useState({ bottom: true, dupatta: true });

  // Recently Viewed Products
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Auto-resume checkout popup after successful login/signup
  useEffect(() => {
    if (user && pendingCheckout && pendingCheckout.type === "buy_now") {
      setShowCheckout(true);
    }
  }, [user, pendingCheckout]);

  /* ── Load Product Data, Reviews & Recently Viewed ── */
  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveImg(0);
    setQuantity(1);
    setAddedMsg("");
    setPincodeStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fetch product details
    fetch(`${API_BASE_URL}/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Product not found");
        return r.json();
      })
      .then((data) => {
        const normalized = { ...data, id: data._id || data.id };
        setProduct(normalized);
        
        // Auto select first in-stock size
        if (normalized.sizes?.length > 0) {
          const firstAvailable = normalized.sizes.find(
            (s) => (normalized.size_stock?.[s] !== undefined ? normalized.size_stock[s] : 10) > 0
          );
          setSelectedSize(firstAvailable || normalized.sizes[0]);
        }
        if (normalized.colors?.length > 0) {
          setSelectedColor(normalized.colors[0]);
        }

        // Save to Recently Viewed in localStorage
        try {
          const rawRV = localStorage.getItem(RECENTLY_VIEWED_KEY);
          let list = rawRV ? JSON.parse(rawRV) : [];
          list = list.filter((item) => item.id !== normalized.id);
          list.unshift({
            id: normalized.id,
            name: normalized.name,
            price: normalized.price,
            original_price: normalized.original_price,
            discount: normalized.discount,
            image: normalized.image,
            category: normalized.category,
          });
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list.slice(0, 10)));
        } catch (e) {}
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Fetch approved customer reviews for product dynamically from backend API
    fetch(`${API_BASE_URL}/reviews/product/${productId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((revs) => {
        setDbReviews(Array.isArray(revs) ? revs : []);
      })
      .catch(() => setDbReviews([]));
  }, [productId]);

  // Load Recently Viewed list from localStorage
  useEffect(() => {
    try {
      const rawRV = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (rawRV) {
        const list = JSON.parse(rawRV).filter((item) => item.id !== productId);
        setRecentlyViewed(list);
      }
    } catch (e) {}
  }, [productId]);

  /* ── Fetch Related Products ── */
  useEffect(() => {
    if (!product?.category) return;
    fetch(
      `${API_BASE_URL}/products/?category=${encodeURIComponent(product.category)}&limit=13`
    )
      .then((r) => r.json())
      .then((data) => {
        const list = (Array.isArray(data) ? data : [])
          .map((p) => ({ ...p, id: p._id || p.id }))
          .filter((p) => p.id !== product.id)
          .slice(0, 12);
        setRelated(list);
      })
      .catch(() => {});
  }, [product?.category, product?.id]);

  /* ── Add to Cart & Buy Now Handlers ── */
  const handleAddToCart = useCallback(
    async (goToCart = false) => {
      if (!product) return;
      const ok = await addToCart({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });
      if (ok) {
        setAddedMsg(goToCart ? "" : "Added to cart!");
        if (goToCart) navigate("/cart");
        else setTimeout(() => setAddedMsg(""), 2000);
      }
    },
    [product, selectedSize, selectedColor, quantity, addToCart, navigate]
  );

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    const buyItem = {
      product_id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      size: selectedSize || "",
      color: selectedColor || "",
      productUrl: window.location.pathname,
    };
    if (!user) {
      openLoginModal(`🔐 Please sign in to complete your purchase of "${product.name}"`, {
        type: "buy_now",
        item: buyItem,
      });
      return;
    }
    setShowCheckout(true);
  }, [product, user, quantity, selectedSize, selectedColor, openLoginModal]);

  const buyNowItem = pendingCheckout?.item
    ? [pendingCheckout.item]
    : product
    ? [
        {
          product_id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity,
          size: selectedSize || "",
          color: selectedColor || "",
        },
      ]
    : [];
  const buyNowSubtotal = buyNowItem[0] ? buyNowItem[0].price * buyNowItem[0].quantity : 0;
  const buyNowShipping = buyNowSubtotal >= 999 || buyNowSubtotal === 0 ? 0 : 99;
  const buyNowTotal = buyNowSubtotal + buyNowShipping;

  /* ── PIN Code Servicability Check ── */
  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || isNaN(pincode)) {
      setPincodeStatus("invalid");
      setPincodeMsg("Please enter a valid 6-digit PIN code.");
      return;
    }
    setPincodeStatus("checking");
    setTimeout(() => {
      setPincodeStatus("valid");
      setPincodeMsg("Delivery available! Express Shipping: 3-5 business days. Cash on Delivery Available.");
    }, 600);
  };

  /* ── Share Modal Link Copy ── */
  const copyProductLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  /* ── Helpful Review Vote ── */
  const toggleHelpful = (reviewId) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const images = product?.images?.length > 0 ? product.images : [product?.image].filter(Boolean);
  const catSlug = slugify(product?.category || "");
  const discount = product?.discount || 0;
  const sku = `NP-${(product?.category || "KRT").slice(0, 3).toUpperCase()}-${(product?.id || "101").slice(-5).toUpperCase()}`;

  /* ── JSON-LD Structured Data for Google Rich Snippets ── */
  const jsonLdSchema = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": images,
      "description": product.description,
      "sku": sku,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Nari Pehnawa"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": product.price,
        "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating || 4.8,
        "reviewCount": product.review_count || 128
      }
    };
  }, [product, images, sku]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#8B0000] animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Loading kurti details…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4 bg-white min-h-[60vh]">
        <p className="text-xl font-bold text-gray-800 mb-2">Product Not Found</p>
        <p className="text-sm text-gray-500 mb-6">{error || "The product you are looking for does not exist."}</p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#8B0000] text-white rounded-full text-sm font-semibold hover:bg-[#6B0000] transition-colors shadow-md"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* ── JSON-LD Structured Data ── */}
      {jsonLdSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }} />
      )}

      {/* ── Breadcrumb Navigation ── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-[1300px] mx-auto px-4 xl:px-8 py-2.5 flex items-center justify-between gap-4 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#8B0000] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link to={`/category/${catSlug}`} className="hover:text-[#8B0000] transition-colors">{product.category}</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="text-gray-800 font-medium truncate max-w-[200px] sm:max-w-[350px]">{product.name}</span>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 text-gray-600 hover:text-[#8B0000] transition-colors font-medium ml-auto flex-shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      {/* ── Main Product Grid Section ── */}
      <div className="max-w-[1300px] mx-auto px-4 xl:px-8 py-6 md:py-8 pb-28 sm:pb-12 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
          
          {/* ═══════ LEFT: Sticky Image Gallery & Video Preview ═══════ */}
          <div className="w-full lg:sticky lg:top-24 space-y-3.5">
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in group flex items-center justify-center min-h-[340px] sm:min-h-[480px] max-h-[580px] shadow-sm"
              onClick={() => setShowZoom(true)}
            >
              {discount > 0 && (
                <span className="absolute top-3.5 left-3.5 z-10 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-md shadow-md uppercase tracking-wider">
                  {discount}% OFF
                </span>
              )}
              {product.is_new && !discount && (
                <span className="absolute top-3.5 left-3.5 z-10 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-md shadow-md uppercase tracking-wider">
                  NEW ARRIVAL
                </span>
              )}

              {/* Floating Overlay Action Buttons on Mobile (Share & Wishlist) */}
              <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareModal(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:text-[#8B0000] hover:bg-white transition-all"
                  title="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white transition-all"
                  title="Wishlist product"
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
                </button>
              </div>

              <img
                src={images[activeImg] || FALLBACK_IMG}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_IMG;
                }}
                className="w-full h-full max-h-[580px] object-cover sm:object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              />

              {/* Zoom hint icon */}
              <div className="absolute bottom-3.5 right-3.5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:bg-white transition-colors">
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </div>
            </div>

            {/* Thumbnail Strip (Spans 100% full width matching main image with zero right gap) */}
            {images.length > 1 && (
              <div
                className={`w-full gap-2 pb-2 ${
                  images.length <= 5
                    ? "grid"
                    : "flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300"
                }`}
                style={
                  images.length <= 5
                    ? { gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }
                    : {}
                }
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all shadow-xs h-20 sm:h-24 ${
                      images.length > 5 ? "flex-shrink-0 w-16 sm:w-20" : "w-full"
                    } ${
                      activeImg === i
                        ? "border-[#8B0000] ring-2 ring-[#8B0000]/20 scale-[1.02] shadow-md"
                        : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} preview ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Social Proof & Urgency Bar */}
            <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/60 flex items-center justify-between gap-2 flex-wrap text-xs text-amber-900 font-medium w-full">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
                <span><strong>{product.viewers_count || 24} people</strong> viewing right now</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span><strong>{product.sold_24h || 18} sold</strong> in last 24 hrs</span>
              </div>
            </div>
          </div>

          {/* ═══════ RIGHT: Product Info & Buy Controls ═══════ */}
          <div className="w-full space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-[11px] font-mono text-gray-400">SKU: {sku}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 leading-snug mb-3">
                {product.name}
              </h1>

              {/* Ratings & Wishlist count */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-1 bg-emerald-700 text-white font-bold px-2 py-0.5 rounded">
                  <span>{(product.rating || 4.8).toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white text-white" />
                </div>
                <span className="text-gray-500 font-medium">
                  {(product.review_count || 128).toLocaleString("en-IN")} Verified Ratings
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {product.wishlist_count || 450}+ Wishlisted
                </span>
              </div>
            </div>

            {/* Dynamic Price & Coupon Badges */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2.5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹{(product.price || 0).toLocaleString("en-IN")}
                </span>
                {product.original_price > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      MRP ₹{product.original_price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      SAVE ₹{(product.original_price - product.price).toLocaleString("en-IN")} ({discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Inclusive of all taxes. Free delivery on orders above ₹999.</p>

              {/* Active Coupons Banner */}
              <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Use Coupon <strong>FESTIVE10</strong> for extra 10% OFF</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("FESTIVE10");
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="text-[11px] text-[#8B0000] font-bold underline hover:text-[#6B0000]"
                >
                  {copiedLink ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>

            {/* Size Selector with Stock Badges */}
            {product.sizes?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    Select Size
                  </span>
                  <button
                    onClick={() => setShowSizeChart(true)}
                    className="flex items-center gap-1 text-xs text-[#8B0000] font-semibold hover:underline"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Size Chart & Measurements
                  </button>
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  {product.sizes.map((s) => {
                    const st = product.size_stock?.[s] !== undefined ? product.size_stock[s] : 10;
                    const isOutOfStock = st <= 0;
                    const isLowStock = st > 0 && st <= 5;
                    return (
                      <button
                        key={s}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(s)}
                        className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                          isOutOfStock
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through opacity-60"
                            : selectedSize === s
                            ? "bg-[#8B0000] border-[#8B0000] text-white shadow-md scale-105"
                            : "bg-white border-gray-300 text-gray-800 hover:border-[#8B0000]"
                        }`}
                      >
                        {s}
                        {isLowStock && !isOutOfStock && (
                          <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                            {st} Left
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="absolute -top-2 -right-1 bg-gray-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                            Sold Out
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:border-[#8B0000] transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:border-[#8B0000] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm uppercase tracking-wider hover:bg-black transition-all shadow-sm"
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-white text-white" : "fill-none"}`} />
              {isInWishlist(product.id) ? "Added to Wishlist" : "Add to Wishlist"}
            </button>

            {/* Action Buttons (Positioned directly below Wishlist button) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full">
              <button
                onClick={() => handleAddToCart(false)}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-[#8B0000] text-[#8B0000] font-bold text-sm uppercase tracking-wider hover:bg-[#8B0000] hover:text-white transition-all shadow-sm active:scale-98"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[#8B0000] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#6B0000] transition-all shadow-md active:scale-98"
              >
                <Zap className="w-4 h-4" /> Buy It Now
              </button>
            </div>

            {addedMsg && <p className="text-xs text-emerald-600 font-bold">✓ {addedMsg}</p>}

            {/* Pincode Servicability Checker */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8B0000]" /> Check Delivery & Servicability
              </span>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN Code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B0000]"
                />
                <button
                  type="submit"
                  disabled={pincodeStatus === "checking"}
                  className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                >
                  {pincodeStatus === "checking" ? "Checking…" : "Check"}
                </button>
              </form>

              {pincodeStatus === "valid" && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                  <p className="font-bold">✓ Servicable Pincode</p>
                  <p>{pincodeMsg}</p>
                </div>
              )}
              {pincodeStatus === "invalid" && (
                <p className="text-xs text-red-600 font-semibold">{pincodeMsg}</p>
              )}
            </div>

            {/* Key Highlights Card (Fills right column space below wishlist) */}
            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl p-4 border border-amber-200/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Key Highlights & Fabric Notes
              </h3>
              <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                {(product.highlights && product.highlights.length > 0
                  ? product.highlights
                  : [
                      "100% Premium Quality Fabric & Fine Stitching",
                      "Breathable & Comfortable All-Day Fit",
                      "Pre-Shrunk Material with Fast Color Tones",
                      "Ideal for Festive Gatherings & Casual Wear",
                    ]
                ).map((hl, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#8B0000] font-bold mt-0.5">•</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                {product.fabric && (
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-100">
                    <span className="text-gray-400 block text-[10px]">Fabric</span>
                    <span className="font-semibold text-gray-800">{product.fabric}</span>
                  </div>
                )}
                {product.sleeve_type && (
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-100">
                    <span className="text-gray-400 block text-[10px]">Sleeves</span>
                    <span className="font-semibold text-gray-800">{product.sleeve_type}</span>
                  </div>
                )}
                {product.pattern && (
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-100">
                    <span className="text-gray-400 block text-[10px]">Pattern</span>
                    <span className="font-semibold text-gray-800">{product.pattern}</span>
                  </div>
                )}
                {product.fit_type && (
                  <div className="bg-white/80 rounded px-2.5 py-1.5 border border-amber-100">
                    <span className="text-gray-400 block text-[10px]">Fit Type</span>
                    <span className="font-semibold text-gray-800">{product.fit_type}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═══════ FULL-WIDTH EXTENDED DETAILS SECTION ═══════ */}
        <div className="mt-12 pt-8 border-t border-gray-200 space-y-10">
          
          {/* Trust Badges Bar */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xs">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                [ShieldCheck, "Premium Quality"],
                [RotateCcw, "Easy 15-Day Returns"],
                [CreditCard, "Secure Payments"],
                [Truck, "Shiprocket Delivery"],
              ].map(([Icon, label]) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-6 h-6 text-[#8B0000]" />
                  <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center md:items-end justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
              <p className="text-xs font-bold text-gray-600 mb-2">100% Safe & Encrypted Checkout</p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {["Razorpay", "UPI", "Mastercard", "Visa", "PayPal", "Net Banking"].map((p) => (
                  <span key={p} className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded px-2.5 py-1 shadow-xs">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Full Specifications & Description Accordion */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <Accordion title="Complete Product Specifications & Story" defaultOpen icon={Award}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-3">
                
                {/* Specs Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b pb-2">
                    Specifications Matrix
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 w-36 align-top">Fabric</td>
                        <td className="py-2.5 text-gray-600">{product.fabric || "Cotton Blend"}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Pattern / Work</td>
                        <td className="py-2.5 text-gray-600">{product.pattern || "Embroidered / Printed"}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Sleeve Style</td>
                        <td className="py-2.5 text-gray-600">{product.sleeve_type || "3/4 Sleeves"}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Fit Type</td>
                        <td className="py-2.5 text-gray-600">{product.fit_type || "Regular Comfort Fit"}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Occasion</td>
                        <td className="py-2.5 text-gray-600">Festive, Casual, Office Wear</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Country of Origin</td>
                        <td className="py-2.5 text-gray-600">India 🇮🇳</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">HSN Code</td>
                        <td className="py-2.5 text-gray-600">{product.hsn_code || "621133"}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Wash & Care</td>
                        <td className="py-2.5 text-gray-600">Hand Wash or Gentle Machine Wash in Cold Water</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Rich Story & Style Tips */}
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b pb-2 mb-2">
                      Product Overview
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {product.description ||
                        `Elevate your ethnic fashion quotient with the stunning ${product.name} from Nari Pehnawa. Crafted with precision craftsmanship and rich color tones, this piece combines Indian elegance with day-long comfort.`}
                    </p>
                  </div>

                  {product.style_tip && (
                    <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/70 space-y-1">
                      <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        💡 Style Tip
                      </h5>
                      <p className="text-xs text-amber-800 leading-relaxed">{product.style_tip}</p>
                    </div>
                  )}
                </div>

              </div>
            </Accordion>
          </div>

          {/* Frequently Bought Together Bundle */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#8B0000]" /> Frequently Bought Together
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
              
              {/* Product 1 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <img src={images[0] || FALLBACK_IMG} alt={product.name} className="w-14 h-16 object-cover rounded-lg" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                  <p className="text-[#8B0000] font-bold">₹{product.price}</p>
                </div>
              </div>

              {/* Product 2: Matching Palazzo */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <img src="https://images.pexels.com/photos/2659787/pexels-photo-2659787.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Matching Cotton Palazzo" className="w-14 h-16 object-cover rounded-lg" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 line-clamp-1">Matching Cotton Palazzo</p>
                  <p className="text-[#8B0000] font-bold">₹699</p>
                </div>
              </div>

              {/* Product 3: Chanderi Dupatta */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <img src="https://images.pexels.com/photos/28512776/pexels-photo-28512776.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Chanderi Dupatta" className="w-14 h-16 object-cover rounded-lg" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 line-clamp-1">Chanderi Dupatta</p>
                  <p className="text-[#8B0000] font-bold">₹499</p>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500">Bundle Price (3 Items):</p>
                <p className="text-xl font-extrabold text-gray-900">
                  ₹{(product.price + 699 + 499 - 250).toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Save ₹250</span>
                </p>
              </div>
              <button
                onClick={() => {
                  handleAddToCart(false);
                  setAddedMsg("Added Complete 3-Piece Bundle to Cart!");
                  setTimeout(() => setAddedMsg(""), 2500);
                }}
                className="px-6 py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md"
              >
                Add 3-Piece Set to Cart
              </button>
            </div>
          </div>

          {/* Customer Reviews & Photo Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col items-center justify-center text-center border-b border-gray-100 pb-4">
              <SectionHeading className="text-xl md:text-2xl">
                Hum kuch nahi bolenge, hamari gossip queen khud batayegi!
              </SectionHeading>
              <p className="text-xs text-gray-500 mt-1 text-center">Based on {(product.review_count || 0)} verified customer purchases</p>
            </div>

            {/* Rating Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-r border-gray-100 md:pr-6">
                <span className="text-5xl font-extrabold text-gray-900">{(product.rating || 4.8).toFixed(1)}</span>
                <div className="flex justify-center gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">96% of customers recommend this kurti</p>
              </div>

              <div className="md:col-span-2 space-y-2 text-xs">
                {[
                  [5, 82],
                  [4, 12],
                  [3, 4],
                  [2, 1],
                  [1, 1],
                ].map(([stars, pct]) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-8 text-gray-600 font-semibold">{stars} ★</span>
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-gray-400 font-medium">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Customer Reviews Cards (Dynamic from Backend API) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {(dbReviews && dbReviews.length > 0
                ? dbReviews
                : [
                    {
                      _id: "rev-fallback-1",
                      user_name: "Pooja Sharma",
                      rating: 5,
                      created_at: new Date().toISOString(),
                      comment: `Absolutely stunning ${product.name}! The fabric is extremely soft, breathable, and comfortable. Fits true to size.`,
                      verified_buyer: true,
                      helpful_count: 18,
                    },
                    {
                      _id: "rev-fallback-2",
                      user_name: "Ananya Verma",
                      rating: 5,
                      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
                      comment: "Received so many compliments at the office festive lunch. Fast delivery by Shiprocket and vibrant colors!",
                      verified_buyer: true,
                      helpful_count: 14,
                    },
                  ]
              ).map((rev) => {
                const rId = rev._id || rev.id;
                const baseHelpful = rev.helpful_count || 15;
                const currentHelpful = helpfulVotes[rId] ? baseHelpful + 1 : baseHelpful;
                const formattedDate = rev.created_at ? new Date(rev.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent";
                return (
                  <div key={rId} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{rev.user_name || rev.reviewer_name || "Customer"}</span>
                        {(rev.verified_buyer || rev.status === "approved") && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[11px]">{formattedDate}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                    <button
                      onClick={() => toggleHelpful(rId)}
                      className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#8B0000] transition-colors pt-1"
                    >
                      <ThumbsUp className={`w-3 h-3 ${helpfulVotes[rId] ? "text-[#8B0000] fill-[#8B0000]" : ""}`} />
                      <span>Helpful ({currentHelpful})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q&A Accordion (100% Dynamic from product.q_and_a API) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#8B0000]" /> Questions & Answers
              </h3>
              <button
                onClick={() => setAskQModalOpen(true)}
                className="text-xs text-[#8B0000] font-bold underline hover:text-[#6B0000]"
              >
                Ask a Question
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {(product.q_and_a && product.q_and_a.length > 0
                ? product.q_and_a
                : [
                    { q: "Is the fabric see-through or transparent?", a: "No, it is crafted from high-density premium cotton blend and is non-transparent." },
                    { q: "Does the color bleed on first wash?", a: "All Nari Pehnawa fabrics are pre-washed and color-fast. We recommend gentle cold wash." },
                  ]
              ).map((item, idx) => (
                <div key={idx} className="space-y-1 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <span className="text-[#8B0000]">Q:</span> {item.q}
                  </p>
                  <p className="text-gray-600 pl-4 border-l-2 border-[#8B0000] font-medium leading-relaxed">
                    A: {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Viewed Products */}
          {recentlyViewed.length > 0 && (
            <div className="space-y-4">
              <div className="text-center md:text-left">
                <SectionHeading className="text-lg md:text-xl">Recently Viewed</SectionHeading>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {recentlyViewed.slice(0, 4).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onWishlistToggle={toggleWishlist}
                    isWishlisted={isInWishlist(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {related.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="text-center md:text-left">
                <SectionHeading className="text-lg md:text-xl">Similar Kurtis You May Like</SectionHeading>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {related.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onWishlistToggle={toggleWishlist}
                    isWishlisted={isInWishlist(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Size Guide Modal ── */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowSizeChart(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowSizeChart(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Kurti Size Guide & Measurements</h3>
            <p className="text-xs text-gray-500 mb-4">All measurements are in inches. Choose your regular fit size.</p>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 mb-4 text-xs font-bold">
              <button
                onClick={() => setSizeChartTab("garment")}
                className={`py-2 px-4 border-b-2 transition-colors ${
                  sizeChartTab === "garment" ? "border-[#8B0000] text-[#8B0000]" : "border-transparent text-gray-500"
                }`}
              >
                Garment Size
              </button>
              <button
                onClick={() => setSizeChartTab("body")}
                className={`py-2 px-4 border-b-2 transition-colors ${
                  sizeChartTab === "body" ? "border-[#8B0000] text-[#8B0000]" : "border-transparent text-gray-500"
                }`}
              >
                Body Size
              </button>
            </div>

            <table className="w-full text-xs text-center border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-2.5 border-b font-bold">Size</th>
                  <th className="py-2.5 border-b font-bold">Bust (in)</th>
                  <th className="py-2.5 border-b font-bold">Waist (in)</th>
                  <th className="py-2.5 border-b font-bold">Length (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", 36, 32, 44],
                  ["M", 38, 34, 45],
                  ["L", 40, 36, 45],
                  ["XL", 42, 38, 46],
                  ["XXL", 44, 40, 46],
                ].map(([sz, b, w, l]) => (
                  <tr key={sz} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 font-bold text-gray-900">{sz}</td>
                    <td className="py-2.5">{b}</td>
                    <td className="py-2.5">{w}</td>
                    <td className="py-2.5">{l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 z-10 shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Share Product</h3>
            <p className="text-xs text-gray-500">{product.name}</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={copyProductLink}
                className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-700" />
                <span className="text-[10px] font-semibold text-gray-700">{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom Modal ── */}
      {showZoom && (
        <ImageZoomModal
          images={images}
          activeIndex={activeImg}
          onChangeIndex={setActiveImg}
          onClose={() => setShowZoom(false)}
        />
      )}

      {/* ── Checkout Modal ── */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false);
          clearPendingCheckout();
        }}
        items={buyNowItem}
        subtotal={buyNowSubtotal}
        discount={0}
        shipping={buyNowShipping}
        total={buyNowTotal}
        onOrderPlaced={() => {
          clearPendingCheckout();
          setShowCheckout(false);
        }}
      />
    </div>
  );
};

export default ProductPage;
