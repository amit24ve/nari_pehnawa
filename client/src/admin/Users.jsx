import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    Edit,
    Trash2,
    Shield,
    User,
    Users as UsersIcon,
    Mail,
    Calendar,
    ChevronDown,
    X,
    Check,
    AlertCircle,
    AlertTriangle,
    Loader2,
    Download,
    Eye,
    EyeOff,
    Phone,
    MapPin,
    Package,
    Truck,
    IndianRupee,
    ShoppingBag,
    CheckCircle,
    Lock,
    Key,
    RefreshCw,
    Coins,
    Sparkles,
    Store,
    ExternalLink,
    Send,
    MessageSquare,
    CreditCard
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Users = () => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewDetails, setViewDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Coins Adjustment State
    const [showAdjustCoinsModal, setShowAdjustCoinsModal] = useState(false);
    const [adjustUser, setAdjustUser] = useState(null);
    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustReason, setAdjustReason] = useState("");
    const [adjustLoading, setAdjustLoading] = useState(false);

    // Delete Confirmation Modal State (Allows deleting any user & admin account except self)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Seller Inquiry Reply State inside View Modal
    const [adminReplyText, setAdminReplyText] = useState({});
    const [replyingInquiryId, setReplyingInquiryId] = useState(null);

    const getCurrentAdmin = () => {
        try {
            return JSON.parse(localStorage.getItem("neel_admin_user")) || null;
        } catch {
            return null;
        }
    };
    const currentAdmin = getCurrentAdmin();

    const handleOpenAdjustCoins = (user) => {
        setAdjustUser(user);
        setAdjustAmount("");
        setAdjustReason("");
        setShowAdjustCoinsModal(true);
    };

    const handleAdjustCoinsSubmit = async (e) => {
        e.preventDefault();
        if (!adjustUser || !adjustAmount) return;
        try {
            setAdjustLoading(true);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/coins/admin/adjust`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: adjustUser.id,
                    amount: parseInt(adjustAmount),
                    reason: adjustReason || "Admin manual adjustment"
                })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to adjust coins");
            }
            alert("User coins updated successfully!");
            setShowAdjustCoinsModal(false);
            fetchUsers();
            if (viewDetails?.user?.id === adjustUser.id) {
                handleViewUser(adjustUser.id);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setAdjustLoading(false);
        }
    };

    const handleViewUser = async (userId) => {
        try {
            setViewLoading(true);
            setShowViewModal(true);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/users/${userId}/details`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setViewDetails(data);
            } else {
                throw new Error("Failed to fetch user details");
            }
        } catch (err) {
            console.error("Error fetching user details:", err);
            alert("Could not load user details");
        } finally {
            setViewLoading(false);
        }
    };

    // Fetch all users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/users/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 401) {
                localStorage.removeItem("neel_admin_user");
                localStorage.removeItem("neel_token");
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "customer",
        status: "active",
    });

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: {
                color: "bg-purple-50 text-purple-700 border-purple-200",
                icon: Shield,
            },
            seller: {
                color: "bg-amber-50 text-amber-800 border-amber-200",
                icon: Store,
            },
            customer: {
                color: "bg-cyan-50 text-[#0891b2] border-cyan-200",
                icon: User,
            },
        };
        const config = roleConfig[role] || roleConfig.customer;
        const Icon = config.icon;
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
            >
                <Icon className="w-3.5 h-3.5" />
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Customer"}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        return status === "active" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Active
            </span>
        ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200">
                Inactive
            </span>
        );
    };

    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredUsers = users.filter((user) => {
        const userName = user.full_name || user.name || "";
        const userEmail = user.email || "";
        const userPhone = user.phone || "";
        const userShop = user.shop_name || "";
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            userName.toLowerCase().includes(term) ||
            userEmail.toLowerCase().includes(term) ||
            userPhone.toLowerCase().includes(term) ||
            userShop.toLowerCase().includes(term);

        let matchesRole = true;
        if (roleFilter === "seller") {
            matchesRole = Boolean(user.role === "seller" || user.is_seller);
        } else if (roleFilter === "admin") {
            matchesRole = Boolean(user.role === "admin" || user.role === "super_admin" || user.is_admin);
        } else if (roleFilter === "customer") {
            matchesRole = Boolean(user.role === "customer" || (!user.is_admin && !user.is_seller && user.role !== "admin" && user.role !== "seller"));
        }
        return matchesSearch && matchesRole;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const nameA = a.full_name || a.name || "";
        const nameB = b.full_name || b.name || "";
        if (sortBy === "name") {
            return nameA.localeCompare(nameB);
        } else if (sortBy === "email") {
            return (a.email || "").localeCompare(b.email || "");
        } else if (sortBy === "role") {
            return (a.role || "").localeCompare(b.role || "");
        } else if (sortBy === "date") {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const paginatedUsers = sortedUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const handleEdit = (user) => {
        if (!user) return;
        setSelectedUser(user);
        setFormData({
            name: user.full_name || user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || (user.is_admin ? "admin" : "customer"),
            status: user.status === "inactive" || user.is_active === false ? "inactive" : "active",
            password: "",
        });
        setShowPassword(false);
        setShowEditModal(true);
    };

    const handleGenerateRandomPassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        let pwd = "";
        for (let i = 0; i < 10; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: pwd }));
        setShowPassword(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.name.trim()) {
            alert("Please enter a valid user name");
            return;
        }
        if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const userId = selectedUser.id || selectedUser._id;

            const payload = {
                name: formData.name.trim(),
                role: formData.role,
                status: formData.status,
            };

            if (formData.password && formData.password.trim().length >= 6) {
                payload.password = formData.password.trim();
            }

            const response = await fetch(
                `${API_BASE_URL}/users/${userId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to update user");
            }

            // If password was changed for the current admin, log out immediately and redirect to login
            if (payload.password) {
                let currentUserId = null;
                try {
                    const rawUser = localStorage.getItem("neel_admin_user");
                    if (rawUser) {
                        const parsed = JSON.parse(rawUser);
                        currentUserId = parsed.id || parsed._id;
                    }
                } catch (_) {}

                const isSelf = currentUserId && String(currentUserId) === String(userId);
                if (isSelf) {
                    alert("Your admin password has been changed successfully. You will now be redirected to log in with your new password.");
                    localStorage.removeItem("neel_token");
                    localStorage.removeItem("token");
                    localStorage.removeItem("neel_admin_user");
                    localStorage.removeItem("np_seller_token");
                    window.location.href = "/?login=true&msg=password_changed";
                    return;
                } else {
                    alert(`Password for "${selectedUser.name || selectedUser.email}" has been updated. All active logins for this account across all devices and browsers have been invalidated and will require re-login.`);
                }
            }

            setShowEditModal(false);
            await fetchUsers();
            if (showViewModal && (viewDetails?.user?.id === userId || viewDetails?.user?._id === userId)) {
                handleViewUser(userId);
            }
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update user: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const promptDelete = (u) => {
        if (currentAdmin && (currentAdmin.id === u.id || currentAdmin.email === u.email)) {
            alert("You cannot delete your own currently logged-in admin account.");
            return;
        }
        setUserToDelete(u);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/users/${userToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || "Failed to delete account");
            }
            alert(data.message || "Account deleted successfully.");
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
            if (viewDetails?.user?.id === userToDelete.id) {
                setShowViewModal(false);
                setViewDetails(null);
            }
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user: " + err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleReplySellerInquiry = async (inquiryId) => {
        const replyMsg = (adminReplyText[inquiryId] || "").trim();
        if (!replyMsg) {
            alert("Please enter a reply message.");
            return;
        }
        try {
            setReplyingInquiryId(inquiryId);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/seller/admin/inquiries/${inquiryId}/reply`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reply_message: replyMsg,
                    new_status: "resolved",
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to send reply");
            }
            alert("Reply sent successfully to seller!");
            setAdminReplyText((prev) => ({ ...prev, [inquiryId]: "" }));
            if (viewDetails?.user?.id) {
                handleViewUser(viewDetails.user.id);
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setReplyingInquiryId(null);
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "Role", "Status", "Joined Date", "Orders Count"];
        const rows = sortedUsers.map(u => [
            u.id || "",
            `"${(u.full_name || u.name || "").replace(/"/g, '""')}"`,
            `"${(u.email || "").replace(/"/g, '""')}"`,
            u.role || "customer",
            u.is_active !== false ? "active" : "inactive",
            u.joined_date || u.created_at || "",
            u.orders_count || u.orders || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return String(dateString);
            return new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric"
            }).format(d);
        } catch {
            return String(dateString);
        }
    };

    const roleCounts = {
        all: users.length,
        admin: users.filter((u) => u.role === "admin" || u.role === "super_admin" || u.is_admin).length,
        seller: users.filter((u) => u.role === "seller" || u.is_seller).length,
        customer: users.filter((u) => u.role === "customer" || (!u.is_admin && !u.is_seller && u.role !== "admin" && u.role !== "seller")).length,
    };

    const statusCounts = {
        active: users.filter((u) => u.is_active !== false).length,
        inactive: users.filter((u) => u.is_active === false).length,
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Loading State */}
            {loading && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm w-full">
                    <Loader2 className="w-10 h-10 text-[#0891b2] mx-auto mb-4 animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">Loading users...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-center gap-3 w-full text-slate-800">
                    <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-semibold text-sm">Error loading users</p>
                        <p className="text-slate-600 text-xs mt-0.5 break-words">{error}</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition text-xs font-bold shadow-sm flex-shrink-0 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                        <div className="min-w-0">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight truncate">
                                Users Management
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                Manage registered customer profiles, administrative roles, and accounts
                            </p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="self-start sm:self-auto px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition flex-shrink-0"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>

                    {/* Stats Cards (Cyan Admin Palette) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                        {/* Stat 1: Total Users */}
                        <div
                            onClick={() => { setRoleFilter("all"); setCurrentPage(1); }}
                            className={`bg-white border hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group cursor-pointer ${
                                roleFilter === "all" ? "border-[#0891b2] ring-2 ring-[#0891b2]/20" : "border-slate-100"
                            }`}
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">All Registered Profiles</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.all}</h4>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-2xl text-[#0891b2] group-hover:bg-[#0891b2] group-hover:text-white transition-all duration-300">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 2: Customers */}
                        <div
                            onClick={() => { setRoleFilter("customer"); setCurrentPage(1); }}
                            className={`bg-white border hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group cursor-pointer ${
                                roleFilter === "customer" ? "border-[#0891b2] ring-2 ring-[#0891b2]/20" : "border-slate-100"
                            }`}
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">Verified Shoppers</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.customer}</h4>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-2xl text-[#0891b2] group-hover:bg-[#0891b2] group-hover:text-white transition-all duration-300">
                                <User className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 3: Sellers / Vendors */}
                        <div
                            onClick={() => { setRoleFilter("seller"); setCurrentPage(1); }}
                            className={`bg-white border hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group cursor-pointer ${
                                roleFilter === "seller" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-100"
                            }`}
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sellers &amp; Vendors</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">Partner Merchant Stores</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.seller}</h4>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                <Store className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 4: Admins */}
                        <div
                            onClick={() => { setRoleFilter("admin"); setCurrentPage(1); }}
                            className={`bg-white border hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group cursor-pointer ${
                                roleFilter === "admin" ? "border-purple-500 ring-2 ring-purple-500/20" : "border-slate-100"
                            }`}
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Accounts</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">System Administrators</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.admin}</h4>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                <Shield className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters Bar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 sm:space-y-4 w-full min-w-0">
                        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 w-full">
                            {/* Search */}
                            <div className="flex-1 relative min-w-0">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
                                />
                            </div>

                            {/* Filter Toggle - Mobile */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 hover:border-[#0891b2] transition"
                            >
                                <Filter className="w-4 h-4 text-[#0891b2]" />
                                Filters
                                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                            </button>

                            {/* Role Filter - Desktop */}
                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#0891b2] focus:bg-white transition cursor-pointer"
                                >
                                    <option value="all">All Roles ({roleCounts.all})</option>
                                    <option value="admin">Admin ({roleCounts.admin})</option>
                                    <option value="seller">Seller ({roleCounts.seller})</option>
                                    <option value="customer">Customer ({roleCounts.customer})</option>
                                </select>
                            </div>

                            {/* Sort Selector */}
                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#0891b2] focus:bg-white transition cursor-pointer"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="email">Sort by Email</option>
                                    <option value="role">Sort by Role</option>
                                    <option value="date">Sort by Date</option>
                                </select>
                            </div>
                        </div>

                        {/* Quick Role Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
                            {[
                                { id: "all", label: `All Users (${roleCounts.all})`, icon: UsersIcon },
                                { id: "customer", label: `Customers (${roleCounts.customer})`, icon: User },
                                { id: "seller", label: `Sellers / Vendors (${roleCounts.seller})`, icon: Store },
                                { id: "admin", label: `Administrators (${roleCounts.admin})`, icon: Shield },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = roleFilter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setRoleFilter(tab.id);
                                            setCurrentPage(1);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-xs ${
                                            isActive
                                                ? "bg-[#0891b2] text-white shadow-md shadow-[#0891b2]/20 font-black"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile Filters */}
                        {showFilters && (
                            <div className="md:hidden pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        Filter by Role
                                    </label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#0891b2]"
                                    >
                                        <option value="all">All Roles ({roleCounts.all})</option>
                                        <option value="admin">Admin ({roleCounts.admin})</option>
                                        <option value="seller">Seller ({roleCounts.seller})</option>
                                        <option value="customer">Customer ({roleCounts.customer})</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        Sort by
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#0891b2]"
                                    >
                                        <option value="name">Sort by Name</option>
                                        <option value="email">Sort by Email</option>
                                        <option value="role">Sort by Role</option>
                                        <option value="date">Sort by Date</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Users Table - Desktop */}
                    <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full min-w-0">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full min-w-[700px] divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            User Profile
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Joined Date (IST)
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Orders Count
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <span className="inline-flex items-center gap-1">
                                                <Coins className="w-3.5 h-3.5 text-amber-500" /> Reward Coins
                                            </span>
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {paginatedUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            (user.full_name || user.name || "U").charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">
                                                            {user.full_name || user.name || "N/A"}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                            {user.email || "N/A"}
                                                        </div>
                                                        {(user.shop_name || user.role === "seller" || user.is_seller) && (
                                                            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mt-0.5">
                                                                <Store className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                                <span className="truncate">{user.shop_name || "Merchant Store"}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(
                                                    user.is_active !== false ? "active" : "inactive"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatDate(user.joined_date || user.created_at || user.joinedDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                    {user.orders_count !== undefined ? user.orders_count : (user.orders || 0)} orders
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-fit">
                                                        <Coins className="w-3.5 h-3.5 text-amber-500" /> {(user.coins_balance || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                        ≈ ₹{((user.coins_balance || 0) / 10).toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewUser(user.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl transition text-xs font-bold shadow-xs cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenAdjustCoins(user)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition text-xs font-bold cursor-pointer"
                                                        title="Adjust Coins"
                                                    >
                                                        <Coins className="w-3.5 h-3.5 text-amber-600" /> Coins
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition text-xs font-bold cursor-pointer"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => promptDelete(user)}
                                                        disabled={currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl transition text-xs font-bold shadow-xs cursor-pointer ${
                                                            currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)
                                                                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-40"
                                                                : user.role === "admin" || user.is_admin
                                                                ? "bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                                : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300"
                                                        }`}
                                                        title={
                                                            currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)
                                                                ? "Cannot delete your own logged-in admin account"
                                                                : user.role === "admin" || user.is_admin
                                                                ? "Delete Administrator Account"
                                                                : "Delete User Account"
                                                        }
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Users Cards - Mobile/Tablet */}
                    <div className="lg:hidden space-y-3">
                        {paginatedUsers.map((user, idx) => (
                            <div
                                key={idx}
                                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center">
                                            {(user.full_name || user.name || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">
                                                {user.full_name || user.name || "N/A"}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                {user.email || "N/A"}
                                            </div>
                                            {(user.shop_name || user.role === "seller" || user.is_seller) && (
                                                <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mt-0.5">
                                                    <Store className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                    <span className="truncate">{user.shop_name || "Merchant Store"}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 items-end">
                                        {getRoleBadge(user.role)}
                                        {getStatusBadge(user.is_active !== false ? "active" : "inactive")}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{formatDate(user.created_at || user.joinedDate)}</span>
                                    </div>
                                    <div className="text-right font-bold text-slate-700">
                                        {user.orders_count !== undefined ? user.orders_count : (user.orders || 0)} orders
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        onClick={() => handleViewUser(user.id)}
                                        className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl transition text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition text-xs font-bold cursor-pointer"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => promptDelete(user)}
                                        disabled={currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)}
                                        className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl transition text-xs font-bold shadow-xs cursor-pointer ${
                                            currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)
                                                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-40"
                                                : user.role === "admin" || user.is_admin
                                                ? "bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300"
                                        }`}
                                        title={
                                            currentAdmin && (currentAdmin.id === user.id || currentAdmin.email === user.email)
                                                ? "Cannot delete your own logged-in admin account"
                                                : user.role === "admin" || user.is_admin
                                                ? "Delete Administrator Account"
                                                : "Delete User Account"
                                        }
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs shadow-sm">
                            <span className="text-slate-500 font-medium">
                                Showing page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold disabled:opacity-40 transition"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold disabled:opacity-40 transition shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredUsers.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">
                                No Users Found
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Try adjusting your search or filter criteria
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full mx-auto shadow-2xl overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-slate-200 px-6 py-4 text-slate-900 flex justify-between items-center">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit User Profile</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Update user name, role permissions, account status, and password</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-slate-700 transition p-2 hover:bg-slate-100 rounded-xl cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                            {/* Security Notice for Locked Phone & Email */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-700">
                                <Shield className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-slate-900">Security Policy:</span> Phone number &amp; Email address are permanent unique sign-in credentials and cannot be modified. Full Name, User Role, Status, and Password can be updated.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Full Name (Editable) */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span>Full Name *</span>
                                        <span className="text-[10px] bg-cyan-50 text-[#0891b2] border border-cyan-200 px-2 py-0.5 rounded-full font-bold">Editable</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white transition font-medium"
                                        placeholder="Enter customer full name"
                                    />
                                </div>

                                {/* Email Address (Locked / Read-only) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                                        </span>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                                            <Lock className="w-2.5 h-2.5" /> Locked
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        disabled
                                        value={formData.email || "No email on file"}
                                        className="w-full bg-slate-100/90 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed select-none font-medium"
                                        title="Email is a unique sign-in identifier and cannot be changed"
                                    />
                                </div>

                                {/* Phone Number (Locked / Read-only) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                                        </span>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                                            <Lock className="w-2.5 h-2.5" /> Locked
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={formData.phone || "No phone number on file"}
                                        className="w-full bg-slate-100/90 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed select-none font-medium"
                                        title="Phone number is a unique sign-in identifier and cannot be changed"
                                    />
                                </div>

                                {/* User Role (Editable) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span>User Role *</span>
                                        <span className="text-[10px] bg-cyan-50 text-[#0891b2] border border-cyan-200 px-2 py-0.5 rounded-full font-bold">Editable</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer font-medium"
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="seller">Seller</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Account Status (Editable) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span>Account Status *</span>
                                        <span className="text-[10px] bg-cyan-50 text-[#0891b2] border border-cyan-200 px-2 py-0.5 rounded-full font-bold">Editable</span>
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer font-medium"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Password Update Field - Horizontal row */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-[#0891b2]" /> Set New Password
                                    </label>
                                    <span className="text-[11px] text-slate-400">Optional (leave blank to keep current)</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password || ""}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:border-[#0891b2] transition"
                                            placeholder="Enter new password (min 6 chars)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGenerateRandomPassword}
                                        className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-200 flex-shrink-0 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 text-[#0891b2]" /> Generate Password
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Detailed View Modal (Cyan Admin Palette with IST timestamps) */}
            {showViewModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn min-w-0">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-slate-200 text-slate-900 p-4 sm:p-6 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-100 text-slate-800 font-black text-lg sm:text-xl flex items-center justify-center border border-slate-200 flex-shrink-0">
                                    {viewDetails?.user?.avatar ? (
                                        <img src={viewDetails.user.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        (viewDetails?.user?.name || "U").charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                                            {viewDetails?.user?.name || "Customer Details"}
                                        </h3>
                                        {viewDetails?.user && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] sm:text-xs font-bold">
                                                {viewDetails.user.role?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 flex items-center gap-2 flex-wrap">
                                        <span className="truncate">{viewDetails?.user?.email}</span>
                                        {viewDetails?.user?.phone && (
                                            <>
                                                <span>•</span>
                                                <span className="font-semibold text-slate-700">{viewDetails.user.phone}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewDetails(null);
                                }}
                                className="text-slate-400 hover:text-slate-700 transition p-2 hover:bg-slate-100 rounded-xl flex-shrink-0 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs sm:text-sm bg-slate-50/50 min-w-0 w-full">
                            {viewLoading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-[#0891b2] animate-spin mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Loading user profile & order history...</p>
                                </div>
                            ) : viewDetails ? (
                                <>
                                    {/* Stats Banner (5 Columns) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-slate-400 text-xs block mb-1 font-semibold">Active Orders</span>
                                            <span className="text-2xl font-black font-mono text-slate-800">{viewDetails.stats?.active_orders ?? viewDetails.stats?.total_orders ?? 0}</span>
                                        </div>
                                        <div className="bg-white border border-cyan-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-[#0891b2] text-xs block mb-1 font-semibold">Total Spend</span>
                                            <span className="text-2xl font-black font-mono text-[#0891b2]">₹{(viewDetails.stats?.total_spent || 0).toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-emerald-600 text-xs block mb-1 font-semibold">Delivered</span>
                                            <span className="text-2xl font-black font-mono text-emerald-600">{viewDetails.stats?.delivered_orders || 0}</span>
                                        </div>
                                        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-blue-600 text-xs block mb-1 font-semibold">In Transit</span>
                                            <span className="text-2xl font-black font-mono text-blue-600">{viewDetails.stats?.in_transit_orders || 0}</span>
                                        </div>
                                        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-red-600 text-xs block mb-1 font-semibold">Cancelled</span>
                                            <span className="text-2xl font-black font-mono text-red-600">{viewDetails.stats?.cancelled_orders || 0}</span>
                                        </div>
                                    </div>

                                    {/* Reward Coins Card */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                                                <Coins className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                    Nari Pehnawa Reward Coins
                                                    <span className="text-xs px-2.5 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-full">
                                                        {(viewDetails.user?.coins_balance || 0).toLocaleString()} Coins
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Worth <strong className="text-emerald-700 font-bold">₹{((viewDetails.user?.coins_balance || 0) / 10).toFixed(2)}</strong> (10 Coins = ₹1) • Earned: +{(viewDetails.user?.coins_earned_total || 0).toLocaleString()} • Spent: -{(viewDetails.user?.coins_spent_total || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenAdjustCoins(viewDetails.user)}
                                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                                        >
                                            <Coins className="w-3.5 h-3.5" /> Adjust Coins
                                        </button>
                                    </div>

                                    {/* Customer Overview */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <User className="w-4 h-4 text-[#0891b2]" /> Account Information
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Sign-in Provider:</span>
                                                <span className="font-bold text-slate-800 uppercase bg-cyan-50 text-[#0891b2] px-2 py-0.5 rounded border border-cyan-200 inline-block">
                                                    {viewDetails.user?.auth_provider || "Email"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Joined Date (IST):</span>
                                                <span className="font-bold text-slate-800">{viewDetails.user?.created_at_ist || viewDetails.user?.joined_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Account Status:</span>
                                                <span className={`font-bold ${viewDetails.user?.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {viewDetails.user?.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ══════════════════════════════════════════════════════════
                                        SELLER BUSINESS PROFILE & SUPPORT INQUIRIES (When Seller)
                                    ══════════════════════════════════════════════════════════ */}
                                    {viewDetails.seller_profile && (
                                        <div className="space-y-4">
                                            {/* Store Profile Card */}
                                            <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-xs">
                                                            <Store className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                                                                    {viewDetails.seller_profile.shop_name || "Merchant Store"}
                                                                </h4>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                    viewDetails.seller_profile.kyc_status === 'verified'
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                                                }`}>
                                                                    KYC: {(viewDetails.seller_profile.kyc_status || 'PENDING').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                Partner Vendor • Total Products Listed: <strong className="text-slate-800 font-mono">{viewDetails.seller_products_count || 0}</strong>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to="/admin/sellers"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs"
                                                    >
                                                        <span>Open in Sellers Panel</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>

                                                {/* Profile Details Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                        <span className="text-slate-400 font-semibold block text-[11px]">Merchant Contact</span>
                                                        <span className="font-bold text-slate-900 text-xs block mt-0.5">{viewDetails.seller_profile.name}</span>
                                                        <span className="text-slate-500 text-[11px] block">{viewDetails.seller_profile.phone}</span>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                        <span className="text-slate-400 font-semibold block text-[11px]">Tax Credentials</span>
                                                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                                                            GSTIN: {viewDetails.seller_profile.gstin || "N/A"}
                                                        </span>
                                                        <span className="text-slate-500 text-[11px] block">
                                                            PAN: {viewDetails.seller_profile.pan || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                        <span className="text-slate-400 font-semibold block text-[11px]">Pickup Location</span>
                                                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                                                            {viewDetails.seller_profile.city || "City"}, {viewDetails.seller_profile.state || "State"}
                                                        </span>
                                                        <span className="text-slate-500 text-[11px] block font-mono">
                                                            PIN: {viewDetails.seller_profile.pincode || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Bank Payout Settlement Info */}
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                                        Bank Settlement Account
                                                    </span>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                                        <div>
                                                            <span className="text-slate-400 block">Bank Name</span>
                                                            <strong className="text-slate-800 block truncate">{viewDetails.seller_profile.bank_name || "N/A"}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Account Number</span>
                                                            <strong className="text-slate-800 font-mono block truncate">{viewDetails.seller_profile.account_number || "N/A"}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">IFSC Code</span>
                                                            <strong className="text-slate-800 font-mono block truncate">{viewDetails.seller_profile.ifsc_code || "N/A"}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Beneficiary</span>
                                                            <strong className="text-slate-800 block truncate">{viewDetails.seller_profile.account_holder_name || viewDetails.seller_profile.name || "N/A"}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Seller Inquiries & Help Support History ── */}
                                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4 text-[#0891b2]" />
                                                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                                                            Seller Support Inquiries ({viewDetails.seller_inquiries?.length || 0})
                                                        </h4>
                                                    </div>
                                                    <span className="text-xs bg-cyan-50 text-[#0891b2] border border-cyan-200 px-2.5 py-0.5 rounded-full font-bold">
                                                        {viewDetails.stats?.seller_inquiries_open || 0} Open Tickets
                                                    </span>
                                                </div>

                                                {viewDetails.seller_inquiries && viewDetails.seller_inquiries.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {viewDetails.seller_inquiries.map((inq) => (
                                                            <div
                                                                key={inq.id}
                                                                className={`p-4 rounded-xl border transition space-y-2.5 text-xs ${
                                                                    inq.status === 'open'
                                                                        ? 'bg-amber-50/50 border-amber-200'
                                                                        : 'bg-slate-50 border-slate-200'
                                                                }`}
                                                            >
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0891b2]/10 text-[#0891b2] border border-[#0891b2]/20">
                                                                            {inq.category || "General Support"}
                                                                        </span>
                                                                        <h5 className="font-bold text-slate-900">{inq.subject}</h5>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[11px] text-slate-400">
                                                                            {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ""}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                            inq.status === 'resolved'
                                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                                : 'bg-amber-100 text-amber-800'
                                                                        }`}>
                                                                            {inq.status || "open"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seller Query:</span>
                                                                    <p className="text-slate-800 leading-relaxed font-sans">{inq.message}</p>
                                                                </div>

                                                                {/* Admin Reply or Reply Box */}
                                                                {inq.admin_reply ? (
                                                                    <div className="bg-cyan-50/80 border border-cyan-200 rounded-xl p-3 text-xs space-y-1">
                                                                        <div className="flex items-center justify-between text-[11px] font-bold text-[#0891b2]">
                                                                            <span>Admin Response ({inq.replied_by || "Admin Support"}):</span>
                                                                            <span className="text-slate-500 font-normal">
                                                                                {inq.replied_at ? new Date(inq.replied_at).toLocaleDateString() : ""}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-slate-800 leading-relaxed">{inq.admin_reply}</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="pt-1 space-y-2">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Write reply to seller..."
                                                                                value={adminReplyText[inq.id] || ""}
                                                                                onChange={(e) =>
                                                                                    setAdminReplyText((prev) => ({
                                                                                        ...prev,
                                                                                        [inq.id]: e.target.value,
                                                                                    }))
                                                                                }
                                                                                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0891b2]"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                disabled={replyingInquiryId === inq.id}
                                                                                onClick={() => handleReplySellerInquiry(inq.id)}
                                                                                className="px-3.5 py-2 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                                                                            >
                                                                                {replyingInquiryId === inq.id ? (
                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                ) : (
                                                                                    <Send className="w-3.5 h-3.5" />
                                                                                )}
                                                                                <span>Reply</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic py-3 bg-slate-50 rounded-xl text-center">
                                                        No help &amp; support inquiries submitted yet by this seller.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Saved Delivery Addresses */}
                                    <div>
                                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#0891b2]" /> Saved Delivery Addresses ({viewDetails.addresses?.length || 0})
                                        </h4>
                                        {viewDetails.addresses && viewDetails.addresses.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {viewDetails.addresses.map((addr, idx) => (
                                                    <div key={idx} className="bg-white border border-slate-200 hover:border-cyan-400 transition rounded-2xl p-4 relative shadow-sm">
                                                        {addr.is_default && (
                                                            <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-cyan-50 text-[#0891b2] border border-cyan-200 text-[10px] font-bold rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                        <div className="font-bold text-slate-800 mb-1">
                                                            {addr.full_name || viewDetails.user?.name}
                                                        </div>
                                                        <p className="text-xs text-slate-600 leading-relaxed">
                                                            {addr.address_line1}
                                                            {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                                                            <br />
                                                            {addr.city}, {addr.state} - <strong className="text-slate-800 font-mono">{addr.pincode}</strong>
                                                        </p>
                                                        {addr.phone && (
                                                            <p className="text-xs text-[#0891b2] mt-2 font-semibold">
                                                                Phone: {addr.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 shadow-sm">
                                                No saved addresses found for this customer.
                                            </div>
                                        )}
                                    </div>

                                    {/* Full Order & Shipment Tracking History */}
                                    <div>
                                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-[#0891b2]" /> Order &amp; Tracking History ({viewDetails.orders?.length || 0})
                                        </h4>
                                        {viewDetails.orders && viewDetails.orders.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewDetails.orders.map((ord, idx) => {
                                                    const isCancelled = ['cancelled', 'canceled', 'failed'].includes((ord.status || '').toLowerCase());
                                                    return (
                                                        <div key={idx} className={`bg-white border transition rounded-2xl p-4 shadow-sm ${
                                                            isCancelled ? 'border-red-200 hover:border-red-400 bg-red-50/20' : 'border-slate-200 hover:border-cyan-400'
                                                        }`}>
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                                                                <div>
                                                                    <span className={`font-bold text-sm font-mono ${isCancelled ? 'text-red-700' : 'text-[#0891b2]'}`}>
                                                                        Order #{ord.order_number || ord.order_id}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 block mt-0.5">
                                                                        Placed on: <strong className="text-slate-700 font-medium">{ord.created_at_ist}</strong>
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                        ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                        isCancelled ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                        'bg-cyan-50 text-[#0891b2] border border-cyan-200'
                                                                    }`}>
                                                                        {ord.status.toUpperCase()}
                                                                    </span>
                                                                    <span className={`font-bold text-sm font-mono ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                                        ₹{ord.total.toLocaleString("en-IN")}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Items Summary with Images */}
                                                            {ord.items && ord.items.length > 0 && (
                                                                <div className="space-y-2 mb-3 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
                                                                    {ord.items.map((it, itemIdx) => {
                                                                        const imgUrl = it.product_image || it.image || it.image_url;
                                                                        return (
                                                                            <div key={itemIdx} className="flex items-center gap-3 text-slate-700">
                                                                                {imgUrl && (
                                                                                    <img
                                                                                        src={imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`}
                                                                                        alt={it.name || it.product_name}
                                                                                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                                    />
                                                                                )}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-semibold text-slate-800 truncate">
                                                                                        {it.name || it.product_name || "Product Item"}
                                                                                    </p>
                                                                                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                                                                        {it.size && <span>Size: <strong className="text-slate-700">{it.size}</strong></span>}
                                                                                        {it.color && <span>Color: <strong className="text-slate-700">{it.color}</strong></span>}
                                                                                        <span>Qty: <strong className="text-slate-700">{it.quantity || 1}</strong></span>
                                                                                    </p>
                                                                                </div>
                                                                                <span className="font-bold text-slate-900 whitespace-nowrap font-mono">
                                                                                    ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Cancellation details if present */}
                                                            {isCancelled && ord.cancellation_reason && (
                                                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                                                    <strong>Cancellation Reason:</strong> {ord.cancellation_reason}
                                                                </div>
                                                            )}

                                                            {/* Shipment & Live Tracking Information */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                                                <div className="text-slate-500">
                                                                    <span>Payment: </span>
                                                                    <strong className="text-slate-800 uppercase">{ord.payment_status}</strong> ({ord.payment_method})
                                                                </div>
                                                                {ord.awb_code ? (
                                                                    <div className="text-right sm:text-right text-[#0891b2] font-semibold flex items-center justify-end gap-1.5 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                                                                        <Truck className="w-3.5 h-3.5 text-[#0891b2]" />
                                                                        <span>AWB: <strong className="text-slate-800 font-mono">{ord.awb_code}</strong></span>
                                                                        {ord.courier_name && <span className="text-slate-500 font-normal">({ord.courier_name})</span>}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-right text-slate-400">
                                                                        Shipment: <span className="text-slate-600 font-medium">{ord.shipment_status || "Pending Dispatch"}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 shadow-sm">
                                                No orders placed yet.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center gap-3">
                            <button
                                onClick={() => {
                                    if (viewDetails?.user) {
                                        handleEdit(viewDetails.user);
                                    }
                                }}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <Edit className="w-3.5 h-3.5 text-[#0891b2]" /> Edit Profile
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewDetails(null);
                                }}
                                className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Coins Modal */}
            {showAdjustCoinsModal && adjustUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-5 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-white/20 rounded-xl text-lg flex items-center justify-center">
                                    <Coins className="w-5 h-5 text-slate-950" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-base">Adjust User Coins</h3>
                                    <p className="text-xs text-amber-950/80">{adjustUser.name || adjustUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAdjustCoinsModal(false)}
                                className="p-1.5 hover:bg-white/20 rounded-xl transition text-slate-950 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustCoinsSubmit} className="p-6 space-y-4">
                            <div className="bg-amber-50 p-3.5 rounded-2xl text-xs text-amber-900 flex justify-between border border-amber-200">
                                <span>Current Balance:</span>
                                <span className="font-bold font-mono">
                                    {(adjustUser.coins_balance || 0).toLocaleString()} Coins (₹{((adjustUser.coins_balance || 0) / 10).toFixed(2)})
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Coin Amount * (+ to add, - to deduct)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="e.g. 100 or -50"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-mono text-slate-800"
                                />
                                {adjustAmount && !isNaN(adjustAmount) && (
                                    <span className="text-[11px] text-slate-500 mt-1 block">
                                        Equivalent Value: <strong>₹{(Math.abs(parseInt(adjustAmount)) / 10).toFixed(2)}</strong> (10 Coins = ₹1)
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Reason / Note *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="e.g. Welcome bonus, Customer loyalty reward, Correction"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-slate-800"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustCoinsModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading || !adjustAmount}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    {adjustLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Adjustment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permanent Account Deletion Modal (Supports Users and Admin Role Deletion) */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 animate-fadeIn">
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 flex-shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Delete {userToDelete.role === "admin" || userToDelete.is_admin ? "Administrator Account" : "User Account"}
                                </h3>
                                <p className="text-xs text-slate-500">This action cannot be undone.</p>
                            </div>
                        </div>

                        {/* Special Warning if Target is an Administrator */}
                        {(userToDelete.role === "admin" || userToDelete.is_admin) && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5 leading-relaxed">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-bold block text-red-950 mb-0.5">Warning: Deleting Admin Access</strong>
                                    You are about to permanently delete an Administrator account. This person will immediately lose all administrative dashboard access.
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Account Name:</span>
                                <span className="font-bold text-slate-800">{userToDelete.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Email:</span>
                                <span className="font-mono text-slate-700">{userToDelete.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Role:</span>
                                <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded-full ${
                                    userToDelete.role === "admin" || userToDelete.is_admin
                                        ? "bg-purple-100 text-purple-700"
                                        : userToDelete.role === "seller"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-cyan-100 text-[#0891b2]"
                                }`}>
                                    {userToDelete.role || "customer"}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to permanently delete this account? All associated delivery addresses and active mobile sessions will also be purged.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-xs transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Confirm &amp; Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
