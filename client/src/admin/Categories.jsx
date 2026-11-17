import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Plus,
    FolderOpen,
    Edit2,
    Trash2,
    Tag,
    Loader2,
    Image as ImageIcon,
    ExternalLink,
    Upload,
    Link2,
    Download,
    Search,
    Copy,
    Check,
    Sparkles,
    Shirt,
    Gem,
    Footprints,
    ShoppingBag,
    Flame,
    Crown,
    Layers,
    SlidersHorizontal,
    PlusCircle,
    Hash,
    Settings,
    Grid,
    CheckCircle2
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

export const PRESET_DEPARTMENTS = [
    { id: "Women", label: "Women's Wear", icon: "Sparkles", description: "Kurtis, Tops, Sarees, Lehengas & Ethnic Wear" },
    { id: "Men", label: "Men's Wear", icon: "Shirt", description: "Kurtas, Shirts, Ethnic & Festive Wear" },
    { id: "Jewellery", label: "Jewellery", icon: "Gem", description: "Necklaces, Earrings, Bangles & Accessories" },
    { id: "Footwear", label: "Footwear", icon: "Footprints", description: "Juttis, Mojaris, Heels & Ethnic Footwear" },
    { id: "Accessories", label: "Accessories", icon: "ShoppingBag", description: "Bags, Clutches, Dupattas & Fashion Accents" },
    { id: "Special Collections", label: "Special Collections", icon: "Flame", description: "Mega Sale, New Arrivals & Festive Deals" },
];

export const DEPT_ICON_MAP = {
    Sparkles,
    Shirt,
    Gem,
    Footprints,
    ShoppingBag,
    Flame,
    Crown,
    Tag,
    Layers,
    Folder: FolderOpen,
};

export const AVAILABLE_DEPT_ICONS = [
    { id: "Sparkles", label: "Women / Ethnic", Icon: Sparkles },
    { id: "Shirt", label: "Men / Shirts", Icon: Shirt },
    { id: "Gem", label: "Jewellery", Icon: Gem },
    { id: "Footprints", label: "Footwear", Icon: Footprints },
    { id: "ShoppingBag", label: "Bags & Accessories", Icon: ShoppingBag },
    { id: "Flame", label: "Sale & Offers", Icon: Flame },
    { id: "Crown", label: "Bridal & Luxury", Icon: Crown },
    { id: "Tag", label: "Deals & Badges", Icon: Tag },
    { id: "Layers", label: "Multi-Category", Icon: Layers },
    { id: "Folder", label: "General Folder", Icon: FolderOpen },
];

export const renderDepartmentIcon = (dept, className = "w-4 h-4") => {
    if (!dept) return <Layers className={className} />;
    const iconKey = typeof dept === "object" ? dept.icon : dept;
    const nameKey = (typeof dept === "object" ? dept.name : dept) || "";

    // Check if custom image URL
    if (typeof dept === "object" && dept.image) {
        return <img src={dept.image} alt={nameKey} className={`${className} object-contain rounded`} />;
    }
    if (typeof iconKey === "string" && (iconKey.startsWith("http") || iconKey.startsWith("/"))) {
        return <img src={iconKey} alt={nameKey} className={`${className} object-contain rounded`} />;
    }

    if (iconKey && DEPT_ICON_MAP[iconKey]) {
        const Comp = DEPT_ICON_MAP[iconKey];
        return <Comp className={className} />;
    }

    const n = nameKey.toLowerCase();
    if (n.includes("women") || n.includes("clothing") || n.includes("ethnic")) return <Sparkles className={className} />;
    if (n.includes("men")) return <Shirt className={className} />;
    if (n.includes("jewel")) return <Gem className={className} />;
    if (n.includes("foot") || n.includes("shoe")) return <Footprints className={className} />;
    if (n.includes("access") || n.includes("bag")) return <ShoppingBag className={className} />;
    if (n.includes("sale") || n.includes("special") || n.includes("mega") || n.includes("offer")) return <Flame className={className} />;

    return <Layers className={className} />;
};

