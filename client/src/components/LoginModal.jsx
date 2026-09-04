import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen: propsIsOpen, onClose: propsOnClose }) => {
  const {
    login,
    user,
    isLoginModalOpen,
    closeLoginModal,
    loginNotice,
    pendingCheckout,
    loginModalMode,
  } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(loginModalMode === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(loginModalMode === "forgot");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isLoginModalOpen;
  const handleClose = propsOnClose || closeLoginModal;

  // Handle post-login actions (resume checkout or navigate)
  React.useEffect(() => {
    if (user && isOpen) {
      handleClose();
      // If there is a pending checkout item/cart, don't redirect to user dashboard so checkout modal can open!
      if (!pendingCheckout && (user.role === "admin" || user.is_admin)) {
        navigate("/admin/dashboard");
      }
    }
  }, [user, isOpen, pendingCheckout, navigate, handleClose]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email || !fullName || !password) {
      setError("Please fill in Name, Email and Password first.");
      return;
    }
    setError("");
    setSendingOtp(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP code");
      }
      setOtpSent(true);
      setError("Verification code sent! Please check your email inbox.");
    } catch (err) {
      setError(err.message || "Failed to send OTP code");
    } finally {
      setSendingOtp(false);
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
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP code");
      }
      setResetOtpSent(true);
      setError("Password reset verification code sent to your email!");
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !otp || !newPassword) {
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
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }
      setError("Password reset successful! You can now log in.");
      setIsForgotPassword(false);
      setResetOtpSent(false);
      setOtp("");
      setNewPassword("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleForgotPassword = (val) => {
    setIsForgotPassword(val);
    setResetOtpSent(false);
    setError("");
    setOtp("");
    setNewPassword("");
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-xl border border-gray-200 my-auto flex flex-col overflow-hidden animate-fadeIn">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B0000] via-[#d4af37] to-[#8B0000] rounded-t-3xl"></div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all duration-300 z-20 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-800" />
        </button>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto max-h-[92vh] flex-1">
          {/* Header */}
          <div className="text-center mb-3.5 sm:mb-4">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <img
                src="/logo.png"
                alt="Nari Pehnawa"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
            <h2
              className="text-lg sm:text-2xl font-serif font-bold tracking-tight mb-0.5"
              style={{ color: "#8B0000" }}
            >
              {isForgotPassword
                ? "Reset Password"
                : isSignUp
                ? "Create Account"
                : "Welcome Back"}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              {isForgotPassword
                ? (resetOtpSent ? "Enter OTP & new password" : "Verify your email to reset password")
                : isSignUp
                ? (otpSent ? "Enter OTP sent to your email" : "Sign up with Email Verification")
                : "Sign in to your account"}
            </p>
          </div>

          {loginNotice && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 flex items-start gap-2 shadow-sm">
              <span className="text-base leading-none">🔐</span>
              <span className="leading-tight">{loginNotice}</span>
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-3 sm:space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");

              if (isForgotPassword) {
                if (resetOtpSent) {
                  await handleResetPassword();
                } else {
                  await handleSendResetOtp();
                }
                return;
              }

              if (isSignUp && !otpSent) {
                await handleSendOtp();
                return;
              }

              setLoading(true);
              const API_URL =
                import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

              try {
                if (isSignUp) {
                  // Sign up flow with OTP
                  if (!otp.trim()) {
                    setError("Please enter the 6-digit OTP code.");
                    setLoading(false);
                    return;
                  }

                  const payload = { email, name: fullName, password, otp: otp.trim() };
                  if (age !== "") {
                    const ageNum = parseInt(age, 10);
                    if (!Number.isNaN(ageNum)) payload.age = ageNum;
                  }

                  const res = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    setError(d.detail || "Sign up failed");
                    setLoading(false);
                    return;
                  }
                  // After successful signup, redirect to login page
                  setLoading(false);
                  setIsSignUp(false);
                  setOtpSent(false);
                  setOtp("");
                  setFullName("");
                  setAge("");
                  setPassword("");
                  setError("Account created & email verified successfully! Please log in.");
                } else {
                  // Sign in flow
                  const loginRes = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: email,
                      password: password,
                    }),
                  });
                  if (loginRes.ok) {
                    const data = await loginRes.json();
                    localStorage.setItem("token", data.access_token);
                    await login({ email, password }); // Update auth context
                    setLoading(false);
                    onClose();

                    // Redirect based on user role
                    if (data.user && data.user.role === "admin") {
                      navigate("/admin/dashboard");
                    } else {
                      navigate("/user/dashboard");
                    }
                  } else {
                    const d = await loginRes.json().catch(() => ({}));
                    setError(d.detail || "Login failed");
                    setLoading(false);
                  }
                }
              } catch (err) {
                setError(err.message || "Something went wrong");
                setLoading(false);
              }
            }}
          >
            {isSignUp && (
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold mb-1.5"
                  style={{ color: "#8B0000" }}
                >
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs sm:text-sm font-semibold mb-1.5"
                style={{ color: "#8B0000" }}
              >
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                disabled={(isForgotPassword && resetOtpSent) || (isSignUp && otpSent)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold mb-1.5"
                  style={{ color: "#8B0000" }}
                >
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-all"
                />
              </div>
            )}

            {isSignUp && otpSent && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    className="block text-xs sm:text-sm font-bold"
                    style={{ color: "#8B0000" }}
                  >
                    Email OTP Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-xs text-[#8B0000] underline font-semibold hover:text-red-800"
                  >
                    {sendingOtp ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit OTP code"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-yellow-50 border-2 border-[#8B0000] rounded-lg text-lg text-center font-bold tracking-widest text-gray-900 focus:outline-none transition-all"
                />
              </div>
            )}

            {isForgotPassword && resetOtpSent && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      className="block text-xs sm:text-sm font-bold"
                      style={{ color: "#8B0000" }}
                    >
                      Reset OTP Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      disabled={sendingOtp}
                      className="text-xs text-[#8B0000] underline font-semibold hover:text-red-800"
                    >
                      {sendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit reset code"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-yellow-50 border-2 border-[#8B0000] rounded-lg text-lg text-center font-bold tracking-widest text-gray-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs sm:text-sm font-semibold mb-1.5"
                    style={{ color: "#8B0000" }}
                  >
                    New Password
                  </label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    required
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent transition-all"
                  />
                </div>
              </>
            )}

            {!isSignUp && !isForgotPassword && (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 bg-white text-[#8B0000] focus:ring-[#8B0000]"
                  />
                  <span className="text-xs sm:text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleForgotPassword(true)}
                  className="text-[#8B0000] hover:text-[#6B0000] transition-colors text-xs sm:text-sm font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || sendingOtp}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white font-bold py-2.5 rounded-xl transition-all duration-300 shadow-md text-sm sm:text-base disabled:opacity-60"
            >
              {sendingOtp
                ? "Sending OTP to Email..."
                : loading
                ? "Please wait..."
                : isForgotPassword
                ? (resetOtpSent ? "Reset Password" : "Send Reset OTP")
                : isSignUp
                ? (otpSent ? "Verify OTP & Create Account" : "Send Email OTP Code")
                : "Sign In"}
            </button>
            {error && (
              <div
                className={`text-xs sm:text-sm mt-1 font-medium ${
                  error.includes("successfully") || error.includes("sent") || error.includes("successful")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {error}
              </div>
            )}
          </form>

          {isForgotPassword ? (
            <div className="text-center mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => handleToggleForgotPassword(false)}
                className="text-[#8B0000] hover:text-[#6B0000] font-semibold transition-colors text-xs sm:text-sm"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Divider */}
              <div className="flex items-center my-3 sm:my-3.5">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-gray-400 text-xs">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Social Login */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const API_URL =
                      import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
                    window.location.href = `${API_URL}/auth/google/login`;
                  }}
                  className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl transition-all duration-300 shadow-sm font-semibold text-xs sm:text-sm"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Toggle Sign Up/Sign In */}
              <div className="text-center mt-3 sm:mt-3.5">
                <p className="text-gray-500 text-xs sm:text-sm">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#8B0000] hover:text-[#6B0000] font-semibold transition-colors"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
