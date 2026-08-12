import React, { useState, useEffect } from "react";
import {
    X,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    Package,
    IndianRupee,
    Download,
    RefreshCw,
    ShieldAlert,
    Layers,
    Printer,
    QrCode,
    Share2,
    Copy,
    ExternalLink,
    Check,
    Mail,
    Upload,
    Tag,
} from "lucide-react";
import { shippingApi } from "../services/shippingApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Products = () => {
    const [activeTab, setActiveTab] = useState("products"); // "products" | "inventory" | "brands"

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProductId, setEditingProductId] = useState(null);
    const [sharingProduct, setSharingProduct] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatusMsg, setEmailStatusMsg] = useState("");

    const [uploadingImage, setUploadingImage] = useState(false);
    const [showPrintCatalogModal, setShowPrintCatalogModal] = useState(false);
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Brands states
    const [brands, setBrands] = useState([
        { id: "b-1", name: "Nari Pehnawa", slug: "nari-pehnawa", count: 12, country: "India", status: "Active" },
        { id: "b-2", name: "Bunaai", slug: "bunaai", count: 18, country: "India", status: "Active" },
        { id: "b-3", name: "House of Chikankari", slug: "house-of-chikankari", count: 5, country: "India", status: "Active" },
        { id: "b-4", name: "Sabyasachi", slug: "sabyasachi", count: 2, country: "India", status: "Inactive" }
    ]);
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [showEditBrandModal, setShowEditBrandModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [newBrand, setNewBrand] = useState({ name: "", country: "", status: "Active" });

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        original_price: "",
        discount: "",
        stock: "",
        category: "",
        image: "",
        sku: "",
        sizes: "S,M,L,XL",
        colors: "",
        fabric: "",
        brand: "Nari Pehnawa",
        delivery_charge: "",
        pickup_location: ""
    });
    const [pickupLocations, setPickupLocations] = useState([]);

    const getAuthToken = () => localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            shippingApi.getPickupLocations()
                .then((res) => setPickupLocations(res.locations || []))
                .catch(() => {});
            const token = getAuthToken();
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const [countResponse, response] = await Promise.all([
                fetch(`${API_BASE_URL}/products/count`, { headers }).catch(() => null),
                fetch(`${API_BASE_URL}/products/?limit=5000`, { headers }).catch(() => null),
            ]);

            if ((response && response.status === 401) || (countResponse && countResponse.status === 401)) {
                localStorage.removeItem("neel_admin_user");
                localStorage.removeItem("neel_token");
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }

            if (!response || !response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();

            if (countResponse && countResponse.ok) {
                const countData = await countResponse.json();
                setTotalProducts(countData.count ?? data.length);
            } else {
                setTotalProducts(data.length);
            }

            const transformedProducts = data.map((product) => ({
                ...product,
                id: product._id || product.id,
                title: product.name || product.title,
                stock: product.stock_quantity || product.stock || 0,
                sku: product.sku || product._id?.slice(-8).toUpperCase() || "N/A",
                brand: product.brand || "Nari Pehnawa"
            }));

            setProducts(transformedProducts);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Inline stock editing
    const handleUpdateStock = async (productId, newStock) => {
        try {
            const token = getAuthToken();
            const prod = products.find(p => p.id === productId);
            if (!prod) return;

            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    stock_quantity: parseInt(newStock),
                    in_stock: parseInt(newStock) > 0
                })
            });

            if (res.ok) {
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: parseInt(newStock) } : p));
            } else {
                alert("Failed to update stock quantity on server");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Product form handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            const parsedSizes = formData.sizes ? formData.sizes.split(",").map(s => s.trim()).filter(Boolean) : ["S", "M", "L", "XL"];
            const parsedColors = formData.colors ? formData.colors.split(",").map(c => c.trim()).filter(Boolean) : [];
            
            const productData = {
                name: formData.title || "",
                description: formData.description || "",
                price: formData.price ? parseFloat(formData.price) : 0.0,
                original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                discount: formData.discount ? parseInt(formData.discount) : null,
                stock_quantity: formData.stock ? parseInt(formData.stock) : 0,
                category: formData.category || "",
                image: formData.image || "",
                brand: formData.brand || "Nari Pehnawa",
                on_sale: formData.discount ? parseInt(formData.discount) > 0 : false,
                is_new: false,
                in_stock: (formData.stock ? parseInt(formData.stock) : 0) > 0,
                sizes: parsedSizes,
                colors: parsedColors,
                fabric: formData.fabric || null,
                delivery_charge: formData.delivery_charge !== "" ? parseFloat(formData.delivery_charge) : 0.0,
                pickup_location: formData.pickup_location || null
            };

            let res;
            if (showEditModal && editingProductId) {
                res = await fetch(`${API_BASE_URL}/products/${editingProductId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(productData),
                });
            } else {
                res = await fetch(`${API_BASE_URL}/products/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(productData),
                });
            }

            if (!res.ok) throw new Error("Failed to save product");

            setShowAddModal(false);
            setShowEditModal(false);
            setEditingProductId(null);
            fetchProducts();
        } catch (err) {
            alert(`Error saving product: ${err.message}`);
        }
    };

    const handleEdit = (product) => {
        setEditingProductId(product.id);
        setFormData({
            title: product.title || "",
            description: product.description || "",
            price: product.price || "",
            original_price: product.original_price || "",
            discount: product.discount || "",
            stock: product.stock || "",
            category: product.category || "",
            image: product.image || "",
            sku: product.sku || "",
            sizes: product.sizes ? product.sizes.join(",") : "S,M,L,XL",
            colors: product.colors ? product.colors.join(",") : "",
            fabric: product.fabric || "",
            brand: product.brand || "Nari Pehnawa",
            delivery_charge: product.delivery_charge !== undefined && product.delivery_charge !== null ? product.delivery_charge : "",
            pickup_location: product.pickup_location || ""
        });
        setShowEditModal(true);
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete product");
            fetchProducts();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Brand form submissions
    const handleAddBrand = (e) => {
        e.preventDefault();
        if (!newBrand.name.trim()) return;
        const brandObj = {
            id: `b-${Date.now()}`,
            name: newBrand.name,
            slug: newBrand.name.toLowerCase().replace(/\s+/g, '-'),
            count: 0,
            country: newBrand.country || "India",
            status: newBrand.status
        };
        setBrands(prev => [...prev, brandObj]);
        setNewBrand({ name: "", country: "", status: "Active" });
        setShowAddBrandModal(false);
    };

    const handleEditBrand = (b) => {
        setEditingBrand(b);
        setNewBrand({ name: b.name, country: b.country || "India", status: b.status || "Active" });
        setShowEditBrandModal(true);
    };

    const handleUpdateBrandSubmit = (e) => {
        e.preventDefault();
        if (!newBrand.name.trim() || !editingBrand) return;
        const oldName = editingBrand.name;
        const newName = newBrand.name.trim();

        setBrands(prev => prev.map(b => b.id === editingBrand.id ? {
            ...b,
            name: newName,
            slug: newName.toLowerCase().replace(/\s+/g, '-'),
            country: newBrand.country || "India",
            status: newBrand.status
        } : b));

        if (oldName !== newName) {
            setProducts(prev => prev.map(p => p.brand === oldName ? { ...p, brand: newName } : p));
        }

        setShowEditBrandModal(false);
        setEditingBrand(null);
        setNewBrand({ name: "", country: "", status: "Active" });
    };

    const handleDeleteBrand = (id) => {
        if (!window.confirm("Delete this brand?")) return;
        setBrands(prev => prev.filter(b => b.id !== id));
    };

    // Filter, Sort, Pagination computation
    const filteredProducts = products.filter((product) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        if (!q) return matchesCategory;

        const matchesSearch = 
            (product.title || "").toLowerCase().includes(q) || 
            (product.sku || "").toLowerCase().includes(q) ||
            (product.category || "").toLowerCase().includes(q) ||
            (product.brand || "").toLowerCase().includes(q) ||
            (product.fabric || "").toLowerCase().includes(q) ||
            (product.pickup_location || "").toLowerCase().includes(q) ||
            (product.tags || []).some(t => String(t).toLowerCase().includes(q));

        return matchesSearch && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "name_asc" || sortBy === "name") return (a.title || "").localeCompare(b.title || "");
        if (sortBy === "name_desc") return (b.title || "").localeCompare(a.title || "");
        if (sortBy === "price_asc" || sortBy === "price") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "stock_asc" || sortBy === "stock") return (a.stock || 0) - (b.stock || 0);
        if (sortBy === "stock_desc") return (b.stock || 0) - (a.stock || 0);
        if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return 0;
    });

    // Pagination items slices
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStockBadge = (stock) => {
        if (stock <= 0) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Out of Stock</span>;
        if (stock <= 5) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Low Stock</span>;
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">In Stock</span>;
    };

    // Export capabilities
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        if (activeTab === "brands") {
            csvContent += "Brand ID,Brand Name,Slug,Country,Status\n";
            brands.forEach(b => {
                csvContent += `"${b.id}","${b.name}","${b.slug}","${b.country}","${b.status}"\n`;
            });
        } else {
            csvContent += "SKU,Product Name,Category,Price,Original Price,Stock,Brand\n";
            filteredProducts.forEach(p => {
                csvContent += `"${p.sku}","${p.title}","${p.category}",${p.price},${p.original_price || p.price},${p.stock},"${p.brand}"\n`;
            });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `products_${activeTab}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalStockUnits = filteredProducts.reduce((acc, p) => acc + (parseInt(p.stock || 0) || 0), 0);
    const totalStockValuation = filteredProducts.reduce((acc, p) => acc + ((parseFloat(p.price) || 0) * (parseInt(p.stock || 0) || 0)), 0);
    const lowStockCount = filteredProducts.filter(p => (parseInt(p.stock || 0) || 0) <= 5).length;

    const handlePrintFullCatalog = () => {
        const printWindow = window.open('', '_blank');
        const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const rowsHtml = products.map((p, idx) => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://naripehnawa.com/product/' + p.id)}`;
            const stockVal = (parseFloat(p.price) || 0) * (parseInt(p.stock || 0) || 0);
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${idx + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
                        ${p.image ? `<img src="${p.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />` : ''}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${p.sku || 'N/A'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">
                        ${p.title}
                        ${p.pickup_location ? `<div style="font-size: 10px; color: #555;">📍 Warehouse: ${p.pickup_location}</div>` : ''}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.category || 'N/A'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace;">₹${(p.price || 0).toLocaleString('en-IN')}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-family: monospace;">${p.stock || 0}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">₹${stockVal.toLocaleString('en-IN')}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
                        <img src="${qrUrl}" alt="QR" style="width: 50px; height: 50px;" />
                    </td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Nari Pehnawa - Product Inventory & QR Catalog</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
                    .title { font-size: 20px; font-weight: bold; }
                    .stats { display: flex; gap: 20px; margin-bottom: 20px; background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; }
                    .stat-box { flex: 1; }
                    .stat-box span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; }
                    .stat-box strong { font-size: 16px; font-family: monospace; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; }
                    @media print {
                        @page { size: A4 landscape; margin: 10mm; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">✨ NARI PEHNAWA — PRODUCT CATALOG & INVENTORY</div>
                        <div style="font-size: 11px; color: #64748b;">Generated on ${todayStr}</div>
                    </div>
                </div>
                <div class="stats">
                    <div class="stat-box">
                        <span>Total Listings</span>
                        <strong>${products.length} Products</strong>
                    </div>
                    <div class="stat-box">
                        <span>Total Stock Quantity</span>
                        <strong>${totalStockUnits.toLocaleString('en-IN')} Units</strong>
                    </div>
                    <div class="stat-box">
                        <span>Total Inventory Valuation</span>
                        <strong>₹${totalStockValuation.toLocaleString('en-IN')}</strong>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center;">#</th>
                            <th style="text-align: center;">Image</th>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: center;">Stock</th>
                            <th style="text-align: right;">Total Value</th>
                            <th style="text-align: center;">Scan QR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintSingleQRLabel = (p) => {
        const printWindow = window.open('', '_blank');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://naripehnawa.com/product/' + p.id)}`;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Label - ${p.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f1f5f9; }
                    .label-box { width: 320px; border: 2px solid #000; padding: 16px; background: #fff; text-align: center; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .brand { font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8b0000; }
                    .title { font-size: 15px; font-weight: bold; margin: 8px 0 4px 0; color: #0f172a; }
                    .sku { font-family: monospace; font-size: 12px; color: #475569; }
                    .qr-img { width: 160px; height: 160px; margin: 12px auto; }
                    .price { font-size: 20px; font-weight: 800; color: #0f172a; font-family: monospace; }
                    .warehouse { font-size: 11px; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 6px; border: 1px solid #e2e8f0; color: #334155; }
                    @media print {
                        body { background: #fff; }
                        .label-box { border: 2px solid #000; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="label-box">
                    <div class="brand">NARI PEHNAWA</div>
                    <div class="title">${p.title}</div>
                    <div class="sku">SKU: ${p.sku || 'N/A'}</div>
                    <img src="${qrUrl}" class="qr-img" alt="QR Code" />
                    <div class="price">₹${(p.price || 0).toLocaleString('en-IN')}</div>
                    ${p.pickup_location ? `<div class="warehouse">📦 Warehouse: <strong>${p.pickup_location}</strong></div>` : ''}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/40 pb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Products Management</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage catalog listings, active inventory warning stocks, and brands.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPrintCatalogModal(true)}
                        className="p-2.5 bg-[#111827] border border-gray-800 rounded-xl hover:bg-gray-800 transition text-xs font-semibold text-white flex items-center gap-2 shadow-sm"
                        title="Open printable product catalog with QR codes"
                    >
                        <Printer className="w-4 h-4 text-cyan-400" /> Print Catalog & QR
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="p-2.5 bg-[#111827] border border-gray-800 rounded-xl hover:bg-gray-800 transition text-xs font-semibold text-white flex items-center gap-2"
                    >
                        <Download className="w-4 h-4 text-[#d4af37]" /> Export CSV
                    </button>
                    {activeTab === "brands" ? (
                        <button
                            onClick={() => setShowAddBrandModal(true)}
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:shadow-cyan-500/20 transition duration-200"
                        >
                            <Plus className="w-4 h-4" /> Add Brand
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:shadow-cyan-500/20 transition duration-200"
                        >
                            <Plus className="w-4 h-4" /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Inventory Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => { setActiveTab("products"); setFilterCategory("all"); setSearchQuery(""); setCurrentPage(1); }}
                    className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-gray-800 p-4 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer hover:border-cyan-500/50 transition transform hover:-translate-y-0.5 group"
                    title="Click to view all product listings"
                >
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Total Listings</span>
                        <span className="text-xl font-extrabold text-white font-mono">{filteredProducts.length} Products</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(false); setCurrentPage(1); }}
                    className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-gray-800 p-4 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer hover:border-blue-500/50 transition transform hover:-translate-y-0.5 group"
                    title="Click to view full inventory stock"
                >
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Total Inventory Stock</span>
                        <span className="text-xl font-extrabold text-white font-mono">{totalStockUnits.toLocaleString("en-IN")} Units</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(false); setCurrentPage(1); }}
                    className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-gray-800 p-4 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer hover:border-amber-500/50 transition transform hover:-translate-y-0.5 group"
                    title="Click to view inventory asset valuation"
                >
                    <div className="p-3 bg-amber-500/10 rounded-xl text-[#d4af37] border border-amber-500/20 group-hover:bg-amber-500/20">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Stock Valuation</span>
                        <span className="text-xl font-extrabold text-[#d4af37] font-mono">₹{totalStockValuation.toLocaleString("en-IN")}</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(true); setCurrentPage(1); }}
                    className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-red-900/50 hover:border-red-500/80 p-4 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer transition transform hover:-translate-y-0.5 group relative overflow-hidden"
                    title="Click to view & restock all low stock products"
                >
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20 group-hover:bg-red-500/20">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Low Stock Alerts</span>
                        <span className="text-xl font-extrabold text-red-400 font-mono">{lowStockCount} Items</span>
                        <span className="text-[10px] text-red-400/90 block mt-0.5 font-bold underline">Click to view & restock &rarr;</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 gap-6">
                <button
                    onClick={() => { setActiveTab("products"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "products" ? "text-[#d4af37]" : "text-gray-400 hover:text-white"}`}
                >
                    Product Catalog
                    {activeTab === "products" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#d4af37] rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("inventory"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "inventory" ? "text-[#d4af37]" : "text-gray-400 hover:text-white"}`}
                >
                    Inventory Warnings
                    {activeTab === "inventory" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#d4af37] rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("brands"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "brands" ? "text-[#d4af37]" : "text-gray-400 hover:text-white"}`}
                >
                    Brands Manager
                    {activeTab === "brands" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#d4af37] rounded-full"></span>}
                </button>
            </div>

            {/* TAB: PRODUCTS */}
            {activeTab === "products" && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-4 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search products by SKU or Name..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-[#d4af37] transition"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    <optgroup label="── Kurtis ──">
                                        <option value="Anarkali Kurtis">Anarkali Kurtis</option>
                                        <option value="Straight Kurtis">Straight Kurtis</option>
                                        <option value="A-Line Kurtis">A-Line Kurtis</option>
                                        <option value="Printed Kurtis">Printed Kurtis</option>
                                        <option value="Embroidered Kurtis">Embroidered Kurtis</option>
                                        <option value="Denim Kurtis">Denim Kurtis</option>
                                        <option value="Kaftan Kurtis">Kaftan Kurtis</option>
                                        <option value="Chikankari Kurtis">Chikankari Kurtis</option>
                                        <option value="Palazzo Set Kurtis">Palazzo Set Kurtis</option>
                                        <option value="Angrakha Kurtis">Angrakha Kurtis</option>
                                    </optgroup>
                                    <optgroup label="── Home Decor ──">
                                        <option value="Vases &amp; Planters">Vases &amp; Planters</option>
                                        <option value="Wall Decor">Wall Decor</option>
                                        <option value="Lighting &amp; Lamps">Lighting &amp; Lamps</option>
                                        <option value="Cushions &amp; Covers">Cushions &amp; Covers</option>
                                        <option value="Rugs &amp; Carpets">Rugs &amp; Carpets</option>
                                        <option value="Pooja Essentials">Pooja Essentials</option>
                                        <option value="Candles &amp; Fragrances">Candles &amp; Fragrances</option>
                                        <option value="Photo Frames &amp; Art">Photo Frames &amp; Art</option>
                                    </optgroup>
                                </select>
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                            >
                                <option value="newest">Sort by Newest First (Date)</option>
                                <option value="stock_asc">Sort by Lowest Stock First (Restock Alert)</option>
                                <option value="stock_desc">Sort by Highest Stock First</option>
                                <option value="price_asc">Sort by Price (Low to High)</option>
                                <option value="price_desc">Sort by Price (High to Low)</option>
                                <option value="name_asc">Sort by Name (A - Z)</option>
                                <option value="name_desc">Sort by Name (Z - A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Table */}
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                                    <tr>
                                        <th className="py-4 px-6">Product</th>
                                        <th className="py-4 px-6">SKU</th>
                                        <th className="py-4 px-6">Category</th>
                                        <th className="py-4 px-6">Price</th>
                                        <th className="py-4 px-6">Stock</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40 text-gray-200">
                                    {paginatedProducts.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800/20 transition">
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#0b1220] border border-gray-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white truncate max-w-[200px]">{p.title}</div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">{p.brand} {p.pickup_location ? `• 📍 Warehouse: ${p.pickup_location}` : ""}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 font-mono text-gray-400">{p.sku}</td>
                                            <td className="py-3.5 px-6 text-gray-400">{p.category}</td>
                                            <td className="py-3.5 px-6 font-bold text-[#d4af37] font-mono">₹{p.price.toLocaleString()}</td>
                                            <td className="py-3.5 px-6 font-mono text-gray-300">{p.stock} units</td>
                                            <td className="py-3.5 px-6">{getStockBadge(p.stock)}</td>
                                            <td className="py-3.5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSharingProduct(p)}
                                                        className="p-2 bg-purple-600/10 text-purple-400 border border-purple-600/20 rounded-xl hover:bg-purple-600/20 transition"
                                                        title="Share Product & QR Code"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintSingleQRLabel(p)}
                                                        className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-600/20 rounded-xl hover:bg-cyan-600/20 transition"
                                                        title="Print QR Label"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="p-2 bg-red-600/10 text-red-400 border border-red-600/20 rounded-xl hover:bg-red-600/20 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                <Package className="w-12 h-12 opacity-40 animate-pulse" />
                                <span>No products matching query found.</span>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl text-xs">
                            <span className="text-gray-400">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === "inventory" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-yellow-950/10 to-amber-950/10 border border-yellow-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-white text-base">Critical Stock Alerts & Restock Center</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Showing products with low stock (5 or fewer units). Edit stock directly to restock inventory.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowOnlyLowStock(prev => !prev)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${showOnlyLowStock ? "bg-red-600/20 border-red-500/40 text-red-300" : "bg-gray-800 border-gray-700 text-gray-300"}`}
                            >
                                {showOnlyLowStock ? "Filter: Low Stock (5 or fewer Units)" : "Filter: Showing All Stock"}
                            </button>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                                    <tr>
                                        <th className="py-4 px-6">Product</th>
                                        <th className="py-4 px-6">SKU</th>
                                        <th className="py-4 px-6">Available Stock</th>
                                        <th className="py-4 px-6">Total Asset Value</th>
                                        <th className="py-4 px-6">Stock Status</th>
                                        <th className="py-4 px-6 text-right">Quick Restock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40 text-gray-200">
                                    {(showOnlyLowStock ? filteredProducts.filter(p => (parseInt(p.stock || 0) || 0) <= 5) : paginatedProducts).map((p, idx) => {
                                        const assetValue = p.price * p.stock;
                                        return (
                                            <tr key={idx} className="hover:bg-gray-800/20 transition">
                                                <td className="py-3.5 px-6 font-semibold text-white">{p.title}</td>
                                                <td className="py-3.5 px-6 font-mono text-gray-400">{p.sku}</td>
                                                <td className="py-3.5 px-6 font-mono font-medium text-gray-200">{p.stock} units</td>
                                                <td className="py-3.5 px-6 font-mono text-gray-400">₹{assetValue.toLocaleString()}</td>
                                                <td className="py-3.5 px-6">{getStockBadge(p.stock)}</td>
                                                <td className="py-3.5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input 
                                                            type="number"
                                                            defaultValue={p.stock}
                                                            onBlur={(e) => handleUpdateStock(p.id, e.target.value)}
                                                            className="w-16 px-2 py-1 text-center bg-[#0b1220] border border-gray-800 rounded-lg text-white font-mono"
                                                            title="Press tab or click out to trigger stock update"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl text-xs">
                            <span className="text-gray-400">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: BRANDS */}
            {activeTab === "brands" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                                    <tr>
                                        <th className="py-4 px-6">Brand Name</th>
                                        <th className="py-4 px-6">Slug</th>
                                        <th className="py-4 px-6">Total Products</th>
                                        <th className="py-4 px-6">Country Origin</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40 text-gray-200">
                                    {brands.map((b, idx) => {
                                        const liveCount = products.filter(p => (p.brand || "").toLowerCase() === (b.name || "").toLowerCase()).length;
                                        return (
                                            <tr key={idx} className="hover:bg-gray-800/20 transition">
                                                <td className="py-3.5 px-6 font-semibold text-white flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-[#d4af37]" /> {b.name}
                                                </td>
                                                <td className="py-3.5 px-6 font-mono text-gray-400">{b.slug}</td>
                                                <td className="py-3.5 px-6 font-mono text-gray-300">{liveCount || b.count || 0} listings</td>
                                                <td className="py-3.5 px-6 text-gray-400">{b.country}</td>
                                                <td className="py-3.5 px-6">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        b.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                                    }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditBrand(b)}
                                                            className="p-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition"
                                                            title="Edit Brand"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBrand(b.id)}
                                                            className="p-2 bg-red-600/10 text-red-400 border border-red-600/20 rounded-xl hover:bg-red-600/20 transition"
                                                            title="Delete Brand"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Brand Modal */}
            {(showAddBrandModal || showEditBrandModal) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f1724] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl text-left">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-base font-bold text-white">
                                {showEditBrandModal ? "Edit Brand Details" : "Add New Partner Brand"}
                            </h3>
                            <button
                                onClick={() => { setShowAddBrandModal(false); setShowEditBrandModal(false); setEditingBrand(null); }}
                                className="p-1 hover:bg-gray-800 rounded-xl text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={showEditBrandModal ? handleUpdateBrandSubmit : handleAddBrand} className="p-5 space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-400 mb-1">Brand Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                                    placeholder="e.g. Nari Pehnawa, Bunaai"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Country Origin</label>
                                <input
                                    type="text"
                                    value={newBrand.country}
                                    onChange={(e) => setNewBrand({ ...newBrand, country: e.target.value })}
                                    className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                                    placeholder="e.g. India"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Status</label>
                                <select
                                    value={newBrand.status}
                                    onChange={(e) => setNewBrand({ ...newBrand, status: e.target.value })}
                                    className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition duration-200">
                                    {showEditBrandModal ? "Update Brand" : "Save Brand"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddBrandModal(false); setShowEditBrandModal(false); setEditingBrand(null); }}
                                    className="flex-1 py-2 bg-gray-800 text-white rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Product Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f1724] border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl text-left">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-sm font-bold text-white">
                                {showEditModal ? "Edit Product Listing" : "Add New Product"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowEditModal(false);
                                    setEditingProductId(null);
                                    setFormData({
                                        title: "",
                                        description: "",
                                        price: "",
                                        original_price: "",
                                        discount: "",
                                        stock: "",
                                        category: "",
                                        image: "",
                                        sku: "",
                                        sizes: "S,M,L,XL",
                                        colors: "",
                                        fabric: "",
                                        brand: "Nari Pehnawa"
                                    });
                                }}
                                className="p-1 hover:bg-gray-800 rounded-xl text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-1">Product Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="Product name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Brand Name</label>
                                    <select
                                        value={formData.brand || "Nari Pehnawa"}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    >
                                        {(brands || []).map((b, idx) => (
                                            <option key={b.id || idx} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Price (INR) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="e.g. 1299"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    >
                                        <option value="">Select category</option>
                                        <optgroup label="── Kurti Types ──">
                                            <option value="Anarkali Kurtis">Anarkali Kurtis</option>
                                            <option value="Straight Kurtis">Straight Kurtis</option>
                                            <option value="A-Line Kurtis">A-Line Kurtis</option>
                                            <option value="Printed Kurtis">Printed Kurtis</option>
                                            <option value="Embroidered Kurtis">Embroidered Kurtis</option>
                                            <option value="Denim Kurtis">Denim Kurtis</option>
                                            <option value="Kaftan Kurtis">Kaftan Kurtis</option>
                                            <option value="Chikankari Kurtis">Chikankari Kurtis</option>
                                            <option value="Palazzo Set Kurtis">Palazzo Set Kurtis</option>
                                            <option value="Angrakha Kurtis">Angrakha Kurtis</option>
                                        </optgroup>
                                        <optgroup label="── Home Decoration ──">
                                            <option value="Vases &amp; Planters">Vases &amp; Planters</option>
                                            <option value="Wall Decor">Wall Decor</option>
                                            <option value="Lighting &amp; Lamps">Lighting &amp; Lamps</option>
                                            <option value="Cushions &amp; Covers">Cushions &amp; Covers</option>
                                            <option value="Rugs &amp; Carpets">Rugs &amp; Carpets</option>
                                            <option value="Pooja Essentials">Pooja Essentials</option>
                                            <option value="Candles &amp; Fragrances">Candles &amp; Fragrances</option>
                                            <option value="Photo Frames &amp; Art">Photo Frames &amp; Art</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1 font-semibold text-xs flex items-center justify-between">
                                        <span>Product Image (File Upload)</span>
                                        <span className="text-[10px] text-gray-500 font-normal">PNG, JPG, WebP (Max 10MB)</span>
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            {formData.image ? (
                                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-cyan-500/40 relative flex-shrink-0 group bg-gray-900">
                                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, image: "" })}
                                                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-[10px] font-bold transition"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : null}

                                            <label className="flex-1 border-2 border-dashed border-gray-700 hover:border-cyan-500/60 bg-[#0b1220] rounded-xl p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2">
                                                {uploadingImage ? (
                                                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4 text-cyan-400" />
                                                )}
                                                <span className="text-xs text-gray-300 font-medium">
                                                    {uploadingImage ? "Uploading Image..." : "Click to Upload Image File"}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageFileUpload}
                                                    className="hidden"
                                                    disabled={uploadingImage}
                                                />
                                            </label>
                                        </div>

                                        <div>
                                            <input
                                                type="url"
                                                value={formData.image}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                                                placeholder="Or paste external image URL (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Original Price (MRP)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.original_price}
                                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="e.g. 1999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Discount %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="e.g. 20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Fabric</label>
                                    <input
                                        type="text"
                                        value={formData.fabric}
                                        onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="e.g. Cotton, Silk"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Delivery Charge (INR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.delivery_charge}
                                        onChange={(e) => setFormData({ ...formData, delivery_charge: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="0 (or leave empty for default)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Pickup Warehouse (Shiprocket)</label>
                                    <select
                                        value={formData.pickup_location || ""}
                                        onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    >
                                        <option value="">Default (Primary Warehouse)</option>
                                        {(pickupLocations || []).map((loc) => (
                                            <option key={loc.id || loc.pickup_location} value={loc.pickup_location}>
                                                {loc.pickup_location} — {loc.city}, {loc.state} ({loc.pin_code}) {loc.is_primary_location ? "★ Primary" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-1">Sizes (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.sizes}
                                        onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                                        className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                                        placeholder="e.g. S,M,L,XL"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#0b1220] border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none h-24 resize-none"
                                    placeholder="Product description..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition duration-200">
                                    {showEditModal ? "Update Listing" : "Publish Listing"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setEditingProductId(null);
                                        setFormData({
                                            title: "",
                                            description: "",
                                            price: "",
                                            original_price: "",
                                            discount: "",
                                            stock: "",
                                            category: "",
                                            image: "",
                                            sku: "",
                                            sizes: "S,M,L,XL",
                                            colors: "",
                                            fabric: "",
                                            brand: "Nari Pehnawa"
                                        });
                                    }}
                                    className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* SHARE PRODUCT & QR CODE MODAL */}
            {sharingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => { setSharingProduct(null); setCopiedLink(false); }}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/50 hover:bg-gray-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                            <QrCode className="w-6 h-6 text-cyan-400" />
                            <div>
                                <h3 className="font-extrabold text-white text-base">Share & Print QR Code</h3>
                                <p className="text-xs text-gray-400">Scan QR code to view live product on store</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center bg-[#0b1220] p-4 rounded-2xl border border-gray-800/80 gap-3">
                            <div className="w-14 h-14 bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                                <img src={sharingProduct.image} alt={sharingProduct.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-white text-sm">{sharingProduct.title}</div>
                                <div className="text-xs text-[#d4af37] font-mono font-bold mt-0.5">₹{sharingProduct.price?.toLocaleString()} | SKU: {sharingProduct.sku}</div>
                                {sharingProduct.pickup_location && (
                                    <div className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded mt-1 inline-block">
                                        📍 Warehouse: {sharingProduct.pickup_location}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-3 rounded-2xl shadow-md my-1">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://naripehnawa.com/product/' + sharingProduct.id)}`}
                                    alt="QR Code"
                                    className="w-40 h-40 object-contain"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">Scan with mobile camera to open product page directly</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://naripehnawa.com/product/${sharingProduct.id}`}
                                    className="w-full text-xs bg-[#0b1220] border border-gray-800 text-gray-300 rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://naripehnawa.com/product/${sharingProduct.id}`);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                                >
                                    {copiedLink ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                                    {copiedLink ? "Copied!" : "Copy"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${sharingProduct.title}: https://naripehnawa.com/product/${sharingProduct.id}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md text-center"
                                >
                                    <Share2 className="w-4 h-4" /> Share WhatsApp
                                </a>

                                <button
                                    onClick={() => handlePrintSingleQRLabel(sharingProduct)}
                                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md text-center"
                                >
                                    <Printer className="w-4 h-4 text-cyan-400" /> Print Label
                                </button>
                            </div>

                            {/* Email Recommendation Section */}
                            <div className="border-t border-gray-800/80 pt-3 space-y-2">
                                <label className="block text-[11px] font-semibold text-gray-400">Email Product to Customer</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        placeholder="customer@email.com"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        className="w-full text-xs bg-[#0b1220] border border-gray-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        disabled={sendingEmail || !shareEmail}
                                        onClick={async () => {
                                            if (!shareEmail) return;
                                            setSendingEmail(true);
                                            setEmailStatusMsg("");
                                            try {
                                                const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
                                                const res = await fetch(`${API_BASE_URL}/products/${sharingProduct.id}/share-email`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "Authorization": `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ email: shareEmail })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    setEmailStatusMsg("✅ Email sent successfully!");
                                                    setShareEmail("");
                                                } else {
                                                    setEmailStatusMsg(`❌ ${data.detail || "Failed to send email"}`);
                                                }
                                            } catch (err) {
                                                setEmailStatusMsg("❌ Network error sending email");
                                            } finally {
                                                setSendingEmail(false);
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {sendingEmail ? "Sending..." : "Send Email"}
                                    </button>
                                </div>
                                {emailStatusMsg && (
                                    <p className="text-[11px] font-medium text-cyan-400 mt-1">{emailStatusMsg}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* IN-PAGE PRINT PREVIEW MODAL */}
            {showPrintCatalogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            #printable-catalog-root, #printable-catalog-root * { visibility: visible !important; }
                            #printable-catalog-root { position: absolute; left: 0; top: 0; width: 100%; color: #000 !important; background: #fff !important; }
                        }
                    `}</style>
                    <div id="printable-catalog-root" className="bg-white text-gray-900 rounded-2xl sm:rounded-3xl w-full max-w-5xl p-4 sm:p-8 relative shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
                            <div className="flex items-center gap-3">
                                <Printer className="w-6 h-6 text-cyan-600" />
                                <div>
                                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Product Inventory & QR Catalog</h2>
                                    <p className="text-xs text-gray-500">Live printable inventory report with QR codes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 sm:px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition"
                                >
                                    <Printer className="w-4 h-4" /> Print Catalog Now
                                </button>
                                <button
                                    onClick={() => setShowPrintCatalogModal(false)}
                                    className="p-2 text-gray-500 hover:text-black rounded-full bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="printable-catalog space-y-4 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-2">
                                <div>
                                    <h1 className="text-lg sm:text-xl font-black text-red-950 tracking-tight">✨ NARI PEHNAWA — CATALOG & INVENTORY REPORT</h1>
                                    <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 text-xs">
                                <div>
                                    <span className="text-gray-500 uppercase block font-semibold text-[10px]">Total Products</span>
                                    <strong className="text-sm font-mono">{filteredProducts.length} Items</strong>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase block font-semibold text-[10px]">Total Stock Units</span>
                                    <strong className="text-sm font-mono">{totalStockUnits.toLocaleString('en-IN')} Units</strong>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase block font-semibold text-[10px]">Total Stock Valuation</span>
                                    <strong className="text-sm font-mono text-amber-700">₹{totalStockValuation.toLocaleString('en-IN')}</strong>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase text-[10px] font-bold">
                                            <th className="p-2 text-center">#</th>
                                            <th className="p-2 text-center">Image</th>
                                            <th className="p-2">SKU</th>
                                            <th className="p-2">Product Name</th>
                                            <th className="p-2">Category</th>
                                            <th className="p-2 text-right">Price</th>
                                            <th className="p-2 text-center">Stock</th>
                                            <th className="p-2 text-right">Total Value</th>
                                            <th className="p-2 text-center">Scan QR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProducts.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-2 text-center text-gray-500 font-mono">{idx + 1}</td>
                                                <td className="p-2 text-center">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded mx-auto border" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 rounded mx-auto" />
                                                    )}
                                                </td>
                                                <td className="p-2 font-mono text-gray-600">{p.sku || 'N/A'}</td>
                                                <td className="p-2 font-bold text-gray-900">
                                                    {p.title}
                                                    {p.pickup_location && <div className="text-[10px] text-gray-500 font-normal">📍 Warehouse: {p.pickup_location}</div>}
                                                </td>
                                                <td className="p-2 text-gray-600">{p.category}</td>
                                                <td className="p-2 text-right font-mono font-semibold">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-center font-mono">{p.stock || 0}</td>
                                                <td className="p-2 text-right font-mono font-bold">₹{((p.price || 0) * (p.stock || 0)).toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-center">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://naripehnawa.com/product/' + p.id)}`}
                                                        alt="QR"
                                                        className="w-12 h-12 mx-auto"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
