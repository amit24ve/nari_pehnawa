import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || localStorage.getItem("np_seller_token");
            if (!token) return null;

            // 1. Check verified admin user
            const adminRaw = localStorage.getItem("neel_admin_user");
            if (adminRaw) {
                const parsed = JSON.parse(adminRaw);
                if ((parsed.role === "admin" || parsed.role === "super_admin") && parsed.is_admin === true) {
                    return parsed;
                }
            }

            // 2. Check seller user
            const sellerRaw = localStorage.getItem("np_seller_user");
            if (sellerRaw) {
                const parsed = JSON.parse(sellerRaw);
                if (parsed.role === "seller" || parsed.is_seller) {
                    return parsed;
                }
            }

            // 3. Check regular customer user
            const userRaw = localStorage.getItem("neel_user") || localStorage.getItem("user");
            if (userRaw) {
                const parsed = JSON.parse(userRaw);
                return { ...parsed, role: parsed.role || "customer", is_admin: false };
            }

            // Legacy fallback: if stored in neel_admin_user but not real admin
            if (adminRaw) {
                const parsed = JSON.parse(adminRaw);
                if (parsed.role !== "admin" || !parsed.is_admin) {
                    return { ...parsed, role: "customer", is_admin: false };
                }
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
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token") || localStorage.getItem("np_seller_token");
            if (!token) return;

            const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
            fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.status === 401) {
                    console.warn("Session revoked by backend (password changed). Clearing auth.");
                    localStorage.removeItem("neel_admin_user");
                    localStorage.removeItem("neel_user");
                    localStorage.removeItem("user");
                    localStorage.removeItem("neel_token");
                    localStorage.removeItem("token");
                    localStorage.removeItem("np_seller_token");
                    localStorage.removeItem("np_seller_user");
                    setUser(null);

                    const pathname = window.location.pathname;
                    if (pathname.startsWith("/admin") || pathname.startsWith("/seller") || pathname.startsWith("/user")) {
                        window.location.href = "/?login=true&msg=password_changed";
                    } else {
                        openLoginModal("🔒 Your password has been changed. Please log in with your new password to continue.");
                    }
                } else if (res.ok) {
                    res.json().then(resData => {
                        const profile = resData.user || resData;
                        const isSellerAcc = profile.role === "seller" || profile.is_seller;
                        const isAdminAcc = (profile.role === "admin" || profile.role === "super_admin") && (profile.is_admin === true || resData.is_admin === true);

                        if (isSellerAcc) {
                            const sellerObj = {
                                id: profile.id,
                                email: profile.email || "",
                                name: profile.name || profile.shop_name || "Seller",
                                role: "seller",
                                is_seller: true,
                                shop_name: profile.shop_name || "",
                            };
                            localStorage.setItem("np_seller_token", token);
                            localStorage.setItem("np_seller_user", JSON.stringify(sellerObj));
                            localStorage.removeItem("neel_admin_user");
                            setUser(sellerObj);
                            return;
                        }

                        if (isAdminAcc) {
                            const adminObj = {
                                id: profile.id,
                                email: profile.email || "",
                                name: profile.name || "Admin",
                                role: "admin",
                                is_admin: true,
                            };
                            localStorage.setItem("neel_admin_user", JSON.stringify(adminObj));
                            localStorage.setItem("neel_user", JSON.stringify(adminObj));
                            setUser(adminObj);
                            return;
                        }

                        // Regular Customer: purge admin key, store purely as customer
                        localStorage.removeItem("neel_admin_user");
                        const u = {
                            id: profile.id,
                            email: profile.email || "",
                            name: profile.name || "User",
                            phone: profile.phone || "",
                            role: "customer",
                            is_admin: false,
                            age: profile.age,
                            bio: profile.bio || "",
                            coins_balance: profile.coins_balance || 0,
                            orders_count: profile.orders_count || 0
                        };
                        localStorage.setItem("neel_user", JSON.stringify(u));
                        localStorage.setItem("user", JSON.stringify(u));
                        setUser(u);
                    });
                }
            }).catch(err => {
                console.warn("Session check offline or error:", err);
            });
        };

        validateSession();
        window.addEventListener("focus", validateSession);
        const intervalId = setInterval(validateSession, 15000);

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
            if (updated.role === "admin" && updated.is_admin === true) {
                localStorage.setItem("neel_admin_user", JSON.stringify(updated));
            } else {
                localStorage.removeItem("neel_admin_user");
                localStorage.setItem("neel_user", JSON.stringify(updated));
                localStorage.setItem("user", JSON.stringify(updated));
            }
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

            if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data.token) {
                const res = await loginWithToken(event.data.token);
                if (res.ok) {
                    closeLoginModal();
                    if (pendingCheckout) {
                        if (pendingCheckout.type === "buy_now" && pendingCheckout.item?.productUrl) {
                            navigate(pendingCheckout.item.productUrl, { replace: true });
                            return;
                        }
                        if (pendingCheckout.type === "cart") {
                            navigate("/cart", { replace: true });
                            return;
                        }
                    }
                    if (res.is_admin && res.user && res.user.role === "admin") {
                        window.location.href = "/admin/dashboard";
                    }
                }
            } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
                openLoginModal(event.data.error || "Google sign-in was cancelled or failed.");
            }
        };

        const handleStorage = (e) => {
            if (e.key === "np_google_auth_token" && e.newValue) {
                localStorage.removeItem("np_google_auth_token");
                loginWithToken(e.newValue).then((res) => {
                    if (res.ok) {
                        closeLoginModal();
                        if (res.is_admin && res.user && res.user.role === "admin") {
                            window.location.href = "/admin/dashboard";
                        }
                    }
                });
            }
        };

        window.addEventListener("message", handleMessage);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("message", handleMessage);
            window.removeEventListener("storage", handleStorage);
        };
    }, [pendingCheckout, navigate]);

    const login = async (email, password) => {
        const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                return {
                    ok: false,
                    message: errData.detail || "Invalid email or password",
                };
            }

            const data = await res.json();
            const token = data.access_token;
            const u = data.user;
            if (token && u) {
                const isSellerAcc = Boolean(
                    data.role === "seller" || 
                    data.is_seller || 
                    u.role === "seller" || 
                    u.is_seller ||
                    data.redirect_url?.includes("seller")
                );
                const isAdminAcc = Boolean(
                    (u.role === "admin" || u.role === "super_admin") &&
                    u.is_admin === true &&
                    data.is_admin === true
                );

                if (isSellerAcc) {
                    const sellerObj = {
                        id: u.id || (data.seller && data.seller.id),
                        email: u.email || (data.seller && data.seller.email) || "",
                        name: (data.seller && data.seller.name) || u.name || "Seller",
                        role: "seller",
                        is_seller: true,
                        shop_name: (data.seller && data.seller.shop_name) || "",
                    };
                    localStorage.setItem("np_seller_token", token);
                    localStorage.setItem("np_seller_user", JSON.stringify(data.seller || sellerObj));
                    localStorage.removeItem("neel_admin_user");
                    setUser(sellerObj);
                    window.dispatchEvent(new CustomEvent("np_seller_token_set"));
                    window.location.href = "/seller/dashboard";
                    return { ok: true, user: u, is_seller: true, seller: data.seller || sellerObj, redirect_url: "/seller/dashboard" };
                }

                if (isAdminAcc) {
                    localStorage.setItem("neel_token", token);
                    localStorage.setItem("token", token);
                    localStorage.setItem("neel_admin_user", JSON.stringify(u));
                    localStorage.setItem("neel_user", JSON.stringify(u));
                    setUser(u);
                    window.location.href = "/admin/dashboard";
                    return { ok: true, user: u, is_admin: true, redirect_url: "/admin/dashboard" };
                }

                // Regular Customer: purge admin key
                localStorage.removeItem("neel_admin_user");
                localStorage.setItem("neel_token", token);
                localStorage.setItem("token", token);
                const custUser = { ...u, role: "customer", is_admin: false };
                localStorage.setItem("neel_user", JSON.stringify(custUser));
                localStorage.setItem("user", JSON.stringify(custUser));
                setUser(custUser);
                return { ok: true, user: custUser, is_admin: false };
            }

            return { ok: false, message: "Invalid response from server" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const loginWithToken = async (token) => {
        const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                return { ok: false, message: "Could not load your profile" };
            }

            const resData = await res.json();
            const profile = resData.user || resData;
            const isSellerAccount = Boolean(profile.role === "seller" || profile.is_seller);
            const isAdminAccount = Boolean(
                (profile.role === "admin" || profile.role === "super_admin") &&
                (profile.is_admin === true || resData.is_admin === true)
            );

            if (isSellerAccount) {
                const sellerObj = {
                    id: profile.id,
                    email: profile.email || "",
                    name: profile.name || profile.shop_name || "Seller",
                    role: "seller",
                    is_seller: true,
                    shop_name: profile.shop_name || "",
                };
                localStorage.setItem("np_seller_token", token);
                localStorage.setItem("np_seller_user", JSON.stringify(sellerObj));
                localStorage.removeItem("neel_admin_user");
                setUser(sellerObj);
                window.dispatchEvent(new CustomEvent("np_seller_token_set"));
                window.location.href = "/seller/dashboard";
                return { ok: true, user: sellerObj, is_seller: true, redirect_url: "/seller/dashboard" };
            }

            if (isAdminAccount) {
                const adminObj = {
                    id: profile.id,
                    email: profile.email || "",
                    name: profile.name || "Admin",
                    role: "admin",
                    is_admin: true,
                };
                localStorage.setItem("neel_token", token);
                localStorage.setItem("token", token);
                localStorage.setItem("neel_admin_user", JSON.stringify(adminObj));
                localStorage.setItem("neel_user", JSON.stringify(adminObj));
                setUser(adminObj);
                window.location.href = "/admin/dashboard";
                return { ok: true, user: adminObj, is_admin: true, redirect_url: "/admin/dashboard" };
            }

            // Customer: purge admin key
            localStorage.removeItem("neel_admin_user");
            localStorage.setItem("neel_token", token);
            localStorage.setItem("token", token);
            const custUser = {
                id: profile.id,
                email: profile.email || "",
                name: profile.name || "User",
                phone: profile.phone || "",
                role: "customer",
                is_admin: false,
                avatar: profile.avatar || "",
                coins_balance: profile.coins_balance || 0,
                orders_count: profile.orders_count || 0
            };
            localStorage.setItem("neel_user", JSON.stringify(custUser));
            localStorage.setItem("user", JSON.stringify(custUser));
            setUser(custUser);
            return { ok: true, user: custUser, is_admin: false };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const sendPhoneOtp = async (phone) => {
        const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
        try {
            const res = await fetch(`${API_URL}/auth/phone/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (res.ok) {
                return {
                    ok: true,
                    message: data.message || "OTP code sent to your phone",
                    is_existing_user: data.is_existing_user ?? true,
                    user_name: data.name || "",
                };
            }
            return { ok: false, message: data.detail || "Failed to send SMS code" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const verifyPhoneOtp = async (phone, otp, name = null) => {
        const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
        try {
            const body = { phone, otp };
            if (name && name.trim()) body.name = name.trim();

            const res = await fetch(`${API_URL}/auth/phone/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                return { ok: false, message: data.detail || "Invalid verification code" };
            }

            const token = data.access_token;
            const u = data.user;
            if (token && u) {
                const isSellerAccount = Boolean(
                    data.role === "seller" || 
                    data.is_seller || 
                    u.role === "seller" || 
                    u.is_seller ||
                    data.redirect_url?.includes("seller")
                );
                const isAdminAccount = Boolean(
                    (u.role === "admin" || u.role === "super_admin") &&
                    u.is_admin === true &&
                    data.is_admin === true
                );

                if (isSellerAccount) {
                    const sellerObj = {
                        id: u.id,
                        email: u.email || (data.seller && data.seller.email) || "",
                        name: (data.seller && data.seller.name) || u.name || "Seller",
                        role: "seller",
                        is_seller: true,
                        shop_name: (data.seller && data.seller.shop_name) || "",
                    };
                    localStorage.setItem("np_seller_token", token);
                    localStorage.setItem("np_seller_user", JSON.stringify(data.seller || sellerObj));
                    localStorage.removeItem("neel_admin_user");
                    setUser(sellerObj);
                    window.dispatchEvent(new CustomEvent("np_seller_token_set"));
                    window.location.href = "/seller/dashboard";
                    return { ok: true, user: u, is_seller: true, seller: data.seller || sellerObj, redirect_url: "/seller/dashboard", is_new_user: data.is_new_user };
                }

                if (isAdminAccount) {
                    localStorage.setItem("neel_token", token);
                    localStorage.setItem("token", token);
                    localStorage.setItem("neel_admin_user", JSON.stringify(u));
                    localStorage.setItem("neel_user", JSON.stringify(u));
                    setUser(u);
                    window.location.href = "/admin/dashboard";
                    return { ok: true, user: u, is_admin: true, redirect_url: "/admin/dashboard", is_new_user: data.is_new_user };
                }

                // Customer: purge admin key
                localStorage.removeItem("neel_admin_user");
                localStorage.setItem("neel_token", token);
                localStorage.setItem("token", token);
                const custUser = { ...u, role: "customer", is_admin: false };
                localStorage.setItem("neel_user", JSON.stringify(custUser));
                localStorage.setItem("user", JSON.stringify(custUser));
                setUser(custUser);
                return { ok: true, user: custUser, is_new_user: data.is_new_user, is_admin: false };
            }

            return { ok: false, message: "Invalid server response" };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    };

    const logout = async () => {
        const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
        const token = localStorage.getItem("neel_token") || localStorage.getItem("np_seller_token");

        try {
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
            localStorage.removeItem("neel_admin_user");
            localStorage.removeItem("neel_user");
            localStorage.removeItem("user");
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
                isLoginModalOpen,
                loginNotice,
                loginModalMode,
                pendingCheckout,
                setPendingCheckout,
                clearPendingCheckout,
                openLoginModal,
                closeLoginModal,
                login,
                loginWithToken,
                sendPhoneOtp,
                verifyPhoneOtp,
                logout,
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
