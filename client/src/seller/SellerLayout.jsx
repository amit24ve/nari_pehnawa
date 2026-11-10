import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  MessageSquare,
  Building2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Clock,
  AlertTriangle,
  Store,
  ChevronDown,
  CheckCircle2,
  ShoppingCart,
  Boxes,
  RotateCcw,
  IndianRupee,
  FileSpreadsheet,
  Headphones,
} from "lucide-react";
import { useSellerAuth } from "./SellerAuthContext";
import logoImg from "../assets/logo.png";

const NavItem = ({ to, children, icon: Icon, onClick, exact }) => (
  <NavLink
    to={to}
    onClick={onClick}
    end={exact}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "bg-[#0891b2] text-white shadow-md shadow-[#0891b2]/15"
          : "text-gray-700 hover:bg-slate-50 hover:text-[#0891b2]"
      }`
    }
  >
    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
    <span>{children}</span>
  </NavLink>
);

const SellerLayout = () => {
  const { seller, logout, isAuthenticated, loading } = useSellerAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">Loading Seller Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/?login=seller" replace />;
  }

  const kycStatus = seller?.kyc_status || "pending";
  const shopName = seller?.shop_name || "My Store";
  const ownerName = seller?.name || "Merchant";

  const getInitials = () => {
    if (shopName) {
      const parts = shopName.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return shopName.substring(0, 2).toUpperCase();
    }
    return "SP";
  };

  const getKycBadge = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> KYC Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Action Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> KYC Under Review
          </span>
        );
    }
  };

  const handleLogout = () => {
    try {
      logout();
    } catch (_) {}
    try {
      localStorage.removeItem("neel_admin_user");
      localStorage.removeItem("neel_token");
      localStorage.removeItem("token");
      localStorage.removeItem("np_seller_token");
      localStorage.removeItem("np_seller_user");
    } catch (_) {}
    window.location.href = "/";
  };

  const navLinks = [
    { to: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/seller/products", label: "Products", icon: Package, exact: true },
    { to: "/seller/products/new", label: "Add Product", icon: PlusCircle },
    { to: "/seller/orders", label: "Orders", icon: ShoppingCart },
    { to: "/seller/inventory", label: "Inventory", icon: Boxes },
    { to: "/seller/finance", label: "Payments", icon: IndianRupee },
    { to: "/seller/returns", label: "Returns", icon: RotateCcw },
    { to: "/seller/inquiries", label: "Inquiries & Support", icon: MessageSquare },
    { to: "/seller/reports", label: "Reports", icon: FileSpreadsheet },
    { to: "/seller/profile", label: "Shop Profile & KYC", icon: Store },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex">
      {/* Desktop Sidebar (Clean, matching Admin Panel) */}
      <aside className="bg-white w-64 border-r border-slate-200 hidden lg:flex lg:flex-col fixed top-0 left-0 h-screen z-30">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <Link
            to="/seller/dashboard"
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition"
          >
            <img
              src={logoImg}
              alt="logo"
              className="h-9 w-auto max-w-[70px] object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span
                className="font-bold text-lg leading-tight block whitespace-nowrap truncate"
                style={{ color: "#0891b2" }}
              >
                Seller Hub
              </span>
              <span className="text-[11px] text-gray-500 font-medium block whitespace-nowrap truncate">
                Multi-Vendor Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Shop Info Card */}
        <div className="p-3 mx-4 my-2.5 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0891b2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{shopName}</h4>
              <p className="text-[10px] text-slate-500 truncate">{seller?.email}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            {getKycBadge()}
            <Link
              to="/seller/profile"
              className="text-[10px] font-bold text-[#0891b2] hover:underline"
            >
              KYC →
            </Link>
          </div>
        </div>

        {/* Clean Flat Navigation Links */}
        <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              icon={link.icon}
              exact={link.exact}
            >
              {link.label}
            </NavItem>
          ))}
        </nav>

        {/* Clean Footer Logout */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-black text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Viewport Content Area */}
      <div className="flex-1 lg:ml-64 min-w-0 w-full flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 shadow-xs">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition text-gray-700 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/seller/dashboard" className="flex items-center gap-2 lg:hidden">
              <img src={logoImg} alt="logo" className="h-7 object-contain" />
              <span className="font-bold text-sm" style={{ color: "#0891b2" }}>
                Seller Hub
              </span>
            </Link>

            {/* Desktop Store Indicator */}
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                Store: <span className="text-[#0891b2] font-bold">{shopName}</span>
              </span>
              {getKycBadge()}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Verification SLA: 24-48 Hours</span>
              </div>
            </div>
          </div>

          {/* Top Right Actions & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Add Product CTA */}
            <Link
              to="/seller/products/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>

            {/* Orders Shortcut */}
            <Link
              to="/seller/orders"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative"
              title="Orders"
            >
              <ShoppingCart className="w-4 h-4" />
            </Link>

            {/* Support Inquiries Icon */}
            <Link
              to="/seller/inquiries"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative"
              title="Support Inquiries"
            >
              <Headphones className="w-4 h-4" />
            </Link>

            {/* Profile Dropdown (Right-side profile section) */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0891b2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {getInitials()}
                </div>
                <div className="hidden md:block text-left min-w-0 max-w-[120px]">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {shopName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate leading-tight">
                    {ownerName}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{shopName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{seller?.email}</p>
                    <div className="mt-2">{getKycBadge()}</div>
                  </div>

                  <div className="py-1">
                    {/* View Live Store directly from profile menu */}
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-[#0891b2] transition"
                    >
                      <Store className="w-4 h-4 text-[#0891b2]" />
                      <span>View Live Store</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                    </a>

                    <Link
                      to="/seller/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Shop Profile & KYC</span>
                    </Link>

                    <Link
                      to="/seller/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      <span>Seller Orders</span>
                    </Link>

                    <Link
                      to="/seller/finance"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <IndianRupee className="w-4 h-4 text-slate-500" />
                      <span>Payments & Settlements</span>
                    </Link>

                    <Link
                      to="/seller/inquiries"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span>Support Inquiries</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col z-10">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="logo" className="h-8 object-contain" />
                  <span className="font-bold text-base text-[#0891b2]">Seller Hub</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 truncate">{shopName}</h4>
                <p className="text-[11px] text-slate-500 truncate">{seller?.email}</p>
                <div className="mt-1">{getKycBadge()}</div>
              </div>

              <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
                {navLinks.map((link) => (
                  <NavItem
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    exact={link.exact}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </NavItem>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-black"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
