import React from "react";

/**
 * NariHeadingDecoration component renders an elegant 💃🏻 (Woman in Red Dress) icon
 * with floating/pulsing hearts & twinkling stars beside it for section headings.
 */
export const NariHeadingDecoration = ({ flip = false, className = "w-9 h-9 md:w-11 md:h-11" }) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative select-none mx-1 md:mx-2 transition-transform duration-300 hover:scale-110 ${
        flip ? "scale-x-[-1]" : ""
      }`}
    >
      {/* Background Subtle Glow */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 via-pink-500/20 to-amber-400/20 animate-ping opacity-25 scale-125 pointer-events-none"></span>

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} drop-shadow-[0_2px_5px_rgba(139,0,0,0.35)]`}
      >
        {/* 💃🏻 ELEGANT WOMAN IN RED DRESS SILHOUETTE & FLUID GOWN */}
        {/* Hair Bun & Graceful Face Contour */}
        <circle cx="27" cy="12" r="4.5" fill="#580C1F" />
        <path d="M25 8.5C26 7.5 28.5 7.5 29.5 8.5" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />

        {/* Slender Neck & Gracefully Raised Arms (💃 Pose) */}
        <path d="M27 16.5V19.5" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" />
        {/* Left Arm Raising Up */}
        <path d="M26 20C21 16 16 11 19 7" stroke="#8B0000" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        {/* Right Arm Curved to Waist */}
        <path d="M28 20C32 23 33 26 30 30" stroke="#8B0000" strokeWidth="2.2" strokeLinecap="round" fill="none" />

        {/* Elegant Red Bodice */}
        <path d="M24 19.5C24 19.5 27 19 30 19.5C29.5 24.5 28.5 28.5 27 31.5C25.5 28.5 24.5 24.5 24 19.5Z" fill="#8B0000" />

        {/* Golden Ornate Kamarbandh / Waistband */}
        <path d="M23.5 31.5C25.5 33 28.5 33 30.5 31.5" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" fill="none" />

        {/* Flared Voluminous Red Lehenga / Dancing Dress Skirt */}
        <path
          d="M24 32C17 40 8 50 6 56C14 59 36 60 44 55C40 48 31 40 27 32Z"
          fill="url(#gown-red-grad)"
        />

        {/* Skirt Layer Shading & Swirl Lines */}
        <path
          d="M15 45C22 49 31 53 41 53.5"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2.5 2"
          fill="none"
        />
        <path
          d="M10 54C19 56.5 29 57.5 41 54.5"
          stroke="#7F1D1D"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── ACCOMPANYING HEART & STAR ON THE SIDE ── */}
        {/* Animated Pulsing Red Heart */}
        <g className="animate-pulse" style={{ animationDuration: "1.5s" }}>
          <path
            d="M50 11C47.5 11 45.5 12.5 44.5 14.2C43.5 12.5 41.5 11 39 11C35.7 11 33 13.5 33 16.8C33 21.5 44.5 27.5 44.5 27.5C44.5 27.5 56 21.5 56 16.8C56 13.5 53.3 11 50 11Z"
            fill="#8B0000"
            stroke="#FFFFFF"
            strokeWidth="0.8"
          />
        </g>

        {/* Animated Twinkling Golden Star */}
        <g className="animate-bounce" style={{ animationDuration: "2.1s" }}>
          <path
            d="M48 34L49.5 38.5L54 40L49.5 41.5L48 46L46.5 41.5L42 40L46.5 38.5L48 34Z"
            fill="#D4AF37"
            className="drop-shadow-sm"
          />
        </g>

        {/* Gradient Defs */}
        <defs>
          <linearGradient id="gown-red-grad" x1="6" y1="32" x2="44" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#991B1B" />
            <stop offset="0.5" stopColor="#8B0000" />
            <stop offset="1" stopColor="#DC2626" />
          </linearGradient>
        </defs>
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
  iconClassName = "w-9 h-9 md:w-11 md:h-11",
}) => {
  return (
    <h2
      className={`text-2xl md:text-4xl font-serif font-bold tracking-wide uppercase inline-flex items-center justify-center flex-wrap gap-1 md:gap-2 ${className}`}
      style={{ color: "#8B0000", ...style }}
    >
      <NariHeadingDecoration className={iconClassName} />
      <span>{children}</span>
      <NariHeadingDecoration flip={true} className={iconClassName} />
    </h2>
  );
};

export default SectionHeading;
