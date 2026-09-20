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

    const dealText =
        sale.deal_text ||
        (sale.deal_type === "bogo"
            ? "BUY 1 GET 1 FREE"
            : sale.deal_type === "buy2get1"
            ? "BUY 2 GET 1 FREE"
            : sale.deal_type === "buy3get1"
            ? "BUY 3 GET 1 FREE"
            : sale.deal_type === "buy5get2"
            ? "BUY 5 GET 2 FREE"
            : `FLAT ${sale.discount_percentage || 30}% OFF`);

    const productSubtitle =
        sale.subtitle && !sale.subtitle.toLowerCase().includes("handcrafted luxury ethnic")
            ? sale.subtitle
            : "Festive Collection • Anarkali Kurtis, Chikankari Suits & Sarees";

    return (
        <section className="w-full my-4 overflow-hidden">
            <Link
                to="/category/sale"
                className="group relative block w-full h-[230px] sm:h-[250px] overflow-hidden shadow-2xl border-y-2 border-amber-400/50 hover:border-amber-400 transition-all duration-300"
            >
                {/* Banner Background - Full Width, responsive 230-250px height */}
                {sale.banner_image ? (
                    <img
                        src={resolveImageUrl(sale.banner_image)}
                        alt={sale.title || "Festive Flash Sale"}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#2A050E] via-[#5C0A19] to-[#20030A]" />
                )}

                {/* Dark Contrast Gradient Overlay to ensure 100% crisp text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/80 md:via-black/55 backdrop-blur-[0.5px]" />

                {/* Subtle festive ambient gold flares */}
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />

                {/* Content Container - Zero Badges, Pure Premium Text Flow */}
                <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
                    {/* Left: Title, Big Deal Text, Product Subtitle, Countdown */}
                    <div className="space-y-2 max-w-2xl py-2">
                        {/* Main Sale Title */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                            {sale.title || "Grand Festive Flash Sale"}
                        </h2>

                        {/* Special Offer Deal Display - Pure Text, No Card */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                            <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 tracking-tight drop-shadow-lg font-mono">
                                {dealText}
                            </span>

                            {countdown.isLive && (
                                <span className="text-xs sm:text-sm font-bold text-white/90 bg-black/60 border border-amber-400/40 px-3 py-1 rounded-full backdrop-blur-md">
                                    Ends in: {String(countdown.hours).padStart(2, "0")}h {String(countdown.minutes).padStart(2, "0")}m {String(countdown.seconds).padStart(2, "0")}s
                                </span>
                            )}
                        </div>

                        {/* Product Subtitle aligned with store catalog */}
                        <p className="text-xs sm:text-sm text-gray-200 font-medium drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                            {productSubtitle}
                        </p>
                    </div>

                    {/* Right: Clean, High-Visibility CTA Button */}
                    <div className="flex items-center flex-shrink-0 pt-1 md:pt-0">
                        <span className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-2xl transition-all duration-300 group-hover:scale-105 active:scale-95">
                            <span>Explore Sale</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform" />
                        </span>
                    </div>
                </div>
            </Link>
        </section>
    );
};

export default FestiveEventBanner;
