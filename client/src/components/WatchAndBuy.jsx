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
import { resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const WatchAndBuy = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const touchStartY = useRef(0);
  const wheelDebounceRef = useRef(false);

  const [videoProducts, setVideoProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState(() => {
    try {
      const saved = localStorage.getItem("nari_liked_reels");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const getVisitorId = () => {
    try {
      let vid = localStorage.getItem("nari_visitor_id");
      if (!vid) {
        vid = "v_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
        localStorage.setItem("nari_visitor_id", vid);
      }
      return vid;
    } catch (_) {
      return "v_guest";
    }
  };

  useEffect(() => {
    const visitorId = getVisitorId();
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
    const headers = {
      "X-Visitor-Id": visitorId,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    fetch(`${API_BASE_URL}/reels/?active_only=true`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reels");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setVideoProducts(data);
        } else {
          setVideoProducts([]);
        }
      })
      .catch((e) => {
        console.error("Reels fetch error:", e);
        setVideoProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Real-time live like synchronization across devices (WebSocket + lightweight polling)
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      try {
        const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/reels/ws";
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.type === "reel_like" && data.reel_id) {
              setVideoProducts((prev) =>
                prev.map((v) => {
                  const vid = v.id || v._id;
                  if (vid === data.reel_id) {
                    return { ...v, likes: data.likes };
                  }
                  return v;
                })
              );
            } else if (data && data.type === "reel_view" && data.reel_id) {
              setVideoProducts((prev) =>
                prev.map((v) => {
                  const vid = v.id || v._id;
                  if (vid === data.reel_id) {
                    return { ...v, views: data.views };
                  }
                  return v;
                })
              );
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch (_) {}
        };
      } catch (_) {}
    };

    connectWs();

    // 3-second lightweight polling fallback so backgrounded/mobile browsers stay 100% in sync
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reels/likes-sync`);
        if (res.ok) {
          const syncData = await res.json();
          const likesMap = syncData?.likes || {};
          const viewsMap = syncData?.views || {};
          setVideoProducts((prev) => {
            let changed = false;
            const next = prev.map((v) => {
              const vid = v.id || v._id;
              let itemUpdated = false;
              let updated = { ...v };
              if (likesMap[vid] !== undefined && likesMap[vid] !== v.likes) {
                updated.likes = likesMap[vid];
                itemUpdated = true;
              }
              if (viewsMap[vid] !== undefined && String(viewsMap[vid]) !== String(v.views)) {
                updated.views = viewsMap[vid];
                itemUpdated = true;
              }
              if (itemUpdated) {
                changed = true;
                return updated;
              }
              return v;
            });
            return changed ? next : prev;
          });
        }
      } catch (_) {}
    }, 3000);

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollInterval) clearInterval(pollInterval);
      if (ws) {
        try {
          ws.close();
        } catch (_) {}
      }
    };
  }, []);

  const viewedReelsRef = useRef(new Set());

  // Automatically count view when active reel changes or opens
  useEffect(() => {
    if (activeReelIndex === null || !videoProducts[activeReelIndex]) return;
    const curReel = videoProducts[activeReelIndex];
    const reelId = curReel.id || curReel._id;
    if (!reelId || viewedReelsRef.current.has(reelId)) return;

    viewedReelsRef.current.add(reelId);

    fetch(`${API_BASE_URL}/reels/${reelId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-Id": getVisitorId(),
      }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.views) {
          setVideoProducts((prev) =>
            prev.map((v) =>
              (v.id || v._id) === reelId ? { ...v, views: data.views } : v
            )
          );
        }
      })
      .catch(() => {});
  }, [activeReelIndex, videoProducts]);

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

  const toggleLike = async (reelId) => {
    if (!reelId) return;
    const isCurrentlyLiked = !!likedReels[reelId];
    const newLikedState = !isCurrentlyLiked;

    // 1. Immediately persist to state & localStorage
    const nextLikedMap = { ...likedReels, [reelId]: newLikedState };
    setLikedReels(nextLikedMap);
    try {
      localStorage.setItem("nari_liked_reels", JSON.stringify(nextLikedMap));
    } catch (_) {}

    // 2. Optimistically update count in videoProducts list
    setVideoProducts((prev) =>
      prev.map((v) => {
        const vid = v.id || v._id;
        if (vid === reelId) {
          const curLikes = Math.max(0, Number(v.likes || 0));
          return {
            ...v,
            likes: newLikedState ? curLikes + 1 : Math.max(0, curLikes - 1)
          };
        }
        return v;
      })
    );

    // 3. Send to backend with visitor ID and optional token
    try {
      const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
      const visitorId = getVisitorId();
      const headers = {
        "Content-Type": "application/json",
        "X-Visitor-Id": visitorId,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/reels/${reelId}/like`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.likes === "number") {
          // Sync exact server count
          setVideoProducts((prev) =>
            prev.map((v) => {
              const vid = v.id || v._id;
              if (vid === reelId) {
                return { ...v, likes: data.likes };
              }
              return v;
            })
          );
        }
      }
    } catch (e) {
      console.error("Error toggling like:", e);
    }
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

  if (!loading && videoProducts.length === 0) {
    return null;
  }

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
                      src={resolveImageUrl(video.video_url || video.videoUrl)}
                      poster={resolveImageUrl(video.thumbnail, DEFAULT_FALLBACK_IMAGE)}
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

                    {/* Views & Likes Count */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                        <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                        {video.views ? `${video.views}` : "0"}
                      </div>
                      {video.likes !== undefined && Number(video.likes) > 0 && (
                        <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 border border-white/20">
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          {video.likes}
                        </div>
                      )}
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
              poster={resolveImageUrl(activeReel.thumbnail, DEFAULT_FALLBACK_IMAGE)}
            >
              <source src={resolveImageUrl(activeReel.video_url || activeReel.videoUrl)} type="video/mp4" />
            </video>

            {/* Top Reel Header Overlay */}
            <div className="absolute top-4 left-4 right-16 flex items-center justify-between z-30 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-bold shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Nari Pehnawa Reels
              </div>
              {activeReel.views && activeReel.views !== "0" && (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white text-xs font-semibold shadow-md">
                  <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{activeReel.views} views</span>
                </div>
              )}
            </div>

            {/* Right Side Action Sidebar (Like, Mute, Share, Up/Down Nav) */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-30">
              {/* Like Button */}
              <button
                onClick={() => toggleLike(activeReel.id || activeReel._id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                  likedReels[activeReel.id || activeReel._id] ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30" : "bg-black/40 border-white/30 text-white hover:bg-black/60"
                }`}>
                  <Heart className={`w-5 h-5 ${likedReels[activeReel.id || activeReel._id] ? "fill-white" : ""}`} />
                </div>
                <span className="text-[10px] text-white font-semibold shadow-text">
                  {Math.max(0, Number(activeReel.likes || 0)).toLocaleString("en-IN")}
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
