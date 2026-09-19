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
  Camera,
} from "lucide-react";
import { useWishlist } from "../context/WishlistProvider";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthProvider";
import ProductCard from "./ProductCard";
import ImageZoomModal from "./ImageZoomModal";
import CheckoutModal from "./CheckoutModal";
import useSEO from "../hooks/useSEO";
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

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

  useSEO(
    product ? `${product.name} | Nari Pehnawa` : "Authentic Women Ethnic Wear | Nari Pehnawa",
    product ? `${product.description || product.name}. Shop original handcrafted Indian ethnic wear at Nari Pehnawa.` : "Handcrafted Anarkali Kurtis, Chikankari Sets, Palazzo Suits, Sarees & Designer Ethnic Wear at Nari Pehnawa."
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
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

  // Dynamic viewers & Urgency counters
  const [viewersCount, setViewersCount] = useState(null);

  // Dynamic Wishlist count on product
  const [productWishlistCount, setProductWishlistCount] = useState(0);

  // Write a Customer Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  // Dynamic coupons
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Frequently Bought Together Dynamic Bundle
  const [bundleProducts, setBundleProducts] = useState([]);
  const [selectedBundleMap, setSelectedBundleMap] = useState({});

  // Recently Viewed Products
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Auto-resume checkout popup after successful login/signup
  useEffect(() => {
    if (user && pendingCheckout && pendingCheckout.type === "buy_now") {
      setShowCheckout(true);
    }
  }, [user, pendingCheckout]);

  /* ── Load Product Data, Reviews & Urgency Counters ── */
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
        setProductWishlistCount(normalized.wishlist_count || 0);
        
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

        // Save to Recently Viewed in localStorage (with clean real data)
        try {
          const rawRV = localStorage.getItem(RECENTLY_VIEWED_KEY);
          let list = rawRV ? JSON.parse(rawRV) : [];
          list = (Array.isArray(list) ? list : []).filter((item) => item && item.id !== normalized.id);
          list.unshift({
            id: normalized.id,
            name: normalized.name,
            price: normalized.price,
            original_price: normalized.original_price,
            discount: normalized.discount,
            image: normalized.image || (normalized.images && normalized.images[0]) || FALLBACK_IMG,
            category: normalized.category,
            rating: normalized.rating || 0.0,
            review_count: normalized.review_count || 0
          });
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list.slice(0, 10)));
        } catch (e) {}
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Record view & fetch dynamic live viewers count from DB
    fetch(`${API_BASE_URL}/products/${productId}/view`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.viewers_count !== undefined) {
          setViewersCount(data.viewers_count);
        }
      })
      .catch(() => {});

    // Fetch active coupons dynamically for promotion banner
    fetch(`${API_BASE_URL}/coupons/public-active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        const top = Array.isArray(c) ? c[0] : c;
        if (top && top.code) setActiveCoupon(top);
      })
      .catch(() => {});

    // Fetch catalog products for Frequently Bought Together bundle
    fetch(`${API_BASE_URL}/products/?limit=12`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = (Array.isArray(data) ? data : [])
          .map((p) => ({ ...p, id: p._id || p.id }))
          .filter((p) => p.id !== productId);
        const topBundleItems = list.slice(0, 2);
        setBundleProducts(topBundleItems);
        const initialMap = {};
        topBundleItems.forEach((p) => {
          initialMap[p.id] = true;
        });
        setSelectedBundleMap(initialMap);
      })
      .catch(() => {});

    // Fetch approved customer reviews for product dynamically from backend API
    fetch(`${API_BASE_URL}/reviews/product/${productId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((revs) => {
        setDbReviews(Array.isArray(revs) ? revs : []);
      })
      .catch(() => setDbReviews([]));

    // Fetch aggregated review stats & customer uploaded photos
    fetch(`${API_BASE_URL}/reviews/product/${productId}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((stats) => {
        if (stats) setReviewStats(stats);
      })
      .catch(() => {});
  }, [productId]);

  // Load Recently Viewed list from localStorage and validate against real active database products
  useEffect(() => {
    fetch(`${API_BASE_URL}/products/?limit=50`)
      .then((r) => (r.ok ? r.json() : []))
      .then((allProds) => {
        const prodList = (Array.isArray(allProds) ? allProds : []).map((p) => ({
          ...p,
          id: p._id || p.id,
        }));
        const validMap = new Map();
        prodList.forEach((p) => validMap.set(String(p.id), p));

        try {
          const rawRV = localStorage.getItem(RECENTLY_VIEWED_KEY);
          if (rawRV) {
            const parsed = JSON.parse(rawRV);
            // Retain ONLY products that actually exist in the current store database
            const valid = (Array.isArray(parsed) ? parsed : [])
              .filter(
                (item) =>
                  item &&
                  item.id &&
                  validMap.has(String(item.id)) &&
                  String(item.id) !== String(productId)
              )
              .map((item) => {
                // Sync with latest catalog details (image, price, rating, review_count)
                const live = validMap.get(String(item.id));
                return {
                  ...item,
                  name: live.name || item.name,
                  image: live.image || item.image,
                  price: live.price ?? item.price,
                  original_price: live.original_price ?? item.original_price,
                  discount: live.discount ?? item.discount,
                  rating: live.rating ?? 0.0,
                  review_count: live.review_count ?? 0,
                };
              });

            setRecentlyViewed(valid);
            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(valid.slice(0, 10)));
          }
        } catch (e) {}
      })
      .catch(() => {});
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

  /* ── Wishlist Toggle with Live Counter Sync ── */
  const handleWishlistToggle = useCallback(() => {
    if (!product) return;
    const isCurrentlyIn = isInWishlist(product.id);
    toggleWishlist(product);
    setProductWishlistCount((prev) => (isCurrentlyIn ? Math.max(0, prev - 1) : prev + 1));
  }, [product, isInWishlist, toggleWishlist]);

  /* ── Open Review Modal with Verified Purchase Gate ── */
  const handleOpenReviewModal = async () => {
    if (!user) {
      setAddedMsg("Please log in to review this kurti.");
      setTimeout(() => setAddedMsg(""), 3000);
      if (openLoginModal) openLoginModal();
      return;
    }

    try {
      const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/reviews/can-review/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data && data.can_review) {
        setReviewMsg("");
        setShowReviewModal(true);
      } else {
        alert("Only verified customers who have purchased this kurti can leave a review.");
      }
    } catch (e) {
      setShowReviewModal(true);
    }
  };

  /* ── Submit Customer Review (Requires Purchase, Submits as Pending for Admin Approval) ── */
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || !product) return;
    if (!user) {
      setReviewMsg("Please log in to submit your review.");
      if (openLoginModal) openLoginModal();
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg("");
    try {
      const authorName = reviewAuthor.trim() || user?.name || "Verified Buyer";
      const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/reviews/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          rating: Number(reviewRating),
          user_name: authorName,
          comment: reviewComment.trim(),
          verified_purchase: true,
        }),
      });
      if (res.ok) {
        setReviewComment("");
        setShowReviewModal(false);
        setAddedMsg("Thank you! Your review has been submitted for admin verification.");
        setTimeout(() => setAddedMsg(""), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setReviewMsg(errData.detail || "Could not submit review. Only verified buyers who ordered this product can review.");
      }
    } catch (err) {
      setReviewMsg("Error submitting review. Please check network.");
    } finally {
      setReviewSubmitting(false);
    }
  };

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

  const rawImages = product?.images?.length > 0 ? product.images : [product?.image].filter(Boolean);
  const images = rawImages.map(img => resolveImageUrl(img, FALLBACK_IMG));
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
      ...((reviewStats?.total_reviews > 0 || product.review_count > 0) ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": reviewStats?.total_reviews > 0 ? reviewStats.average_rating : (product.rating || 5.0),
          "reviewCount": reviewStats?.total_reviews > 0 ? reviewStats.total_reviews : (product.review_count || 1)
        }
      } : {})
    };
  }, [product, images, sku, reviewStats]);

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
                    handleWishlistToggle();
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white transition-all cursor-pointer"
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
                <span><strong>{viewersCount ?? (product.viewers_count || 14)} people</strong> viewing right now</span>
              </div>
              {(product.sold_24h && product.sold_24h > 0) ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span><strong>{product.sold_24h} sold</strong> in last 24 hrs</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span><strong>Trending</strong> in festive ethnic wear</span>
                </div>
              )}
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
                <div className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                  (reviewStats?.total_reviews > 0 || (product.review_count || 0) > 0)
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}>
                  <span>
                    {(reviewStats?.total_reviews > 0
                      ? reviewStats.average_rating
                      : (product.rating || 0.0)
                    ).toFixed(1)}
                  </span>
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <span className="text-gray-500 font-medium">
                  {(reviewStats?.total_reviews > 0
                    ? reviewStats.total_reviews
                    : (product.review_count || product.reviews_count || 0)
                  ).toLocaleString("en-IN")}{" "}
                  {(reviewStats?.total_reviews > 0 || (product.review_count || 0) > 0)
                    ? "Verified Ratings"
                    : "Reviews • Be the first to review"}
                </span>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                  <span>{productWishlistCount} Wishlisted</span>
                </button>
              </div>
            </div>

            {/* Live Flash Sale Event Banner */}
            {(product.sale_title || product.deal_text) && (
              <div className="bg-gradient-to-r from-[#8B0000] via-rose-800 to-amber-700 text-white p-3 sm:p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 fill-white text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-200">
                      {product.sale_title || "Special Festive Offer"}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base leading-tight mt-0.5">
                      {product.deal_text || "Special Promotional Deal"}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-rose-100 block">⚡ Limited Period Offer</span>
                  <span className="text-xs font-bold text-amber-300">IST Live</span>
                </div>
              </div>
            )}

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

              {/* Dynamic Active Coupon Banner */}
              {(() => {
                const couponCode = product.offer_code || activeCoupon?.code;
                const couponDesc =
                  product.offer_text ||
                  (activeCoupon
                    ? `Use Coupon ${activeCoupon.code} for extra ${
                        activeCoupon.discount_type === "percentage"
                          ? `${activeCoupon.discount_value}%`
                          : `₹${activeCoupon.discount_value}`
                      } OFF`
                    : null);
                if (!couponCode) return null;
                return (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>{couponDesc || <>Use Coupon <strong>{couponCode}</strong> for special discount</>}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(couponCode);
                        setCopiedCoupon(true);
                        setTimeout(() => setCopiedCoupon(false), 2000);
                      }}
                      className="text-[11px] text-[#8B0000] font-bold underline hover:text-[#6B0000]"
                    >
                      {copiedCoupon ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                );
              })()}
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
              type="button"
              onClick={handleWishlistToggle}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                isInWishlist(product.id)
                  ? "bg-rose-700 text-white hover:bg-rose-800"
                  : "bg-gray-900 text-white hover:bg-black"
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-white text-white" : "fill-none"}`} />
              {isInWishlist(product.id) ? `Wishlisted (${productWishlistCount})` : `Add to Wishlist (${productWishlistCount})`}
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
          </div>
        </div>

        {/* ═══════ FULL-WIDTH KEY HIGHLIGHTS & FABRIC SPECIFICATIONS (COVERS BOTH SIDES ON DESKTOP) ═══════ */}
        <div className="mt-10 bg-gradient-to-br from-[#FFF9F6] via-white to-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs w-full">
          <div className="flex items-center gap-2 mb-6 border-b border-amber-200/60 pb-3">
            <Sparkles className="w-5 h-5 text-[#8B0000]" />
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900">
              Key Highlights &amp; Fabric Notes
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
            {/* Left Column: Key Highlights Bullet Points */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900/90 flex items-center gap-1.5">
                <span>✨</span> Design &amp; Craftsmanship Highlights
              </h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-3 leading-relaxed">
                {(product.highlights && product.highlights.length > 0
                  ? product.highlights
                  : [
                      "100% Premium Quality Fabric & Authentic Handcrafted Stitching",
                      "Breathable, Ultra-Comfortable Silhouette Designed for All-Day Wear",
                      "Pre-Shrunk Material with Vivid, Long-Lasting Color Fastness",
                      "Versatile Design Ideal for Festive Gatherings, Office & Casual Outings",
                    ]
                ).map((hl, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#8B0000] font-bold text-base leading-none mt-0.5">•</span>
                    <span className="text-gray-800 font-medium">{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: Fabric & Silhouette Matrix */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900/90 flex items-center gap-1.5">
                <span>🧵</span> Fabric &amp; Silhouette Matrix
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Fabric</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.fabric || "Cotton Blend"}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Sleeve Style</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.sleeve_type || "3/4 Sleeves"}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Pattern</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.pattern || "Floral Print"}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Fit Type</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.fit_type || "Comfort Fit"}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Occasion</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.occasion || "Festive & Casual"}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-100/90 shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Origin</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{product.country_of_origin || "India 🇮🇳"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ FULL-WIDTH EXTENDED DETAILS SECTION ═══════ */}
        <div className="mt-10 pt-6 border-t border-gray-200 space-y-10">
          
          {/* Trust Badges Bar */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                [ShieldCheck, "Premium Quality"],
                [
                  RotateCcw,
                  product.is_returnable === false
                    ? (product.return_policy || "Non-Returnable (Final Sale)")
                    : (product.return_policy || "Easy 15-Day Returns")
                ],
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
              <div className="space-y-8 pt-3">
                
                {/* Rich Story & Style Tips */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b pb-2 mb-2">
                    Product Overview
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description ||
                      `Elevate your ethnic fashion quotient with the stunning ${product.name} from Nari Pehnawa. Crafted with precision craftsmanship and rich color tones, this piece combines Indian elegance with day-long comfort.`}
                  </p>
                  
                  {product.style_tip && (
                    <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/70 space-y-1 max-w-2xl">
                      <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        💡 Style Tip
                      </h5>
                      <p className="text-xs text-amber-800 leading-relaxed">{product.style_tip}</p>
                    </div>
                  )}
                </div>

                {/* Specs Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b pb-2">
                    Specifications Matrix
                  </h4>
                  <div className="max-w-2xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 font-semibold text-gray-700 w-44 align-top">Fabric</td>
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
                          <td className="py-2.5 text-gray-600">{product.occasion || "Festive, Casual, Office Wear"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Country of Origin</td>
                          <td className="py-2.5 text-gray-600">{product.country_of_origin || "India 🇮🇳"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">HSN Code</td>
                          <td className="py-2.5 text-gray-600">{product.hsn_code || "621133"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Wash & Care</td>
                          <td className="py-2.5 text-gray-600">{product.wash_care || "Hand Wash or Gentle Machine Wash in Cold Water"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">Return & Exchange</td>
                          <td className="py-2.5 text-gray-600">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              product.is_returnable === false
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {product.is_returnable === false
                                ? (product.return_policy || "Non-Returnable (Final Sale)")
                                : (product.return_policy || "Easy 15-Day Returns")}
                            </span>
                          </td>
                        </tr>
                        {/* Custom specifications from Admin if configured */}
                        {Array.isArray(product.specifications) && product.specifications.map((spec, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-2.5 pr-4 font-semibold text-gray-700 align-top">{spec.name || spec.key || spec.title}</td>
                            <td className="py-2.5 text-gray-600">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </Accordion>
          </div>

          {/* Frequently Bought Together Bundle */}
          {bundleProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#8B0000]" /> Frequently Bought Together
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                
                {/* Main Product */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="relative shrink-0">
                    <img
                      src={images[0] || FALLBACK_IMG}
                      alt={product.name}
                      className="w-14 h-16 object-cover rounded-lg"
                    />
                    <span className="absolute -top-1.5 -left-1.5 bg-[#8B0000] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Main
                    </span>
                  </div>
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-gray-900 truncate">{product.name}</p>
                    <p className="text-[#8B0000] font-bold">₹{product.price}</p>
                  </div>
                </div>

                {/* Companion Products from Store */}
                {bundleProducts.map((bundleItem) => {
                  const isChecked = selectedBundleMap[bundleItem.id] !== false;
                  return (
                    <div
                      key={bundleItem.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                        isChecked ? "bg-amber-50/40 border-amber-300" : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                      onClick={() =>
                        setSelectedBundleMap((prev) => ({
                          ...prev,
                          [bundleItem.id]: !isChecked,
                        }))
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#8B0000] focus:ring-[#8B0000] h-4 w-4 shrink-0"
                      />
                      <img
                        src={bundleItem.image || (bundleItem.images && bundleItem.images[0]) || FALLBACK_IMG}
                        alt={bundleItem.name}
                        className="w-14 h-16 object-cover rounded-lg shrink-0"
                      />
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{bundleItem.name}</p>
                        <p className="text-[#8B0000] font-bold">₹{bundleItem.price}</p>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Bundle Pricing & Add to Cart */}
              {(() => {
                const selectedItems = bundleProducts.filter(
                  (item) => selectedBundleMap[item.id] !== false
                );
                const companionTotal = selectedItems.reduce((sum, item) => sum + (item.price || 0), 0);
                const rawTotal = (product.price || 0) + companionTotal;
                const bundleSavings = selectedItems.length > 0 ? Math.round(rawTotal * 0.10) : 0;
                const bundleFinal = rawTotal - bundleSavings;

                return (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        Bundle Price ({1 + selectedItems.length} {1 + selectedItems.length === 1 ? "Item" : "Items"}):
                      </p>
                      <p className="text-xl font-extrabold text-gray-900">
                        ₹{bundleFinal.toLocaleString("en-IN")}{" "}
                        {bundleSavings > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-1">
                            Save ₹{bundleSavings.toLocaleString("en-IN")} (10% Bundle OFF)
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleAddToCart(false);
                        for (const item of selectedItems) {
                          await addToCart({
                            product_id: item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image || (item.images && item.images[0]) || FALLBACK_IMG,
                            size: item.sizes?.[0] || "Free Size",
                            color: item.colors?.[0] || "",
                            quantity: 1,
                          });
                        }
                        setAddedMsg(`Added Bundle (${1 + selectedItems.length} items) to Cart!`);
                        setTimeout(() => setAddedMsg(""), 2500);
                      }}
                      className="px-6 py-3 bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add Bundle to Cart
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Customer Reviews & Photo Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
              <div className="text-left">
                <SectionHeading className="text-xl md:text-2xl">
                  Hum kuch nahi bolenge, hamari gossip queen khud batayegi!
                </SectionHeading>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {(reviewStats?.total_reviews > 0 ? reviewStats.total_reviews : (product.review_count || 0))} verified customer purchases
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="px-4 py-2 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Write a Review
              </button>
            </div>

            {/* Rating Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-r border-gray-100 md:pr-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {(reviewStats?.total_reviews > 0 ? reviewStats.average_rating : (product.rating || 0.0)).toFixed(1)}
                </span>
                <div className="flex justify-center gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(reviewStats?.total_reviews > 0 ? reviewStats.average_rating : (product.rating || 0))
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {reviewStats?.total_reviews > 0
                    ? `${Math.round(((reviewStats.distribution?.[5] || 0) + (reviewStats.distribution?.[4] || 0)) / reviewStats.total_reviews * 100)}% of customers recommend this item`
                    : "No reviews yet. Be the first verified buyer to review!"}
                </p>
              </div>

              <div className="md:col-span-2 space-y-2 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = reviewStats?.percentages
                    ? (reviewStats.percentages[stars] || 0)
                    : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-8 text-gray-600 font-semibold">{stars} ★</span>
                      <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-gray-400 font-medium">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verified Customer Reviews Cards (Dynamic from Backend API - only admin-approved reviews) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {dbReviews && dbReviews.length > 0 ? (
                dbReviews.map((rev) => {
                const rId = rev._id || rev.id;
                const baseHelpful = rev.helpful_count || 15;
                const currentHelpful = helpfulVotes[rId] ? baseHelpful + 1 : baseHelpful;
                const formattedDate = rev.created_at ? new Date(rev.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent";
                return (
                  <div key={rId} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{rev.user_name || rev.reviewer_name || "Customer"}</span>
                        {(rev.verified_buyer || rev.verified_purchase) && (
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
              })
            ) : (
              <div className="py-8 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
                <Star className="w-8 h-8 text-amber-400/60 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No reviews yet for this kurti</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-3">
                  Verified buyers who ordered this kurti can leave a review after logging in.
                </p>
                <button
                  type="button"
                  onClick={handleOpenReviewModal}
                  className="px-4 py-2 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> {user ? "Write a Review" : "Login to Review"}
                </button>
              </div>
            )}
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

      {/* ── Size Guide Modal (Exact Kurti Size Chart) ── */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowSizeChart(false)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 z-10 shadow-2xl max-h-[92vh] overflow-y-auto border border-gray-100">
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#8B0000] tracking-wider uppercase">
                KURTI SIZE CHART
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                All measurements are in inches. Measure yourself before choosing your regular size.
              </p>
            </div>

            {/* Main Content Grid: Table + Kurti Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Size Table */}
              <div className="md:col-span-8 overflow-x-auto">
                <table className="w-full text-center border-collapse border-2 border-gray-800 rounded-xl overflow-hidden text-xs sm:text-sm font-semibold">
                  <thead>
                    <tr className="bg-gray-50 text-[#8B0000] border-b-2 border-gray-800 uppercase tracking-tight">
                      <th className="py-3 px-2 border-r-2 border-gray-800 font-extrabold">SIZE</th>
                      <th className="py-3 px-2 border-r-2 border-gray-800 font-extrabold leading-tight">BUST<br/>SIZE</th>
                      <th className="py-3 px-2 border-r-2 border-gray-800 font-extrabold leading-tight">KURTA<br/>WAIST</th>
                      <th className="py-3 px-2 border-r-2 border-gray-800 font-extrabold leading-tight">KURTA<br/>HIP</th>
                      <th className="py-3 px-2 border-r-2 border-gray-800 font-extrabold leading-tight">SHOULDER<br/>SIZE</th>
                      <th className="py-3 px-2 font-extrabold leading-tight">KURTA<br/>LENGTH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-800 text-gray-900 font-bold">
                    {[
                      { size: "S", bust: "36", waist: "34", hip: "39", shoulder: "14", length: "44" },
                      { size: "M", bust: "38", waist: "36", hip: "41", shoulder: "14.5", length: "44" },
                      { size: "L", bust: "40", waist: "38", hip: "43", shoulder: "15", length: "44" },
                      { size: "XL", bust: "42", waist: "40", hip: "45", shoulder: "15.5", length: "44" },
                      { size: "2XL", bust: "44", waist: "42", hip: "47", shoulder: "16", length: "44" },
                    ].map((row, i) => (
                      <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-3 px-2 border-r-2 border-gray-800 font-extrabold text-[#8B0000] text-sm">
                          {row.size}
                        </td>
                        <td className="py-3 px-2 border-r-2 border-gray-800">{row.bust}</td>
                        <td className="py-3 px-2 border-r-2 border-gray-800">{row.waist}</td>
                        <td className="py-3 px-2 border-r-2 border-gray-800">{row.hip}</td>
                        <td className="py-3 px-2 border-r-2 border-gray-800">{row.shoulder}</td>
                        <td className="py-3 px-2">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kurti Diagram Illustration */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-red-50/30 rounded-2xl border border-red-100">
                <svg
                  viewBox="0 0 200 320"
                  className="w-full max-w-[160px] h-auto"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Kurti Body Outline */}
                  <path
                    d="M75 25 C85 45 115 45 125 25 L155 42 L185 135 L165 140 L150 78 L148 100 Q145 150 148 290 L52 290 Q55 150 52 100 L50 78 L35 140 L15 135 L45 42 Z"
                    fill="#ffffff"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Neckline */}
                  <path
                    d="M75 25 C85 50 115 50 125 25"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  {/* Bust arrow */}
                  <line x1="50" y1="88" x2="150" y2="88" stroke="#1e293b" strokeWidth="2" />
                  <path d="M57 83 L50 88 L57 93 M143 83 L150 88 L143 93" stroke="#1e293b" strokeWidth="2" fill="none" />
                  <text x="100" y="80" textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="bold">Bust</text>

                  {/* Waist arrow */}
                  <line x1="53" y1="145" x2="147" y2="145" stroke="#1e293b" strokeWidth="2" />
                  <path d="M60 140 L53 145 L60 150 M140 140 L147 145 L140 150" stroke="#1e293b" strokeWidth="2" fill="none" />
                  <text x="100" y="137" textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="bold">Waist</text>

                  {/* Hip arrow */}
                  <line x1="52" y1="195" x2="148" y2="195" stroke="#1e293b" strokeWidth="2" />
                  <path d="M59 190 L52 195 L59 200 M141 190 L148 195 L141 200" stroke="#1e293b" strokeWidth="2" fill="none" />
                  <text x="100" y="187" textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="bold">Hip</text>
                </svg>
                <span className="text-[11px] font-bold text-[#8B0000] mt-2 text-center">
                  Measurement Guide
                </span>
              </div>
            </div>

            {/* How to Measure Guidelines */}
            <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/80 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                How to Measure Your Body:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div>
                  <strong className="text-gray-900">1. Bust:</strong> Measure around the fullest part of your chest with tape horizontal.
                </div>
                <div>
                  <strong className="text-gray-900">2. Waist:</strong> Measure around your natural waistline, just above the navel.
                </div>
                <div>
                  <strong className="text-gray-900">3. Hip:</strong> Measure around the fullest part of your hips/seat.
                </div>
              </div>
            </div>
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

      {/* ── Write Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 z-10 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Rate &amp; Review Kurti
            </h3>
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {product.name}
            </p>
            <div className="bg-amber-50 text-amber-900 text-[11px] font-medium px-3 py-1.5 rounded-xl mb-4 border border-amber-200/60 flex items-center gap-1.5">
              <span>🛡️</span> Verified buyer reviews are published upon admin verification.
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Your Rating: <span className="text-[#8B0000]">{reviewRating} Star{reviewRating > 1 ? "s" : ""}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Your Name
                </label>
                <input
                  type="text"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder={user?.name || "e.g. Priya Sharma"}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Your Review / Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the fabric quality, fitting, colors, and overall look..."
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              {reviewMsg && (
                <p className="text-xs text-red-600 font-medium">{reviewMsg}</p>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting || !reviewComment.trim()}
                className="w-full py-3 bg-[#8B0000] hover:bg-[#6B0000] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {reviewSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
