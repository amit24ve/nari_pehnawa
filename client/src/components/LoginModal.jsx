import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen: propsIsOpen, onClose: propsOnClose }) => {
  const {
    login,
    loginWithToken,
    user,
    isLoginModalOpen,
    closeLoginModal,
    loginNotice,
    pendingCheckout,
    loginModalMode,
  } = useAuth();
  const navigate = useNavigate();

  // Primary View: "login" | "signup" | "forgot"
  const [authView, setAuthView] = useState("login");

  // Sign In States
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Email or 10-digit phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Feedback States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

  // Sync mode when loginModalMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (loginModalMode === "signup") {
        setAuthView("signup");
      } else if (loginModalMode === "forgot") {
        setAuthView("forgot");
      } else {
        setAuthView("login");
      }
      setError("");
      setSuccessMsg("");
      setResetOtpSent(false);
    }
  }, [loginModalMode, isOpen]);

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

  const switchView = (newView) => {
    setAuthView(newView);
    setError("");
    setSuccessMsg("");
    setResetOtpSent(false);
    setForgotOtp("");
  };

  // ── 1. SIGN IN (EMAIL OR MOBILE ID + PASSWORD) ──
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !password) {
      setError("Please enter your Email or Mobile number and password.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const result = await login({ email: cleanId, password });
    setLoading(false);

    if (result.ok) {
      handleClose();
      if (result.is_seller || (result.user && result.user.role === "seller")) {
        navigate("/seller/dashboard");
      } else if (result.user && (result.user.role === "admin" || result.user.is_admin)) {
        navigate("/admin/dashboard");
      }
    } else {
      setError(result.message || "Invalid credentials. Please verify and try again.");
    }
  };

  // ── 2. CREATE ACCOUNT (NAME + MOBILE + EMAIL + PASSWORD) ──
  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanName) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid Email Address.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const payload = {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password: signupPassword,
      };

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
      }

      // Auto login user on successful registration
      if (data.access_token && data.user) {
        localStorage.setItem("neel_token", data.access_token);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("neel_admin_user", JSON.stringify(data.user));
        setRegistrationSuccess(true);
      } else {
        setSuccessMsg("Account created successfully! Please sign in with your password.");
        setLoginIdentifier(cleanEmail);
        switchView("login");
      }
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // ── 3. FORGOT PASSWORD: SEND OTP TO EMAIL ──
  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setSendingOtp(true);

    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send reset code");
      }

      setResetOtpSent(true);
      setResendTimer(45);
      setSuccessMsg(`A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`);
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── 4. FORGOT PASSWORD: VERIFY OTP & RESET PASSWORD ──
  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP code received in your email.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      // Password reset successful -> auto-login or switch to login
      setSuccessMsg("Password reset successfully! Please sign in with your new password.");
      setLoginIdentifier(cleanEmail);
      setPassword("");
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResetOtpSent(false);
      switchView("login");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE SIGN IN ──
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
          if (registrationSuccess) {
            setRegistrationSuccess(false);
            handleClose();
          } else {
            handleClose();
          }
        }}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[440px] border border-stone-200 my-auto flex flex-col overflow-hidden animate-scaleUp z-10">
        {/* Top Luxury Gold Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#780016] via-[#c59b27] to-[#780016]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (registrationSuccess) {
              setRegistrationSuccess(false);
            }
            handleClose();
          }}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Registration Success Screen */}
          {registrationSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-stone-900">Welcome to Nari Pehnawa!</h3>
                <p className="text-xs text-stone-600">Your account has been created successfully.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRegistrationSuccess(false);
                  handleClose();
                }}
                className="w-full py-3 bg-[#780016] hover:bg-[#5a0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{pendingCheckout ? "Continue to Checkout" : "Explore Handcrafted Collection"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Header: Brand & Title */}
              <div className="text-center mb-5">
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#780016]">
                  NARI PEHNAWA
                </h1>
                <p className="text-[11px] uppercase tracking-[0.15em] text-[#c59b27] font-semibold mt-0.5">
                  Handcrafted Ethnic Luxury
                </p>
              </div>

              {/* Password Change / Session Expired Notice */}
              {loginNotice && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 flex items-start gap-2 shadow-xs">
                  <span className="text-sm leading-none flex-shrink-0">🔐</span>
                  <span className="leading-tight">{loginNotice}</span>
                </div>
              )}

              {/* Status Message (Error / Success) */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{successMsg}</span>
                </div>
              )}

              {/* Tab Navigation for Sign In / Create Account (Clean, No Messy Badges) */}
              {authView !== "forgot" && (
                <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600 mb-5">
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                      authView === "login"
                        ? "bg-white text-[#780016] shadow-xs font-extrabold"
                        : "hover:text-stone-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchView("signup")}
                    className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                      authView === "signup"
                        ? "bg-white text-[#780016] shadow-xs font-extrabold"
                        : "hover:text-stone-900"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════
                  VIEW 1: SIGN IN (EMAIL OR MOBILE + PASSWORD)
              ═══════════════════════════════════════════════════ */}
              {authView === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="you@example.com or 10-digit mobile"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]/20 transition"
                      />
                      <UserIcon className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">Password</label>
                      <button
                        type="button"
                        onClick={() => switchView("forgot")}
                        className="text-[11px] font-semibold text-[#780016] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] focus:ring-1 focus:ring-[#780016]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#780016] hover:bg-[#5a0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Clean Divider */}
                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-stone-200" />
                    <span className="px-3 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      Or continue with
                    </span>
                    <div className="flex-1 border-t border-stone-200" />
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 transition flex items-center justify-center gap-2.5 text-xs font-semibold text-stone-700 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════
                  VIEW 2: CREATE ACCOUNT (MOBILE NUMBER + EMAIL + ID)
              ═══════════════════════════════════════════════════ */}
              {authView === "signup" && (
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] transition"
                      />
                      <UserIcon className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="flex rounded-xl border border-stone-300 focus-within:border-[#780016] focus-within:ring-1 focus-within:ring-[#780016]/20 bg-stone-50 overflow-hidden transition">
                      <span className="px-3 py-2.5 bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm flex items-center gap-1 border-r border-stone-200 select-none">
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
                        placeholder="10-digit mobile number"
                        required
                        className="flex-1 px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 placeholder-stone-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] transition"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Create Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Enter secure password"
                        required
                        minLength={6}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#780016] hover:bg-[#5a0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-3"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-stone-500 pt-1">
                    By signing up, you agree to Nari Pehnawa's Terms of Service and Privacy Policy.
                  </p>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════
                  VIEW 3: FORGOT PASSWORD (EMAIL OTP WORKFLOW)
              ═══════════════════════════════════════════════════ */}
              {authView === "forgot" && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-[#780016] flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {resetOtpSent ? "Enter Verification Code" : "Reset Your Password"}
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {resetOtpSent
                        ? "Enter the 6-digit code sent to your email address"
                        : "Enter your registered email to receive an OTP verification code"}
                    </p>
                  </div>

                  {!resetOtpSent ? (
                    <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016] transition"
                          />
                          <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={sendingOtp || !forgotEmail.trim()}
                        className="w-full py-3 bg-[#780016] hover:bg-[#5a0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {sendingOtp ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending code to email...</span>
                          </>
                        ) : (
                          <>
                            <span>Send OTP Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          6-Digit Email Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 589214"
                          required
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-center font-mono font-bold tracking-widest text-base text-stone-900 focus:bg-white focus:outline-none focus:border-[#780016]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          New Password (min 6 chars)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          minLength={6}
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#780016]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          disabled={resendTimer > 0 || sendingOtp}
                          className="text-[11px] font-semibold text-[#780016] hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP to Email"}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || forgotOtp.length !== 6 || newPassword.length < 6}
                        className="w-full py-3 bg-[#780016] hover:bg-[#5a0010] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Updating password...</span>
                          </>
                        ) : (
                          <>
                            <span>Reset Password &amp; Login</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchView("login")}
                      className="text-xs font-bold text-[#780016] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
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
