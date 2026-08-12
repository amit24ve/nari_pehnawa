import React, { useState, useEffect } from "react";

/**
 * E-commerce style splash/loading screen.
 * Shows for ~2.5s on first page load, then fades out.
 */
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animate progress bar 0 → 100 over 2200ms
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min((elapsed / 2200) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);

    // Start fade-out at 2.3s, call onComplete at 2.8s
    const t1 = setTimeout(() => setFadeOut(true), 2300);
    const t2 = setTimeout(() => onComplete(), 2800);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #8B0000 1px, transparent 1px), radial-gradient(circle at 75% 75%, #8B0000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Logo */}
      <div className="relative flex flex-col items-center">
        <div
          className="relative mb-8"
          style={{ animation: "loaderPulse 1.8s ease-in-out infinite" }}
        >
          <img
            src="/loader.png"
            alt="Nari Pehnawa"
            className="w-40 h-40 object-contain drop-shadow-md"
          />
        </div>

        {/* Brand name */}
        <h1
          className="text-2xl font-bold tracking-[0.18em] mb-1"
          style={{ color: "#8B0000", fontFamily: "Georgia, serif" }}
        >
          NARI PEHNAWA
        </h1>
        <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-8">
          Fashion &amp; Home Decor
        </p>

        {/* Progress bar */}
        <div className="w-52 h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(to right, #8B0000, #c0392b)",
            }}
          />
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#8B0000]"
              style={{
                animation: `loaderDot 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes loaderPulse {
          0%, 100% { transform: scale(1);   opacity: 1;    }
          50%       { transform: scale(1.04); opacity: 0.9; }
        }
        @keyframes loaderDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
