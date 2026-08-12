import React, { useState, useEffect, useCallback } from "react";
import { X, Eye, EyeOff, Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "np_welcome_v2";
const POPUP_DELAY_MS = 5000;
const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

/* ── Decorative SVG divider element used inside the modal ── */
const OrnamentDivider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #d4af37)" }} />
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L11.5 8H18L12.8 11.8L14.8 18L10 14.2L5.2 18L7.2 11.8L2 8H8.5L10 2Z"
        fill="#d4af37" opacity="0.8" />
    </svg>
    <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #d4af37)" }} />
  </div>
);

/* ── Google SVG icon ── */
const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login, openLoginModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: fullName, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.detail || "Registration failed. Please try again.");
          return;
        }
        setSuccess("Account created! Signing you in…");
        // Auto-login after signup
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          localStorage.setItem("token", data.access_token);
          await login({ email, password });
          dismiss();
        }
      } else {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.detail || "Invalid email or password.");
          return;
        }
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        await login({ email, password });
        dismiss();
        if (data.user?.role === "admin") navigate("/admin/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[9998] bg-black/70"
        style={{ backdropFilter: "blur(4px)" }}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* ── Modal container ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Nari Pehnawa"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ animation: "npPopupIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div
          className="relative w-full overflow-y-auto sm:overflow-hidden flex flex-col sm:flex-row"
          style={{
            maxWidth: "780px",
            maxHeight: "92vh",
            borderRadius: "16px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.18)",
          }}
        >
          {/* ═══════════════════════════════════════════════════
              LEFT — Fashion image panel with luxury overlay
              (Compact banner on mobile, full side panel on desktop)
          ═══════════════════════════════════════════════════ */}
          <div
            className="relative sm:w-[44%] flex-shrink-0 h-40 sm:h-auto"
            style={{ minHeight: undefined }}
          >
            {/* Actual model image */}
            <img
              src="/hero_model_1.png"
              alt="Nari Pehnawa Collection"
              className="w-full h-full object-cover object-top"
              style={{ display: "block" }}
              onError={(e) => {
                e.target.src = "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&dpr=1";
              }}
            />

            {/* Multi-layer gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(to top,  rgba(80,0,0,0.92) 0%, rgba(80,0,0,0.4) 40%, transparent 70%),
                  linear-gradient(to right, rgba(0,0,0,0.25) 0%, transparent 60%)
                `,
              }}
            />

            {/* Gold shimmer strip left edge */}
            <div
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: "linear-gradient(to bottom, transparent, #d4af37, transparent)" }}
            />

            {/* Top badge */}
            <div className="absolute top-3 sm:top-5 left-4 sm:left-5 right-5 flex justify-start">
              <div
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold"
                style={{
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid rgba(212,175,55,0.5)",
                  color: "#f0d060",
                  backdropFilter: "blur(8px)",
                  letterSpacing: "0.08em",
                }}
              >
                <Sparkles className="w-3 h-3" />
                EXCLUSIVE OFFER
              </div>
            </div>

            {/* Bottom text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              {/* Discount callout */}
              <div className="mb-1.5 sm:mb-3 flex sm:block items-baseline gap-2">
                <span
                  className="text-3xl sm:text-5xl font-black leading-none"
                  style={{ color: "#d4af37", fontFamily: "Georgia, serif" }}
                >
                  10%
                </span>
                <span
                  className="text-sm sm:text-base font-bold text-white/90"
                  style={{ fontSize: "0.85rem" }}
                >
                  OFF
                </span>
                <p className="text-white/70 text-[10px] sm:text-xs sm:mt-0.5 font-light tracking-wider">
                  YOUR FIRST ORDER
                </p>
              </div>

              {/* Tagline + trust badges — hidden on very short mobile banner to save space */}
              <div className="hidden sm:block">
                <div
                  className="w-10 h-px mb-3"
                  style={{ background: "#d4af37" }}
                />
                <p
                  className="text-white font-light leading-snug text-sm"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  Where tradition meets<br />
                  <span className="font-semibold text-white not-italic">
                    timeless elegance
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap mt-4">
                  {["Premium Fabric", "Easy Returns", "Free Ship ₹999+"].map((b) => (
                    <span
                      key={b}
                      className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              RIGHT — Login / Signup panel
          ═══════════════════════════════════════════════════ */}
          <div
            className="flex-1 flex flex-col overflow-y-auto"
            style={{ backgroundColor: "#fdfaf7" }}
          >
            {/* Gold top accent line */}
            <div
              className="h-1 w-full flex-shrink-0"
              style={{ background: "linear-gradient(to right, #8B0000, #d4af37, #8B0000)" }}
            />

            <div className="flex-1 px-5 sm:px-7 pt-5 sm:pt-7 pb-5 sm:pb-6 flex flex-col justify-between gap-1">

              {/* Header */}
              <div className="text-center mb-1">
                <img
                  src="/logo.png"
                  alt="Nari Pehnawa"
                  className="h-8 sm:h-10 w-auto object-contain mx-auto mb-2 sm:mb-3"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <h2
                  className="font-bold mb-1"
                  style={{ color: "#8B0000", fontSize: "clamp(1.05rem, 4vw, 1.3rem)", fontFamily: "Georgia, serif" }}
                >
                  {mode === "login" ? "Welcome Back, Nari ✨" : "Join Nari Pehnawa"}
                </h2>
                <p className="text-[11px] sm:text-xs" style={{ color: "#999" }}>
                  {mode === "login"
                    ? "Sign in to unlock your exclusive 10% discount"
                    : "Create your account and claim 10% off instantly"}
                </p>
              </div>

              <OrnamentDivider />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 flex-1">

                {mode === "signup" && (
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
                      style={{ color: "#c0a0a0" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 transition-all"
                      style={{
                        borderColor: "#e8d5d5",
                        background: "#fff",
                        color: "#333",
                        "--tw-ring-color": "#8B0000",
                      }}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "#c0a0a0" }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 transition-all"
                    style={{ borderColor: "#e8d5d5", background: "#fff", color: "#333" }}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "#c0a0a0" }}
                  />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 transition-all"
                    style={{ borderColor: "#e8d5d5", background: "#fff", color: "#333" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors"
                    style={{ color: showPwd ? "#8B0000" : "#c0a0a0" }}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remember / Forgot */}
                {mode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: "#777" }}>
                      <input type="checkbox" className="w-3 h-3 accent-[#8B0000] rounded" />
                      Remember me
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        dismiss();
                        openLoginModal("", null, "forgot");
                      }}
                      className="text-xs hover:underline" 
                      style={{ color: "#8B0000" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Error / Success */}
                {error && (
                  <p className="text-xs text-center py-2 px-3 rounded-lg"
                    style={{ color: "#c0392b", background: "#fff5f5", border: "1px solid #fcd0d0" }}>
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs text-center py-2 px-3 rounded-lg"
                    style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    {success}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm tracking-wide transition-all hover:shadow-lg disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #8B0000 0%, #a52a2a 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(139,0,0,0.3)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Please wait…
                    </span>
                  ) : (
                    <>
                      {mode === "login" ? "Sign In & Claim Offer" : "Create My Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
                <span className="text-xs" style={{ color: "#bbb" }}>OR</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#eee" }} />
              </div>

              {/* Google + Skip row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { window.location.href = `${API_URL}/auth/google/login`; }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-all hover:bg-gray-50"
                  style={{ borderColor: "#e0e0e0", color: "#444" }}
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-medium border transition-all hover:bg-gray-50"
                  style={{ borderColor: "#e0e0e0", color: "#888" }}
                >
                  Skip
                </button>
              </div>

              {/* Toggle mode */}
              <p className="text-center text-xs mt-2" style={{ color: "#888" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
                  className="font-bold hover:underline"
                  style={{ color: "#8B0000" }}
                >
                  {mode === "login" ? "Sign Up Free" : "Sign In"}
                </button>
              </p>
            </div>
          </div>

          {/* ── Close button (top-right corner of modal) ── */}
          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          >
            <X className="w-4 h-4" style={{ color: "#444" }} />
          </button>
        </div>
      </div>

      {/* Entry animation keyframe */}
      <style>{`
        @keyframes npPopupIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
};

export default WelcomePopup;
