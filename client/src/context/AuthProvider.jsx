import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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
        const stored = localStorage.getItem("neel_admin_user");
        let token = localStorage.getItem("neel_token") || localStorage.getItem("token");
        if (token) {
            localStorage.setItem("neel_token", token);
            localStorage.setItem("token", token);
            
            const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
            fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.status === 401) {
                    localStorage.removeItem("neel_admin_user");
                    localStorage.removeItem("neel_token");
                    localStorage.removeItem("token");
                    setUser(null);
                } else if (res.ok) {
                    res.json().then(profile => {
                        const u = {
                            id: profile.id,
                            email: profile.email,
                            name: profile.name,
                            role: profile.role || "customer",
                            orders_count: profile.orders_count || 0
                        };
                        localStorage.setItem("neel_admin_user", JSON.stringify(u));
                        setUser(u);
                    });
                } else {
                    if (stored) setUser(JSON.parse(stored));
                }
            }).catch(err => {
                console.error("Token validation error:", err);
                if (stored) setUser(JSON.parse(stored));
            });
        } else {
            if (stored) setUser(JSON.parse(stored));
        }
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
                email: profile.email,
                name: profile.name,
                role: profile.role || "customer",
                orders_count: profile.orders_count || 0
            };

            localStorage.setItem("neel_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("neel_admin_user", JSON.stringify(u));
            setUser(u);

            return { ok: true, user: u };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const logout = async () => {
        const API_URL =
            import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
        const token = localStorage.getItem("neel_token");

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
            // Always clear local storage and redirect, even if API fails
            localStorage.removeItem("neel_admin_user");
            localStorage.removeItem("neel_token");
            localStorage.removeItem("token");
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
                logout,
                isLoginModalOpen,
                loginNotice,
                pendingCheckout,
                loginModalMode,
                openLoginModal,
                closeLoginModal,
                setPendingCheckout,
                clearPendingCheckout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
