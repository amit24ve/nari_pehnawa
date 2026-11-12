import React, { useState, useEffect } from "react";
import useSEO from "./hooks/useSEO";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import VisitorTracker from "./components/VisitorTracker";
import CookieConsent from "./components/CookieConsent";
import HeroSection from "./components/HeroSection";
import FestiveEventBanner from "./components/FestiveEventBanner";
import FloatingOfferCard from "./components/FloatingOfferCard";
import Categories from "./components/Categories";
import FeaturedProducts from "./components/FeaturedProducts";
import HomeCategorySections from "./components/HomeCategorySections";
import WatchAndBuy from "./components/WatchAndBuy";
import CelebApprovedLooks from "./components/CelebApprovedLooks";
import WomenOfBunaai from "./components/WomenOfBunaai";
import AsFeaturedOn from "./components/AsFeaturedOn";
import CategoryPage from "./components/CategoryPage";
import ProductPage from "./components/ProductPage";
import Cart from "./components/Cart";
import WishlistPage from "./components/WishlistPage";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import WelcomePopup from "./components/WelcomePopup";
import SellerRegisterModal from "./components/SellerRegisterModal";
import GoogleAuthCallback from "./components/GoogleAuthCallback";
import OwnerPage from "./components/OwnerPage";
import AboutUs from "./components/AboutUs";
import SupportPages from "./components/SupportPages";
import PublicOrderTracking from "./components/PublicOrderTracking";
import "./App.css";
import AIChatbot from "./components/AIChatbot";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import Users from "./admin/Users";
import Products from "./admin/Products";
import Orders from "./admin/Orders";
import AdminCategories from "./admin/Categories";
import Reviews from "./admin/Reviews";
import Settings from "./admin/Settings";
import PaymentHistory from "./admin/PaymentHistory";
import Visitors from "./admin/Visitors";
import HeroBanners from "./admin/HeroBanners";
import Inquiries from "./admin/Inquiries";
import AdminAnnouncementsModal from "./admin/AdminAnnouncementsModal";
import Collaborations from "./admin/Collaborations";
import Sellers from "./admin/Sellers";
import CreatorDashboard from "./components/CreatorDashboard";
import RequireAuth from "./admin/RequireAuth";
import { AuthProvider } from "./context/AuthProvider";
import { WishlistProvider } from "./context/WishlistProvider";
import { CartProvider } from "./context/CartProvider";
import { SellerAuthProvider } from "./seller/SellerAuthContext";
import SellerLayout from "./seller/SellerLayout";
import SellerLogin from "./seller/SellerLogin";
import SellerRegister from "./seller/SellerRegister";
import SellerDashboard from "./seller/SellerDashboard";
import SellerProducts from "./seller/SellerProducts";
import SellerAddProduct from "./seller/SellerAddProduct";
import SellerPackaging from "./seller/SellerPackaging";
import SellerInquiries from "./seller/SellerInquiries";
import SellerProfile from "./seller/SellerProfile";
import SellerOrders from "./seller/SellerOrders";
import SellerInventory from "./seller/SellerInventory";
import SellerFinance from "./seller/SellerFinance";
import SellerReturns from "./seller/SellerReturns";
import SellerReports from "./seller/SellerReports";

// User account (no separate dashboard — pages are reached only via the
// navbar's profile dropdown, rendered inside the normal site layout)
import AccountLayout from "./user/AccountLayout";
import UserProfile from "./user/Profile";
import UserCoins from "./user/CoinsWallet";
import UserOrders from "./user/Orders";
import UserSettings from "./user/Settings";

import InteractiveCampaignBanner from "./components/InteractiveCampaignBanner";

function HomePage() {
    useSEO(
        "Nari Pehnawa | Traditional Ka Tadka | Luxury Women Ethnic Wear & Designer Kurtis",
        "Nari Pehnawa (naripehnawa.com) is India's premier boutique for handcrafted Women's Floral Kurtis, Designer Sleeveless Tops, Festive Outfits & Ethnic Wear. Free Shipping & Fast Delivery."
    );
    return (
        <>
            <HeroSection />
            <Categories />
            <FestiveEventBanner />
            <InteractiveCampaignBanner />
            <FeaturedProducts />
            <HomeCategorySections />
            <WatchAndBuy />
            <CelebApprovedLooks />
            <AsFeaturedOn />
        </>
    );
}

