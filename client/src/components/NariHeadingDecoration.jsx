import React from "react";

/**
 * NariHeadingDecoration component renders an authentic boutique Ethnic Kurti / Garment silhouette.
 * Strictly garment apparel design — NO dancing female silhouettes, NO hearts, NO stars, and NO gold.
 * Styled in Royal Maroon (#8B0000, #780016) and Crisp White.
 */
export const NariHeadingDecoration = ({ flip = false, className = "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" }) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative select-none mx-1 sm:mx-1.5 transition-transform duration-300 hover:scale-105 ${
        flip ? "scale-x-[-1]" : ""
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} drop-shadow-[0_1px_3px_rgba(120,0,22,0.25)]`}
      >
        {/* Outer subtle glow in royal maroon */}
        <defs>
          <linearGradient id="kurtiGrad" x1="6" y1="3" x2="26" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9E1616" />
            <stop offset="0.5" stopColor="#780016" />
            <stop offset="1" stopColor="#4A0A14" />
          </linearGradient>
          <linearGradient id="slitGleam" x1="16" y1="16" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* ── ETHNIC KURTI SILHOUETTE ── */}
        {/* Shoulders & Sleeves & Flared Hem Body */}
        <path
          d="M9.5 3.5 L12.5 7 H19.5 L22.5 3.5 L27 8.5 L24 10.5 L23 9.5 V28.5 C23 29 22.5 29.5 22 29.5 H19.5 L19 20 H13 L12.5 29.5 H10 C9.5 29.5 9 29 9 28.5 V9.5 L8 10.5 L5 8.5 L9.5 3.5 Z"
          fill="url(#kurtiGrad)"
        />

        {/* Elegant Designer V-Neckline Notch (Crisp White Accent) */}
        <path
          d="M13 7 C13 8.8 14.2 10.2 16 10.2 C17.8 10.2 19 8.8 19 7 H13 Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Delicate Yoke Piping Stitch Accent */}
        <line x1="16" y1="10.5" x2="16" y2="15.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

        {/* Center Placket Buttons (Clean micro dots) */}
        <circle cx="16" cy="12" r="0.75" fill="#ffffff" />
        <circle cx="16" cy="14" r="0.75" fill="#ffffff" />

        {/* Side Slits Hem Highlight */}
        <line x1="13.2" y1="20" x2="12.6" y2="29" stroke="url(#slitGleam)" strokeWidth="0.75" opacity="0.6" />
        <line x1="18.8" y1="20" x2="19.4" y2="29" stroke="url(#slitGleam)" strokeWidth="0.75" opacity="0.6" />
      </svg>
    </span>
  );
};

/**
 * SectionHeading Component wraps any title text with NariHeadingDecoration on left & right sides.
 */
export const SectionHeading = ({
  children,
  className = "",
  style = {},
  iconClassName = "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
}) => {
  return (
    <h2
      className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-wider uppercase inline-flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-center text-[#780016] ${className}`}
      style={{ color: "#780016", ...style }}
    >
      <NariHeadingDecoration className={iconClassName} />
      <span className="drop-shadow-xs">{children}</span>
      <NariHeadingDecoration flip={true} className={iconClassName} />
    </h2>
  );
};

export default SectionHeading;
