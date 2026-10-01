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
  KeyRound,
  UserPlus,
  LogIn,
  ShieldCheck,
  ArrowLeft
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

  // Primary View: "login" (default) | "signup" (create account) | "forgot"
  const [authView, setAuthView] = useState("login");

  // Sub-Method inside Login: "phone" | "email"
  const [loginMethod, setLoginMethod] = useState("phone");

  // Sub-Method inside Signup: "phone" | "email"
  const [signupMethod, setSignupMethod] = useState("phone");

  // Phone States
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneUserName, setPhoneUserName] = useState("");
  const [phoneUserEmail, setPhoneUserEmail] = useState("");
  const [phoneIsExistingUser, setPhoneIsExistingUser] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);

  // General Status States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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
      setPhoneOtpSent(false);
      setPhoneOtp("");
      setResetOtpSent(false);
    }
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

  // ── RESET STATE HELPER ──
  const switchView = (newView) => {
    setAuthView(newView);
    setError("");
    setSuccessMsg("");
    setPhoneOtpSent(false);
    setPhoneOtp("");
    setResetOtpSent(false);
  };

  // ── PHONE OTP FLOW HANDLERS ──
  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (authView === "signup" && signupMethod === "phone" && !fullName.trim()) {
      setError("Please enter your Full Name to create an account.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setSendingOtp(true);
    const res = await sendPhoneOtp(cleanPhone);
    setSendingOtp(false);

    if (res.ok) {
      const isExisting = Boolean(res.data?.is_existing_user);
      setPhoneIsExistingUser(isExisting);
      if (res.data?.name && !fullName) {
        setPhoneUserName(res.data.name);
      }

      if (authView === "signup" && isExisting) {
        setError(`This mobile number (+91 ${cleanPhone}) is already registered with an account. Please log in.`);
        return;
      }

      setPhoneOtpSent(true);
      setResendTimer(30);
      setSuccessMsg(`OTP sent to +91 ${cleanPhone}`);
    } else {
      setError(res.message || "Failed to send OTP code. Please try again or use Email / Google.");
    }
  };

  const handleResendPhoneOtp = async () => {
    if (resendTimer > 0 || sendingOtp) return;
    const cleanPhone = phone.replace(/\D/g, "");
    setError("");
    setSuccessMsg("");
    setSendingOtp(true);
    const res = await resendPhoneOtp(cleanPhone);
    setSendingOtp(false);

    if (res.ok) {
      setResendTimer(30);
      setSuccessMsg("Fresh OTP code sent to your mobile number!");
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

    const userNameToSubmit = (fullName.trim() || phoneUserName.trim());

    // If it's a new customer / not an existing user, Full Name is STRICTLY MANDATORY!
    if (!phoneIsExistingUser && !userNameToSubmit) {
      setError("Please enter your Full Name. Name is mandatory to create your account.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const userEmailToSubmit = phoneUserEmail.trim() || undefined;

    const res = await verifyPhoneOtp({
      phone: cleanPhone,
      otp: cleanOtp,
      name: userNameToSubmit || undefined,
      email: userEmailToSubmit,
    });
    setLoading(false);

    if (res.ok) {
      if (res.is_new_user || authView === "signup" || !phoneIsExistingUser) {
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
    setSuccessMsg("");
  };

  // ── EMAIL LOGIN HANDLER ──
  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setSuccessMsg("");
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

  // ── EMAIL SIGNUP HANDLER ──
  const handleRegisterDirect = async (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in Full Name, Email Address, and Password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        name: fullName.trim(),
        password: password,
      };
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detailMsg = data.detail || "Registration failed. Please try again.";
        if (detailMsg.toLowerCase().includes("already exists") || detailMsg.toLowerCase().includes("already registered")) {
          throw new Error("Email is already exist! An account with this email already exists. Please log in.");
        }
        throw new Error(detailMsg);
      }

      if (data.access_token) {
        await loginWithToken(data.access_token);
      }
      setRegisteredUserData(data.user || { name: fullName, email });
      setRegistrationSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD HANDLERS ──
  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your registered email address.");
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
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send reset code");
      setResetOtpSent(true);
      setSuccessMsg("Password reset verification code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotOtp || !newPassword) {
      setError("Please enter your Email, OTP Code, and New Password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
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
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setSuccessMsg("Password reset successful! Please login with your new password.");
      setAuthView("login");
      setLoginMethod("email");
      setEmail(forgotEmail);
      setPassword("");
      setResetOtpSent(false);
      setForgotOtp("");
      setNewPassword("");
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
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[500px] border border-gray-100 my-auto flex flex-col overflow-hidden animate-scaleUp z-10">
        {/* Top Luxury Accent Stripe */}
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
              VIEW 1: REGISTRATION / LOGIN SUCCESS SCREEN
          ═══════════════════════════════════════════════════ */}
          {registrationSuccess ? (
            <div className="text-center py-3 space-y-4 animate-fadeIn">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-emerald-50 rounded-full border-2 border-emerald-400">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-bounce" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Account Verified &amp; Active
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-900">
                  Welcome to Nari Pehnawa!
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Hello, <span className="font-bold text-[#8B0000]">{registeredUserData?.name || user?.name || fullName || "Valued Shopper"}</span>!
                </p>
              </div>

              {/* User Details Summary Card */}
              <div className="bg-neutral-50 border border-gray-200 rounded-2xl p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-500 border-b border-gray-200/80 pb-2">
                  <span className="font-medium">User Profile</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Active Member
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Name</p>
                    <p className="font-bold truncate">{registeredUserData?.name || user?.name || fullName || "Shopper"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Contact</p>
                    <p className="font-bold truncate">
                      {registeredUserData?.phone || (phone ? `+91 ${phone}` : "") || registeredUserData?.email || email || user?.email || "Registered"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-left text-xs text-amber-950 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Account created &amp; logged in seamlessly!</p>
                  <p className="text-amber-800 mt-0.5 text-[11px]">
                    {pendingCheckout
                      ? "You can now complete your pending order checkout without any interruption."
                      : "Track your orders, save addresses, and earn reward coins on every order."}
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
                VIEW 2: AUTH MODAL (LOGIN / SIGNUP / FORGOT)
            ═══════════════════════════════════════════════════ */
            <>
              {/* Brand Logo & Title */}
              <div className="text-center mb-3">
                <img
                  src="/logo.png"
                  alt="Nari Pehnawa"
                  className="h-10 sm:h-12 w-auto mx-auto mb-2 object-contain"
                />

                {authView === "login" && (
                  <>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-tight">
                      Login to Your Account
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      Welcome back! Login via Mobile OTP or Email
                    </p>
                  </>
                )}

                {authView === "signup" && (
                  <>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-tight">
                      Create New Account
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      Join Nari Pehnawa with your Mobile Number or Email
                    </p>
                  </>
                )}

                {authView === "forgot" && (
                  <>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-tight">
                      Reset Password
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      Enter your registered email to receive a reset code
                    </p>
                  </>
                )}
              </div>

              {loginNotice && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 flex items-start gap-2 shadow-xs">
                  <span className="text-base leading-none">🔐</span>
                  <span className="leading-tight">{loginNotice}</span>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════
                  MODE 1: LOGIN VIEW
              ═══════════════════════════════════════════════════ */}
              {authView === "login" && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Method Switcher Tabs (Mobile OTP vs Email) */}
                  <div className="flex bg-neutral-100 p-1 rounded-2xl text-xs font-bold text-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("phone");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        loginMethod === "phone"
                          ? "bg-white text-[#8B0000] shadow-xs font-black"
                          : "hover:text-gray-900"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Mobile OTP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("email");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        loginMethod === "email"
                          ? "bg-white text-[#8B0000] shadow-xs font-black"
                          : "hover:text-gray-900"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email &amp; Password</span>
                    </button>
                  </div>

                  {/* 1A. Mobile OTP Login */}
                  {loginMethod === "phone" && (
                    <div className="space-y-3">
                      {!phoneOtpSent ? (
                        <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                              Enter Mobile Number
                            </label>
                            <div className="flex rounded-xl border border-gray-300 focus-within:border-[#8B0000] focus-within:ring-2 focus-within:ring-[#8B0000]/20 bg-white overflow-hidden transition">
                              <span className="px-3 py-2.5 bg-neutral-50 text-gray-700 font-bold text-sm flex items-center gap-1.5 border-r border-gray-200 select-none">
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
                                <span>Sending OTP...</span>
                              </>
                            ) : (
                              <>
                                <span>Get Instant OTP</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyPhoneOtp} className="space-y-3 animate-fadeIn">
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

                          {/* Existing vs New User Indicator */}
                          {phoneIsExistingUser ? (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>
                                Welcome back{phoneUserName ? `, ${phoneUserName}` : ""}! Enter the OTP code sent to your phone.
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-semibold flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">New to Nari Pehnawa?</p>
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                  Please enter your Full Name below. Your account will be created automatically upon OTP verification.
                                </p>
                              </div>
                            </div>
                          )}

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

                          {/* If new user, require Name */}
                          {!phoneIsExistingUser && (
                            <div className="space-y-3 pt-1 border-t border-gray-100">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  Your Full Name <span className="text-red-500 font-black">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    required
                                    value={fullName || phoneUserName}
                                    onChange={(e) => {
                                      setFullName(e.target.value);
                                      setPhoneUserName(e.target.value);
                                    }}
                                    placeholder="e.g. Priya Sharma"
                                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                                  />
                                  <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  Email Address (Optional)
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    value={phoneUserEmail}
                                    onChange={(e) => setPhoneUserEmail(e.target.value)}
                                    placeholder="you@example.com (optional)"
                                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                                  />
                                  <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
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
                              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={phoneOtp.length < 4 || (!phoneIsExistingUser && !(fullName.trim() || phoneUserName.trim())) || loading}
                            className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                <span>{phoneIsExistingUser ? "Verifying OTP..." : "Creating Account..."}</span>
                              </>
                            ) : (
                              <>
                                <span>{phoneIsExistingUser ? "Verify & Login" : "Verify & Create Account"}</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* 1B. Email Login */}
                  {loginMethod === "email" && (
                    <form onSubmit={handleEmailLogin} className="space-y-3">
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
                            onClick={() => switchView("forgot")}
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
                            placeholder="Enter your password"
                            required
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
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
                        {loading ? "Logging in..." : "Login with Email"}
                      </button>
                    </form>
                  )}

                  {/* OR Divider & Google Login */}
                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="px-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Or continue with
                    </span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

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
                    <span>Login with Google</span>
                  </button>

                  {/* Switch to Create Account */}
                  <div className="pt-2 text-center border-t border-gray-100 mt-3">
                    <p className="text-xs text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchView("signup")}
                        className="font-bold text-[#8B0000] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Create Account</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════
                  MODE 2: CREATE ACCOUNT / SIGNUP VIEW
              ═══════════════════════════════════════════════════ */}
              {authView === "signup" && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Method Switcher Tabs (Mobile Number vs Email ID) */}
                  <div className="flex bg-neutral-100 p-1 rounded-2xl text-xs font-bold text-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupMethod("phone");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        signupMethod === "phone"
                          ? "bg-white text-[#8B0000] shadow-xs font-black"
                          : "hover:text-gray-900"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Mobile Number</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignupMethod("email");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        signupMethod === "email"
                          ? "bg-white text-[#8B0000] shadow-xs font-black"
                          : "hover:text-gray-900"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email ID</span>
                    </button>
                  </div>

                  {/* 2A. Signup via Mobile OTP */}
                  {signupMethod === "phone" && (
                    <div className="space-y-3">
                      {!phoneOtpSent ? (
                        <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Your Full Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Priya Sharma"
                                required
                                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                              />
                              <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Mobile Number
                            </label>
                            <div className="flex rounded-xl border border-gray-300 focus-within:border-[#8B0000] focus-within:ring-2 focus-within:ring-[#8B0000]/20 bg-white overflow-hidden transition">
                              <span className="px-3 py-2.5 bg-neutral-50 text-gray-700 font-bold text-sm flex items-center gap-1.5 border-r border-gray-200 select-none">
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
                                className="flex-1 px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none tracking-wider"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={phone.length !== 10 || !fullName.trim() || sendingOtp}
                            className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                          >
                            {sendingOtp ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                <span>Sending OTP...</span>
                              </>
                            ) : (
                              <>
                                <span>Get OTP to Register</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyPhoneOtp} className="space-y-3 animate-fadeIn">
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

                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="text-gray-500">Didn't receive code?</span>
                            <button
                              type="button"
                              onClick={handleResendPhoneOtp}
                              disabled={resendTimer > 0 || sendingOtp}
                              className="font-bold text-[#8B0000] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                            >
                              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
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
                                <span>Verifying &amp; Creating Account...</span>
                              </>
                            ) : (
                              <>
                                <span>Verify &amp; Create Account</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* 2B. Signup via Email */}
                  {signupMethod === "email" && (
                    <form onSubmit={handleRegisterDirect} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Priya Sharma"
                            required
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                          />
                          <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

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
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Set Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create password (min 6 chars)"
                            required
                            minLength={6}
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
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
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* OR Divider & Google Login */}
                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="px-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Or continue with
                    </span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

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
                    <span>Sign up with Google</span>
                  </button>

                  {/* Switch to Login */}
                  <div className="pt-2 text-center border-t border-gray-100 mt-3">
                    <p className="text-xs text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchView("login")}
                        className="font-bold text-[#8B0000] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Login</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════
                  MODE 3: FORGOT PASSWORD VIEW
              ═══════════════════════════════════════════════════ */}
              {authView === "forgot" && (
                <div className="space-y-3.5 animate-fadeIn">
                  {!resetOtpSent ? (
                    <form onSubmit={handleSendResetOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#8B0000]"
                          />
                          <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={sendingOtp || !forgotEmail}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sendingOtp ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          6-Digit Email Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          required
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-center font-mono font-bold tracking-widest text-sm text-gray-900"
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
                          placeholder="Enter new password (min 6 chars)"
                          required
                          minLength={6}
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || forgotOtp.length < 4 || newPassword.length < 6}
                        className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? "Resetting..." : "Reset Password & Login"}
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchView("login")}
                      className="text-xs font-bold text-[#8B0000] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Notifications (Errors / Success) */}
              {error && (
                <div className="text-xs mt-3 font-semibold p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 flex flex-col items-center justify-center gap-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-center">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>

                  {/* If user tries to create an account that already exists */}
                  {(error.toLowerCase().includes("already exist") || error.toLowerCase().includes("already registered")) && (
                    <button
                      type="button"
                      onClick={() => {
                        switchView("login");
                        if (signupMethod === "email") setLoginMethod("email");
                        if (signupMethod === "phone") setLoginMethod("phone");
                      }}
                      className="mt-1 px-4 py-1.5 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Switch to Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* If user tries to login with an account that doesn't exist */}
                  {(error.toLowerCase().includes("no account found") || error.toLowerCase().includes("user not found") || error.toLowerCase().includes("create an account")) && (
                    <button
                      type="button"
                      onClick={() => {
                        switchView("signup");
                        if (loginMethod === "email") setSignupMethod("email");
                        if (loginMethod === "phone") setSignupMethod("phone");
                      }}
                      className="mt-1 px-4 py-1.5 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create New Account</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {successMsg && !error && (
                <div className="text-xs mt-3 font-semibold p-2.5 rounded-xl text-center bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{successMsg}</span>
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
