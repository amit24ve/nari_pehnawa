import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, ArrowRight } from "lucide-react";

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
                if (data.is_active && (data.is_currently_live || data.status === "live")) {
                    setSale(data);
                } else if (Array.isArray(data.active_sales) && data.active_sales.length > 0) {
                    setSale(data.active_sales[0]);
                } else {
                    setSale(null);
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
        <section className="my-4 px-2.5 sm:px-4 max-w-7xl mx-auto">
            <Link
                to="/category/sale"
                className="group relative block overflow-hidden rounded-2xl shadow-xl border border-amber-400/30 hover:border-amber-400 transition-all duration-300"
            >
                {/* Banner Image Background */}
                {sale.banner_image ? (
                    <img
                        src={sale.banner_image}
                        alt={sale.title || "Festive Event"}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4A0E17] via-[#8B0000] to-[#2D0B12]" />
                )}

                {/* Translucent Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/60 sm:to-black/40 backdrop-blur-[1px]" />

                {/* Decorative Glowing Flares */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />

                {/* Content Container */}
                <div className="relative z-10 p-5 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-white">
                    {/* Left: Titles & Badges */}
                    <div className="space-y-2.5 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full shadow-md">
                                <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                                <span>LIVE FESTIVE EVENT</span>
                            </span>

                            {countdown.isLive && (
                                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-black/60 border border-amber-300/40 text-amber-300 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    <span>ENDS IN:</span>
                                    <span className="font-mono text-white">
                                        {String(countdown.hours).padStart(2, "0")}h:
                                        {String(countdown.minutes).padStart(2, "0")}m:
                                        {String(countdown.seconds).padStart(2, "0")}s
                                    </span>
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                            {sale.title || "Grand Festive Flash Sale"}
                        </h3>

                        <p className="text-xs sm:text-sm text-amber-100/90 font-medium drop-shadow line-clamp-2">
                            {sale.subtitle || "Exclusive Limited-Time Discounts on Handcrafted Ethnic Luxury"}
                        </p>
                    </div>

                    {/* Right: Promotional Deal & CTA */}
                    <div className="flex items-center sm:items-end md:flex-col justify-between sm:justify-end gap-3 flex-shrink-0">
                        <div className="bg-white/95 text-slate-950 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-amber-300 backdrop-blur-md text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Special Offer
                            </span>
                            <span className="text-sm sm:text-base md:text-lg font-black text-[#8B0000] font-mono tracking-tight whitespace-nowrap">
                                {dealBadgeText}
                            </span>
                        </div>

                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg group-hover:bg-amber-300 transition-colors">
                            <span>Explore Sale</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </div>
            </Link>
        </section>
    );
};

export default FestiveEventBanner;
