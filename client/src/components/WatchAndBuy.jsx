import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeading } from "./NariHeadingDecoration";
import {
  Play,
  Pause,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  ShoppingBag,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const defaultVideoProducts = [
  {
    id: "v-1",
    product_link: "/category/anarkali-kurtis",
    title: "Blush Glow Anarkali Kurta Set",
    price: 4500,
    original_price: 5400,
    views: "2.4L",
    likes: 14200,
    thumbnail: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600",
    video_url: "https://res.cloudinary.com/demo/video/upload/v1687258384/samples/dance-2.mp4",
  },
  {
    id: "v-2",
    product_link: "/category/chikankari-kurtis",
    title: "Chikankari Handcrafted Silk Kurti",
    price: 3800,
    original_price: 4600,
    views: "1.8L",
    likes: 9800,
    thumbnail: "https://images.pexels.com/photos/2802024/pexels-photo-2802024.jpeg?auto=compress&cs=tinysrgb&w=600",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "v-3",
    product_link: "/category/embroidered-kurtis",
    title: "Maroon Mirror Work Anarkali Suit",
    price: 5200,
    original_price: 6200,
    views: "3.1L",
    likes: 21500,
    thumbnail: "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=600",
    video_url: "https://res.cloudinary.com/demo/video/upload/v1687258385/samples/sea-turtle.mp4",
  },
  {
    id: "v-4",
    product_link: "/category/palazzo-set-kurtis",
    title: "Palazzo Set - Festive Teal & Gold",
    price: 2999,
    original_price: 3800,
    views: "1.2L",
    likes: 8300,
    thumbnail: "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=600",
    video_url: "https://res.cloudinary.com/demo/video/upload/v1687258382/samples/cld-sample-video.mp4",
  }
];

const WatchAndBuy = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const touchStartY = useRef(0);
  const wheelDebounceRef = useRef(false);

  const [videoProducts, setVideoProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/reels/?active_only=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reels");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVideoProducts(data);
        } else {
          setVideoProducts(defaultVideoProducts);
        }
      })
      .catch((e) => {
        console.error("Reels fetch error:", e);
        setVideoProducts(defaultVideoProducts);
      })
      .finally(() => setLoading(false));
  }, []);

  const openReelModal = (index) => {
    setActiveReelIndex(index);
    document.body.style.overflow = "hidden";
    try {
      window.history.pushState({ reelModalOpen: true }, "");
    } catch (_) {}
  };

  const closeReelModal = () => {
    setActiveReelIndex(null);
    document.body.style.overflow = "auto";
  };

  const scrollReel = (direction) => {
    if (activeReelIndex === null || videoProducts.length === 0) return;
    if (direction === "next") {
      setActiveReelIndex((prev) => (prev + 1) % videoProducts.length);
    } else {
      setActiveReelIndex((prev) => (prev - 1 + videoProducts.length) % videoProducts.length);
    }
  };

  const toggleLike = (reelId) => {
    setLikedReels((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  // Keyboard navigation & History popstate (Back button / swipe back)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeReelIndex === null) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        scrollReel("next");
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        scrollReel("prev");
      } else if (e.key === "Escape") {
        closeReelModal();
      }
    };

    const handlePopState = (e) => {
      if (activeReelIndex !== null) {
        setActiveReelIndex(null);
        document.body.style.overflow = "auto";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeReelIndex, videoProducts]);

  // Wheel scroll event handler for Instagram Reel style vertical scroll
  const handleWheelScroll = (e) => {
    if (activeReelIndex === null || wheelDebounceRef.current) return;
    if (e.deltaY > 25) {
      scrollReel("next");
      wheelDebounceRef.current = true;
      setTimeout(() => { wheelDebounceRef.current = false; }, 350);
    } else if (e.deltaY < -25) {
      scrollReel("prev");
      wheelDebounceRef.current = true;
      setTimeout(() => { wheelDebounceRef.current = false; }, 350);
    }
  };

  // Touch swipe event handlers for mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (activeReelIndex === null) return;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (diffY > 40) {
      scrollReel("next");
    } else if (diffY < -40) {
      scrollReel("prev");
    }
  };

  const scrollHorizontal = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(() => {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      }, 300);
    }
  };

  const activeReel = activeReelIndex !== null && videoProducts[activeReelIndex] ? videoProducts[activeReelIndex] : null;

  return (
    <section className="py-12 bg-gradient-to-b from-[#faf0e8]/30 via-white to-[#faf0e8]/30 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <SectionHeading>
          Watch &amp; Buy
        </SectionHeading>
        <p className="text-xs md:text-sm text-gray-500 mt-2 font-sans max-w-lg mx-auto">
          Click any reel video clip to launch full-screen Instagram style video reel scrolling!
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-3"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
        </div>
      ) : (
        <div className="relative container mx-auto px-2 md:px-6">
          {/* Horizontal Scroll Arrows */}
          {showLeftArrow && (
            <button
              onClick={() => scrollHorizontal("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
          )}

          {showRightArrow && (
            <button
              onClick={() => scrollHorizontal("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-gray-200 shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          )}

          {/* On-Page Video Cards Carousel */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {videoProducts.map((video, index) => {
              const reelId = video.id || video._id;

              return (
                <div
                  key={reelId}
                  className="flex-shrink-0 w-[250px] sm:w-[270px] md:w-[290px] group text-left cursor-pointer"
                  onClick={() => openReelModal(index)}
                >
                  <div className="relative h-[420px] md:h-[450px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/90 bg-black">
                    {/* Video Preview */}
                    <video
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={video.video_url || video.videoUrl}
                      poster={video.thumbnail}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none"></div>

                    {/* Watch Reel Play Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 border border-white/20">
                      <Play className="w-3 h-3 fill-white text-white" /> WATCH REEL
                    </div>

                    {/* Views Count */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 border border-white/20">
                      <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                      {video.views || "1.2L"}
                    </div>

                    {/* Bottom Embedded Product Overlay Card */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-3.5 z-20 border-t border-gray-100 rounded-t-2xl shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 line-clamp-1">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-[#8B0000]">
                              ₹{Number(video.price || 0).toLocaleString("en-IN")}
                            </span>
                            {(video.original_price || video.originalPrice) && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{Number(video.original_price || video.originalPrice).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#8B0000] text-white flex items-center justify-center flex-shrink-0 group-hover:bg-[#a52a2a] transition shadow-md">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FULL-SCREEN INSTAGRAM REELS VERTICAL SCROLL MODAL ── */}
      {activeReel && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-0 md:p-4 animate-fadeIn select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReelModal();
          }}
          onWheel={handleWheelScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close Button top right */}
          <button
            onClick={closeReelModal}
            className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition shadow-lg"
            title="Close Reel"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Vertical Reel Viewer Container */}
          <div className="relative w-full h-full max-w-sm md:max-w-md max-h-[100vh] md:max-h-[88vh] bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Main Video */}
            <video
              key={activeReel.id || activeReel._id}
              className="w-full h-full object-cover pointer-events-none"
              autoPlay
              loop
              playsInline
              muted={isMuted}
              poster={activeReel.thumbnail}
            >
              <source src={activeReel.video_url || activeReel.videoUrl} type="video/mp4" />
            </video>

            {/* Top Reel Header Overlay */}
            <div className="absolute top-4 left-4 right-16 flex items-center justify-between z-30 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-bold shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Nari Pehnawa Reels
              </div>
            </div>

            {/* Right Side Action Sidebar (Like, Mute, Share, Up/Down Nav) */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-30">
              {/* Like Button */}
              <button
                onClick={() => toggleLike(activeReel.id || activeReel._id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                  likedReels[activeReel.id || activeReel._id] ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30" : "bg-black/40 border-white/30 text-white hover:bg-black/60"
                }`}>
                  <Heart className={`w-5 h-5 ${likedReels[activeReel.id || activeReel._id] ? "fill-white" : ""}`} />
                </div>
                <span className="text-[10px] text-white font-semibold shadow-text">
                  {((activeReel.likes || 1200) + (likedReels[activeReel.id || activeReel._id] ? 1 : 0)).toLocaleString("en-IN")}
                </span>
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-11 h-11 rounded-full bg-black/40 border border-white/30 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Share Button */}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Reel link copied to clipboard!");
                }}
                className="w-11 h-11 rounded-full bg-black/40 border border-white/30 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Up / Down Navigation Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                <button
                  onClick={() => scrollReel("prev")}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition"
                  title="Previous Reel"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollReel("next")}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition"
                  title="Next Reel"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Product Details Overlay Card */}
            <div className="absolute bottom-4 left-4 right-16 bg-white/95 backdrop-blur-md p-4 rounded-2xl z-30 shadow-2xl border border-white/40">
              <div className="flex items-center gap-3">
                <img
                  src={activeReel.thumbnail}
                  alt={activeReel.title}
                  className="w-12 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#8B0000] uppercase tracking-wider block">
                    Nari Pehnawa Collection
                  </span>
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1 mt-0.5">
                    {activeReel.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">
                      ₹{Number(activeReel.price || 0).toLocaleString("en-IN")}
                    </span>
                    {(activeReel.original_price || activeReel.originalPrice) && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{Number(activeReel.original_price || activeReel.originalPrice).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  closeReelModal();
                  const target = activeReel.product_link || activeReel.productId;
                  if (target) {
                    if (target.startsWith("/")) {
                      navigate(target);
                    } else {
                      navigate(`/product/${target}`);
                    }
                  } else {
                    navigate("/category/anarkali-kurtis");
                  }
                }}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#a52a2a] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/30 transition"
              >
                <ShoppingBag className="w-4 h-4" /> Shop This Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WatchAndBuy;
