import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, ArrowRight, Sparkles } from "lucide-react";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const FestiveEventBanner = () => {
    const [sale, setSale] = useState(null);
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, isLive: false });

    useEffect(() => {
        let isMounted = true;
        fetch(`${API_BASE_URL}/admin/flash-sale`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!isMounted || !data) return;
                // If active or has banner_image or any sale exists
                if (data.is_active || data.banner_image || (data.active_sales && data.active_sales.length > 0)) {
                    setSale(data);
                } else if (Array.isArray(data.all_sales) && data.all_sales.length > 0) {
                    const withBanner = data.all_sales.find((s) => s.banner_image);
                    setSale(withBanner || data.all_sales[0] || data);
                } else {
                    setSale(data);
                }
            })
            .catch(() => {
                if (isMounted) setSale(null);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!sale?.end_time) {
            setCountdown({ hours: 0, minutes: 0, seconds: 0, isLive: false });
            return;
        }

        const updateTimer = () => {
            const end = new Date(sale.end_time).getTime();
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0, isLive: false });
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown({ hours, minutes, seconds, isLive: true });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [sale]);

    if (!sale) return null;

    const dealBadgeText =
        sale.deal_text ||
        (sale.deal_type === "bogo"
            ? "🎁 BUY 1 GET 1 FREE"
            : sale.deal_type === "buy2get1"
            ? "🎁 BUY 2 GET 1 FREE"
            : sale.deal_type === "buy3get1"
            ? "🎁 BUY 3 GET 1 FREE"
            : `🔥 FLAT ${sale.discount_percentage || 30}% OFF`);

    return (
        <section className="w-full my-4 overflow-hidden">
            <Link
                to="/category/sale"
                className="group relative block w-full h-[200px] max-h-[200px] overflow-hidden shadow-lg border-y border-amber-400/40 hover:border-amber-400 transition-all duration-300"
            >
                {/* Banner Image Background - Full Width, exactly 200px height */}
                {sale.banner_image ? (
                    <img
                        src={resolveImageUrl(sale.banner_image)}
                        alt={sale.title || "Festive Flash Sale"}
                        className="absolute inset-0 w-full h-[200px] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-[200px] bg-gradient-to-r from-[#3B0813] via-[#7B0D1E] to-[#4A0019]" />
                )}

                {/* Translucent Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/75 md:via-black/35 backdrop-blur-[0.5px]" />

                {/* Decorative Glowing Flare */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-rose-600/25 blur-3xl pointer-events-none" />

                {/* Content Container - Vertically centered inside 200px height */}
                <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4 text-white">
                    {/* Left: Titles & Badges */}
                    <div className="space-y-1.5 sm:space-y-2 max-w-xl md:max-w-2xl py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                                <Flame className="w-3 h-3 fill-current animate-bounce" />
                                <span>LIVE FESTIVE EVENT</span>
                            </span>

                            {countdown.isLive ? (
                                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold bg-black/60 border border-amber-300/40 text-amber-300 px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md">
                                    <Clock className="w-3 h-3 animate-spin" />
                                    <span>ENDS IN:</span>
                                    <span className="font-mono text-white">
                                        {String(countdown.hours).padStart(2, "0")}h:
                                        {String(countdown.minutes).padStart(2, "0")}m:
                                        {String(countdown.seconds).padStart(2, "0")}s
                                    </span>
                                </div>
                            ) : (
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300/90 bg-amber-950/40 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3 text-amber-400" /> Limited Festive Stock
                                </span>
                            )}
                        </div>

                        <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md leading-tight line-clamp-1">
                            {sale.title || "Grand Festive Flash Sale"}
                        </h3>

                        <p className="text-xs sm:text-sm text-amber-100/90 font-medium drop-shadow line-clamp-1 sm:line-clamp-2">
                            {sale.subtitle || "Exclusive Limited-Time Discounts on Handcrafted Ethnic Luxury"}
                        </p>
                    </div>

                    {/* Right: Promotional Deal & CTA */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-end sm:items-center md:items-end justify-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="bg-white/95 text-slate-950 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl border border-amber-300 backdrop-blur-md text-center">
                            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 block">
                                Special Offer
                            </span>
                            <span className="text-xs sm:text-base md:text-lg font-black text-[#8B0000] font-mono tracking-tight whitespace-nowrap">
                                {dealBadgeText}
                            </span>
                        </div>

                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg group-hover:bg-amber-300 transition-colors">
                            <span>Explore Sale</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </div>
            </Link>
        </section>
    );
};

export default FestiveEventBanner;
