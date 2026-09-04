import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Package,
  MapPin,
  Truck,
  Heart,
  Lock,
  LogOut,
  ChevronRight,
  Edit2,
  Save,
  Plus,
  Trash2,
  Home,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Eye,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useWishlist } from "../context/WishlistProvider";
import { useCart } from "../context/CartProvider";
import { useNavigate } from "react-router-dom";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const CustomerAccountModal = () => {
  const {
    user,
    logout,
    isAccountModalOpen,
    closeAccountModal,
    accountModalTab,
    openAccountModal,
  } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(accountModalTab || "profile");

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    bio: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password / Security States
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    type: "home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState({ type: "", text: "" });

  // Orders States
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Tracking States
  const [trackInput, setTrackInput] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Wishlist item size selection inside modal
  const [selectedWishlistSizes, setSelectedWishlistSizes] = useState({});
  const [addingToCartId, setAddingToCartId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

  // Sync tab when opened with a specific tab
  useEffect(() => {
    if (accountModalTab) {
      setActiveTab(accountModalTab);
    }
  }, [accountModalTab]);

  // Load user data on open
  useEffect(() => {
    if (isAccountModalOpen && user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        age: user.age || "",
        bio: user.bio || "",
      });
      fetchAddresses();
      fetchOrders();
    }
  }, [isAccountModalOpen, user]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/addresses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching addresses:", e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");

    try {
      const payload = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        bio: profileData.bio.trim(),
      };
      if (profileData.age) {
        const parsedAge = parseInt(profileData.age, 10);
        if (!Number.isNaN(parsedAge)) payload.age = parsedAge;
      }

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
        setIsEditingProfile(false);
        // Refresh updated profile in localStorage
        const updated = await res.json();
        if (updated) {
          const storedUser = JSON.parse(localStorage.getItem("neel_admin_user") || "{}");
          localStorage.setItem("neel_admin_user", JSON.stringify({ ...storedUser, ...updated }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setProfileMsg({ type: "error", text: err.detail || "Failed to update profile." });
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Network error updating profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ type: "", text: "" });
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/users/me/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        const err = await res.json().catch(() => ({}));
        setPasswordMsg({ type: "error", text: err.detail || "Failed to change password." });
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg({ type: "", text: "" });
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");

    try {
      const url = editingAddressId
        ? `${API_URL}/addresses/${editingAddressId}`
        : `${API_URL}/addresses/`;
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressFormData),
      });

      if (res.ok) {
        setAddressMsg({
          type: "success",
          text: editingAddressId ? "Address updated successfully!" : "New address added!",
        });
        setShowAddressForm(false);
        setEditingAddressId(null);
        setAddressFormData({
          type: "home",
          full_name: "",
          phone: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          pincode: "",
          is_default: false,
        });
        fetchAddresses();
      } else {
        const err = await res.json().catch(() => ({}));
        setAddressMsg({ type: "error", text: err.detail || "Failed to save address." });
      }
    } catch (err) {
      setAddressMsg({ type: "error", text: err.message || "Failed to save address." });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (e) {
      console.error("Delete address failed", e);
    }
  };

  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!trackInput.trim()) return;

    setLoadingTracking(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const res = await fetch(`${API_URL}/order-tracking/${encodeURIComponent(trackInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingResult(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setTrackingError(err.detail || "No shipment found with this ID / AWB.");
      }
    } catch (err) {
      setTrackingError("Failed to fetch tracking details. Please try again.");
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleAddWishlistItemToCart = async (item) => {
    const size = selectedWishlistSizes[item.id] || "M";
    setAddingToCartId(item.id);
    await addToCart({
      product_id: String(item.id),
      name: item.name,
      price: item.price,
      image: item.image,
      size: size,
      quantity: 1,
    });
    setAddingToCartId(null);
  };

  if (!isAccountModalOpen || !user) return null;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      orderFilter === "all" || (o.status || "pending").toLowerCase() === orderFilter;
    const term = orderSearch.toLowerCase().trim();
    const orderNum = (o.order_number || o.id || o.order_id || "").toLowerCase();
    const matchesSearch = !term || orderNum.includes(term);
    return matchesFilter && matchesSearch;
  });

  const menuItems = [
    { id: "profile", label: "My Profile", icon: User, badge: null },
    { id: "orders", label: "My Orders", icon: Package, badge: orders.length > 0 ? orders.length : null },
    { id: "addresses", label: "Delivery Addresses", icon: MapPin, badge: addresses.length > 0 ? addresses.length : null },
    { id: "track", label: "Track Shipment", icon: Truck, badge: null },
    { id: "wishlist", label: "My Wishlist", icon: Heart, badge: wishlist.length > 0 ? wishlist.length : null },
    { id: "security", label: "Password & Security", icon: Lock, badge: null },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeAccountModal}
      ></div>

      {/* Modal Window */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] sm:h-[88vh] max-h-[820px] flex flex-col overflow-hidden border border-stone-200 z-10">
        {/* Top Luxury Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#580C1F] via-[#D4AF37] to-[#8B0000]"></div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FAF5ED] via-white to-[#FAF5ED] border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#580C1F] to-[#8B0000] flex items-center justify-center text-[#D4AF37] font-serif font-bold text-lg shadow-md flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
                  {user.name || "Customer Account"}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#580C1F]/10 text-[#580C1F] uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  {user.role === "admin" || user.is_admin ? "Admin" : "Verified Member"}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate max-w-[220px] sm:max-w-md">
                {user.email} {user.phone ? `• ${user.phone}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(user.role === "admin" || user.is_admin) && (
              <button
                onClick={() => {
                  closeAccountModal();
                  navigate("/admin/dashboard");
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF0E6] text-[#580C1F] text-xs font-bold rounded-xl hover:bg-[#F3E5D8] transition-colors border border-[#580C1F]/20 cursor-pointer"
              >
                <span>Admin Dashboard</span>
              </button>
            )}
            <button
              onClick={closeAccountModal}
              className="p-2 hover:bg-stone-200/80 rounded-full transition-colors text-stone-500 hover:text-stone-900 bg-white border border-stone-200 shadow-sm cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tab Navigation (Scrollable) */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-50 border-b border-stone-200 overflow-x-auto no-scrollbar flex-shrink-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-[#580C1F] text-white shadow-sm"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-[#D4AF37] text-stone-900" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body (Sidebar + Content) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Left Sidebar */}
          <div className="hidden md:flex flex-col w-64 bg-stone-50/80 border-r border-stone-200 p-4 justify-between flex-shrink-0">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase px-3 mb-2">
                Account Menu
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#580C1F] to-[#8B0000] text-white shadow-md shadow-[#580C1F]/20 translate-x-1"
                        : "text-stone-700 hover:bg-stone-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF37]" : "text-stone-500"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? "bg-[#D4AF37] text-stone-950" : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${isActive ? "text-white" : ""}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Logout */}
            <div className="pt-3 border-t border-stone-200">
              <button
                onClick={async () => {
                  closeAccountModal();
                  await logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
            {/* ================= 1. PROFILE TAB ================= */}
            {activeTab === "profile" && (
              <div className="space-y-6 max-w-2xl animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      Personal Information
                    </h3>
                    <p className="text-xs text-stone-500">
                      Manage your personal profile details and contact information
                    </p>
                  </div>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF5ED] text-[#580C1F] border border-[#580C1F]/30 hover:bg-[#580C1F] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {profileMsg.text && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      profileMsg.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {profileMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isEditingProfile}
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#580C1F] disabled:bg-stone-100/70 disabled:text-stone-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Email Address (Verified)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profileData.email}
                        className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={!isEditingProfile}
                        placeholder="+91 98765 43210"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#580C1F] disabled:bg-stone-100/70 disabled:text-stone-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        disabled={!isEditingProfile}
                        placeholder="e.g. 28"
                        value={profileData.age}
                        onChange={(e) =>
                          setProfileData({ ...profileData, age: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#580C1F] disabled:bg-stone-100/70 disabled:text-stone-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Bio / Fashion Preferences
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isEditingProfile}
                      placeholder="Share your style preference or notes..."
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#580C1F] disabled:bg-stone-100/70 disabled:text-stone-600 transition-all"
                    />
                  </div>

                  {isEditingProfile && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#580C1F] hover:bg-[#8B0000] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  )}
                </form>

                {/* Quick Profile Summary Card */}
                <div className="mt-8 p-4 sm:p-5 bg-gradient-to-br from-[#FAF5ED] to-white rounded-2xl border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#580C1F] mb-3">
                    Account Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm text-center">
                      <Package className="w-5 h-5 mx-auto text-[#580C1F] mb-1" />
                      <span className="block text-lg font-bold text-stone-900">{orders.length}</span>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Total Orders</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm text-center">
                      <Heart className="w-5 h-5 mx-auto text-rose-500 mb-1" />
                      <span className="block text-lg font-bold text-stone-900">{wishlist.length}</span>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Wishlist Items</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm text-center col-span-2 sm:col-span-1">
                      <MapPin className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                      <span className="block text-lg font-bold text-stone-900">{addresses.length}</span>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Saved Addresses</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. ORDERS TAB ================= */}
            {activeTab === "orders" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      My Orders &amp; History
                    </h3>
                    <p className="text-xs text-stone-500">
                      Track delivery, view items, and download invoices
                    </p>
                  </div>
                  <button
                    onClick={fetchOrders}
                    disabled={loadingOrders}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by Order ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {["all", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                          orderFilter === status
                            ? "bg-[#580C1F] text-white shadow-sm"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div className="py-16 text-center text-stone-400 text-sm flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#580C1F]" />
                    <span>Loading your orders...</span>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-stone-50 rounded-2xl border border-stone-200 my-4 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <p className="text-sm font-bold text-stone-700">No orders found</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      {orderSearch || orderFilter !== "all"
                        ? "Try resetting your search or filter."
                        : "You haven't placed any orders yet. Discover our latest collections!"}
                    </p>
                    <button
                      onClick={() => {
                        closeAccountModal();
                        navigate("/new-arrivals");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      <span>Explore New Arrivals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredOrders.map((order) => {
                      const orderId = order.order_number || order.order_id || order.id || order._id;
                      const status = (order.status || "pending").toLowerCase();
                      const statusStyles = {
                        delivered: "bg-green-100 text-green-800 border-green-200",
                        shipped: "bg-blue-100 text-blue-800 border-blue-200",
                        processing: "bg-amber-100 text-amber-800 border-amber-200",
                        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                        cancelled: "bg-red-100 text-red-800 border-red-200",
                      }[status] || "bg-stone-100 text-stone-800 border-stone-200";

                      const items = order.items || [];

                      return (
                        <div
                          key={orderId}
                          className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Card Header */}
                          <div className="px-4 py-3 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-900">
                                Order #{orderId}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusStyles}`}
                              >
                                {status}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-serif font-bold text-[#580C1F]">
                                ₹{order.total_amount || order.total || 0}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {order.created_at_ist || order.created_at || "Recent"}
                              </span>
                            </div>
                          </div>

                          {/* Card Body - Products list */}
                          <div className="p-4 divide-y divide-stone-100">
                            {items.map((item, idx) => (
                              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-14 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-14 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-5 h-5 text-stone-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-stone-900 truncate">
                                    {item.name || "Nari Pehnawa Designer Wear"}
                                  </p>
                                  <p className="text-[11px] text-stone-500">
                                    Size: <span className="font-semibold text-stone-800">{item.size || "Free"}</span> • Qty: <span className="font-semibold text-stone-800">{item.quantity || 1}</span>
                                  </p>
                                  <p className="text-xs font-semibold text-[#8B0000]">
                                    ₹{item.price || item.unit_price || 0}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="px-4 py-2.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                            <div className="text-[11px] text-stone-500 truncate">
                              {order.awb_code ? (
                                <span className="text-stone-700 font-medium">
                                  AWB: <span className="font-mono">{order.awb_code}</span> ({order.courier_name || "Shiprocket"})
                                </span>
                              ) : (
                                <span>Payment: {order.payment_method || "Online"}</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setTrackInput(order.awb_code || orderId);
                                setActiveTab("track");
                                setTimeout(() => handleTrackSubmit(), 100);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF5ED] text-[#580C1F] hover:bg-[#580C1F] hover:text-white rounded-lg font-bold text-xs transition-colors border border-[#580C1F]/20 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Track</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= 3. ADDRESSES TAB ================= */}
            {activeTab === "addresses" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      Saved Delivery Addresses
                    </h3>
                    <p className="text-xs text-stone-500">
                      Manage multiple shipping locations for seamless 1-click checkout
                    </p>
                  </div>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressFormData({
                          type: "home",
                          full_name: user?.name || "",
                          phone: user?.phone || "",
                          address_line1: "",
                          address_line2: "",
                          city: "",
                          state: "",
                          pincode: "",
                          is_default: false,
                        });
                        setShowAddressForm(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {addressMsg.text && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      addressMsg.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {addressMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{addressMsg.text}</span>
                  </div>
                )}

                {/* Add / Edit Form Modal inside Addresses */}
                {showAddressForm ? (
                  <div className="bg-stone-50/80 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900">
                        {editingAddressId ? "Edit Delivery Address" : "Add New Address"}
                      </h4>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="p-1 hover:bg-stone-200 rounded-full text-stone-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAddress} className="space-y-3.5">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                          <input
                            type="radio"
                            name="address_type"
                            value="home"
                            checked={addressFormData.type === "home"}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, type: e.target.value })
                            }
                            className="text-[#580C1F] focus:ring-[#580C1F]"
                          />
                          <span>Home</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                          <input
                            type="radio"
                            name="address_type"
                            value="work"
                            checked={addressFormData.type === "work"}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, type: e.target.value })
                            }
                            className="text-[#580C1F] focus:ring-[#580C1F]"
                          />
                          <span>Work / Office</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Receiver Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Full name"
                            value={addressFormData.full_name}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, full_name: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            10-Digit Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="9876543210"
                            value={addressFormData.phone}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Flat, House no., Building, Street *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flat 302, Royal Residency, M.G. Road"
                          value={addressFormData.address_line1}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, address_line1: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Landmark / Area (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Near City Mall"
                          value={addressFormData.address_line2}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, address_line2: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="City"
                            value={addressFormData.city}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, city: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            State *
                          </label>
                          <select
                            required
                            value={addressFormData.state}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, state: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="6 digits PIN"
                            value={addressFormData.pincode}
                            onChange={(e) =>
                              setAddressFormData({ ...addressFormData, pincode: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="is_default_chk"
                          checked={addressFormData.is_default}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, is_default: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#580C1F] focus:ring-[#580C1F]"
                        />
                        <label htmlFor="is_default_chk" className="text-xs font-semibold text-stone-700 cursor-pointer">
                          Make this my default shipping address
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="px-5 py-2 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                        >
                          {savingAddress ? "Saving..." : "Save Address"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {/* Addresses List */}
                {loadingAddresses ? (
                  <div className="py-12 text-center text-stone-400 text-xs">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-200 my-4 space-y-2">
                    <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs font-bold text-stone-700">No saved addresses yet</p>
                    <p className="text-[11px] text-stone-400">Add an address to checkout faster next time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => {
                      const addrId = addr.id || addr._id;
                      return (
                        <div
                          key={addrId}
                          className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                            addr.is_default
                              ? "bg-gradient-to-br from-[#FAF5ED] to-white border-[#D4AF37] shadow-sm"
                              : "bg-white border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                {addr.type === "work" ? (
                                  <Briefcase className="w-3.5 h-3.5 text-[#580C1F]" />
                                ) : (
                                  <Home className="w-3.5 h-3.5 text-[#580C1F]" />
                                )}
                                <span className="text-xs font-bold text-stone-900 uppercase">
                                  {addr.type || "Home"}
                                </span>
                              </div>
                              {addr.is_default && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8B0000] border border-[#D4AF37]">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-stone-900">{addr.full_name}</p>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ""},{" "}
                              {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                            </p>
                            <p className="text-xs text-stone-500 mt-1">
                              Phone: <span className="font-semibold text-stone-800">{addr.phone}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-stone-100">
                            <button
                              onClick={() => {
                                setEditingAddressId(addrId);
                                setAddressFormData({
                                  type: addr.type || "home",
                                  full_name: addr.full_name || "",
                                  phone: addr.phone || "",
                                  address_line1: addr.address_line1 || "",
                                  address_line2: addr.address_line2 || "",
                                  city: addr.city || "",
                                  state: addr.state || "",
                                  pincode: addr.pincode || "",
                                  is_default: !!addr.is_default,
                                });
                                setShowAddressForm(true);
                              }}
                              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addrId)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= 4. TRACK SHIPMENT TAB ================= */}
            {activeTab === "track" && (
              <div className="space-y-5 max-w-2xl animate-fadeIn">
                <div className="pb-3 border-b border-stone-200">
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    Live Shipment Tracking
                  </h3>
                  <p className="text-xs text-stone-500">
                    Enter your Order ID or Courier AWB number to see live status
                  </p>
                </div>

                <form onSubmit={handleTrackSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Truck className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. NP-2026-1001 or 143249024..."
                      value={trackInput}
                      onChange={(e) => setTrackInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingTracking}
                    className="px-5 py-2.5 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {loadingTracking ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Track</span>
                  </button>
                </form>

                {trackingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {trackingResult && (
                  <div className="bg-gradient-to-br from-[#FAF5ED] to-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          Status
                        </span>
                        <h4 className="text-base font-bold text-[#580C1F] uppercase">
                          {trackingResult.current_status || trackingResult.status || "In Transit"}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          Courier / AWB
                        </span>
                        <p className="text-xs font-mono font-bold text-stone-800">
                          {trackingResult.courier_name || "Shiprocket"} • {trackingResult.awb_code || trackInput}
                        </p>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="py-2 space-y-3">
                      <p className="text-xs font-bold text-stone-700">Tracking Progress</p>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        {["Ordered", "Packed", "Shipped", "Delivered"].map((step, idx) => {
                          const isDone = idx <= 2; // sample state indicator
                          return (
                            <div key={step} className="space-y-1">
                              <div
                                className={`h-2 rounded-full ${
                                  isDone ? "bg-[#580C1F]" : "bg-stone-200"
                                }`}
                              ></div>
                              <span
                                className={`font-bold ${
                                  isDone ? "text-[#580C1F]" : "text-stone-400"
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 5. WISHLIST TAB ================= */}
            {activeTab === "wishlist" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      My Wishlist ({wishlist.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Your saved favorite kurtis and ethnic ensembles
                    </p>
                  </div>
                </div>

                {wishlist.length === 0 ? (
                  <div className="py-14 text-center bg-stone-50 rounded-2xl border border-stone-200 my-4 space-y-3">
                    <Heart className="w-12 h-12 text-rose-300 mx-auto" />
                    <p className="text-sm font-bold text-stone-700">Your wishlist is empty</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Explore our handcrafted collections and save your favorite styles.
                    </p>
                    <button
                      onClick={() => {
                        closeAccountModal();
                        navigate("/new-arrivals");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      <span>Explore Catalog</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-stone-200 p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-xl border border-stone-200 flex-shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                                {item.name}
                              </h4>
                              <button
                                onClick={() => removeFromWishlist(item.id)}
                                className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs font-serif font-bold text-[#580C1F] mt-0.5">
                              ₹{item.price}
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            {/* Size selector */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-stone-500 font-semibold">Size:</span>
                              {["S", "M", "L", "XL"].map((sz) => {
                                const currSize = selectedWishlistSizes[item.id] || "M";
                                return (
                                  <button
                                    key={sz}
                                    onClick={() =>
                                      setSelectedWishlistSizes({
                                        ...selectedWishlistSizes,
                                        [item.id]: sz,
                                      })
                                    }
                                    className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                                      currSize === sz
                                        ? "bg-[#580C1F] text-white"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => handleAddWishlistItemToCart(item)}
                              disabled={addingToCartId === item.id}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{addingToCartId === item.id ? "Adding..." : "Move to Cart"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= 6. SECURITY & PASSWORD TAB ================= */}
            {activeTab === "security" && (
              <div className="space-y-6 max-w-md animate-fadeIn">
                <div className="pb-3 border-b border-stone-200">
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    Password &amp; Security
                  </h3>
                  <p className="text-xs text-stone-500">
                    Update your password to keep your account safe
                  </p>
                </div>

                {passwordMsg.text && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      passwordMsg.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {passwordMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#580C1F]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="w-full py-2.5 bg-[#580C1F] hover:bg-[#8B0000] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {savingPassword ? "Updating Password..." : "Change Password"}
                    </button>
                  </div>
                </form>

                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                  <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Security Tips</p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Never share your OTP or password with anyone. Nari Pehnawa team will never ask for your password.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccountModal;
