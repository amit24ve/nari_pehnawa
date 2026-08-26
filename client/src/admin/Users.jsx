import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Edit,
    Trash2,
    Shield,
    User,
    Mail,
    Calendar,
    ChevronDown,
    X,
    Check,
    AlertCircle,
    Loader2,
    Download,
    Eye,
    Phone,
    MapPin,
    Package,
    Truck,
    ExternalLink,
    IndianRupee,
    Clock,
    Globe,
    ShoppingBag
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Users = () => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
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
                color: "bg-purple-50 text-purple-700 border border-purple-200",
                icon: Shield,
            },
            customer: {
                color: "bg-blue-50 text-blue-700 border border-blue-200",
                icon: User,
            },
        };
        const config = roleConfig[role] || roleConfig.customer;
        const Icon = config.icon;
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
                <Icon className="w-3.5 h-3.5" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        return status === "active" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Active
            </span>
        ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
                Inactive
            </span>
        );
    };

    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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
        if (sortBy === "name") {
            const nameA = a.full_name || a.name || "";
            const nameB = b.full_name || b.name || "";
            return nameA.localeCompare(nameB);
        }
        if (sortBy === "email") {
            return (a.email || "").localeCompare(b.email || "");
        }
        if (sortBy === "role") {
            return (a.role || "").localeCompare(b.role || "");
        }
        if (sortBy === "date") {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "User ID,Name,Email,Role,Status,Created At\n";
        filteredUsers.forEach(u => {
            csvContent += `"${u.id}","${u.full_name || u.name || 'N/A'}","${u.email}","${u.role}","${u.is_active !== false ? 'Active' : 'Inactive'}","${u.created_at || ''}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.full_name || user.name || "",
            email: user.email || "",
            role: user.role || "customer",
            status: user.is_active !== false ? "active" : "inactive",
        });
        setShowEditModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/users/${selectedUser.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        full_name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        is_active: formData.status === "active",
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update user");
            }

            const updatedUser = await response.json();

            // Update user in state
            setUsers(
                users.map((u) =>
                    u.id === selectedUser.id
                        ? {
                              ...u,
                              full_name: updatedUser.full_name,
                              email: updatedUser.email,
                              role: updatedUser.role,
                              is_active: updatedUser.is_active,
                          }
                        : u,
                ),
            );

            setShowEditModal(false);
            setFormData({
                name: "",
                email: "",
                role: "customer",
                status: "active",
            });
            alert("User updated successfully!");
        } catch (err) {
            console.error("Error updating user:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this user? This action cannot be undone.",
            )
        ) {
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
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete user");
            }

            setUsers(users.filter((u) => u.id !== userId));
            alert("User deleted successfully!");
        } catch (err) {
            console.error("Error deleting user:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const roleCounts = {
        all: users.length,
        admin: users.filter((u) => u.role === "admin").length,
        customer: users.filter((u) => u.role === "customer").length,
    };

    const statusCounts = {
        active: users.filter((u) => u.is_active !== false).length,
        inactive: users.filter((u) => u.is_active === false).length,
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Loading State */}
            {loading && (
                <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl p-12 text-center">
                    <Loader2 className="w-12 h-12 text-[#d4af37] mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading users...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-red-300 font-medium">
                            Error loading users
                        </p>
                        <p className="text-red-400 text-sm mt-1">{error}</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-red-900/40 text-red-300 rounded-lg hover:bg-red-900/60 transition-colors text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-2">
                            Users Management
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Manage all registered users and their roles
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {[
                            {
                                label: "Total Users",
                                count: roleCounts.all,
                                color: "from-gray-700 to-gray-800",
                                icon: User,
                            },
                            {
                                label: "Admins",
                                count: roleCounts.admin,
                                color: "from-purple-900/40 to-purple-800/40",
                                icon: Shield,
                            },
                            {
                                label: "Customers",
                                count: roleCounts.customer,
                                color: "from-blue-900/40 to-blue-800/40",
                                icon: User,
                            },
                            {
                                label: "Active Users",
                                count: statusCounts.active,
                                color: "from-green-900/40 to-green-800/40",
                                icon: Check,
                            },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`bg-gradient-to-br ${stat.color} border border-gray-800/50 rounded-xl p-4 hover:scale-105 transition-transform duration-200`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-100">
                                        {stat.count}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 md:p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                                />
                            </div>

                            {/* Filter Toggle - Mobile */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f1724] border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#d4af37] transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                                />
                            </button>

                            {/* Role Filter - Desktop */}
                            <div className="hidden md:flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-colors cursor-pointer"
                                >
                                    <option value="all">
                                        All Roles ({roleCounts.all})
                                    </option>
                                    <option value="admin">
                                        Admin ({roleCounts.admin})
                                    </option>
                                    <option value="customer">
                                        Customer ({roleCounts.customer})
                                    </option>
                                </select>
                            </div>

                            {/* Sort Selector */}
                            <div className="hidden md:flex items-center gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-colors cursor-pointer"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="email">Sort by Email</option>
                                    <option value="role">Sort by Role</option>
                                    <option value="date">Sort by Date</option>
                                </select>
                            </div>

                            {/* CSV Export Button */}
                            <button
                                onClick={handleExportCSV}
                                className="px-4 py-2.5 bg-[#111827] border border-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                                <Download className="w-4 h-4 text-[#d4af37]" />
                                Export CSV
                            </button>
                        </div>

                        {/* Mobile Filters */}
                        {showFilters && (
                            <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Filter by Role
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) =>
                                        setRoleFilter(e.target.value)
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-colors"
                                >
                                    <option value="all">
                                        All Roles ({roleCounts.all})
                                    </option>
                                    <option value="admin">
                                        Admin ({roleCounts.admin})
                                    </option>
                                    <option value="customer">
                                        Customer ({roleCounts.customer})
                                    </option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Users Table - Desktop */}
                    <div className="hidden lg:block bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-[#0f1724] border-b border-gray-800/50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Joined Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Orders
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {paginatedUsers.map((user, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-[#0f1724]/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-200">
                                                        {user.full_name ||
                                                            user.name ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(
                                                    user.is_active !== false
                                                        ? "active"
                                                        : "inactive",
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDate(
                                                        user.joined_date ||
                                                            user.created_at ||
                                                            user.joinedDate,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-300">
                                                    {user.orders_count !== undefined ? user.orders_count : (user.orders || 0)} orders
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleViewUser(user.id)
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded-lg hover:bg-blue-900/60 transition-colors text-sm font-medium"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(user)
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d4af37] text-[#0f1724] rounded-lg hover:bg-[#c49d2f] transition-colors text-sm font-medium"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    {user.role !== "admin" && !user.is_admin && user.email !== "admin@naripehnawa.com" && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 text-red-300 border border-red-800/50 rounded-lg hover:bg-red-900/60 transition-colors text-sm font-medium"
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
                    <div className="lg:hidden space-y-4">
                        {paginatedUsers.map((user, idx) => (
                            <div
                                key={idx}
                                className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl p-4 hover:border-[#d4af37]/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-200 mb-1">
                                            {user.full_name ||
                                                user.name ||
                                                "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                            <Mail className="w-3 h-3" />
                                            {user.email || "N/A"}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {getRoleBadge(user.role)}
                                        {getStatusBadge(
                                            user.is_active !== false
                                                ? "active"
                                                : "inactive",
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {formatDate(
                                                user.created_at ||
                                                    user.joinedDate,
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-right">
                                        {user.orders_count !== undefined ? user.orders_count : (user.orders || 0)} orders
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewUser(user.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded-lg hover:bg-blue-900/60 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#d4af37] text-[#0f1724] rounded-lg hover:bg-[#c49d2f] transition-colors text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    {user.role !== "admin" && !user.is_admin && user.email !== "admin@naripehnawa.com" && (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/40 text-red-300 border border-red-800/50 rounded-lg hover:bg-red-900/60 transition-colors text-sm font-medium"
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
                        <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-xl text-xs mt-6">
                            <span className="text-gray-400">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-850 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-850 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredUsers.length === 0 && (
                        <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl p-12 text-center">
                            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                No Users Found
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Try adjusting your search or filter criteria
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="border-b border-gray-800/50 p-4 md:p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-100">
                                    Edit User
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Update user information and permissions
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-800/50 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-4 md:p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    User Role *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value,
                                        })
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-colors cursor-pointer"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Account Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value,
                                        })
                                    }
                                    className="w-full bg-[#0f1724] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37] transition-colors cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0f1724] rounded-lg hover:bg-[#c49d2f] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {/* User Detailed View Modal (Addresses, Orders & Tracking in IST) */}
            {showViewModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                    <div className="bg-[#0f1724] border border-gray-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
                        {/* Modal Header */}
                        <div className="border-b border-gray-800/80 p-5 sm:p-6 flex justify-between items-center bg-[#111827]/80">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#550000] text-amber-300 font-extrabold text-lg flex items-center justify-center shadow-md">
                                    {viewDetails?.user?.avatar ? (
                                        <img src={viewDetails.user.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        (viewDetails?.user?.name || "U").charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg sm:text-xl font-bold text-white">
                                            {viewDetails?.user?.name || "Customer Details"}
                                        </h3>
                                        {viewDetails?.user && getRoleBadge(viewDetails.user.role)}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                        <span>{viewDetails?.user?.email}</span>
                                        {viewDetails?.user?.phone && (
                                            <>
                                                <span>•</span>
                                                <span className="text-amber-400/90">{viewDetails.user.phone}</span>
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
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                            {viewLoading ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mx-auto mb-3" />
                                    <p className="text-gray-400">Loading user profile & order history...</p>
                                </div>
                            ) : viewDetails ? (
                                <>
                                    {/* Stats Banner */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-[#162032] border border-gray-800 rounded-2xl p-3.5">
                                            <span className="text-gray-400 text-xs block mb-1">Total Orders</span>
                                            <span className="text-xl font-extrabold text-white">{viewDetails.stats?.total_orders || 0}</span>
                                        </div>
                                        <div className="bg-[#162032] border border-gray-800 rounded-2xl p-3.5">
                                            <span className="text-gray-400 text-xs block mb-1">Total Spend</span>
                                            <span className="text-xl font-extrabold text-[#d4af37]">₹{(viewDetails.stats?.total_spent || 0).toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="bg-[#162032] border border-gray-800 rounded-2xl p-3.5">
                                            <span className="text-gray-400 text-xs block mb-1">Delivered</span>
                                            <span className="text-xl font-extrabold text-emerald-400">{viewDetails.stats?.delivered_orders || 0}</span>
                                        </div>
                                        <div className="bg-[#162032] border border-gray-800 rounded-2xl p-3.5">
                                            <span className="text-gray-400 text-xs block mb-1">In Transit / Active</span>
                                            <span className="text-xl font-extrabold text-blue-400">{viewDetails.stats?.in_transit_orders || 0}</span>
                                        </div>
                                    </div>

                                    {/* Customer Overview */}
                                    <div className="bg-[#162032]/60 border border-gray-800 rounded-2xl p-4 space-y-2">
                                        <h4 className="font-bold text-gray-200 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <User className="w-4 h-4 text-[#d4af37]" /> Account Overview
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300 pt-1">
                                            <div>
                                                <span className="text-gray-500 block">Sign-in Provider:</span>
                                                <span className="font-semibold text-white uppercase">{viewDetails.user?.auth_provider || "Email"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Joined Date (IST):</span>
                                                <span className="font-semibold text-white">{viewDetails.user?.created_at_ist || viewDetails.user?.joined_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Account Status:</span>
                                                <span className={`font-semibold ${viewDetails.user?.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {viewDetails.user?.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Saved Delivery Addresses */}
                                    <div>
                                        <h4 className="font-bold text-gray-200 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#d4af37]" /> Saved Delivery Addresses ({viewDetails.addresses?.length || 0})
                                        </h4>
                                        {viewDetails.addresses && viewDetails.addresses.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {viewDetails.addresses.map((addr, idx) => (
                                                    <div key={idx} className="bg-[#162032] border border-gray-800 rounded-2xl p-4 relative">
                                                        {addr.is_default && (
                                                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                        <div className="font-bold text-white mb-1">
                                                            {addr.full_name || viewDetails.user?.name}
                                                        </div>
                                                        <p className="text-xs text-gray-300 leading-relaxed">
                                                            {addr.address_line1}
                                                            {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                                                            <br />
                                                            {addr.city}, {addr.state} - <strong className="text-white">{addr.pincode}</strong>
                                                        </p>
                                                        {addr.phone && (
                                                            <p className="text-xs text-amber-400/90 mt-2 font-medium">
                                                                Phone: {addr.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-[#162032]/40 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                                                No saved addresses found.
                                            </div>
                                        )}
                                    </div>

                                    {/* Full Order & Shipment Tracking History */}
                                    <div>
                                        <h4 className="font-bold text-gray-200 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-[#d4af37]" /> Order &amp; Tracking History ({viewDetails.orders?.length || 0})
                                        </h4>
                                        {viewDetails.orders && viewDetails.orders.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewDetails.orders.map((ord, idx) => (
                                                    <div key={idx} className="bg-[#162032] border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-colors">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3 mb-3">
                                                            <div>
                                                                <span className="font-extrabold text-white text-sm">
                                                                    Order #{ord.order_id}
                                                                </span>
                                                                <span className="text-xs text-gray-400 block mt-0.5">
                                                                    Placed on: <strong className="text-gray-300">{ord.created_at_ist}</strong>
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                    ord.status === 'delivered' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' :
                                                                    ord.status === 'cancelled' ? 'bg-red-900/40 text-red-300 border border-red-700/50' :
                                                                    'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                                                                }`}>
                                                                    {ord.status.toUpperCase()}
                                                                </span>
                                                                <span className="font-bold text-[#d4af37] text-sm">
                                                                    ₹{ord.total.toLocaleString("en-IN")}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Items Summary */}
                                                        {ord.items && ord.items.length > 0 && (
                                                            <div className="space-y-1.5 mb-3 bg-[#0f1724]/70 p-2.5 rounded-xl text-xs">
                                                                {ord.items.map((it, itemIdx) => (
                                                                    <div key={itemIdx} className="flex justify-between items-center text-gray-300">
                                                                        <span className="truncate pr-2">
                                                                            {it.name || it.product_name} <span className="text-gray-500 font-semibold">x{it.quantity}</span>
                                                                        </span>
                                                                        <span className="font-semibold text-white whitespace-nowrap">
                                                                            ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Shipment & Live Tracking Information */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                                            <div className="text-gray-400">
                                                                <span>Payment: </span>
                                                                <strong className="text-white uppercase">{ord.payment_status}</strong> ({ord.payment_method})
                                                            </div>
                                                            {ord.awb_code ? (
                                                                <div className="text-right sm:text-right text-blue-400 font-medium flex items-center justify-end gap-1.5">
                                                                    <Truck className="w-3.5 h-3.5" />
                                                                    <span>AWB: <strong className="text-white">{ord.awb_code}</strong></span>
                                                                    {ord.courier_name && <span className="text-gray-400">({ord.courier_name})</span>}
                                                                </div>
                                                            ) : (
                                                                <div className="text-right text-gray-500">
                                                                    Shipment: {ord.shipment_status || "Pending Dispatch"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-[#162032]/40 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                                                No orders placed yet.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-800 bg-[#111827]/80 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewDetails(null);
                                }}
                                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
