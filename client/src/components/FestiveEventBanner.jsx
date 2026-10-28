import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const FestiveEventBanner = () => {
  const [sale, setSale] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/admin/flash-sale`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const activeSales = Array.isArray(data.active_sales)
          ? data.active_sales.filter((s) => s.is_active && (s.is_currently_live || s.status === "live"))
          : [];

        if (data.is_active || data.is_currently_live) {
          setSale(data);
        } else if (activeSales.length > 0) {
          setSale(activeSales[0]);
        } else {
          // Keep configured deal even if timer not ticking so banner stays visible with admin settings
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

  // Compute dynamic Deal Text based on admin panel config
  const formatDealText = () => {
    if (!sale) return "Buy 1 Get 1 Free";

    if (sale.deal_type === "bogo") return "Buy 1 Get 1 Free";
    if (sale.deal_type === "buy2get1") return "Buy 2 Get 1 Free";
    if (sale.deal_type === "buy3get1") return "Buy 3 Get 1 Free";
    if (sale.deal_type === "buy5get2") return "Buy 5 Get 2 Free";
    if (sale.deal_type === "buy5get1") return "Buy 5 Get 1 Free";
    if (sale.deal_type === "percentage") {
      return `Flat ${sale.discount_percentage || 30}% Off`;
    }

    if (sale.deal_text && sale.deal_text.trim() !== "") {
      return sale.deal_text
        .replace(/\(BOGO\)/i, "")
        .replace(/BUY/gi, "Buy")
        .replace(/GET/gi, "Get")
        .replace(/FREE/gi, "Free")
        .trim();
    }

    return "Buy 1 Get 1 Free";
  };

  const dealText = formatDealText();

  const titleText =
    sale?.title && !sale.title.toLowerCase().includes("grand")
      ? sale.title
      : "SPECIAL OFFER";

  const subtitleText =
    sale?.subtitle && !sale.subtitle.toLowerCase().includes("exclusive handcrafted")
      ? sale.subtitle
      : "Mix your favourite styles";

  // Check if admin uploaded a custom full banner image
  const hasCustomBanner = !!sale?.banner_image;
  const isDefaultBogo = dealText === "Buy 1 Get 1 Free" && !hasCustomBanner;

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 my-4 sm:my-6 overflow-hidden">
      <Link
        to="/category/sale"
        className="group block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-rose-200/50 hover:border-rose-300 cursor-pointer bg-[#FDF0F1]"
        title={`${titleText}: ${dealText} - ${subtitleText}`}
      >
        {hasCustomBanner ? (
          // Admin uploaded custom banner image
          <img
            src={resolveImageUrl(sale.banner_image)}
            alt={sale.title || "Special Offer"}
            className="w-full h-auto object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : isDefaultBogo ? (
          // Standard Buy 1 Get 1 Free Banner from design
          <img
            src="/bogo_special_offer_banner.png"
            alt="Special Offer - Buy 1 Get 1 Free - Mix your favourite styles"
            className="w-full h-auto object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          // Dynamic Offer Banner Template (Buy 2 Get 1, Buy 3 Get 1, etc. configured from admin)
          <div className="relative w-full h-[120px] sm:h-[150px] md:h-[180px] bg-gradient-to-r from-[#FCEAEB] via-[#FDF0F1] to-[#FCEAEB] flex items-center justify-between px-6 sm:px-12 md:px-16 overflow-hidden">
            {/* Background floral decoration on left */}
            <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-rose-300/40 via-transparent to-transparent" />

            {/* Left Dynamic Text Content */}
            <div className="relative z-10 flex flex-col justify-center max-w-[65%] sm:max-w-[60%]">
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-[#780016] uppercase tracking-widest font-sans">
                {titleText}
              </span>
              <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-black text-[#6B0D23] tracking-tight leading-tight my-0.5 sm:my-1 drop-shadow-xs">
                {dealText}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-rose-900/80 font-sans tracking-wide">
                {subtitleText}
              </p>
            </div>

            {/* Right Side Model Image */}
            <div className="relative z-10 h-full flex items-center justify-end flex-shrink-0">
              <img
                src="/banner_model_crop.png"
                alt="Special Offer Model"
                className="h-full w-auto object-contain object-right group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </div>
        )}
      </Link>
    </section>
  );
};

export default FestiveEventBanner;
