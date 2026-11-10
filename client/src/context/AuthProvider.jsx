import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("neel_admin_user");
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            if (stored && token) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to parse stored user", e);
        }
        return null;
    });
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginNotice, setLoginNotice] = useState("");
    const [loginModalMode, setLoginModalMode] = useState("login"); // "login" | "signup" | "forgot"
    const [pendingCheckout, setPendingCheckoutState] = useState(() => {
        try {
            const saved = localStorage.getItem("np_pending_checkout");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const navigate = useNavigate();

    const setPendingCheckout = (intent) => {
        setPendingCheckoutState(intent);
        if (intent) {
            localStorage.setItem("np_pending_checkout", JSON.stringify(intent));
        } else {
            localStorage.removeItem("np_pending_checkout");
        }
    };

    const clearPendingCheckout = () => {
        setPendingCheckoutState(null);
        localStorage.removeItem("np_pending_checkout");
    };

    const openLoginModal = (notice = "", pendingIntent = null, initialMode = "login") => {
        if (notice) setLoginNotice(notice);
        if (pendingIntent) setPendingCheckout(pendingIntent);
        setLoginModalMode(initialMode);
        setIsLoginModalOpen(true);
    };

    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
        setLoginNotice("");
        setLoginModalMode("login");
    };

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const msgParam = params.get("msg");
            const storedNotice = sessionStorage.getItem("np_auth_notice");
            if (params.get("login") || msgParam || storedNotice) {
                let notice = "";
                if (params.get("login") === "seller") {
                    notice = "Please sign in to access Seller Dashboard.";
                } else if (msgParam === "password_changed" || storedNotice) {
                    notice = "🔒 Your password has been changed. Please log in with your new password to continue.";
                    sessionStorage.removeItem("np_auth_notice");
                }
                openLoginModal(notice);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (_) {}
    }, []);

    // Session validation, periodic heartbeat & active focus check
    useEffect(() => {
        const validateSession = () => {
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            if (!token) return;

            const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
            fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.status === 401) {
                    // Password was changed or token invalidated on backend
                    console.warn("Session revoked by backend (password changed). Clearing auth.");
                    localStorage.removeItem("neel_admin_user");
                    localStorage.removeItem("neel_token");
                    localStorage.removeItem("token");
                    localStorage.removeItem("np_seller_token");
                    setUser(null);

                    const pathname = window.location.pathname;
                    if (pathname.startsWith("/admin") || pathname.startsWith("/seller") || pathname.startsWith("/user")) {
                        window.location.href = "/?login=true&msg=password_changed";
                    } else {
                        openLoginModal("🔒 Your password has been changed. Please log in with your new password to continue.");
                    }
                } else if (res.ok) {
                    res.json().then(profile => {
                        const u = {
                            id: profile.id,
                            email: profile.email || "",
                            name: profile.name || "User",
                            phone: profile.phone || "",
                            role: profile.role || "customer",
                            is_admin: profile.is_admin || false,
                            age: profile.age,
                            bio: profile.bio || "",
                            coins_balance: profile.coins_balance || 0,
                            orders_count: profile.orders_count || 0
                        };
                        localStorage.setItem("neel_admin_user", JSON.stringify(u));
                        setUser(u);
                    });
                }
            }).catch(err => {
                console.warn("Session check offline or error:", err);
            });
        };

        // Initial check on mount
        validateSession();

        // Check on window focus (when switching back to tab)
        window.addEventListener("focus", validateSession);

        // Periodic heartbeat every 15 seconds to ensure immediate logout across all devices/tabs
        const intervalId = setInterval(validateSession, 15000);

        // Listen for global session expired event
        const handleSessionExpired = () => {
            setUser(null);
        };
        window.addEventListener("np_auth_session_expired", handleSessionExpired);

        return () => {
            window.removeEventListener("focus", validateSession);
            clearInterval(intervalId);
            window.removeEventListener("np_auth_session_expired", handleSessionExpired);
        };
    }, []);

    const updateUserProfile = (updatedData) => {
        setUser(prev => {
            const updated = { ...prev, ...updatedData };
            localStorage.setItem("neel_admin_user", JSON.stringify(updated));
            return updated;
        });
    };


    // Listen for Google Auth popup response & cross-tab storage synchronization
    useEffect(() => {
        const allowedOrigins = [
            window.location.origin,
            "https://naripehnawa.com",
            "https://www.naripehnawa.com",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:2300"
        ];

        const handleMessage = async (event) => {
            if (!allowedOrigins.includes(event.origin)) return;
            if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data?.token) {
                await loginWithToken(event.data.token);
                closeLoginModal();
            }
        };

        const handleStorage = async (event) => {
            if (event.key === "np_google_auth_token" && event.newValue) {
                const token = event.newValue;
                localStorage.removeItem("np_google_auth_token");
                await loginWithToken(token);
                closeLoginModal();
            }
        };

        window.addEventListener("message", handleMessage);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("message", handleMessage);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const login = async ({ email, password }) => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return { ok: false, message: data.detail || "Login failed" };
            }

            const data = await res.json();
            const token = data.access_token;
            const u = data.user;
            if (token && u) {
                localStorage.setItem("neel_token", token);
                localStorage.setItem("token", token);
                localStorage.setItem("neel_admin_user", JSON.stringify(u));
                setUser(u);

                // If seller account detected, save seller session and redirect directly to /seller/dashboard
                if (data.role === "seller" || data.is_seller || u.role === "seller") {
                    localStorage.setItem("np_seller_token", token);
                    localStorage.setItem("np_seller_user", JSON.stringify(data.seller || u));
                    navigate("/seller/dashboard");
                    return { ok: true, user: u, is_seller: true, seller: data.seller || u };
                }

                // Redirect admin users to admin dashboard
                if (u.role === "admin" || u.is_admin) {
                    navigate("/admin/dashboard");
                }

                return { ok: true, user: u };
            }

            return { ok: false, message: "Invalid response from server" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    /**
     * Used by the Google sign-in callback: we already have a valid JWT
     * (issued by /auth/google/callback), so just store it and fetch the
     * user's profile with it to populate the auth context.
     */
    const loginWithToken = async (token) => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                return { ok: false, message: "Could not load your profile" };
            }

            const profile = await res.json();
            const u = {
                id: profile.id,
                email: profile.email || "",
                name: profile.name || "User",
                phone: profile.phone || "",
                role: profile.role || "customer",
                is_admin: profile.is_admin || false,
                avatar: profile.avatar || "",
                coins_balance: profile.coins_balance || 0,
                orders_count: profile.orders_count || 0
            };

            localStorage.setItem("neel_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("neel_admin_user", JSON.stringify(u));
            setUser(u);

            const isSellerAccount = u.role === "seller" || profile.role === "seller" || profile.is_seller;
            if (isSellerAccount) {
                localStorage.setItem("np_seller_token", token);
                localStorage.setItem("np_seller_user", JSON.stringify(profile));
                navigate("/seller/dashboard");
                return { ok: true, user: u, is_seller: true };
            }

            if (u.role === "admin" || u.is_admin) {
                navigate("/admin/dashboard");
                return { ok: true, user: u, is_admin: true };
            }

            return { ok: true, user: u };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const sendPhoneOtp = async (phone) => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/auth/phone/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return { ok: false, message: data.detail || "Failed to send OTP" };
            }
            return { ok: true, data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const resendPhoneOtp = async (phone) => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/auth/phone/resend-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return { ok: false, message: data.detail || "Failed to resend OTP" };
            }
            return { ok: true, data };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const verifyPhoneOtp = async ({ phone, otp, name, email }) => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/auth/phone/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp, name, email }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return { ok: false, message: data.detail || "Failed to verify OTP" };
            }

            const token = data.access_token;
            const u = data.user;
            if (token && u) {
                localStorage.setItem("neel_token", token);
                localStorage.setItem("token", token);
                localStorage.setItem("neel_admin_user", JSON.stringify(u));
                setUser(u);

            const isSellerAccount = data.role === "seller" || data.is_seller || u.role === "seller" || u.is_seller;
            if (isSellerAccount) {
                localStorage.setItem("np_seller_token", token);
                localStorage.setItem("np_seller_user", JSON.stringify(data.seller || u));
                navigate("/seller/dashboard");
                return { ok: true, user: u, is_seller: true, seller: data.seller || u, is_new_user: data.is_new_user };
            }

            if (u.role === "admin" || u.is_admin) {
                navigate("/admin/dashboard");
                return { ok: true, user: u, is_admin: true, is_new_user: data.is_new_user };
            }

            return { ok: true, user: u, is_new_user: data.is_new_user };
        }

        return { ok: false, message: "Invalid server response" };
    } catch (err) {
        return { ok: false, message: err.message };
    }
};

const logout = async () => {
    const API_URL =
        import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
    const token = localStorage.getItem("neel_token") || localStorage.getItem("np_seller_token");

    try {
        // Call logout API
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
        }
    } catch (err) {
        console.error("Logout API error:", err);
    } finally {
        // Always clear all auth storage and redirect directly to /
        localStorage.removeItem("neel_admin_user");
        localStorage.removeItem("neel_token");
        localStorage.removeItem("token");
        localStorage.removeItem("np_seller_token");
        localStorage.removeItem("np_seller_user");
        clearPendingCheckout();
        setUser(null);
        window.location.href = "/";
    }
};

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                loginWithToken,
                sendPhoneOtp,
                verifyPhoneOtp,
                resendPhoneOtp,
                logout,
                isLoginModalOpen,
                loginNotice,
                pendingCheckout,
                loginModalMode,
                openLoginModal,
                closeLoginModal,
                setPendingCheckout,
                clearPendingCheckout,
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
