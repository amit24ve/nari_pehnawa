import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Check } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";
import { useAuth } from "../context/AuthProvider";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const VOTED_STORAGE_KEY = "nari_campaign_user_voted_slot";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

const InteractiveCampaignBanner = () => {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVotedSlot, setUserVotedSlot] = useState(null);
  const [justVotedSlot, setJustVotedSlot] = useState(null);
  const [authTip, setAuthTip] = useState(false);

  // Load user voted slot from localStorage as fast fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOTED_STORAGE_KEY);
      if (stored !== null && stored !== undefined && stored !== "") {
        setUserVotedSlot(Number(stored));
      }
    } catch (e) {}
  }, []);

  // Fetch active campaign from server with auth header if available
  useEffect(() => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/campaign/active`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.is_active !== false) {
          setCampaign(data);
          if (data.user_voted_slot !== null && data.user_voted_slot !== undefined) {
            setUserVotedSlot(Number(data.user_voted_slot));
            try {
              localStorage.setItem(VOTED_STORAGE_KEY, String(data.user_voted_slot));
            } catch (e) {}
          }
        } else {
          setCampaign(null);
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [user]);

  const handleVote = async (e, slot) => {
    e.stopPropagation();
    const slotId = slot.slot_id;

    // REQUIRE LOGIN: if not logged in, prompt user to login
    if (!user) {
      setAuthTip(true);
      setTimeout(() => setAuthTip(false), 3500);
      if (typeof openLoginModal === "function") {
        openLoginModal("login");
      }
      return;
    }

    // If already voted for this exact slot, do nothing
    if (userVotedSlot === slotId) return;

    const previousVotedSlot = userVotedSlot;

    // Trigger pulse micro-animation
    setJustVotedSlot(slotId);
    setTimeout(() => setJustVotedSlot(null), 1200);

    // Optimistically enforce SINGLE choice out of 4
    setUserVotedSlot(slotId);
    try {
      localStorage.setItem(VOTED_STORAGE_KEY, String(slotId));
    } catch (e) {}

    // Optimistically update slots votes locally
    setCampaign((prev) => {
      if (!prev || !prev.slots) return prev;
      const updated = prev.slots.map((s) => {
        if (s.slot_id === slotId) {
          return { ...s, votes: (s.votes || 0) + 1 };
        }
        if (previousVotedSlot !== null && s.slot_id === previousVotedSlot) {
          return { ...s, votes: Math.max(0, (s.votes || 1) - 1) };
        }
        return s;
      });
      return { ...prev, slots: updated };
    });

    // Send vote to server
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/campaign/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot_id: slotId,
          product_id: slot.product?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.slots) {
          setCampaign((prev) => (prev ? { ...prev, slots: data.slots } : prev));
        }
        if (data.user_voted_slot !== undefined) {
          setUserVotedSlot(data.user_voted_slot);
        }
      } else if (res.status === 401) {
        // Token expired or invalid
        if (typeof openLoginModal === "function") {
          openLoginModal("login");
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  if (loading || !campaign || campaign.is_active === false) {
    return null;
  }

  const handleCtaClick = (link) => {
    const target = link || "/category/sale";
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.href = target;
    } else {
      navigate(target);
    }
  };

  // Full-width custom image banner mode if configured by admin
  if (campaign.full_banner_image) {
    return (
      <section className="my-6 px-2.5 sm:px-4 max-w-7xl mx-auto">
        <div
          onClick={() => handleCtaClick(campaign.cta_link)}
          className="block relative overflow-hidden rounded-2xl shadow-xl border border-rose-400/30 hover:border-rose-400 transition-all duration-300 cursor-pointer"
          style={{ height: `${campaign.banner_height || 320}px` }}
        >
          <img
            src={resolveImageUrl(campaign.full_banner_image, DEFAULT_HERO_FALLBACK)}
            alt={campaign.title || "Special Campaign"}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_HERO_FALLBACK;
            }}
          />
        </div>
      </section>
    );
  }

  const slots = campaign.slots || [];

  return (
    <section className="my-6 px-2.5 sm:px-4 max-w-7xl mx-auto">
      <div
        className="relative overflow-hidden rounded-3xl shadow-2xl border-2 border-[#8B0000]/40 flex flex-col lg:flex-row transition-all duration-300 select-none bg-stone-950"
        style={{ minHeight: `${campaign.banner_height || 320}px` }}
      >
        {/* ── LEFT PROMOTIONAL SECTION (~28% width) — WALL-ART FRAMED PLAQUE TEMPLATE ── */}
        <div className="relative w-full lg:w-[28%] xl:w-[27%] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FFF2F4] p-4 sm:p-6 flex flex-col items-center justify-center text-center flex-shrink-0 z-10 border-b-2 lg:border-b-0 lg:border-r-2 border-[#8B0000]/20 shadow-inner overflow-hidden min-h-[290px]">
          {/* Custom Left Background Image if uploaded by admin */}
          {campaign.left_image && (
            <>
              <img
                src={resolveImageUrl(campaign.left_image)}
                alt=""
                onError={(e) => {
                  e.target.style.display = "none";
                }}
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px] pointer-events-none" />
            </>
          )}

          {/* Wall-Art Framed Plaque (Border Box with Inset Frame & Corner Ticks) */}
          <div className="relative z-10 w-full max-w-[285px] p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border-2 border-[#8B0000]/25 transition-all duration-300 flex flex-col items-center justify-center text-center">
            {/* Inner Hairline Wall-Art Frame with Corner Accents */}
            <div className="w-full border border-dashed border-[#8B0000]/30 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center relative">
              {/* Corner decorative wall-art ticks */}
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8B0000]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8B0000]" />
              <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8B0000]" />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8B0000]" />

              {/* Pre-Headline with Elegant Spaced Rules */}
              <div className="flex items-center justify-center gap-2 w-full mb-1">
                <span className="h-[1px] w-5 sm:w-7 bg-[#8B0000]/35" />
                <p className="text-[#8B0000] font-serif font-black text-[10px] sm:text-xs tracking-[0.22em] uppercase">
                  {campaign.title || "VOTE & WIN"}
                </p>
                <span className="h-[1px] w-5 sm:w-7 bg-[#8B0000]/35" />
              </div>

              {/* Dedicated Border Box For Highlight Text */}
              <div className="w-full my-1.5 py-2 px-3 rounded-lg border-2 border-stone-900/15 bg-gradient-to-b from-stone-50/90 to-stone-100/90 shadow-inner flex items-center justify-center">
                <h2
                  className="text-2xl sm:text-3xl xl:text-[2.65rem] font-serif font-black tracking-tight leading-none text-center"
                  style={{ color: campaign.text_color || "#111827" }}
                >
                  {campaign.discount_text || "TOP LOOK"}
                </h2>
              </div>

              {/* Subtitle / Note */}
              <p className="text-stone-600 text-[11px] sm:text-xs font-medium pt-1 whitespace-pre-line max-w-[210px] leading-relaxed">
                {campaign.subtitle || "Pick your favorite ethnic style & get rewards"}
              </p>

              {/* High-conversion Wall-Art Action Button */}
              <div className="pt-3 w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => handleCtaClick(campaign.cta_link)}
                  className="inline-flex items-center justify-center gap-2 bg-[#6E1624] hover:bg-[#8B0000] text-white font-bold text-[11px] sm:text-xs px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
                >
                  <span>{campaign.cta_text || "Explore Deals"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT INTERACTIVE 4-CARDS SHOWCASE (~72% width) ── */}
        <div className="relative flex-1 bg-gradient-to-r from-[#4A0019] via-[#350012] to-[#20000A] p-4 sm:p-6 flex flex-col justify-center overflow-hidden">
          {/* Subtle atmospheric flares */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 rounded-full bg-black/40 blur-3xl pointer-events-none" />

          {/* Centered Section Header */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-4 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-xs sm:text-sm font-serif font-bold text-rose-100 uppercase tracking-widest drop-shadow">
                PICK ANY 1 OF 4 — VOTE FOR YOUR FAVORITE LOOK
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>

            {/* Login feedback tip if guest tries to vote */}
            {authTip && (
              <span className="mt-1.5 inline-block text-[11px] font-semibold text-amber-300 bg-black/60 px-3 py-0.5 rounded-full border border-amber-300/40 animate-bounce">
                Please log in to cast your vote!
              </span>
            )}
          </div>

          {/* 4 Cards Grid */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {slots.map((slot) => {
              const product = slot.product || {};
              const slotId = slot.slot_id;
              const isVoted = userVotedSlot === slotId;
              const isJustVoted = justVotedSlot === slotId;
              const imgSrc = resolveImageUrl(slot.custom_image || product.image, DEFAULT_HERO_FALLBACK);

              return (
                <div
                  key={slotId}
                  className="group relative flex flex-col items-center transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Card Container with Arched Top Frame — Pure Image Only */}
                  <div
                    onClick={() => product.id && navigate(`/product/${product.id}`)}
                    className="w-full relative rounded-2xl overflow-hidden border-2 border-rose-300/40 hover:border-rose-300/80 transition-all duration-500 shadow-xl bg-stone-900 cursor-pointer"
                    title={product.name ? `View ${product.name}` : "View product"}
                  >
                    {/* Pure Product Photo with Arched Top */}
                    <div className="relative h-[180px] sm:h-[205px] md:h-[220px] w-full overflow-hidden bg-stone-900">
                      <img
                        src={imgSrc}
                        alt=""
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_HERO_FALLBACK;
                        }}
                      />
                    </div>
                  </div>

                  {/* Dedicated "Rate Now" Button Underneath the Card */}
                  <div className="mt-2.5 text-center w-full flex justify-center">
                    {isVoted ? (
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[155px] bg-emerald-600 text-white font-bold text-[11px] sm:text-xs py-2 px-3 rounded-full shadow-md border border-emerald-400 flex items-center justify-center gap-1.5 cursor-default"
                        title="You voted for this look"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Rated</span>
                        <span className="text-[10px] opacity-90">
                          ({(slot.votes || 0).toLocaleString("en-IN")})
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleVote(e, slot)}
                        className="w-full max-w-[155px] bg-white hover:bg-rose-50 text-[#8B0000] font-black text-[11px] sm:text-xs py-2 px-3 rounded-full shadow-md hover:shadow-lg border border-rose-200/90 flex items-center justify-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                        title="Click to Vote / Rate this look"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 text-[#8B0000] fill-[#8B0000] ${
                            isJustVoted ? "scale-150 animate-ping" : ""
                          }`}
                        />
                        <span>Rate Now</span>
                        <span className="text-[10px] font-semibold text-rose-800/80">
                          ({(slot.votes || 0).toLocaleString("en-IN")})
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveCampaignBanner;
