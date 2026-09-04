import React, { useState } from "react";
import useSEO from "./hooks/useSEO";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import VisitorTracker from "./components/VisitorTracker";
import CookieConsent from "./components/CookieConsent";
import HeroSection from "./components/HeroSection";
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
import GoogleAuthCallback from "./components/GoogleAuthCallback";
import OwnerPage from "./components/OwnerPage";
import SupportPages from "./components/SupportPages";
import PublicOrderTracking from "./components/PublicOrderTracking";
import CustomerAccountModal from "./components/CustomerAccountModal";
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
import RequireAuth from "./admin/RequireAuth";
import { AuthProvider } from "./context/AuthProvider";
import { WishlistProvider } from "./context/WishlistProvider";
import { CartProvider } from "./context/CartProvider";

// User account (no separate dashboard — pages are reached only via the
// navbar's profile dropdown, rendered inside the normal site layout)
import AccountLayout from "./user/AccountLayout";
import UserProfile from "./user/Profile";
import UserOrders from "./user/Orders";
import UserSettings from "./user/Settings";

function HomePage() {
    useSEO(
        "Nari Pehnawa | Traditional Ka Tadka | Authentic Women Ethnic Wear, Kurtis & Sarees",
        "Nari Pehnawa (naripehnawa.com) is India's leading online boutique for handcrafted Anarkali Kurtis, Chikankari Sets, Palazzo Suits, Sarees & Designer Ethnic Wear. Free Shipping & Fast Delivery."
    );
    return (
        <>
            <HeroSection />
            <Categories />
            <FeaturedProducts />
            <HomeCategorySections />
            <WatchAndBuy />
            <CelebApprovedLooks />
            <AsFeaturedOn />
            <AIChatbot />
        </>
    );
}

// Layout component for regular pages (with Navbar and Footer)
function MainLayout() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
            <Navbar />
            <CustomerAccountModal />
            <VisitorTracker />
            <CookieConsent />
            {/* pt: mobile = promo(30)+bar(80) = 110px; md = +category strip(44) = 154px */}
            <div className="pt-[110px] md:pt-[154px]">
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

                    {/* Home Decor categories */}
                    <Route
                        path="/category/vases-planters"
                        element={<CategoryPage categoryName="Vases & Planters" />}
                    />
                    <Route
                        path="/category/wall-decor"
                        element={<CategoryPage categoryName="Wall Decor" />}
                    />
                    <Route
                        path="/category/lighting-lamps"
                        element={<CategoryPage categoryName="Lighting & Lamps" />}
                    />
                    <Route
                        path="/category/cushions-covers"
                        element={
                            <CategoryPage categoryName="Cushions & Covers" />
                        }
                    />
                    <Route
                        path="/category/rugs-carpets"
                        element={<CategoryPage categoryName="Rugs & Carpets" />}
                    />
                    <Route
                        path="/category/pooja-essentials"
                        element={<CategoryPage categoryName="Pooja Essentials" />}
                    />
                    <Route
                        path="/category/candles-fragrances"
                        element={
                            <CategoryPage categoryName="Candles & Fragrances" />
                        }
                    />
                    <Route
                        path="/category/photo-frames-art"
                        element={
                            <CategoryPage categoryName="Photo Frames & Art" />
                        }
                    />

                    {/* Dynamic catch-all — handles any category not listed
                        above by fetching its real name/image/tagline from
                        the backend using the URL slug. */}
                    <Route
                        path="/category/:categoryName"
                        element={<CategoryPage />}
                    />
                    <Route
                        path="/order-tracking/:orderId"
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
                        <Route path="orders" element={<UserOrders />} />
                        <Route path="settings" element={<UserSettings />} />
                    </Route>
                </Routes>
            </div>
            <Footer />
        </div>
    );
}

function App() {
    const [appReady, setAppReady] = useState(false);

    return (
        <>
            {!appReady && (
                <LoadingScreen onComplete={() => setAppReady(true)} />
            )}
            <Router>
                <AuthProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <WelcomePopup />
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
                                        path="inquiries"
                                        element={<Inquiries />}
                                    />
                                </Route>

                                {/* Google Sign-In redirect landing page - No Navbar/Footer */}
                                <Route
                                    path="/auth/google/success"
                                    element={<GoogleAuthCallback />}
                                />

                                {/* Standalone Owner, Founders, & About pages */}
                                <Route path="/owner" element={<OwnerPage />} />
                                <Route path="/about" element={<OwnerPage />} />
                                <Route path="/about-us" element={<OwnerPage />} />
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
                </AuthProvider>
            </Router>
        </>
    );
}

export default App;
