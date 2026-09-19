import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Sparkles, ArrowRight, Award, Check } from "lucide-react";
import { resolveImageUrl, DEFAULT_HERO_FALLBACK } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const VOTED_STORAGE_KEY = "nari_campaign_votes";

const InteractiveCampaignBanner = () => {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votedSlots, setVotedSlots] = useState({});
  const [justVotedSlot, setJustVotedSlot] = useState(null);

  // Load voted state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOTED_STORAGE_KEY);
      if (stored) {
        setVotedSlots(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Fetch active campaign from server
  useEffect(() => {
    fetch(`${API_BASE_URL}/campaign/active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.is_active !== false) {
          setCampaign(data);
        } else {
          setCampaign(null);
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, []);

  const handleVote = async (e, slot) => {
    e.stopPropagation();
    const slotId = slot.slot_id;

    // If already voted for this slot in this session, provide soft feedback
    if (votedSlots[slotId]) return;

    // Optimistically update vote in state
    setJustVotedSlot(slotId);
    setTimeout(() => setJustVotedSlot(null), 1200);

    const newVoted = { ...votedSlots, [slotId]: true };
    setVotedSlots(newVoted);
    try {
      localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(newVoted));
    } catch (e) {}

    // Update campaign slots locally
    setCampaign((prev) => {
      if (!prev || !prev.slots) return prev;
      const updatedSlots = prev.slots.map((s) => {
        if (s.slot_id === slotId) {
          return {
            ...s,
            votes: (s.votes || 0) + 1,
            rating: Math.min(5.0, Number(((s.rating || 4.8) + 0.02).toFixed(1))),
          };
        }
        return s;
      });

      // Recalculate top voted
      const maxVotes = Math.max(...updatedSlots.map((s) => s.votes || 0));
      const withTop = updatedSlots.map((s) => ({
        ...s,
        is_top_voted: s.votes === maxVotes && maxVotes > 0,
      }));

      return { ...prev, slots: withTop };
    });

    // Send vote to server
    try {
      await fetch(`${API_BASE_URL}/campaign/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slotId,
          product_id: slot.product?.id,
        }),
      });
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
        {/* ── LEFT PROMOTIONAL SECTION (~28% width) — CENTERED & PROJECT ROYAL MAROON PALETTE ── */}
        <div className="relative w-full lg:w-[28%] xl:w-[26%] bg-gradient-to-br from-[#78081f] via-[#8B0000] to-[#520010] p-6 sm:p-7 flex flex-col items-center justify-center text-center text-white flex-shrink-0 z-10 border-b-2 lg:border-b-0 lg:border-r-2 border-rose-300/25">
          {/* Subtle elegant ambient glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-black/30 rounded-full blur-xl pointer-events-none" />

          {/* Left Custom Image overlay if uploaded */}
          {campaign.left_image && (
            <img
              src={resolveImageUrl(campaign.left_image)}
              alt="Promo background"
              className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay opacity-30 pointer-events-none"
            />
          )}

          {/* Centered Promo Text Block */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1 w-full">
            {campaign.badge_text && (
              <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-white/15 border border-white/30 backdrop-blur-xs px-3.5 py-1 rounded-full text-rose-100 shadow-sm mb-1.5">
                {campaign.badge_text}
              </span>
            )}

            <p className="text-rose-200/95 font-semibold text-xs sm:text-sm tracking-widest uppercase">
              {campaign.title || "Up to"}
            </p>

            {/* Centered Large Discount Text */}
            <h2
              className="text-4xl sm:text-5xl xl:text-[3.1rem] font-serif font-black tracking-tight leading-none text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] my-1"
            >
              {campaign.discount_text || "30% OFF"}
            </h2>

            <p className="text-rose-100/90 text-xs sm:text-sm font-medium pt-1 drop-shadow-xs whitespace-pre-line max-w-[240px] leading-relaxed">
              {campaign.subtitle || "on first order\n*Only on Nari Pehnawa"}
            </p>

            {/* Centered CTA Button */}
            <div className="pt-4 w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleCtaClick(campaign.cta_link)}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-[#8B0000] font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
              >
                <span>{campaign.cta_text || "Explore Deals"}</span>
                <ArrowRight className="w-4 h-4 text-[#8B0000] group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[9px] text-rose-200/60 mt-2.5 font-mono tracking-wider">
                *T&amp;C Apply • Limited Period Offer
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT INTERACTIVE 4-CARDS SHOWCASE (~72% width) ── */}
        <div className="relative flex-1 bg-gradient-to-r from-[#4A0019] via-[#350012] to-[#20000A] p-4 sm:p-6 flex flex-col justify-center overflow-hidden">
          {/* Subtle atmospheric flares */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 rounded-full bg-black/40 blur-3xl pointer-events-none" />

          {/* Section Header Hint for Customer Rating & Voting */}
          <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-300 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-rose-200 uppercase tracking-wider font-serif">
                Customer Favorites — Rate Your Favorite Look
              </span>
            </div>
            <span className="text-[11px] text-rose-200/60 hidden sm:inline-block font-sans">
              Live Ratings
            </span>
          </div>

          {/* 4 Cards Grid */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {slots.map((slot) => {
              const product = slot.product || {};
              const slotId = slot.slot_id;
              const isVoted = Boolean(votedSlots[slotId]);
              const isJustVoted = justVotedSlot === slotId;
              const imgSrc = resolveImageUrl(slot.custom_image || product.image, DEFAULT_HERO_FALLBACK);

              return (
                <div
                  key={slotId}
                  onClick={() => product.id && navigate(`/product/${product.id}`)}
                  className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Card Container with Arched Top Frame */}
                  <div className="w-full relative rounded-t-[38px] rounded-b-2xl overflow-hidden border-2 border-rose-300/40 hover:border-rose-300/80 transition-all duration-500 shadow-xl bg-stone-900/90">
                    
                    {/* Decorative floating icon in corner */}
                    <div className="absolute top-2 right-2.5 z-20 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                      {slotId === 0 && <span className="text-sm drop-shadow">❤️</span>}
                      {slotId === 1 && <span className="text-sm drop-shadow">🪙</span>}
                      {slotId === 2 && <span className="text-sm drop-shadow">✨</span>}
                      {slotId === 3 && <span className="text-sm drop-shadow">🌟</span>}
                    </div>

                    {/* Product Photo with Arched Top */}
                    <div className="relative h-[160px] sm:h-[185px] md:h-[195px] w-full overflow-hidden bg-stone-900">
                      <img
                        src={imgSrc}
                        alt={product.name || slot.tag}
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_HERO_FALLBACK;
                        }}
                      />
                      {/* Gradient shadow overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>

                    {/* Interactive Live Rating & "Rate Now" Button inside card bottom */}
                    <div className="bg-black/75 backdrop-blur-md px-2.5 py-1.5 flex items-center justify-between border-t border-rose-300/20">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-bold text-rose-100">
                          {Number(slot.rating || 4.8).toFixed(1)}
                        </span>
                      </div>

                      {/* Explicit "Rate Now" Button */}
                      <button
                        type="button"
                        onClick={(e) => handleVote(e, slot)}
                        className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 active:scale-110 cursor-pointer ${
                          isVoted
                            ? "bg-emerald-700/90 border-emerald-400 text-white shadow-md shadow-emerald-700/40"
                            : "bg-rose-700/90 hover:bg-rose-600 border-rose-400/50 text-white shadow-sm hover:scale-105"
                        }`}
                        title="Rate & Vote for this product"
                      >
                        {isVoted ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Rated</span>
                          </>
                        ) : (
                          <>
                            <Heart
                              className={`w-3 h-3 text-white ${
                                isJustVoted ? "scale-150 animate-ping" : "fill-white"
                              }`}
                            />
                            <span>Rate Now</span>
                          </>
                        )}
                        <span className="text-[9px] opacity-85 ml-0.5">
                          ({(slot.votes || 0).toLocaleString("en-IN")})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Pill Badge */}
                  <div className="mt-2 text-center w-full">
                    <span className="inline-block w-full max-w-[155px] truncate bg-white hover:bg-rose-50 text-[#520030] font-bold text-[11px] sm:text-xs py-1.5 px-3 rounded-full shadow-md border border-rose-200/80 tracking-wide transition-colors group-hover:scale-105">
                      {slot.tag || "Special Pick"}
                    </span>
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
