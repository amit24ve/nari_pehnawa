import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import {
    X,
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    FolderOpen,
    Star,
    Settings,
    LogOut,
    Menu,
    Store,
    User,
    ChevronDown,
    CreditCard,
    Eye,
    Sparkles,
    MessageSquare,
    Megaphone,
    Share2,
} from "lucide-react";
import logoImg from "../assets/logo.png";

const NavItem = ({ to, children, icon: Icon, onClick, badge }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                    ? "bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B8860B] text-black shadow-md shadow-[#D4AF37]/30"
                    : "text-[#574B38] hover:bg-[#F4ECDA] hover:text-[#996515]"
            }`
        }
    >
        <div className="flex items-center gap-3 min-w-0">
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="truncate">{children}</span>
        </div>
        {badge && (
            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 ml-1.5 shrink-0">
                {badge}
            </span>
        )}
    </NavLink>
);

const AdminLayout = () => {
    const [open, setOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    const { logout, user } = useAuth();

    // Get user initials for avatar
    const getInitials = () => {
        if (user?.full_name) {
            const names = user.full_name.trim().split(" ");
            if (names.length >= 2) {
                return (names[0][0] + names[names.length - 1][0]).toUpperCase();
            }
            return names[0].substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "AD";
    };

    const handleLogout = () => {
        try {
            logout();
        } catch (e) {
            try {
                localStorage.removeItem("neel_admin_user");
                localStorage.removeItem("neel_token");
            } catch (_) {}
            navigate("/");
        }
    };

    const closeMobileMenu = () => {
        setOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#FAF6EC] text-gray-800 flex">
            {/* Desktop Sidebar */}
            <aside className="bg-[#FFFDF8] w-64 border-r border-[#E8DCB8] hidden lg:flex lg:flex-col fixed top-0 left-0 h-screen z-30 shadow-xs">
                {/* Header */}
                <div className="p-4 border-b border-[#E8DCB8] flex-shrink-0 bg-gradient-to-b from-[#FFFDF8] to-[#FAF5E8]">
                    <Link
                        to="/admin"
                        className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#F4ECDA] transition"
                    >
                        <img
                            src={logoImg}
                            alt="logo"
                            className="h-9 w-auto max-w-[70px] object-contain flex-shrink-0 drop-shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                            <span
                                className="font-extrabold text-lg leading-tight block whitespace-nowrap truncate tracking-wide"
                                style={{ color: "#B8860B" }}
                            >
                                Admin Panel
                            </span>
                            <span className="text-[11px] text-[#8C7A58] font-semibold block whitespace-nowrap truncate">
                                Nari Pehnawa Luxury
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1 p-3.5 flex-1 overflow-y-auto custom-scrollbar">
                    <NavItem to="/admin" icon={LayoutDashboard}>
                        Dashboard
                    </NavItem>
                    <NavItem to="/admin/visitors" icon={Eye}>
                        Visitors
                    </NavItem>
                    <NavItem to="/admin/users" icon={Users}>
                        Users
                    </NavItem>
                    <NavItem to="/admin/products" icon={Package}>
                        Products
                    </NavItem>
                    <NavItem to="/admin/orders" icon={ShoppingCart}>
                        Orders
                    </NavItem>
                    <NavItem to="/admin/sellers" icon={Store} badge="Portal">
                        Seller Hub
                    </NavItem>
                    <NavItem to="/admin/categories" icon={FolderOpen}>
                        Categories
                    </NavItem>
                    <NavItem to="/admin/hero" icon={Sparkles}>
                        Hero Sections
                    </NavItem>
                    <NavItem to="/admin/announcements" icon={Megaphone}>
                        Announcements
                    </NavItem>
                    <NavItem to="/admin/inquiries" icon={MessageSquare}>
                        Inquiries
                    </NavItem>
                    <NavItem to="/admin/reviews" icon={Star}>
                        Reviews
                    </NavItem>
                    <NavItem to="/admin/payment-history" icon={CreditCard}>
                        Payments
                    </NavItem>
                    <NavItem to="/admin/collaborations" icon={Share2}>
                        Influencer Collabs
                    </NavItem>
                    <NavItem to="/admin/settings" icon={Settings}>
                        Settings
                    </NavItem>
                </nav>

                {/* Footer */}
                <div className="p-3.5 border-t border-[#E8DCB8] flex-shrink-0 bg-[#FFFDF8]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-sm font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 min-w-0 w-full flex flex-col min-h-screen overflow-x-hidden">
                {/* Mobile/Tablet Header */}
                <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#FFFDF8] border-b border-[#E8DCB8] shadow-xs">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setOpen(true)}
                            className="p-2 bg-[#F8F3E4] border border-[#E8DCB8] rounded-xl hover:bg-[#F3EBD3] transition text-[#785A18]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link to="/admin" className="flex items-center gap-2">
                            <img src={logoImg} alt="logo" className="h-8 object-contain" />
                            <span
                                className="font-extrabold text-base tracking-wide"
                                style={{ color: "#B8860B" }}
                            >
                                Admin
                            </span>
                        </Link>
                    </div>

                    {/* Admin Profile - Mobile */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-[#F8F3E4] border border-[#E8DCB8] rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E6C25B] via-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-md">
                                <span className="text-sm font-extrabold text-black">
                                    {getInitials()}
                                </span>
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                                    {user?.full_name || user?.email || "Admin"}
                                </p>
                                <p className="text-[10px] text-[#8C7A58] capitalize font-medium">
                                    {user?.role || "Administrator"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="text-sm text-[#785A18] hover:text-[#B8860B] flex items-center gap-1 p-2 hover:bg-[#F8F3E4] rounded-xl transition"
                            title="Go to store"
                        >
                            <Store className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:block sticky top-0 z-40 bg-[#FFFDF8] border-b border-[#E8DCB8] shadow-xs">
                    <div className="px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-base font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#B8860B]" />
                                Store Administration
                            </h2>
                        </div>

                        {/* Admin Profile - Desktop */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowProfileMenu(!showProfileMenu)
                                }
                                className="flex items-center gap-3 px-3.5 py-2 bg-[#FAF5E8] border border-[#E8DCB8] rounded-xl hover:bg-[#F3EBD3] transition text-gray-800 cursor-pointer shadow-xs"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E6C25B] via-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-sm">
                                    <span className="text-sm font-extrabold text-black">
                                        {getInitials()}
                                    </span>
                                </div>
                                <div className="text-left min-w-0 max-w-[200px]">
                                    <p className="text-xs font-bold text-[#1C1917] truncate">
                                        {user?.full_name ||
                                            user?.email ||
                                            "Admin User"}
                                    </p>
                                    <p className="text-[10px] text-[#8C7A58] font-medium capitalize">
                                        {user?.role || "Administrator"}
                                    </p>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-[#8C7A58] transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() =>
                                            setShowProfileMenu(false)
                                        }
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden text-gray-800">
                                        <div className="p-3 border-b border-slate-200">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {user?.full_name ||
                                                    user?.email ||
                                                    "Admin User"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user?.email || ""}
                                            </p>
                                        </div>
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/settings");
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-slate-50 hover:text-[#0891b2] transition flex items-center gap-2"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate("/");
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-slate-50 hover:text-[#0891b2] transition flex items-center gap-2"
                                            >
                                                <Store className="w-4 h-4" />
                                                View Store
                                            </button>
                                        </div>
                                        <div className="border-t border-slate-200 py-2">
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Drawer */}
                {open && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
                            onClick={closeMobileMenu}
                        />

                        {/* Drawer */}
                        <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl">
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={logoImg}
                                        alt="logo"
                                        className="h-8 w-auto max-w-[65px] object-contain flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <span
                                            style={{ color: "#B8860B" }}
                                            className="font-extrabold text-base leading-tight block whitespace-nowrap truncate tracking-wide"
                                        >
                                            Admin Panel
                                        </span>
                                        <span className="text-[11px] text-[#8C7A58] font-medium block whitespace-nowrap truncate">
                                            Nari Pehnawa Luxury
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeMobileMenu}
                                    className="p-2 rounded-xl hover:bg-[#F3EBD3] transition text-[#785A18] flex-shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-1 p-3.5 flex-1 overflow-y-auto custom-scrollbar">
                                <NavItem
                                    to="/admin"
                                    icon={LayoutDashboard}
                                    onClick={closeMobileMenu}
                                >
                                    Dashboard
                                </NavItem>
                                <NavItem
                                    to="/admin/visitors"
                                    icon={Eye}
                                    onClick={closeMobileMenu}
                                >
                                    Visitors
                                </NavItem>
                                <NavItem
                                    to="/admin/users"
                                    icon={Users}
                                    onClick={closeMobileMenu}
                                >
                                    Users
                                </NavItem>
                                <NavItem
                                    to="/admin/products"
                                    icon={Package}
                                    onClick={closeMobileMenu}
                                >
                                    Products
                                </NavItem>
                                <NavItem
                                    to="/admin/orders"
                                    icon={ShoppingCart}
                                    onClick={closeMobileMenu}
                                >
                                    Orders
                                </NavItem>
                                <NavItem
                                    to="/admin/sellers"
                                    icon={Store}
                                    badge="Portal"
                                    onClick={closeMobileMenu}
                                >
                                    Seller Hub
                                </NavItem>
                                <NavItem
                                    to="/admin/categories"
                                    icon={FolderOpen}
                                    onClick={closeMobileMenu}
                                >
                                    Categories
                                </NavItem>
                                <NavItem
                                    to="/admin/hero"
                                    icon={Sparkles}
                                    onClick={closeMobileMenu}
                                >
                                    Hero Banners
                                </NavItem>
                                <NavItem
                                    to="/admin/announcements"
                                    icon={Megaphone}
                                    onClick={closeMobileMenu}
                                >
                                    Announcements
                                </NavItem>
                                <NavItem
                                    to="/admin/reviews"
                                    icon={Star}
                                    onClick={closeMobileMenu}
                                >
                                    Reviews
                                </NavItem>
                                <NavItem
                                    to="/admin/payment-history"
                                    icon={CreditCard}
                                    onClick={closeMobileMenu}
                                >
                                    Payments
                                </NavItem>
                                <NavItem
                                    to="/admin/collaborations"
                                    icon={Share2}
                                    onClick={closeMobileMenu}
                                >
                                    Influencer Collabs
                                </NavItem>
                                <NavItem
                                    to="/admin/settings"
                                    icon={Settings}
                                    onClick={closeMobileMenu}
                                >
                                    Settings
                                </NavItem>
                            </nav>

                            <div className="p-4 space-y-2 border-t border-slate-200">
                                {/* <button
                  onClick={() => { navigate('/'); closeMobileMenu(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium transition"
                >
                  <Store className="w-4 h-4" />
                  View Store
                </button> */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium transition shadow-lg shadow-red-600/20"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Main content area */}
                <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
