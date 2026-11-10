import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global 401 Unauthorized Interceptor:
// If any session token is rejected (e.g. password changed on backend),
// immediately clear auth storage, broadcast event, and refresh to login.
if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (response && response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
        // Do not intercept standard login attempts where 401 means "wrong credentials"
        const isLoginAttempt = url.includes("/auth/login") || url.includes("/seller/login") || url.includes("/otp/verify");
        const hadAuthToken = localStorage.getItem("neel_token") || localStorage.getItem("token") || localStorage.getItem("np_seller_token");

        if (!isLoginAttempt && hadAuthToken) {
          console.warn("401 Unauthorized detected on authenticated request:", url, "— Session revoked or password changed.");
          localStorage.removeItem("neel_token");
          localStorage.removeItem("token");
          localStorage.removeItem("neel_admin_user");
          localStorage.removeItem("np_seller_token");
          sessionStorage.setItem("np_auth_notice", "Your password has been changed or session expired. Please log in again.");
          window.dispatchEvent(new CustomEvent("np_auth_session_expired"));

          const pathname = window.location.pathname;
          if (pathname.startsWith("/admin") || pathname.startsWith("/seller") || pathname.startsWith("/user")) {
            // Force clean reload directly to login
            window.location.href = "/?login=true&msg=password_changed";
          }
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
