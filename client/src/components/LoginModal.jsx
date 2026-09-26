import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  UserCheck,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen: propsIsOpen, onClose: propsOnClose }) => {
  const {
    login,
    loginWithToken,
    sendPhoneOtp,
    verifyPhoneOtp,
    resendPhoneOtp,
    user,
    isLoginModalOpen,
    closeLoginModal,
    loginNotice,
    pendingCheckout,
    loginModalMode,
  } = useAuth();
  const navigate = useNavigate();

  // Mode: "phone" (default) | "email" | "signup_email" | "forgot"
  const [authMode, setAuthMode] = useState("phone");

  // Phone Login States
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneUserName, setPhoneUserName] = useState("");
  const [phoneIsExistingUser, setPhoneIsExistingUser] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);

  // General Status States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Registration Success Screen
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState(null);

  const otpInputRef = useRef(null);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isLoginModalOpen;
  const handleClose = propsOnClose || closeLoginModal;

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Sync mode when loginModalMode changes
  useEffect(() => {
    if (loginModalMode === "signup") {
      setAuthMode("phone");
    } else if (loginModalMode === "forgot") {
      setAuthMode("forgot");
    } else {
      setAuthMode("phone");
    }
    setError("");
  }, [loginModalMode, isOpen]);

  // Focus OTP input when phone OTP sent
  useEffect(() => {
    if (phoneOtpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [phoneOtpSent]);

  // Handle post-login actions
  useEffect(() => {
    if (user && isOpen && !registrationSuccess) {
      handleClose();
      if (!pendingCheckout && (user.role === "admin" || user.is_admin)) {
        navigate("/admin/dashboard");
      }
    }
  }, [user, isOpen, pendingCheckout, navigate, handleClose, registrationSuccess]);

  if (!isOpen) return null;

  // ── PHONE OTP FLOW HANDLERS ──

  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setSendingOtp(true);
    const res = await sendPhoneOtp(cleanPhone);
    setSendingOtp(false);

    if (res.ok) {
      setPhoneOtpSent(true);
      setPhoneIsExistingUser(res.data?.is_existing_user);
      if (res.data?.name) setPhoneUserName(res.data.name);
      setResendTimer(30);
      setError("");
    } else {
      setError(res.message || "Failed to send OTP code. Please try again.");
    }
  };

  const handleResendPhoneOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    const cleanPhone = phone.replace(/\D/g, "");
    setError("");
    setSendingOtp(true);
    const res = await resendPhoneOtp(cleanPhone);
    setSendingOtp(false);

    if (res.ok) {
      setResendTimer(30);
      setError("Fresh OTP sent successfully to your mobile number!");
    } else {
      setError(res.message || "Failed to resend OTP code.");
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanOtp = phoneOtp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError("Please enter the complete OTP code.");
      return;
    }

    setError("");
    setLoading(true);
    const res = await verifyPhoneOtp({
      phone: cleanPhone,
      otp: cleanOtp,
      name: phoneUserName.trim() || undefined,
    });
    setLoading(false);

    if (res.ok) {
      if (res.is_new_user) {
        setRegisteredUserData(res.user);
        setRegistrationSuccess(true);
      } else {
        handleClose();
        if (res.user && (res.user.role === "admin" || res.user.is_admin)) {
          navigate("/admin/dashboard");
        }
      }
    } else {
      setError(res.message || "Invalid OTP code. Please check and try again.");
    }
  };

  const handleEditPhone = () => {
    setPhoneOtpSent(false);
    setPhoneOtp("");
    setError("");
  };

  // ── EMAIL FLOW HANDLERS ──

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login({ email: email.trim(), password });
    setLoading(false);

    if (result.ok) {
      handleClose();
      if (result.user && (result.user.role === "admin" || result.user.is_admin)) {
        navigate("/admin/dashboard");
      }
    } else {
      setError(result.message || "Invalid email or password");
    }
  };

  const handleSendEmailOtp = async () => {
    if (!email || !fullName || !password) {
      setError("Please fill in Name, Email, and Password first.");
      return;
    }
    setError("");
    setSendingOtp(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send email OTP");
      setEmailOtpSent(true);
      setError("Verification code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to send OTP code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegisterEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailOtp.trim()) {
      setError("Please enter the 6-digit email OTP code.");
      return;
    }
    setError("");
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const payload = {
        email: email.trim(),
        name: fullName.trim(),
        password,
        otp: emailOtp.trim(),
      };
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Sign up failed");

      if (data.access_token) {
        await loginWithToken(data.access_token);
      }
      setRegisteredUserData(data.user || { name: fullName, email });
      setRegistrationSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError("");
    setSendingOtp(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send reset code");
      setResetOtpSent(true);
      setError("Password reset verification code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !emailOtp || !newPassword) {
      setError("Please enter your Email, OTP Code, and New Password.");
      return;
    }
    setError("");
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: emailOtp.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setError("Password reset successful! You can now log in.");
      setAuthMode("email");
      setResetOtpSent(false);
      setEmailOtp("");
      setNewPassword("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRegistration = () => {
    setRegistrationSuccess(false);
    handleClose();
  };

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      `${API_URL}/auth/google/login`,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      window.location.href = `${API_URL}/auth/google/login`;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (registrationSuccess) handleFinishRegistration();
          else handleClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 my-auto flex flex-col overflow-hidden animate-scaleUp z-10">
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B0000] via-[#d4af37] to-[#8B0000]" />

        {/* Close Button */}
        <button
          onClick={() => {
            if (registrationSuccess) handleFinishRegistration();
            else handleClose();
          }}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-20 text-gray-400 hover:text-gray-700 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto max-h-[90vh]">
          {/* ═══════════════════════════════════════════════════
              VIEW 1: REGISTRATION SUCCESS SCREEN
          ═══════════════════════════════════════════════════ */}
          {registrationSuccess ? (
            <div className="text-center py-3 space-y-4 animate-fadeIn">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-emerald-50 rounded-full border-2 border-emerald-400">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-bounce" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Verified &amp; Logged In
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-900">
                  Welcome to Nari Pehnawa!
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Hello, <span className="font-bold text-[#8B0000]">{registeredUserData?.name || "Shopper"}</span>! Your account is ready.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-left text-xs text-amber-950 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">You are now logged in seamlessly!</p>
                  <p className="text-amber-800 mt-0.5 text-[11px]">
                    {pendingCheckout
                      ? "You can now complete your pending order checkout without any interruption."
                      : "Track orders, save wishlists, and enjoy exclusive member offers."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleFinishRegistration}
                  className="w-full bg-[#8B0000] hover:bg-[#700000] text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{pendingCheckout ? "Continue to Checkout" : "Start Shopping Now"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════
                VIEW 2: MAIN AUTH FORMS
            ═══════════════════════════════════════════════════ */
            <>
              {/* Brand Logo & Header */}
              <div className="text-center mb-4">
                <img
                  src="/logo.png"
                  alt="Nari Pehnawa"
                  className="h-11 sm:h-13 w-auto mx-auto mb-2 object-contain"
                />
                <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 leading-tight">
                  {authMode === "phone"
                    ? (phoneOtpSent ? "Verify OTP" : "Login or Sign Up")
                    : authMode === "email"
                    ? "Welcome Back"
                    : authMode === "signup_email"
                    ? "Create Account"
                    : "Reset Password"}
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {authMode === "phone"
                    ? (phoneOtpSent
                        ? `Enter 6-digit OTP sent to +91 ${phone}`
                        : "Enter your mobile number to get instant OTP")
                    : authMode === "email"
                    ? "Sign in with your Email & Password"
                    : authMode === "signup_email"
                    ? "Sign up with Email verification"
                    : "Enter your email to receive reset code"}
                </p>
              </div>

              {loginNotice && (
                <div className="mb-4 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 flex items-start gap-2 shadow-xs">
                  <span className="text-base leading-none">🔐</span>
                  <span className="leading-tight">{loginNotice}</span>
                </div>
              )}

              {/* ───────────────────────────────────────────────
                  1. PRIMARY FLOW: MOBILE NUMBER OTP LOGIN
              ─────────────────────────────────────────────── */}
              {authMode === "phone" && (
                <div className="space-y-4">
                  {!phoneOtpSent ? (
                    /* Step 1: Enter Phone Number */
                    <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Mobile Number
                        </label>
                        <div className="flex rounded-xl border border-gray-300 focus-within:border-[#8B0000] focus-within:ring-2 focus-within:ring-[#8B0000]/20 bg-white overflow-hidden transition">
                          <span className="px-3.5 py-2.5 bg-neutral-50 text-gray-700 font-bold text-sm flex items-center gap-1.5 border-r border-gray-200 select-none">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) setPhone(val);
                            }}
                            placeholder="Enter 10-digit number"
                            autoFocus
                            required
                            className="flex-1 px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none tracking-wider"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={phone.length !== 10 || sendingOtp}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        {sendingOtp ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Sending OTP via SMS...</span>
                          </>
                        ) : (
                          <>
                            <span>Get OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                        By continuing, you agree to Nari Pehnawa's{" "}
                        <span className="text-[#8B0000] font-semibold">Terms</span> &amp;{" "}
                        <span className="text-[#8B0000] font-semibold">Privacy Policy</span>.
                      </p>
                    </form>
                  ) : (
                    /* Step 2: Enter OTP Code & Name */
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-3.5 animate-fadeIn">
                      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-xl border border-gray-200 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-bold text-gray-800">+91 {phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleEditPhone}
                          className="text-[11px] font-bold text-[#8B0000] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Enter 6-Digit OTP Code
                        </label>
                        <input
                          ref={otpInputRef}
                          type="text"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••••"
                          required
                          className="w-full px-4 py-3 bg-neutral-50 border border-gray-300 rounded-xl text-center text-xl font-mono font-black tracking-[0.5em] text-gray-900 focus:bg-white focus:outline-none focus:border-[#8B0000] focus:ring-2 focus:ring-[#8B0000]/20 transition"
                        />
                      </div>

                      {/* Name input if new user */}
                      {!phoneIsExistingUser && (
                        <div className="pt-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Your Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={phoneUserName}
                              onChange={(e) => setPhoneUserName(e.target.value)}
                              placeholder="e.g. Priya Sharma"
                              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                            />
                            <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-gray-500">Didn't receive code?</span>
                        <button
                          type="button"
                          onClick={handleResendPhoneOtp}
                          disabled={resendTimer > 0 || sendingOtp}
                          className="font-bold text-[#8B0000] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                        >
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP via SMS"}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={phoneOtp.length < 4 || loading}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify &amp; Continue</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="px-3 text-gray-400 text-xs font-semibold uppercase">Or continue with</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  {/* Social & Alternate Login Buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl transition shadow-xs font-semibold text-xs sm:text-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("email");
                        setError("");
                      }}
                      className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-gray-800 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span>Login with Email &amp; Password</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────
                  2. EMAIL & PASSWORD LOGIN FLOW
              ─────────────────────────────────────────────── */}
              {authMode === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setError("");
                        }}
                        className="text-[11px] font-semibold text-[#8B0000] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? "Signing in..." : "Sign In with Email"}
                  </button>

                  <div className="pt-2 text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("phone");
                        setError("");
                      }}
                      className="text-xs font-bold text-[#8B0000] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>← Back to Mobile Number OTP Login</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ───────────────────────────────────────────────
                  3. FORGOT PASSWORD FLOW
              ─────────────────────────────────────────────── */}
              {authMode === "forgot" && (
                <div className="space-y-3.5 animate-fadeIn">
                  {!resetOtpSent ? (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Your Registered Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendResetOtp}
                        disabled={sendingOtp}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
                      >
                        {sendingOtp ? "Sending code..." : "Send Reset Code"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          6-Digit Email OTP
                        </label>
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
                      >
                        {loading ? "Resetting..." : "Reset Password & Login"}
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("phone");
                        setError("");
                      }}
                      className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      ← Back to Mobile Login
                    </button>
                  </div>
                </div>
              )}

              {/* Error / Success Toast Message */}
              {error && (
                <div
                  className={`text-xs mt-3 font-semibold p-2.5 rounded-xl text-center ${
                    error.includes("successfully") || error.includes("sent") || error.includes("successful")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
