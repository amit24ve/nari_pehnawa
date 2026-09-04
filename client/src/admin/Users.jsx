import React, { useState, useEffect } from "react";
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
    RefreshCw
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Users = () => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewDetails, setViewDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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
        const matchesSearch =
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
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
        setSelectedUser(user);
        setFormData({
            name: user.full_name || user.name || "",
            email: user.email || "",
            role: user.role || "customer",
            status: user.is_active !== false ? "active" : "inactive",
            password: "",
        });
        setShowPassword(false);
        setShowEditModal(true);
    };

    const handleOpenResetPassword = (user) => {
        setSelectedUser(user);
        setNewPassword("");
        setShowPassword(false);
        setShowResetPasswordModal(true);
    };

    const handleGenerateRandomPassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        let pwd = "";
        for (let i = 0; i < 10; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pwd);
        setShowPassword(true);
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.trim().length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        try {
            setResetSubmitting(true);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const userId = selectedUser.id || selectedUser._id;

            const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: newPassword.trim() }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to reset password");
            }

            alert(`Password for ${selectedUser.name || selectedUser.email} has been reset successfully!`);
            setShowResetPasswordModal(false);
            setNewPassword("");
        } catch (err) {
            console.error("Error resetting password:", err);
            alert("Failed to reset password: " + err.message);
        } finally {
            setResetSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const userId = selectedUser.id || selectedUser._id;

            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                is_active: formData.status === "active",
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

            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update user: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to delete user");
            }

            fetchUsers();
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user: " + err.message);
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
        admin: users.filter((u) => u.role === "admin" || u.is_admin).length,
        customer: users.filter((u) => u.role === "customer" || (!u.role && !u.is_admin)).length,
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
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 w-full">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-red-800 font-semibold text-sm">Error loading users</p>
                        <p className="text-red-600 text-xs mt-0.5 break-words">{error}</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-xs font-bold shadow-sm flex-shrink-0"
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
                        <div className="bg-white border border-slate-100 hover:shadow-md hover:border-[#0891b2]/30 transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group">
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">All Registered Profiles</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.all}</h4>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-2xl text-[#0891b2] group-hover:bg-[#0891b2] group-hover:text-white transition-all duration-300">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 2: Admins */}
                        <div className="bg-white border border-slate-100 hover:shadow-md hover:border-[#0891b2]/30 transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group">
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Accounts</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">System Administrators</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.admin}</h4>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                <Shield className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 3: Customers */}
                        <div className="bg-white border border-slate-100 hover:shadow-md hover:border-[#0891b2]/30 transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group">
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">Verified Shoppers</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{roleCounts.customer}</h4>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-2xl text-[#0891b2] group-hover:bg-[#0891b2] group-hover:text-white transition-all duration-300">
                                <User className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Stat 4: Active Users */}
                        <div className="bg-white border border-slate-100 hover:shadow-md hover:border-[#0891b2]/30 transition-all duration-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between group">
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Accounts</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">Currently Enabled</span>
                                <h4 className="text-2xl font-black font-mono mt-2 text-slate-800">{statusCounts.active}</h4>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                <CheckCircle className="w-5 h-5" />
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
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {paginatedUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-cyan-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 text-[#0891b2] font-bold text-sm flex items-center justify-center flex-shrink-0">
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
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewUser(user.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-[#0891b2] border border-cyan-200 rounded-xl hover:bg-[#0891b2] hover:text-white transition text-xs font-bold shadow-sm"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition text-xs font-bold"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenResetPassword(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-600 hover:text-white transition text-xs font-bold shadow-xs"
                                                        title="Set or Reset User Password"
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                        Password
                                                    </button>
                                                    {user.role !== "admin" && !user.is_admin && user.email !== "admin@naripehnawa.com" && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition text-xs font-bold"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </button>
                                                    )}
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
                                        <div className="w-10 h-10 rounded-full bg-cyan-100 text-[#0891b2] font-bold text-sm flex items-center justify-center">
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
                                        className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-50 text-[#0891b2] border border-cyan-200 rounded-xl hover:bg-[#0891b2] hover:text-white transition text-xs font-bold shadow-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition text-xs font-bold"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleOpenResetPassword(user)}
                                        className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-600 hover:text-white transition text-xs font-bold"
                                    >
                                        <Key className="w-4 h-4" />
                                        Password
                                    </button>
                                    {user.role !== "admin" && !user.is_admin && user.email !== "admin@naripehnawa.com" && (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition text-xs font-bold"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    )}
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
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full mx-4 shadow-2xl overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#0891b2] to-[#06b6d4] p-5 text-white flex justify-between items-center shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold">Edit User</h3>
                                <p className="text-xs text-cyan-100 mt-0.5">Update profile permissions and active status</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    User Role *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Account Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Optional Password Update Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                                    <span>Set New Password (Optional)</span>
                                    <span className="text-[11px] text-slate-400 font-normal">Leave blank to keep current</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password || ""}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
                                        placeholder="Enter new password (min 6 chars)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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
                        {/* Modal Header (Cyan Gradient) */}
                        <div className="bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white p-4 sm:p-6 flex justify-between items-center shadow-md flex-shrink-0">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/20 text-white font-black text-lg sm:text-xl flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner flex-shrink-0">
                                    {viewDetails?.user?.avatar ? (
                                        <img src={viewDetails.user.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        (viewDetails?.user?.name || "U").charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                                            {viewDetails?.user?.name || "Customer Details"}
                                        </h3>
                                        {viewDetails?.user && (
                                            <span className="px-2 py-0.5 bg-white/20 text-white border border-white/30 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-sm">
                                                {viewDetails.user.role?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-cyan-100 mt-0.5 sm:mt-1 flex items-center gap-2 flex-wrap">
                                        <span className="truncate">{viewDetails?.user?.email}</span>
                                        {viewDetails?.user?.phone && (
                                            <>
                                                <span>•</span>
                                                <span className="font-semibold text-white">{viewDetails.user.phone}</span>
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
                                className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-xl flex-shrink-0"
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
                                    {/* Stats Banner */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-slate-400 text-xs block mb-1 font-semibold">Total Orders</span>
                                            <span className="text-2xl font-black font-mono text-slate-800">{viewDetails.stats?.total_orders || 0}</span>
                                        </div>
                                        <div className="bg-white border border-cyan-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-[#0891b2] text-xs block mb-1 font-semibold">Total Spend</span>
                                            <span className="text-2xl font-black font-mono text-[#0891b2]">₹{(viewDetails.stats?.total_spent || 0).toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-emerald-600 text-xs block mb-1 font-semibold">Delivered</span>
                                            <span className="text-2xl font-black font-mono text-emerald-600">{viewDetails.stats?.delivered_orders || 0}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                            <span className="text-blue-600 text-xs block mb-1 font-semibold">In Transit</span>
                                            <span className="text-2xl font-black font-mono text-blue-600">{viewDetails.stats?.in_transit_orders || 0}</span>
                                        </div>
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
                                                {viewDetails.orders.map((ord, idx) => (
                                                    <div key={idx} className="bg-white border border-slate-200 hover:border-cyan-400 transition rounded-2xl p-4 shadow-sm">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                                                            <div>
                                                                <span className="font-bold text-[#0891b2] text-sm font-mono">
                                                                    Order #{ord.order_id}
                                                                </span>
                                                                <span className="text-xs text-slate-400 block mt-0.5">
                                                                    Placed on: <strong className="text-slate-700 font-medium">{ord.created_at_ist}</strong>
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                    ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                    ord.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                    'bg-cyan-50 text-[#0891b2] border border-cyan-200'
                                                                }`}>
                                                                    {ord.status.toUpperCase()}
                                                                </span>
                                                                <span className="font-bold text-slate-900 text-sm font-mono">
                                                                    ₹{ord.total.toLocaleString("en-IN")}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Items Summary */}
                                                        {ord.items && ord.items.length > 0 && (
                                                            <div className="space-y-1.5 mb-3 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
                                                                {ord.items.map((it, itemIdx) => (
                                                                    <div key={itemIdx} className="flex justify-between items-center text-slate-700">
                                                                        <span className="truncate pr-2">
                                                                            {it.name || it.product_name} <span className="text-slate-400 font-bold">x{it.quantity}</span>
                                                                        </span>
                                                                        <span className="font-bold text-slate-900 whitespace-nowrap font-mono">
                                                                            ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                                                                        </span>
                                                                    </div>
                                                                ))}
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
                                                ))}
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
                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewDetails(null);
                                }}
                                className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Reset Password Modal */}
            {showResetPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full mx-4 shadow-2xl overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Key className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Reset Password</h3>
                                    <p className="text-xs text-amber-100 mt-0.5">
                                        For {selectedUser.full_name || selectedUser.name || selectedUser.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowResetPasswordModal(false)}
                                className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span>
                                    Enter a new password or generate a secure temporary password. Once saved, the user will be able to log in with this password immediately.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateRandomPassword}
                                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Generate Random Password
                            </button>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPasswordModal(false)}
                                    disabled={resetSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {resetSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