const emptyForm = {
    name: "",
    department: "Women",
    category_type: "regular", // "regular" | "special_collection" | "sale" | "new_arrival"
    badge: "POPULAR",
    tagline: "",
    image: "",
    link: "",
    border_color: "#8B0000",
    display_order: 0,
    is_active: true,
    sub_categories: [],
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

    // Sub-Categories Tag Input in Modal
    const [subCatInput, setSubCatInput] = useState("");

    // Sub-Categories Manager Modal
    const [showSubCatModal, setShowSubCatModal] = useState(false);
    const [subCatSelectedDept, setSubCatSelectedDept] = useState("Women");
    const [subCatNewName, setSubCatNewName] = useState("");
    const [subCatSaving, setSubCatSaving] = useState(false);
    const [subCatError, setSubCatError] = useState(null);
    const [subCatSuccess, setSubCatSuccess] = useState(null);
    const [subCatModalCategory, setSubCatModalCategory] = useState(null);
    const [quickSubInput, setQuickSubInput] = useState("");
    const [quickSubSaving, setQuickSubSaving] = useState(false);

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
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [customDeptInput, setCustomDeptInput] = useState(false);
    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Dynamic Departments State (Live CRUD from Backend)
    const [departments, setDepartments] = useState([]);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptForm, setDeptForm] = useState({ name: "", icon: "Sparkles", image: "", display_order: 1 });
    const [deptSubmitting, setDeptSubmitting] = useState(false);
    const [deptError, setDeptError] = useState(null);
    const [deptSuccess, setDeptSuccess] = useState(null);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/departments/`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch departments", e);
        }
    };

    const handleSaveDepartment = async (e) => {
        e.preventDefault();
        const trimmed = deptForm.name?.trim();
        if (!trimmed) {
            setDeptError("Department name is required");
            return;
        }
        setDeptSubmitting(true);
        setDeptError(null);
        setDeptSuccess(null);
        try {
            const token = getToken();
            const url = editingDept
                ? `${API_BASE_URL}/departments/${editingDept.id || editingDept._id}`
                : `${API_BASE_URL}/departments/`;
            const method = editingDept ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: trimmed,
                    icon: deptForm.icon || "Sparkles",
                    image: deptForm.image?.trim() || null,
                    display_order: Number(deptForm.display_order) || 0
                })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to save department");
            }
            setDeptSuccess(editingDept ? `Department updated & all categories/products synced to "${trimmed}"!` : `Department "${trimmed}" created successfully!`);
            setDeptForm({ name: "", icon: "Sparkles", image: "", display_order: departments.length + 1 });
            setEditingDept(null);
            await fetchDepartments();
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
        } catch (err) {
            setDeptError(err.message);
        } finally {
            setDeptSubmitting(false);
        }
    };

    const handleDeleteDepartment = async (dept) => {
        if (!window.confirm(`Delete department "${dept.name}"? Any linked categories and products will be safely moved to "Women".`)) return;
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/departments/${dept.id || dept._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to delete department");
            }
            await fetchDepartments();
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
        } catch (err) {
            alert(err.message);
        }
    };

    const availableDepartments = departments.length > 0 
        ? departments.map(d => d.name)
        : Array.from(
            new Set([
                "Women",
                "Men",
                "Jewellery",
                "Footwear",
                "Accessories",
                "Special Collections",
                ...categories.map((c) => c.department).filter(Boolean),
            ])
        );

    const filteredCategories = categories.filter(cat => {
        const catDept = (cat.department || "Women").toLowerCase();
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.tagline || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            catDept.includes(searchTerm.toLowerCase()) ||
            (cat.sub_categories || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let matchesDept = true;
        if (filterDepartment !== "all") {
            const filterLower = filterDepartment.toLowerCase();
            if (filterLower === "women" || filterLower === "clothing") {
                matchesDept = catDept === "women" || catDept === "clothing" || catDept === "women's wear";
            } else {
                matchesDept = catDept === filterLower;
            }
        }
        return matchesSearch && matchesDept;
    });

    const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "order") return (a.display_order || 0) - (b.display_order || 0);
        return 0;
    });

    const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
    const paginatedCategories = sortedCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Category ID,Department,Name,Type,SubCategories,Badge,Tagline,Link,Display Order,Active\n";
        filteredCategories.forEach(cat => {
            const subStr = (cat.sub_categories || []).join("; ");
            csvContent += `"${cat.id || cat._id}","${cat.department || 'Women'}","${cat.name}","${cat.category_type || 'regular'}","${subStr}","${cat.badge || ''}","${cat.tagline || ''}","${cat.link || ''}",${cat.display_order || 0},"${cat.is_active ? 'Yes' : 'No'}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "categories_subcategories_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchCategories();
        fetchDepartments();
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

    /* Sub-Category Tag Management inside Modal */
    const handleAddSubCategory = (e) => {
        if (e) e.preventDefault();
        const trimmed = subCatInput.trim();
        if (!trimmed) return;
        const currentSubs = formData.sub_categories || [];
        if (!currentSubs.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            setFormData(prev => ({
                ...prev,
                sub_categories: [...currentSubs, trimmed]
            }));
        }
        setSubCatInput("");
    };

    const handleRemoveSubCategory = (subToRemove) => {
        setFormData(prev => ({
            ...prev,
            sub_categories: (prev.sub_categories || []).filter(s => s !== subToRemove)
        }));
    };

    /* Department-wise Sub-Category Manager Handlers */
    const handleAddSubCategoryToDept = async (e) => {
        if (e) e.preventDefault();
        const trimmed = subCatNewName.trim();
        if (!trimmed) {
            setSubCatError("Please enter a sub-category name");
            return;
        }
        setSubCatSaving(true);
        setSubCatError(null);
        setSubCatSuccess(null);
        try {
            const targetDept = subCatSelectedDept || "Women";
            const names = trimmed.split(",").map(s => s.trim()).filter(Boolean);
            for (const name of names) {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                const res = await fetch(`${API_BASE_URL}/categories/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        name: name,
                        department: targetDept,
                        category_type: "regular",
                        link: `/category/${slug}`,
                        image: "/placeholder.jpg",
                        is_active: true,
                        display_order: categories.filter(c => (c.department || "Women").toLowerCase() === targetDept.toLowerCase()).length + 1
                    })
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || `Failed to create sub-category "${name}"`);
                }
            }
            setSubCatSuccess(`Sub-categor${names.length > 1 ? 'ies' : 'y'} added successfully under "${targetDept}"!`);
            setSubCatNewName("");
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
            localStorage.setItem("categories_updated_at", Date.now().toString());
        } catch (err) {
            setSubCatError(err.message);
        } finally {
            setSubCatSaving(false);
        }
    };

    const handleDeleteSubCategoryFromModal = async (catItem) => {
        if (!window.confirm(`Delete sub-category "${catItem.name}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/categories/${catItem._id || catItem.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to delete sub-category");
            }
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
            localStorage.setItem("categories_updated_at", Date.now().toString());
        } catch (err) {
            alert(err.message);
        }
    };

    /* Quick Subcategory Modal Handlers */
    const handleQuickAddSub = async (e) => {
        e.preventDefault();
        const trimmed = quickSubInput.trim();
        if (!trimmed || !subCatModalCategory) return;
        setQuickSubSaving(true);
        try {
            const catId = subCatModalCategory._id || subCatModalCategory.id;
            const res = await fetch(`${API_BASE_URL}/categories/${catId}/subcategories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ name: trimmed })
            });
            if (!res.ok) throw new Error("Failed to add sub-category");
            const updated = await res.json();
            setSubCatModalCategory(updated);
            setQuickSubInput("");
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
        } catch (err) {
            alert(err.message);
        } finally {
            setQuickSubSaving(false);
        }
    };

    const handleQuickDeleteSub = async (subName) => {
        if (!subCatModalCategory) return;
        try {
            const catId = subCatModalCategory._id || subCatModalCategory.id;
            const res = await fetch(`${API_BASE_URL}/categories/${catId}/subcategories/${encodeURIComponent(subName)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error("Failed to delete sub-category");
            const updated = await res.json();
            setSubCatModalCategory(updated);
            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
        } catch (err) {
            alert(err.message);
        }
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
                name: formData.name.trim(),
                department: formData.department?.trim() || "Women",
                category_type: formData.category_type || "regular",
                badge: formData.badge || "POPULAR",
                tagline: formData.tagline?.trim() || null,
                image: formData.image || "",
                link:
                    formData.link ||
                    `/category/${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                border_color: formData.border_color || "#8B0000",
                display_order: Number(formData.display_order) || 0,
                is_active: formData.is_active,
                sub_categories: formData.sub_categories || [],
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
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.detail ||
                        `Failed to ${editingCategory ? "update" : "create"} category`,
                );
            }

            await fetchCategories();
            window.dispatchEvent(new Event("categoriesUpdated"));
            localStorage.setItem("categories_updated_at", Date.now().toString());
            setShowModal(false);
            setEditing(null);
            setFormData(emptyForm);
            setCustomDeptInput(false);
            setSubCatInput("");
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cat) => {
        const catDept = cat.department || "Women";
        setFormData({
            name: cat.name || "",
            department: catDept,
            category_type: cat.category_type || "regular",
            badge: cat.badge || "POPULAR",
            tagline: cat.tagline || "",
            image: cat.image || "",
            link: cat.link || "",
            border_color: cat.border_color || "#8B0000",
            display_order: cat.display_order ?? 0,
            is_active: cat.is_active ?? true,
            sub_categories: Array.isArray(cat.sub_categories) ? [...cat.sub_categories] : [],
        });
        setEditing(cat);
        setCustomDeptInput(!departments.some(d => (d.name || "").toLowerCase() === catDept.toLowerCase()));
        setImgError(false);
        setImgTab("url");
        setSubCatInput("");
        setShowModal(true);
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`Delete category "${cat.name}" and all associated sub-category mappings?`)) return;
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

    const openAdd = (presetDept = null) => {
        const targetDept = presetDept || (filterDepartment !== "all" ? filterDepartment : "Women");
        setEditing(null);
        setFormData({
            ...emptyForm,
            department: targetDept,
            sub_categories: [],
        });
        setCustomDeptInput(!departments.some(p => (p.name || "").toLowerCase() === targetDept.toLowerCase()));
        setImgError(false);
        setImgTab("url");
        setSubCatInput("");
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <span>Categories &amp; Sub-Categories</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                        Multi-tier hierarchy for Women, Men, Jewellery, Footwear &amp; Special Collections.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setEditingDept(null);
                            setDeptForm({ name: "", icon: "Sparkles", image: "", display_order: (departments.length || 5) + 1 });
                            setDeptError(null);
                            setDeptSuccess(null);
                            setShowDeptModal(true);
                        }}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <Settings className="w-3.5 h-3.5 text-[#0891b2]" /> Manage Categories
                    </button>
                    <button
                        onClick={() => {
                            setEditingDept(null);
                            setDeptForm({ name: "", icon: "Sparkles", image: "", display_order: (departments.length || 5) + 1 });
                            setDeptError(null);
                            setDeptSuccess(null);
                            setShowDeptModal(true);
                        }}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer hover:border-cyan-400"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5] text-[#0891b2]" /> Add Category
                    </button>
                    <button
                        onClick={() => openAdd()}
                        className="flex items-center gap-2 bg-[#0891b2] hover:bg-[#06b6d4] text-white px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-sm transition-all duration-200 cursor-pointer"
                    >
                        <Tag className="w-4 h-4" /> Add Sub-Category
                    </button>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    type="button"
                    onClick={() => { setFilterDepartment("all"); setCurrentPage(1); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        filterDepartment === "all"
                            ? "bg-[#0891b2] text-white shadow-md shadow-[#0891b2]/20 font-black"
                            : "bg-white text-slate-700 hover:text-[#0891b2] border border-slate-200"
                    }`}
                >
                    <Grid className="w-3.5 h-3.5" />
                    <span>All Categories ({categories.length})</span>
                </button>
                {(departments.length > 0 ? departments : PRESET_DEPARTMENTS.map(p => ({ name: p.id, icon: p.icon, id: p.id }))).map((dept) => {
                    const deptName = dept.name || dept.id || dept;
                    const count = categories.filter((c) => {
                        const cd = (c.department || "Women").toLowerCase();
                        const dn = deptName.toLowerCase();
                        if (dn === "women" || dn === "clothing") return cd === "women" || cd === "clothing";
                        return cd === dn;
                    }).length;
                    const isSelected = filterDepartment.toLowerCase() === deptName.toLowerCase();
                    return (
                        <div key={dept.id || dept._id || deptName} className="flex items-center flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => { setFilterDepartment(deptName); setCurrentPage(1); }}
                                className={`px-3.5 py-2 rounded-l-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                        ? "bg-[#0891b2] text-white shadow-md shadow-[#0891b2]/20 font-black"
                                        : "bg-white text-slate-700 hover:text-[#0891b2] border-y border-l border-slate-200"
                                }`}
                            >
                                {renderDepartmentIcon(dept, isSelected ? "w-3.5 h-3.5 text-white" : "w-3.5 h-3.5 text-[#0891b2]")}
                                <span>{deptName}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                }`}>
                                    {count}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const match = departments.find(d => (d.name || "").toLowerCase() === deptName.toLowerCase()) || {
                                        name: deptName,
                                        icon: dept.icon || "Sparkles",
                                        display_order: 1
                                    };
                                    setEditingDept(match);
                                    setDeptForm({
                                        name: match.name,
                                        icon: match.icon || "Sparkles",
                                        image: match.image || "",
                                        display_order: match.display_order ?? 1
                                    });
                                    setDeptError(null);
                                    setDeptSuccess(null);
                                    setShowDeptModal(true);
                                }}
                                title={`Edit / Rename ${deptName}`}
                                className={`px-2 py-2 rounded-r-xl border-y border-r transition-all cursor-pointer ${
                                    isSelected
                                        ? "bg-[#0891b2] text-white border-y border-r border-[#0891b2] hover:bg-[#06b6d4]"
                                        : "bg-white text-slate-400 hover:text-[#0891b2] border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
                <button
                    type="button"
                    onClick={() => {
                        setEditingDept(null);
                        setDeptForm({ name: "", icon: "Sparkles", image: "", display_order: (departments.length || 5) + 1 });
                        setDeptError(null);
                        setDeptSuccess(null);
                        setShowDeptModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer bg-cyan-50 text-[#0891b2] border border-cyan-200 hover:bg-cyan-100 flex-shrink-0"
                >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> New Department
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search category or sub-category..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] focus:bg-white transition"
                    />
                </div>
                
                <div className="flex gap-3 w-full md:w-auto justify-end">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#0891b2] focus:bg-white cursor-pointer"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="order">Sort by Sequence</option>
                    </select>

                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-100 transition cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-[#0891b2]" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-xs font-semibold flex-1">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#0891b2] animate-spin" />
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
                    <FolderOpen className="w-16 h-16 text-cyan-500/40 mx-auto mb-4" />
                    <p className="text-slate-900 text-lg font-bold mb-1">
                        {filterDepartment === "all" ? "No categories found" : `No categories in "${filterDepartment}" yet`}
                    </p>
                    <p className="text-slate-500 text-xs max-w-md mx-auto mb-5">
                        {filterDepartment === "all" 
                            ? "Create your first category and add sub-categories like Anarkali, Straight Cut, Sleeveless, etc."
                            : `Add your first category and ethnic styles under ${filterDepartment}.`}
                    </p>
                    <button
                        onClick={() => openAdd(filterDepartment !== "all" ? filterDepartment : "Women")}
                        className="px-5 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white font-extrabold rounded-xl text-xs flex items-center gap-2 mx-auto transition cursor-pointer shadow-md"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        {filterDepartment === "all" ? "Create First Category" : `Add Category to ${filterDepartment}`}
                    </button>
                </div>
            ) : (
                /* Category Cards Grid with Subcategories Chips */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {paginatedCategories.map((cat) => {
                        const subCats = Array.isArray(cat.sub_categories) ? cat.sub_categories : [];
                        const isSpecial = cat.department === "Special Collections" || cat.category_type === "sale" || cat.category_type === "new_arrival";
                        
                        return (
                            <div
                                key={cat._id || cat.id}
                                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Thumbnail Image */}
                                    <div className="h-40 relative overflow-hidden bg-slate-100">
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
                                                <ImageIcon className="w-10 h-10 text-slate-300" />
                                            </div>
                                        )}

                                        {/* Status Top Right */}
                                        <div className="absolute top-2.5 right-2.5">
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                                                    cat.is_active
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-slate-700 text-white"
                                                }`}
                                            >
                                                {cat.is_active ? "Active" : "Hidden"}
                                            </span>
                                        </div>

                                        {/* Sequence Top Left */}
                                        <div className="absolute top-2.5 left-2.5">
                                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-white/95 text-slate-900 border border-slate-200 shadow-sm backdrop-blur-xs">
                                                #{cat.display_order ?? 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Category Details Bar */}
                                    <div className="p-3.5 bg-white">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-extrabold text-slate-900 text-sm truncate font-serif" title={cat.name}>
                                                    {cat.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                                                    {renderDepartmentIcon(cat.department, "w-3 h-3 text-[#0891b2]")}
                                                    <span>{cat.department || "Women"}</span>
                                                </div>
                                                {cat.tagline && (
                                                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                                        {cat.tagline}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card bottom footer */}
                                <div className="p-3.5 bg-white space-y-2.5">
                                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                        <span className="font-mono text-[11px] truncate text-slate-700 max-w-[85%]">
                                            {cat.link || `/category/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                copyToClipboard(cat.link || `/category/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, cat.id || cat._id);
                                            }}
                                            title="Copy Category URL Path"
                                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#0891b2] transition cursor-pointer flex-shrink-0"
                                        >
                                            {copiedId === (cat.id || cat._id) ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs mt-6 shadow-xs">
                    <span className="text-slate-500">Showing page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ── MODAL: ADD / EDIT CATEGORY (WITH SUB-CATEGORIES & CLASSIFICATION) ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[92vh] overflow-y-auto text-left">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span>{editingCategory ? "Edit Sub-Category" : "Add New Sub-Category"}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Select parent category, upload image, and configure URL routing.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditing(null);
                                }}
                                className="p-2 hover:bg-slate-200 rounded-xl transition text-slate-400 hover:text-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Parent Category Dropdown */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                    Category <span className="text-cyan-600 font-extrabold">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.department || "Women"}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-xs"
                                >
                                    {availableDepartments.map((deptName) => (
                                        <option key={deptName} value={deptName} className="font-medium text-slate-800">
                                            {deptName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-Category Name */}
                            <InputField label="Sub-Category Name" required>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 transition font-medium"
                                    placeholder="e.g. Sleeveless Kurtis, Halter Neck Tops, Anarkali Suits"
                                />
                            </InputField>

                            {/* Category URL Path (Auto-generated from name, fully customizable/editable) */}
                            <InputField label="Category URL Path (Auto-Generated &amp; Fully Editable)" required>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        required
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-28 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 transition font-mono font-medium"
                                        placeholder="/category/sleeveless-kurtis"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(formData.link)}
                                        disabled={!formData.link}
                                        className="absolute right-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                            </InputField>

                            {/* Category Banner Image */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                    Category Banner Image
                                </label>

                                <div className="flex rounded-xl overflow-hidden border border-slate-300 mb-2.5 bg-slate-100 p-1">
                                    {["url", "upload"].map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setImgTab(tab)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                                imgTab === tab
                                                    ? "bg-[#0891b2] text-white shadow-xs"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            {tab === "url" ? (
                                                <>
                                                    <Link2 className="w-3 h-3" /> Paste URL
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3 h-3" /> Upload File
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {imgTab === "url" && (
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => {
                                            setFormData({ ...formData, image: e.target.value });
                                            setImgError(false);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 transition"
                                        placeholder="e.g. /category_anarkali.png or https://.../image.webp"
                                    />
                                )}

                                {imgTab === "upload" && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-slate-50 hover:bg-slate-100/70 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mb-1" />
                                                <p className="text-xs text-slate-600 font-medium">Uploading…</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-500 mb-1 transition-colors" />
                                                <p className="text-xs text-slate-700 font-semibold group-hover:text-cyan-600 transition-colors">
                                                    Click to select image
                                                </p>
                                                <p className="text-[10px] text-slate-400">JPEG, PNG, WebP — Max 10 MB</p>
                                            </>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(e.target.files?.[0])}
                                        />
                                    </div>
                                )}

                                {formData.image && !imagePreviewError && (
                                    <div className="mt-2 rounded-xl overflow-hidden h-24 bg-slate-100 relative border border-slate-200 shadow-sm">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image: "" })}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sr No / Display Sequence */}
                            <InputField label="Display Order (Sr No)">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 transition"
                                    placeholder="0"
                                />
                            </InputField>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                                <div>
                                    <p className="text-xs text-slate-900 font-bold">Show in Store / Navigation</p>
                                    <p className="text-[11px] text-slate-500">Toggle active status for homepage &amp; header</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData((f) => ({ ...f, is_active: !f.is_active }))}
                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                                        formData.is_active ? "bg-cyan-500" : "bg-slate-300"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                            formData.is_active ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                                    {submitting ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditing(null);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-black border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: MANAGE CATEGORIES (PROFESSIONAL E-COMMERCE UI WITHOUT EMOJIS) ── */}
            {showDeptModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <Settings className="w-5 h-5 text-cyan-600" />
                                <div>
                                    <h3 className="font-bold text-base text-slate-900">
                                        {editingDept ? `Edit Category "${editingDept.name}"` : "Manage Store Categories"}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Top-level divisions: Women, Men, Jewellery, Footwear, Accessories, etc.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeptModal(false);
                                    setEditingDept(null);
                                    setDeptError(null);
                                    setDeptSuccess(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            {deptError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                                    {deptError}
                                </div>
                            )}
                            {deptSuccess && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
                                    {deptSuccess}
                                </div>
                            )}

                            {/* Form to Create or Edit Category */}
                            <form onSubmit={handleSaveDepartment} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {editingDept ? `Edit Category Details` : "+ Add New Category"}
                                    </span>
                                    {editingDept && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingDept(null);
                                                setDeptForm({ name: "", icon: "Sparkles", image: "", display_order: departments.length + 1 });
                                                setDeptError(null);
                                                setDeptSuccess(null);
                                            }}
                                            className="text-xs text-cyan-600 font-bold hover:underline cursor-pointer"
                                        >
                                            Switch to Add New
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Category Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={deptForm.name}
                                            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                            placeholder="e.g. Women, Men, Jewellery, Footwear..."
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Display Order
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={deptForm.display_order}
                                            onChange={(e) => setDeptForm({ ...deptForm, display_order: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>

                                {/* Professional Vector Icon Picker */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                                        Select Professional Icon:
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {AVAILABLE_DEPT_ICONS.map(({ id, label, Icon }) => {
                                            const isSelected = deptForm.icon === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setDeptForm({ ...deptForm, icon: id })}
                                                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm ring-1 ring-cyan-400"
                                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                                    <span className="truncate">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Icon or Image URL */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Or Custom Icon / Image URL (Optional):
                                    </label>
                                    <input
                                        type="text"
                                        value={deptForm.image || ""}
                                        onChange={(e) => setDeptForm({ ...deptForm, image: e.target.value })}
                                        placeholder="https://.../icon.svg or /uploads/category.png"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={deptSubmitting}
                                        className="px-4 py-2 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50 transition"
                                    >
                                        {deptSubmitting ? "Saving..." : editingDept ? "Save Category" : "+ Add Category"}
                                    </button>
                                </div>
                            </form>

                            {/* Existing Categories List */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Active Categories ({departments.length})
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                    {departments.map((d) => (
                                        <div key={d.id || d._id || d.name} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                                                    {renderDepartmentIcon(d, "w-4 h-4")}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                                        <span>{d.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">#{d.display_order ?? 0}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        <span>{d.category_count ?? 0} sub-categories</span>
                                                        <span>•</span>
                                                        <span>{d.product_count ?? 0} products</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingDept(d);
                                                        setDeptForm({
                                                            name: d.name,
                                                            icon: d.icon || "Sparkles",
                                                            image: d.image || "",
                                                            display_order: d.display_order ?? 0
                                                        });
                                                        setDeptError(null);
                                                        setDeptSuccess(null);
                                                    }}
                                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                                    title="Rename / Edit Category"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                {d.name.toLowerCase() !== "women" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDepartment(d)}
                                                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-red-600 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
