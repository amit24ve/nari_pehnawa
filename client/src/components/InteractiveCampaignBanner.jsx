import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, ArrowRight, Check } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";
import { useAuth } from "../context/AuthProvider";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const VOTED_STORAGE_KEY = "nari_campaign_user_voted_slot";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

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

const InteractiveCampaignBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVotedSlot, setUserVotedSlot] = useState(null);
  const [justVotedSlot, setJustVotedSlot] = useState(null);

  // Load user voted slot from localStorage as fast fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOTED_STORAGE_KEY);
      if (stored !== null && stored !== undefined && stored !== "") {
        setUserVotedSlot(Number(stored));
      }
    } catch (e) {}
  }, []);

  // Fetch active campaign from server with visitor id and optional auth header
  useEffect(() => {
    const token = getToken();
    const visitorId = getVisitorId();
    const headers = {
      "X-Visitor-Id": visitorId,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

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

    // Send vote to server with visitor ID & optional token
    try {
      const token = getToken();
      const visitorId = getVisitorId();
      const res = await fetch(`${API_BASE_URL}/campaign/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Id": visitorId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        {/* ── LEFT PROMOTIONAL SECTION — DYNAMIC BACKGROUND, CUSTOMIZABLE TYPOGRAPHY & CENTERED LAYOUT ── */}
        <div
          className="relative w-full lg:w-[30%] xl:w-[28%] p-6 sm:p-8 flex flex-col items-center justify-center text-center flex-shrink-0 z-10 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-200/80 shadow-inner overflow-hidden transition-colors duration-300"
          style={{
            backgroundColor: campaign.left_bg_color || "#ffffff",
          }}
        >
          {/* Custom Left Image if uploaded by admin */}
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
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[0.5px] pointer-events-none" />
            </>
          )}

          {/* Centered Promo Text Block */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center w-full my-auto space-y-1.5">
            {/* Pre-Headline: CUSTOMER'S CHOICE (Bold, uppercase, 4-6px smaller than headline) */}
            <p
              className="font-black uppercase tracking-wider leading-tight drop-shadow-xs"
              style={{
                fontSize: `${campaign.title_font_size || 32}px`,
                color: campaign.title_color || campaign.text_color || "#111827",
              }}
            >
              {campaign.title || "CUSTOMER'S CHOICE"}
            </p>

            {/* Main Headline: WHICH LOOK DO YOU LOVE? (Large, Bold & Italic) */}
            <h2
              className={`font-serif font-black tracking-tight leading-tight my-1 drop-shadow-xs ${
                campaign.discount_italic !== false ? "italic" : ""
              }`}
              style={{
                fontSize: `${campaign.discount_font_size || 36}px`,
                color: campaign.text_color || "#8B0000",
              }}
            >
              {campaign.discount_text || "WHICH LOOK DO YOU LOVE?"}
            </h2>

            {/* Subtitle */}
            <p
              className="text-xs sm:text-sm font-medium pt-1 whitespace-pre-line max-w-[260px] leading-relaxed drop-shadow-xs opacity-90"
              style={{
                color: campaign.subtitle_color || "#4B5563",
              }}
            >
              {campaign.subtitle || "Vote for your favorite festive look • Help us pick the trending style!"}
            </p>

            {/* High-conversion Centered CTA Button */}
            <div className="pt-4 w-full flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => handleCtaClick(campaign.cta_link)}
                className="inline-flex items-center justify-center gap-2 font-black text-xs sm:text-sm px-7 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer border border-transparent hover:border-amber-300/40"
                style={{
                  backgroundColor: campaign.cta_bg_color || "#8B0000",
                  color: campaign.cta_text_color || "#ffffff",
                }}
              >
                <span>{campaign.cta_text || "Vote Now"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT INTERACTIVE 4-CARDS SHOWCASE (~70% width) ── */}
        <div 
          className={`relative flex-1 p-4 sm:p-6 flex flex-col justify-center overflow-hidden ${
            campaign.right_bg_theme === "noir"
              ? "bg-gradient-to-r from-[#18181B] via-[#0F0F12] to-[#09090B]"
              : campaign.right_bg_theme === "gold"
              ? "bg-gradient-to-r from-[#2A1B0A] via-[#1E1307] to-[#120B04]"
              : campaign.right_bg_theme === "rose"
              ? "bg-gradient-to-r from-[#3D0C1E] via-[#2A0815] to-[#17040B]"
              : "bg-gradient-to-r from-[#4A0019] via-[#350012] to-[#20000A]"
          }`}
        >
          {/* Subtle atmospheric flares */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 rounded-full bg-black/40 blur-3xl pointer-events-none" />

          {/* Centered Section Header */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-4 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-xs sm:text-sm font-serif font-bold text-rose-100 uppercase tracking-widest drop-shadow">
                PICK YOUR FAVORITE LOOK — VOTE FOR WHAT YOU LOVE
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
          </div>

          {/* 4 Cards Grid - Pure Look Photo + Vote Action (NO star ratings, NO tags) */}
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

                  {/* Dedicated "Vote" Button Underneath the Card */}
                  <div className="mt-2.5 text-center w-full flex justify-center">
                    {isVoted ? (
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[155px] bg-emerald-600 text-white font-bold text-[11px] sm:text-xs py-2 px-3 rounded-full shadow-md border border-emerald-400 flex items-center justify-center gap-1.5 cursor-default"
                        title="You voted for this look"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Voted</span>
                        <span className="text-[10px] opacity-90">
                          ({(slot.votes || 0).toLocaleString("en-IN")})
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleVote(e, slot)}
                        className="w-full max-w-[155px] bg-white hover:bg-rose-50 text-[#8B0000] font-black text-[11px] sm:text-xs py-2 px-3 rounded-full shadow-md hover:shadow-lg border border-rose-200/90 flex items-center justify-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                        title="Click to Vote for this look"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 text-[#8B0000] fill-[#8B0000] ${
                            isJustVoted ? "scale-150 animate-ping" : ""
                          }`}
                        />
                        <span>Vote</span>
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
