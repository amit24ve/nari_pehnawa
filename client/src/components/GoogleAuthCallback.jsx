import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const ERROR_MESSAGES = {
  google_auth_cancelled: "Google sign-in was cancelled.",
  google_token_exchange_failed: "Could not verify your Google account. Please try again.",
  google_profile_fetch_failed: "Could not read your Google profile. Please try again.",
  google_email_missing: "Your Google account has no email address to sign in with.",
  admin_must_use_password_login: "This account is an admin account — please sign in with your password instead.",
};

/**
 * Lands here after the backend finishes the Google OAuth redirect flow
 * (GET /auth/google/callback). Reads the token (or error) from the URL,
 * logs the user into the app, then redirects to their dashboard.
 */
const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you in…");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setStatus(ERROR_MESSAGES[error] || "Google sign-in failed. Please try again.");
      setTimeout(() => navigate("/", { replace: true }), 2000);
      return;
    }

    if (!token) {
      setStatus("Something went wrong. Redirecting…");
      setTimeout(() => navigate("/", { replace: true }), 1500);
      return;
    }

    loginWithToken(token).then((res) => {
      if (res.ok) {
        setStatus("Success! Resuming your session…");
        const pendingRaw = localStorage.getItem("np_pending_checkout");
        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw);
            if (pending.type === "buy_now" && pending.item?.productUrl) {
              navigate(pending.item.productUrl, { replace: true });
              return;
            }
            if (pending.type === "cart") {
              navigate("/cart", { replace: true });
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
        navigate("/user/dashboard", { replace: true });
      } else {
        setStatus(res.message || "Sign-in failed. Redirecting…");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">{status}</p>
    </div>
  );
};

export default GoogleAuthCallback;