// Layout component for regular pages (with Navbar and Footer)
function MainLayout() {
    const location = useLocation();

    useEffect(() => {
        // If a seller session exists, redirect immediately to /seller/dashboard
        const sellerToken = localStorage.getItem("np_seller_token");
        const sellerUser = localStorage.getItem("np_seller_user");
        const adminUser = localStorage.getItem("neel_admin_user");
        let parsedAdmin = null;
        try { parsedAdmin = JSON.parse(adminUser || "{}"); } catch(_) {}
        let parsedSeller = null;
        try { parsedSeller = JSON.parse(sellerUser || "{}"); } catch(_) {}

        const isSellerSession = Boolean(
            sellerToken ||
            parsedSeller?.role === "seller" ||
            parsedSeller?.is_seller ||
            parsedAdmin?.role === "seller" ||
            parsedAdmin?.is_seller
        );

        if (isSellerSession) {
            window.location.replace("/seller/dashboard");
            return;
        }

        // If an admin is logged in and visits customer-only account pages, redirect to admin dashboard
        const isAdminSession = Boolean(parsedAdmin?.role === "admin" || parsedAdmin?.is_admin);
        if (isAdminSession && location.pathname.startsWith("/user")) {
            window.location.replace("/admin/dashboard");
            return;
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
            <Navbar />
            <VisitorTracker />
            <CookieConsent />
            {/* pt: header(80px) + category strip(38px) = 118px */}
            <div className="pt-[118px]">
                <Routes>
                    {/* Home Page */}
                    <Route path="/" element={<HomePage />} />

                    {/* Support Pages */}
                    <Route path="/support/:pageType" element={<SupportPages />} />

                    {/* Cart Page */}
                    <Route path="/cart" element={<Cart />} />

                    {/* Wishlist Page — accessible without login */}
                    <Route path="/wishlist" element={<WishlistPage />} />

                    {/* Product detail page — full page, not a modal */}
                    <Route path="/product/:productId" element={<ProductPage />} />
                    <Route path="/p/:productId" element={<ProductPage />} />

                    {/* "Virtual" filter categories (not real DB categories) */}
                    <Route
                        path="/new-arrivals"
                        element={<CategoryPage categoryName="NEW ARRIVALS" />}
                    />
                    <Route
                        path="/category/sale"
                        element={<CategoryPage categoryName="SALE" />}
                    />

                    {/* Women Fashion — Kurti categories */}
                    <Route
                        path="/category/anarkali-kurtis"
                        element={<CategoryPage categoryName="Anarkali Kurtis" />}
                    />
                    <Route
                        path="/category/straight-kurtis"
                        element={<CategoryPage categoryName="Straight Kurtis" />}
                    />
                    <Route
                        path="/category/aline-kurtis"
                        element={<CategoryPage categoryName="A-Line Kurtis" />}
                    />
                    <Route
                        path="/category/printed-kurtis"
                        element={<CategoryPage categoryName="Printed Kurtis" />}
                    />
                    <Route
                        path="/category/embroidered-kurtis"
                        element={
                            <CategoryPage categoryName="Embroidered Kurtis" />
                        }
                    />
                    <Route
                        path="/category/denim-kurtis"
                        element={<CategoryPage categoryName="Denim Kurtis" />}
                    />
                    <Route
                        path="/category/kaftan-kurtis"
                        element={<CategoryPage categoryName="Kaftan Kurtis" />}
                    />
                    <Route
                        path="/category/chikankari-kurtis"
                        element={
                            <CategoryPage categoryName="Chikankari Kurtis" />
                        }
                    />
                    <Route
                        path="/category/palazzo-set-kurtis"
                        element={
                            <CategoryPage categoryName="Palazzo Set Kurtis" />
                        }
                    />
                    <Route
                        path="/category/angrakha-kurtis"
                        element={<CategoryPage categoryName="Angrakha Kurtis" />}
                    />



                    {/* Dynamic catch-all — handles any category not listed
                        above by fetching its real name/image/tagline from
                        the backend using the URL slug. */}
                    <Route
                        path="/category/:categoryName"
                        element={<CategoryPage />}
                    />
                    <Route
                        path="/order-tracking"
                        element={<PublicOrderTracking />}
                    />
                    <Route
                        path="/order-tracking/:orderId"
                        element={<PublicOrderTracking />}
                    />
                    <Route
                        path="/track-order"
                        element={<PublicOrderTracking />}
                    />
                    <Route
                        path="/track-order/:orderId"
                        element={<PublicOrderTracking />}
                    />

                    {/* My Account (no separate dashboard — reached only via the
                        navbar's profile dropdown, rendered inside this same
                        Navbar/Footer layout) */}
                    <Route path="/user" element={<AccountLayout />}>
                        <Route
                            index
                            element={<Navigate to="profile" replace />}
                        />
                        <Route
                            path="dashboard"
                            element={<Navigate to="/user/profile" replace />}
                        />
                        <Route path="profile" element={<UserProfile />} />
                        <Route path="coins" element={<UserCoins />} />
                        <Route path="orders" element={<UserOrders />} />
                        <Route path="settings" element={<UserSettings />} />
                    </Route>
                </Routes>
            </div>
            <Footer />
            <AIChatbot />
            <FloatingOfferCard />
        </div>
    );
}

const SellerLoginRedirect = () => {
    const isAuth = Boolean(
        typeof window !== "undefined" &&
        (localStorage.getItem("np_seller_token") || localStorage.getItem("neel_token") || localStorage.getItem("token"))
    );
    if (isAuth) {
        return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/?login=seller" replace />;
};

function App() {
    const [appReady, setAppReady] = useState(false);

    return (
        <>
            {!appReady && (
                <LoadingScreen onComplete={() => setAppReady(true)} />
            )}
            <Router>
                <AuthProvider>
                    <SellerAuthProvider>
                        <CartProvider>
                            <WishlistProvider>
                            <WelcomePopup />
                            <SellerRegisterModal />
                            <Routes>
                                {/* Admin Pages (protected) - No Navbar/Footer */}
                                <Route
                                    path="/admin"
                                    element={
                                        <RequireAuth>
                                            <AdminLayout />
                                        </RequireAuth>
                                    }
                                >
                                    <Route index element={<Dashboard />} />
                                    <Route
                                        path="dashboard"
                                        element={<Dashboard />}
                                    />
                                    <Route path="users" element={<Users />} />
                                    <Route
                                        path="products"
                                        element={<Products />}
                                    />
                                    <Route path="orders" element={<Orders />} />
                                    <Route
                                        path="categories"
                                        element={<AdminCategories />}
                                    />
                                    <Route
                                        path="reviews"
                                        element={<Reviews />}
                                    />
                                    <Route
                                        path="payment-history"
                                        element={<PaymentHistory />}
                                    />
                                    <Route
                                        path="settings"
                                        element={<Settings />}
                                    />
                                    <Route
                                        path="visitors"
                                        element={<Visitors />}
                                    />
                                    <Route
                                        path="hero"
                                        element={<HeroBanners />}
                                    />
                                    <Route
                                        path="announcements"
                                        element={<AdminAnnouncementsModal />}
                                    />
                                    <Route
                                        path="inquiries"
                                        element={<Inquiries />}
                                    />
                                    <Route
                                        path="collaborations"
                                        element={<Collaborations />}
                                    />
                                    <Route
                                        path="sellers"
                                        element={<Sellers />}
                                    />
                                </Route>

                                {/* Dedicated Independent Seller Portal - No Separate Seller Login Page */}
                                <Route
                                    path="/seller/login"
                                    element={<SellerLoginRedirect />}
                                />
                                <Route
                                    path="/seller/register"
                                    element={<SellerRegister />}
                                />
                                <Route path="/seller" element={<SellerLayout />}>
                                    <Route
                                        index
                                        element={<Navigate to="/seller/dashboard" replace />}
                                    />
                                    <Route
                                        path="dashboard"
                                        element={<SellerDashboard />}
                                    />
                                    <Route
                                        path="orders"
                                        element={<SellerOrders />}
                                    />
                                    <Route
                                        path="inventory"
                                        element={<SellerInventory />}
                                    />
                                    <Route
                                        path="finance"
                                        element={<SellerFinance />}
                                    />
                                    <Route
                                        path="returns"
                                        element={<SellerReturns />}
                                    />
                                    <Route
                                        path="reports"
                                        element={<SellerReports />}
                                    />
                                    <Route
                                        path="products"
                                        element={<SellerProducts />}
                                    />
                                    <Route
                                        path="products/new"
                                        element={<SellerAddProduct />}
                                    />
                                    <Route
                                        path="packaging"
                                        element={<Navigate to="/seller/dashboard" replace />}
                                    />
                                    <Route
                                        path="inquiries"
                                        element={<SellerInquiries />}
                                    />
                                    <Route
                                        path="profile"
                                        element={<SellerProfile />}
                                    />
                                </Route>

                                {/* Google Sign-In redirect landing page - No Navbar/Footer */}
                                <Route
                                    path="/auth/google/success"
                                    element={<GoogleAuthCallback />}
                                />

                                {/* Private Creator Dashboard - Token-based, No Login Required */}
                                <Route
                                    path="/collab/:token"
                                    element={<CreatorDashboard />}
                                />

                                {/* Standalone Brand Story & About Us pages */}
                                <Route path="/about" element={<AboutUs />} />
                                <Route path="/about-us" element={<AboutUs />} />
                                <Route path="/our-story" element={<AboutUs />} />

                                {/* Standalone Founder & Owner pages */}
                                <Route path="/owner" element={<OwnerPage />} />
                                <Route path="/founders" element={<OwnerPage />} />
                                <Route path="/founder" element={<OwnerPage />} />
                                <Route path="/who-is-the-owner-of-nari-pehnawa" element={<OwnerPage />} />
                                <Route path="/nari-pehnawa-owner" element={<OwnerPage />} />
                                <Route path="/nari-pehnawa-founder" element={<OwnerPage />} />
                                <Route path="/malik" element={<OwnerPage />} />

                                {/* All other routes with Navbar and Footer
                                    (this includes /user/* — the account
                                    pages are nested inside MainLayout so
                                    they share the normal Navbar/Footer) */}
                                <Route path="*" element={<MainLayout />} />
                            </Routes>
                        </WishlistProvider>
                    </CartProvider>
                </SellerAuthProvider>
            </AuthProvider>
            </Router>
        </>
    );
}

export default App;
