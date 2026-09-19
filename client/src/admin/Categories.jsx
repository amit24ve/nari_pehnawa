import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Plus,
    FolderOpen,
    Edit2,
    Trash2,
    Tag,
    Loader2,
    Image,
    ExternalLink,
    Upload,
    Link2,
    Download,
    Search,
    Copy,
    Check
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

const emptyForm = {
    name: "",
    tagline: "",
    image: "",
    link: "",
    border_color: "#8B0000",
    display_order: 0,
    is_active: true,
};

const InputField = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            {label} {required && <span className="text-cyan-600 font-extrabold">*</span>}
        </label>
        {children}
    </div>
);

const Categories = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreviewError, setImgError] = useState(false);
    // Image upload
    const [imgTab, setImgTab] = useState("url"); // "url" | "upload"
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [copiedId, setCopiedId] = useState(null);
    const [copiedModal, setCopiedModal] = useState(false);

    const copyToClipboard = (text, id = null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (id) {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            setCopiedModal(true);
            setTimeout(() => setCopiedModal(false), 2000);
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.tagline || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "order") return (a.display_order || 0) - (b.display_order || 0);
        return 0;
    });

    const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
    const paginatedCategories = sortedCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Category ID,Name,Tagline,Link,Display Order,Active\n";
        filteredCategories.forEach(cat => {
            csvContent += `"${cat.id || cat._id}","${cat.name}","${cat.tagline || ''}","${cat.link || ''}",${cat.display_order || 0},"${cat.is_active ? 'Yes' : 'No'}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "categories_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_BASE_URL}/categories/`);
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    /* Auto-generate link from name */
    const handleNameChange = (name) => {
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const autoLink = slug ? `/category/${slug}` : "";
        setFormData((f) => ({
            ...f,
            name,
            link: autoLink,
        }));
    };

    /* Upload image file to backend */
    const handleImageUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setImgError(false);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${API_BASE_URL}/upload/image`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Upload failed");
            }
            const { url } = await res.json();
            // url = "/uploads/xxxxx.jpg"  → full URL for display
            const fullUrl = `${API_BASE_URL}${url}`;
            setFormData((f) => ({ ...f, image: fullUrl }));
        } catch (e) {
            setError(`Image upload: ${e.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const url = editingCategory
                ? `${API_BASE_URL}/categories/${editingCategory._id || editingCategory.id}`
                : `${API_BASE_URL}/categories/`;
            const method = editingCategory ? "PUT" : "POST";

            const payload = {
                name: formData.name,
                tagline: formData.tagline || null,
                image: formData.image || "",
                link:
                    formData.link ||
                    `/category/${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                border_color: formData.border_color || "#8B0000",
                display_order: Number(formData.display_order) || 0,
                is_active: formData.is_active,
            };

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.status === 401) {
                localStorage.removeItem("neel_admin_user");
                localStorage.removeItem("neel_token");
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(
                    err.detail ||
                        `Failed to ${editingCategory ? "update" : "create"} category`,
                );
            }

            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
            localStorage.setItem("categories_updated_at", Date.now().toString());
            setShowModal(false);
            setEditing(null);
            setFormData(emptyForm);
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cat) => {
        setFormData({
            name: cat.name || "",
            tagline: cat.tagline || "",
            image: cat.image || "",
            link: cat.link || "",
            border_color: cat.border_color || "#8B0000",
            display_order: cat.display_order ?? 0,
            is_active: cat.is_active ?? true,
        });
        setEditing(cat);
        setImgError(false);
        setImgTab("url");
        setShowModal(true);
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`Delete category "${cat.name}"?`)) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/categories/${cat._id || cat.id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );
            if (res.status === 401) {
                localStorage.removeItem("neel_admin_user");
                localStorage.removeItem("neel_token");
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }
            if (!res.ok) throw new Error("Delete failed");
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
            localStorage.setItem("categories_updated_at", Date.now().toString());
        } catch (e) {
            setError(e.message);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setFormData(emptyForm);
        setImgError(false);
        setImgTab("url");
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        Categories
                    </h2>
                    <p className="text-sm text-gray-400">
                        Manage categories — they appear dynamically in the
                        navbar &amp; hero sections.
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-md transition-all duration-200 cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[2.5]" /> Add Category
                </button>
            </div>

            {/* Controls */}
            <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                </div>
                
                <div className="flex gap-3 w-full md:w-auto justify-end">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-[#0b1220] border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="order">Sort by Order</option>
                    </select>

                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-[#0f1724] border border-gray-850 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 hover:bg-gray-800 transition cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-cyan-400" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400/60 hover:text-red-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16">
                    <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">
                        No categories yet
                    </p>
                    <p className="text-gray-600 text-sm">
                        Create your first category and it will appear in the
                        navbar!
                    </p>
                    <button
                        onClick={openAdd}
                        className="mt-4 px-6 py-2.5 bg-[#d4af37] text-[#0f1724] rounded-lg font-semibold text-sm"
                    >
                        Create First Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {paginatedCategories.map((cat) => (
                        <div
                            key={cat._id || cat.id}
                            className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-700/50 transition-all duration-300 group"
                        >
                            {/* Hero image thumbnail */}
                            <div
                                className="h-40 relative overflow-hidden"
                                style={{
                                    background: cat.image
                                        ? undefined
                                        : `linear-gradient(135deg, ${cat.border_color || "#8B0000"}33, ${cat.border_color || "#8B0000"}11)`,
                                }}
                            >
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Image className="w-12 h-12 text-gray-600" />
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                {/* Active badge */}
                                <div className="absolute top-2.5 right-2.5">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            cat.is_active
                                                ? "bg-green-500/90 text-white"
                                                : "bg-gray-500/90 text-gray-200"
                                        }`}
                                    >
                                        {cat.is_active ? "Active" : "Hidden"}
                                    </span>
                                </div>

                                {/* Order badge */}
                                <div className="absolute top-2.5 left-2.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-gray-300">
                                        #{cat.display_order || 0}
                                    </span>
                                </div>

                                {/* Name on image */}
                                <div className="absolute bottom-2 left-3 right-3">
                                    <p className="text-white text-sm font-bold drop-shadow truncate">
                                        {cat.name}
                                    </p>
                                    {cat.tagline && (
                                        <p className="text-white/70 text-[10px] truncate">
                                            {cat.tagline}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    {/* Link & Copy */}
                                    <div className="flex items-center gap-1.5 truncate max-w-[75%]">
                                        <a
                                            href={cat.link || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#d4af37] transition-colors truncate"
                                        >
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            {cat.link || "No link set"}
                                        </a>
                                        {cat.link && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    copyToClipboard(cat.link, cat.id || cat._id);
                                                }}
                                                title="Copy Category URL Path"
                                                className="p-1 rounded hover:bg-gray-700/70 text-gray-400 hover:text-cyan-400 transition flex-shrink-0"
                                            >
                                                {copiedId === (cat.id || cat._id) ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Color dot */}
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                                        style={{
                                            background:
                                                cat.border_color || "#8B0000",
                                        }}
                                        title="Border color"
                                    />
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-bold border border-red-500/30 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />{" "}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-xl text-xs mt-6">
                    <span className="text-gray-400">Showing page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3.5 py-2 bg-[#0f1724] border border-gray-850 rounded-xl text-white font-semibold disabled:opacity-40 font-bold"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-2 bg-[#0f1724] border border-gray-850 rounded-xl text-white font-semibold disabled:opacity-40 font-bold"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto text-left">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingCategory
                                        ? "Edit Category"
                                        : "Add New Category"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Categories appear automatically in navbar
                                    &amp; hero sections
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditing(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Name */}
                            <InputField label="Category Name" required>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleNameChange(e.target.value)
                                    }
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                    placeholder="e.g. Anarkali Suits"
                                />
                            </InputField>

                            {/* Tagline */}
                            <InputField label="Tagline (Hero Subtitle)">
                                <input
                                    type="text"
                                    value={formData.tagline}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tagline: e.target.value,
                                        })
                                    }
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                    placeholder="e.g. Anarkalis Made For Forever Moments!"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Shown in the hero banner on the category
                                    page
                                </p>
                            </InputField>

                            {/* ── Hero Banner Image (URL or Upload) ── */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                    Hero Banner Image
                                </label>

                                {/* Tab switcher */}
                                <div className="flex rounded-xl overflow-hidden border border-slate-300 mb-3 bg-slate-100 p-1">
                                    {["url", "upload"].map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setImgTab(tab)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                                imgTab === tab
                                                    ? "bg-cyan-400 text-black shadow-sm"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            {tab === "url" ? (
                                                <>
                                                    <Link2 className="w-3.5 h-3.5" />{" "}
                                                    Paste URL
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3.5 h-3.5" />{" "}
                                                    Upload File
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* URL tab */}
                                {imgTab === "url" && (
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                image: e.target.value,
                                            });
                                            setImgError(false);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                        placeholder="https://images.unsplash.com/photo-xxx"
                                    />
                                )}

                                {/* Upload tab */}
                                {imgTab === "upload" && (
                                    <div
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="w-full border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-slate-50 hover:bg-slate-100/70 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                                                <p className="text-sm text-slate-600 font-medium">
                                                    Uploading…
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mb-2 transition-colors" />
                                                <p className="text-sm text-slate-700 font-semibold group-hover:text-cyan-600 transition-colors">
                                                    Click to select image
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    JPEG, PNG, WebP — Max 10 MB
                                                </p>
                                            </>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={(e) =>
                                                handleImageUpload(
                                                    e.target.files?.[0],
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {/* Preview */}
                                {formData.image && !imagePreviewError && (
                                    <div className="mt-2 rounded-xl overflow-hidden h-28 bg-slate-100 relative border border-slate-200 shadow-sm">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    image: "",
                                                })
                                            }
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600/80 transition-colors cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                {imagePreviewError && (
                                    <p className="text-xs text-red-500 mt-1">
                                        ⚠️ Could not load image — check URL or
                                        re-upload
                                    </p>
                                )}
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    This image appears as the full-width hero
                                    banner on the category page
                                </p>
                            </div>

                            {/* Link with Auto-Generation and Copy Button */}
                            <InputField label="Category URL Path">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={formData.link}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                link: e.target.value,
                                            })
                                        }
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-28 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition font-mono"
                                        placeholder="/category/anarkali-kurtis"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(formData.link)}
                                        disabled={!formData.link}
                                        className="absolute right-1.5 px-2.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                                    >
                                        {copiedModal ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-800" />
                                                <span className="text-black">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 text-black" />
                                                <span>Copy Path</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                    <span>⚡ Auto-generated from name. Change only if needed.</span>
                                    {formData.link && (
                                        <span className="text-cyan-700 font-mono text-[10px] font-bold">
                                            Live: {formData.link}
                                        </span>
                                    )}
                                </p>
                            </InputField>

                            {/* Row: border color + display order */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Accent Color">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.border_color}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    border_color:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={formData.border_color}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    border_color:
                                                        e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition font-mono"
                                            placeholder="#8B0000"
                                        />
                                    </div>
                                </InputField>

                                <InputField label="Display Order">
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.display_order}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                display_order: e.target.value,
                                            })
                                        }
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                        placeholder="0"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Lower = appears first in navbar
                                    </p>
                                </InputField>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-sm text-slate-900 font-bold">
                                        Show in Navbar
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Toggle visibility in navbar &amp;
                                        category list
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((f) => ({
                                            ...f,
                                            is_active: !f.is_active,
                                        }))
                                    }
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                                        formData.is_active
                                            ? "bg-cyan-500"
                                            : "bg-slate-300"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                                            formData.is_active
                                                ? "translate-x-5"
                                                : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {submitting && (
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                    )}
                                    {submitting
                                        ? "Saving…"
                                        : editingCategory
                                          ? "Update Category"
                                          : "Create Category"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditing(null);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-black border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
