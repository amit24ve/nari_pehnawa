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
    Loader2,
    Building2,
    Star,
    Image as ImageIcon,
} from "lucide-react";
import shippingApi from "../services/shippingApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const DEFAULT_WAREHOUSES = [
    { id: 1, pickup_location: "Home", city: "Sultanpur", state: "Uttar Pradesh", pin_code: "228151", is_primary_location: true },
    { id: 2, pickup_location: "home-1", city: "Allahabad", state: "Uttar Pradesh", pin_code: "211006", is_primary_location: false }
];

const PRESET_DEPARTMENTS = [
    { id: "Clothing", label: "Clothing / Ethnic", icon: "👗" },
    { id: "Jewellery", label: "Jewellery", icon: "✨" },
    { id: "Footwear", label: "Footwear / Shoes", icon: "👠" },
    { id: "Accessories", label: "Bags & Accessories", icon: "👜" },
];

const Products = () => {
    const [activeTab, setActiveTab] = useState("products"); // "products" | "inventory" | "brands"

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [quickCatName, setQuickCatName] = useState("");
    const [quickCatLoading, setQuickCatLoading] = useState(false);
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

    // Brands states (Dynamic from Backend API)
    const [brands, setBrands] = useState([]);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [showEditBrandModal, setShowEditBrandModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [newBrand, setNewBrand] = useState({ name: "", country: "", status: "Active" });

    // Categories states (Dynamic from Backend API)
    const [categoriesList, setCategoriesList] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const res = await fetch(`${API_BASE_URL}/categories/`);
            if (res.ok) {
                const data = await res.json();
                setCategoriesList(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Departments states (Dynamic from Backend API)
    const [departmentsList, setDepartmentsList] = useState([]);
    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/departments/`);
            if (res.ok) {
                const data = await res.json();
                setDepartmentsList(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    const emptyForm = {
        title: "",
        description: "",
        price: "",
        original_price: "",
        discount: "",
        stock: "0",
        category: "",
        department: "Clothing",
        image: "",
        images: [],
        sku: "",
        sizes: "S,M,L,XL",
        colors: "",
        fabric: "",
        brand: "Nari Pehnawa",
        delivery_charge: "",
        pickup_location: "Home",
        warehouse_stock: { "Home": 0, "home-1": 0 },
        warehouse_size_stock: { "Home": {}, "home-1": {} },
        is_returnable: true,
        return_policy: "Easy 15-Day Returns",
        pattern: "",
        sleeve_type: "",
        fit_type: "Regular Comfort Fit",
        occasion: "Festive, Casual, Office Wear",
        country_of_origin: "India 🇮🇳",
        hsn_code: "621133",
        wash_care: "Hand Wash or Gentle Machine Wash in Cold Water",
        offer_code: "",
        offer_text: ""
    };

    const [formData, setFormData] = useState(emptyForm);
    const [pickupLocations, setPickupLocations] = useState(DEFAULT_WAREHOUSES);
    const [isSyncingWarehouses, setIsSyncingWarehouses] = useState(false);

    const fetchPickupLocations = async (force = false) => {
        try {
            setIsSyncingWarehouses(true);
            const res = await shippingApi.getPickupLocations();
            const locationsList = Array.isArray(res) ? res : (res?.locations || res?.shipping_address || []);
            if (locationsList && locationsList.length > 0) {
                setPickupLocations(locationsList);
                return locationsList;
            }
        } catch (e) {
            console.warn("Dynamic pickup locations fetch failed:", e);
        } finally {
            setIsSyncingWarehouses(false);
        }
        return pickupLocations;
    };

    const handleOpenAddModal = async () => {
        fetchCategories();
        const liveLocations = await fetchPickupLocations(true);
        const locs = (liveLocations && liveLocations.length > 0) ? liveLocations : pickupLocations;
        const initialWhStock = {};
        const initialWhSizeStock = {};
        locs.forEach(loc => {
            const name = loc.pickup_location || loc.name;
            if (name) {
                initialWhStock[name] = 0;
                initialWhSizeStock[name] = {};
            }
        });
        const primaryLoc = locs.find(l => l.is_primary_location)?.pickup_location || locs[0]?.pickup_location || "Home";
        setFormData({
            ...emptyForm,
            pickup_location: primaryLoc,
            warehouse_stock: initialWhStock,
            warehouse_size_stock: initialWhSizeStock
        });
        setShowAddModal(true);
    };

    const handleWarehouseSizeStockChange = (whName, size, qty) => {
        const val = qty === "" ? "" : Math.max(0, parseInt(qty) || 0);
        setFormData(prev => {
            const currentWhSize = { ...(prev.warehouse_size_stock || {}) };
            const whSizes = { ...(currentWhSize[whName] || {}), [size]: val };
            currentWhSize[whName] = whSizes;

            const currentWhStock = { ...(prev.warehouse_stock || {}) };
            const activeWhList = (pickupLocations.length > 0 ? pickupLocations : DEFAULT_WAREHOUSES).map(l => l.pickup_location);
            
            let grandTotal = 0;
            activeWhList.forEach(wName => {
                const sizesForWh = currentWhSize[wName] || {};
                const sizeValues = Object.values(sizesForWh).filter(v => v !== "" && !isNaN(v));
                if (sizeValues.length > 0) {
                    const sum = sizeValues.reduce((a, b) => a + Number(b), 0);
                    currentWhStock[wName] = sum;
                }
                grandTotal += Number(currentWhStock[wName] || 0);
            });

            return {
                ...prev,
                warehouse_size_stock: currentWhSize,
                warehouse_stock: currentWhStock,
                stock: grandTotal.toString()
            };
        });
    };

    const handleWarehouseTotalStockChange = (whName, totalQty) => {
        const val = totalQty === "" ? "" : Math.max(0, parseInt(totalQty) || 0);
        setFormData(prev => {
            const updatedStock = { ...(prev.warehouse_stock || {}), [whName]: val };
            const grandTotal = Object.values(updatedStock).reduce((a, b) => a + (Number(b) || 0), 0);
            return {
                ...prev,
                warehouse_stock: updatedStock,
                stock: grandTotal.toString()
            };
        });
    };

    const getAuthToken = () => localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            fetchPickupLocations();
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
            const productsList = Array.isArray(data) ? data : [];

            if (countResponse && countResponse.ok) {
                const countData = await countResponse.json();
                setTotalProducts(countData.count ?? productsList.length);
            } else {
                setTotalProducts(productsList.length);
            }

            const transformedProducts = productsList.map((product) => ({
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

    const fetchBrands = async () => {
        try {
            setBrandsLoading(true);
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/brands/admin/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (res.ok) {
                const data = await res.json();
                setBrands(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching brands:", err);
        } finally {
            setBrandsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchBrands();
        fetchCategories();
        fetchDepartments();
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
            
            // Aggregate size_stock across warehouses
            const aggregatedSizeStock = {};
            const whSizeStock = formData.warehouse_size_stock || {};
            Object.values(whSizeStock).forEach(whSizes => {
                if (whSizes && typeof whSizes === "object") {
                    Object.entries(whSizes).forEach(([sz, q]) => {
                        const num = Number(q) || 0;
                        if (num > 0) {
                            aggregatedSizeStock[sz] = (aggregatedSizeStock[sz] || 0) + num;
                        }
                    });
                }
            });

            // If warehouse_stock is specified, use sum of warehouses, otherwise formData.stock
            const whStockValues = Object.values(formData.warehouse_stock || {});
            const whTotalStock = whStockValues.reduce((a, b) => a + (Number(b) || 0), 0);
            const totalStock = whTotalStock > 0 ? whTotalStock : (formData.stock ? parseInt(formData.stock) : 0);

            const allImages = (formData.images && formData.images.length > 0)
                ? formData.images.filter(Boolean)
                : (formData.image ? [formData.image] : []);
            const primaryImage = formData.image || allImages[0] || "";
            const orderedImages = primaryImage 
                ? [primaryImage, ...allImages.filter(img => img !== primaryImage)] 
                : allImages;

            const productData = {
                name: formData.title || "",
                description: formData.description || "",
                price: formData.price ? parseFloat(formData.price) : 0.0,
                original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                discount: formData.discount ? parseInt(formData.discount) : null,
                stock_quantity: totalStock,
                category: formData.category || "",
                department: formData.department || (categoriesList.find(c => c.name === formData.category)?.department || "Clothing"),
                image: primaryImage,
                images: orderedImages,
                brand: formData.brand || "Nari Pehnawa",
                on_sale: formData.discount ? parseInt(formData.discount) > 0 : false,
                is_new: true,
                in_stock: totalStock > 0,
                sizes: parsedSizes,
                size_stock: Object.keys(aggregatedSizeStock).length > 0 ? aggregatedSizeStock : {},
                colors: parsedColors,
                fabric: formData.fabric || null,
                pattern: formData.pattern || null,
                sleeve_type: formData.sleeve_type || null,
                fit_type: formData.fit_type || null,
                occasion: formData.occasion || null,
                country_of_origin: formData.country_of_origin || "India 🇮🇳",
                hsn_code: formData.hsn_code || "621133",
                wash_care: formData.wash_care || null,
                is_returnable: formData.is_returnable !== false,
                return_policy: formData.return_policy || "Easy 15-Day Returns",
                offer_code: formData.offer_code || null,
                offer_text: formData.offer_text || null,
                delivery_charge: formData.delivery_charge !== "" ? parseFloat(formData.delivery_charge) : 0.0,
                pickup_location: formData.pickup_location || "Home",
                warehouse_stock: formData.warehouse_stock || {},
                warehouse_size_stock: formData.warehouse_size_stock || {}
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
            setFormData(emptyForm);
            fetchProducts();
        } catch (err) {
            alert(`Error saving product: ${err.message}`);
        }
    };

    const handleImageFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploadingImage(true);
        try {
            const token = getAuthToken();
            const fd = new FormData();
            files.forEach(f => fd.append("files", f));

            let uploadedUrls = [];
            try {
                const res = await fetch(`${API_BASE_URL}/upload/images`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
                if (res.ok) {
                    const data = await res.json();
                    uploadedUrls = (data.urls || []).map(u => u.startsWith("http") ? u : `${API_BASE_URL}${u}`);
                }
            } catch (err) {
                console.warn("Batch upload failed, fallback to individual:", err);
            }

            if (uploadedUrls.length === 0) {
                for (const file of files) {
                    const singleFd = new FormData();
                    singleFd.append("file", file);
                    const singleRes = await fetch(`${API_BASE_URL}/upload/image`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: singleFd,
                    });
                    if (singleRes.ok) {
                        const sData = await singleRes.json();
                        uploadedUrls.push(sData.url.startsWith("http") ? sData.url : `${API_BASE_URL}${sData.url}`);
                    }
                }
            }

            if (uploadedUrls.length === 0) {
                throw new Error("No images were uploaded. Please verify file type and size.");
            }

            setFormData(prev => {
                const existing = prev.images || (prev.image ? [prev.image] : []);
                const combined = [...existing, ...uploadedUrls];
                const primary = prev.image || combined[0] || "";
                return {
                    ...prev,
                    image: primary,
                    images: combined
                };
            });
        } catch (err) {
            alert(`Image upload error: ${err.message}`);
        } finally {
            setUploadingImage(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleSetPrimaryImage = (imgUrl) => {
        setFormData(prev => ({
            ...prev,
            image: imgUrl
        }));
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => {
            const currentList = prev.images || (prev.image ? [prev.image] : []);
            const updated = currentList.filter((_, idx) => idx !== indexToRemove);
            const primaryStillExists = updated.includes(prev.image);
            const newPrimary = primaryStillExists ? prev.image : (updated[0] || "");
            return {
                ...prev,
                image: newPrimary,
                images: updated
            };
        });
    };

    const handleEdit = (product) => {
        fetchCategories();
        fetchPickupLocations();
        setEditingProductId(product.id || product._id);
        const whStock = { ...(product.warehouse_stock || {}) };
        const whSizeStock = { ...(product.warehouse_size_stock || {}) };

        // Ensure all discovered Shiprocket warehouses have keys
        pickupLocations.forEach(loc => {
            const name = loc.pickup_location || loc.name;
            if (name && whStock[name] === undefined) {
                whStock[name] = 0;
            }
            if (name && !whSizeStock[name]) {
                whSizeStock[name] = {};
            }
        });

        // If no warehouse stock was previously allocated, allocate current stock to primary warehouse
        const totalWhAllocated = Object.values(whStock).reduce((a, b) => a + Number(b || 0), 0);
        if (totalWhAllocated === 0) {
            const primaryName = pickupLocations.find(l => l.is_primary_location)?.pickup_location || pickupLocations[0]?.pickup_location || "Home";
            whStock[primaryName] = Number(product.stock ?? product.stock_quantity ?? 0);
        }

        const rawImages = Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.image ? [product.image] : []);
        const primaryImg = product.image || rawImages[0] || "";
        const allImgs = [...rawImages];
        if (primaryImg && !allImgs.includes(primaryImg)) {
            allImgs.unshift(primaryImg);
        }

        setFormData({
            title: product.title || product.name || "",
            description: product.description || "",
            price: product.price || "",
            original_price: product.original_price || "",
            discount: product.discount || "",
            stock: (product.stock ?? product.stock_quantity ?? 0).toString(),
            category: product.category || "",
            department: product.department || (categoriesList.find(c => c.name === product.category)?.department || "Clothing"),
            image: primaryImg,
            images: allImgs,
            sku: product.sku || "",
            sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : (product.sizes || "S,M,L,XL"),
            colors: Array.isArray(product.colors) ? product.colors.join(",") : (product.colors || ""),
            fabric: product.fabric || "",
            brand: product.brand || "Nari Pehnawa",
            delivery_charge: product.delivery_charge !== undefined && product.delivery_charge !== null ? product.delivery_charge : "",
            pickup_location: product.pickup_location || pickupLocations[0]?.pickup_location || "Home",
            warehouse_stock: whStock,
            warehouse_size_stock: whSizeStock,
            is_returnable: product.is_returnable !== false,
            return_policy: product.return_policy || "Easy 15-Day Returns",
            pattern: product.pattern || "",
            sleeve_type: product.sleeve_type || "",
            fit_type: product.fit_type || "Regular Comfort Fit",
            occasion: product.occasion || "Festive, Casual, Office Wear",
            country_of_origin: product.country_of_origin || "India 🇮🇳",
            hsn_code: product.hsn_code || "621133",
            wash_care: product.wash_care || "Hand Wash or Gentle Machine Wash in Cold Water",
            offer_code: product.offer_code || "",
            offer_text: product.offer_text || ""
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
            if (!res.ok && res.status !== 404) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to delete product");
            }
            // Remove from state immediately and refresh product list
            setProducts(prev => prev.filter(p => p.id !== productId && p._id !== productId));
            fetchProducts();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Brand form submissions (Live CRUD with Backend API)
    const handleAddBrand = async (e) => {
        e.preventDefault();
        if (!newBrand.name.trim()) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/brands/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newBrand.name.trim(),
                    country: newBrand.country || "India",
                    status: newBrand.status || "Active"
                }),
            });
            if (res.ok) {
                const createdBrand = await res.json();
                setBrands(prev => [...prev, createdBrand]);
                setNewBrand({ name: "", country: "", status: "Active" });
                setShowAddBrandModal(false);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to create brand");
            }
        } catch (err) {
            console.error("Error adding brand:", err);
            alert("Network error creating brand");
        }
    };

    const handleEditBrand = (b) => {
        setEditingBrand(b);
        setNewBrand({ name: b.name, country: b.country || "India", status: b.status || "Active" });
        setShowEditBrandModal(true);
    };

    const handleUpdateBrandSubmit = async (e) => {
        e.preventDefault();
        if (!newBrand.name.trim() || !editingBrand) return;
        const brandId = editingBrand.id || editingBrand._id;
        const oldName = editingBrand.name;
        const newName = newBrand.name.trim();

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newName,
                    country: newBrand.country || "India",
                    status: newBrand.status || "Active"
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setBrands(prev => prev.map(b => (b.id === brandId || b._id === brandId) ? updated : b));
                if (oldName !== newName) {
                    setProducts(prev => prev.map(p => p.brand === oldName ? { ...p, brand: newName } : p));
                }
                setShowEditBrandModal(false);
                setEditingBrand(null);
                setNewBrand({ name: "", country: "", status: "Active" });
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to update brand");
            }
        } catch (err) {
            console.error("Error updating brand:", err);
            alert("Network error updating brand");
        }
    };

    const handleDeleteBrand = async (brandItem) => {
        const brandId = typeof brandItem === "object" ? (brandItem.id || brandItem._id) : brandItem;
        const brandName = typeof brandItem === "object" ? brandItem.name : "this brand";
        if (!window.confirm(`Are you sure you want to delete brand "${brandName}"?`)) return;

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (res.ok) {
                setBrands(prev => prev.filter(b => (b.id !== brandId && b._id !== brandId)));
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Failed to delete brand");
            }
        } catch (err) {
            console.error("Error deleting brand:", err);
            alert("Network error deleting brand");
        }
    };

    const availableDepartments = departmentsList.length > 0
        ? departmentsList.map(d => d.name)
        : Array.from(
            new Set([
                "Clothing",
                "Jewellery",
                "Footwear",
                "Accessories",
                ...categoriesList.map((c) => c.department).filter(Boolean),
                ...products.map((p) => p.department).filter(Boolean),
            ])
        );

    // Filter, Sort, Pagination computation
    const filteredProducts = products.filter((product) => {
        const q = searchQuery.toLowerCase().trim();
        const prodDept = product.department || (categoriesList.find(c => c.name?.toLowerCase() === product.category?.toLowerCase())?.department || "Clothing");
        const matchesDepartment = filterDepartment === "all" || prodDept.toLowerCase() === filterDepartment.toLowerCase();
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;

        if (!matchesDepartment || !matchesCategory) return false;
        if (!q) return true;

        const matchesSearch = 
            (product.title || "").toLowerCase().includes(q) || 
            (product.sku || "").toLowerCase().includes(q) ||
            (product.category || "").toLowerCase().includes(q) ||
            prodDept.toLowerCase().includes(q) ||
            (product.brand || "").toLowerCase().includes(q) ||
            (product.fabric || "").toLowerCase().includes(q) ||
            (product.pickup_location || "").toLowerCase().includes(q) ||
            (product.tags || []).some(t => String(t).toLowerCase().includes(q));

        return matchesSearch;
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
                        <Download className="w-4 h-4 text-cyan-400" /> Export CSV
                    </button>
                    {activeTab === "brands" ? (
                        <button
                            onClick={() => setShowAddBrandModal(true)}
                            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition duration-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-black stroke-[2.5]" /> Add Brand
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition duration-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-black stroke-[2.5]" /> Add Product
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
                    className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-gray-800 p-4 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer hover:border-cyan-500/50 transition transform hover:-translate-y-0.5 group"
                    title="Click to view inventory asset valuation"
                >
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Stock Valuation</span>
                        <span className="text-xl font-extrabold text-cyan-400 font-mono">₹{totalStockValuation.toLocaleString("en-IN")}</span>
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
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "products" ? "text-cyan-400" : "text-gray-400 hover:text-white"}`}
                >
                    Product Catalog
                    {activeTab === "products" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-400 rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("inventory"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "inventory" ? "text-cyan-400" : "text-gray-400 hover:text-white"}`}
                >
                    Inventory Warnings
                    {activeTab === "inventory" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-400 rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("brands"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition ${activeTab === "brands" ? "text-cyan-400" : "text-gray-400 hover:text-white"}`}
                >
                    Brands Manager
                    {activeTab === "brands" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-400 rounded-full"></span>}
                </button>
            </div>

            {/* TAB: PRODUCTS */}
            {activeTab === "products" && (
                <div className="space-y-4">
                    {/* Department Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => { setFilterDepartment("all"); setFilterCategory("all"); setCurrentPage(1); }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                filterDepartment === "all"
                                    ? "bg-cyan-400 text-black shadow-sm font-black"
                                    : "bg-[#111827] text-gray-400 hover:text-white border border-gray-800"
                            }`}
                        >
                            All Departments ({products.length})
                        </button>
                        {(departmentsList.length > 0 ? departmentsList : availableDepartments.map(d => ({ name: d, icon: "📁" }))).map((dept) => {
                            const deptName = dept.name || dept;
                            const count = products.filter((p) => {
                                const d = p.department || (categoriesList.find(c => c.name?.toLowerCase() === p.category?.toLowerCase())?.department || "Clothing");
                                return d.toLowerCase() === deptName.toLowerCase();
                            }).length;
                            const isSelected = filterDepartment.toLowerCase() === deptName.toLowerCase();
                            return (
                                <button
                                    key={dept.id || dept._id || deptName}
                                    type="button"
                                    onClick={() => { setFilterDepartment(deptName); setFilterCategory("all"); setCurrentPage(1); }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                        isSelected
                                            ? "bg-cyan-400 text-black shadow-sm font-black"
                                            : "bg-[#111827] text-gray-400 hover:text-white border border-gray-800"
                                    }`}
                                >
                                    <span>{dept.icon || "📁"}</span>
                                    <span>{deptName}</span>
                                    <span className="text-[10px] opacity-75">({count})</span>
                                </button>
                            );
                        })}
                    </div>

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
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                                >
                                    <option value="all" className="bg-slate-900 text-white">
                                        {filterDepartment === "all" ? `All Categories (${totalProducts})` : `All ${filterDepartment} Categories`}
                                    </option>
                                    {categoriesList && categoriesList.length > 0 ? (
                                        (() => {
                                            const groups = {};
                                            const relevantCats = filterDepartment === "all" 
                                                ? categoriesList 
                                                : categoriesList.filter(c => (c.department || "Clothing").toLowerCase() === filterDepartment.toLowerCase());

                                            relevantCats.forEach((cat) => {
                                                const dept = cat.department || "Clothing";
                                                if (!groups[dept]) groups[dept] = [];
                                                groups[dept].push(cat);
                                            });
                                            return Object.entries(groups).map(([dept, cats]) => (
                                                <optgroup key={dept} label={`📂 ${dept.toUpperCase()}`} className="bg-slate-800 text-cyan-300 font-bold">
                                                    {cats.map((cat) => {
                                                        const count = products.filter(p => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()).length;
                                                        return (
                                                            <option key={cat._id || cat.id} value={cat.name} className="bg-slate-900 text-white font-normal">
                                                                {cat.name} ({count})
                                                            </option>
                                                        );
                                                    })}
                                                </optgroup>
                                            ));
                                        })()
                                    ) : null}
                                </select>
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0b1220] border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                            <table className="w-full border-collapse text-left text-xs min-w-[950px]">
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
                                        <tr key={p.id || p._id || idx} className="hover:bg-gray-800/20 transition">
                                            {/* 1. Product */}
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className="w-10 h-10 bg-[#0b1220] border border-gray-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white truncate max-w-[220px]" title={p.title}>{p.title}</div>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] text-gray-500">
                                                            <span className="text-gray-400 font-medium">{p.brand || "Nari Pehnawa"}</span>
                                                            {p.pickup_location && (
                                                                <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 text-[9px] font-semibold">
                                                                    📍 {p.pickup_location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. SKU */}
                                            <td className="py-3.5 px-6 font-mono text-xs text-gray-400 font-medium whitespace-nowrap">
                                                {p.sku || "—"}
                                            </td>

                                            {/* 3. Category & Department */}
                                            <td className="py-3.5 px-6">
                                                <div className="flex flex-col gap-1 items-start min-w-[120px]">
                                                    <span className="text-gray-200 font-semibold">{p.category || "Uncategorized"}</span>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 whitespace-nowrap">
                                                        {p.department || (categoriesList.find(c => c.name?.toLowerCase() === p.category?.toLowerCase())?.department || "Clothing")}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 4. Price */}
                                            <td className="py-3.5 px-6 whitespace-nowrap font-mono">
                                                <div className="font-bold text-white text-xs">
                                                    ₹{Number(p.price || 0).toLocaleString()}
                                                </div>
                                                {p.original_price && Number(p.original_price) > Number(p.price) && (
                                                    <div className="text-[10px] text-gray-500 line-through">
                                                        ₹{Number(p.original_price).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 5. Stock */}
                                            <td className="py-3.5 px-6 font-mono text-gray-300 whitespace-nowrap">
                                                <div className="font-bold text-white">{p.stock} units</div>
                                                {p.warehouse_stock && Object.keys(p.warehouse_stock).length > 0 && (
                                                    <div className="text-[10px] text-gray-400 font-sans mt-0.5">
                                                        <span className="text-cyan-400 font-medium">Home: {p.warehouse_stock.Home ?? 0}</span> • <span className="text-slate-300 font-medium">home-1: {p.warehouse_stock['home-1'] ?? 0}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* 6. Status */}
                                            <td className="py-3.5 px-6 whitespace-nowrap">
                                                {getStockBadge(p.stock)}
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSharingProduct(p)}
                                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl transition cursor-pointer"
                                                        title="Share Product & QR Code"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/product/${p.id || p._id}`, "_blank")}
                                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl transition cursor-pointer"
                                                        title="View Product"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl transition cursor-pointer font-bold shadow-sm"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id || p._id)}
                                                        className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer"
                                                        title="Delete Product"
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
                                    {brandsLoading && brands.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                                                Loading brands...
                                            </td>
                                        </tr>
                                    ) : brands.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-400">
                                                No brands found. Click "Add Brand" above to register your brand.
                                            </td>
                                        </tr>
                                    ) : (
                                        brands.map((b, idx) => {
                                            const liveCount = products.filter(p => (p.brand || "").toLowerCase() === (b.name || "").toLowerCase()).length;
                                            return (
                                                <tr key={b.id || b._id || idx} className="hover:bg-gray-800/20 transition">
                                                    <td className="py-3.5 px-6 font-semibold text-white flex items-center gap-2">
                                                        <Tag className="w-4 h-4 text-cyan-400" /> {b.name}
                                                    </td>
                                                    <td className="py-3.5 px-6 font-mono text-gray-400">{b.slug}</td>
                                                    <td className="py-3.5 px-6 font-mono text-gray-300">{liveCount || b.count || 0} listings</td>
                                                    <td className="py-3.5 px-6 text-gray-400">{b.country}</td>
                                                    <td className="py-3.5 px-6">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            b.status === "Active" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                                        }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditBrand(b)}
                                                                className="p-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl transition cursor-pointer font-bold shadow-sm"
                                                                title="Edit Brand"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBrand(b)}
                                                                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer"
                                                                title="Delete Brand"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Brand Modal */}
            {(showAddBrandModal || showEditBrandModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl text-left overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                                {showEditBrandModal ? "Edit Brand Details" : "Add New Partner Brand"}
                            </h3>
                            <button
                                onClick={() => { setShowAddBrandModal(false); setShowEditBrandModal(false); setEditingBrand(null); }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={showEditBrandModal ? handleUpdateBrandSubmit : handleAddBrand} className="p-5 space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Brand Name <span className="text-cyan-600 font-extrabold">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                    placeholder="e.g. Nari Pehnawa, Bunaai"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Country Origin</label>
                                <input
                                    type="text"
                                    value={newBrand.country}
                                    onChange={(e) => setNewBrand({ ...newBrand, country: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                    placeholder="e.g. India"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Status</label>
                                <select
                                    value={newBrand.status}
                                    onChange={(e) => setNewBrand({ ...newBrand, status: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                                >
                                    <option value="Active" className="bg-white text-slate-900">Active</option>
                                    <option value="Inactive" className="bg-white text-slate-900">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl shadow-md transition duration-200 cursor-pointer text-xs">
                                    {showEditBrandModal ? "Update Brand" : "Save Brand"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddBrandModal(false); setShowEditBrandModal(false); setEditingBrand(null); }}
                                    className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-black border border-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col shadow-2xl text-left overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20"></span>
                                <h3 className="text-base font-bold text-slate-900 tracking-wide">
                                    {showEditModal ? "Edit Product Listing" : "Add New Product"}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowEditModal(false);
                                    setEditingProductId(null);
                                    setFormData(emptyForm);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1 text-slate-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Product Title <span className="text-cyan-600 font-extrabold">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. Royal Embroidered Anarkali Kurti"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Brand Name</label>
                                    <select
                                        value={formData.brand || "Nari Pehnawa"}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                                    >
                                        {(brands || []).map((b, idx) => (
                                            <option key={b.id || idx} value={b.name} className="bg-white text-slate-900">{b.name}</option>
                                        ))}
                                        {(!brands || brands.length === 0) && (
                                            <option value="Nari Pehnawa" className="bg-white text-slate-900">Nari Pehnawa</option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Price (INR) <span className="text-cyan-600 font-extrabold">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. 1299"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                                        <span>Total Stock Quantity <span className="text-cyan-600 font-extrabold">*</span></span>
                                        <span className="text-[10px] text-cyan-700 font-normal">Auto-calculated from Warehouses</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono font-bold transition"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                                        <span>Department / Main Section <span className="text-cyan-600 font-extrabold">*</span></span>
                                        <span className="text-[10px] text-cyan-700 font-normal">Organize Product Line</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                        {(departmentsList.length > 0 ? departmentsList : PRESET_DEPARTMENTS.map(p => ({ id: p.id, name: p.label, icon: p.icon }))).map((dept) => {
                                            const deptName = dept.name || dept.id;
                                            const isSelected = (formData.department || "Clothing").toLowerCase() === deptName.toLowerCase();
                                            return (
                                                <button
                                                    key={dept.id || dept._id || deptName}
                                                    type="button"
                                                    onClick={() => {
                                                        const targetDept = deptName;
                                                        const validCat = categoriesList.find(c => (c.department || "Clothing").toLowerCase() === targetDept.toLowerCase() && c.name === formData.category);
                                                        setFormData({
                                                            ...formData,
                                                            department: targetDept,
                                                            category: validCat ? formData.category : ""
                                                        });
                                                    }}
                                                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm ring-1 ring-cyan-400 font-black"
                                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    <span>{dept.icon || "📁"}</span>
                                                    <span className="truncate">{deptName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.department || ""}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Or type custom department (e.g., Watches, Kids, Beauty...)"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 font-medium mb-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                                        <span>Category <span className="text-cyan-600 font-extrabold">*</span></span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-cyan-700 font-normal">
                                                In {formData.department || "Clothing"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddCatOpen(!quickAddCatOpen)}
                                                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                                            >
                                                {quickAddCatOpen ? "Cancel" : "+ New Category"}
                                            </button>
                                        </div>
                                    </label>

                                    {quickAddCatOpen && (
                                        <div className="mb-2.5 p-2.5 bg-cyan-50/80 border border-cyan-200 rounded-xl flex items-center gap-2 animate-fadeIn">
                                            <input
                                                type="text"
                                                value={quickCatName}
                                                onChange={(e) => setQuickCatName(e.target.value)}
                                                placeholder={`New category for ${formData.department || 'Clothing'}...`}
                                                className="flex-1 bg-white border border-cyan-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={!quickCatName.trim() || quickCatLoading}
                                                onClick={async () => {
                                                    if (!quickCatName.trim()) return;
                                                    setQuickCatLoading(true);
                                                    try {
                                                        const targetDept = formData.department?.trim() || "Clothing";
                                                        const res = await fetch(`${API_BASE_URL}/categories/`, {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                Authorization: `Bearer ${getToken()}`
                                                            },
                                                            body: JSON.stringify({
                                                                name: quickCatName.trim(),
                                                                department: targetDept,
                                                                image: "/placeholder.jpg",
                                                                link: `/category/${quickCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                                                                is_active: true
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            const newCat = await res.json();
                                                            await fetchCategories();
                                                            setFormData({
                                                                ...formData,
                                                                category: newCat.name,
                                                                department: targetDept
                                                            });
                                                            setQuickCatName("");
                                                            setQuickAddCatOpen(false);
                                                        } else {
                                                            const err = await res.json().catch(() => ({}));
                                                            alert(err.detail || "Failed to create category");
                                                        }
                                                    } catch (err) {
                                                        alert(`Error creating category: ${err.message}`);
                                                    } finally {
                                                        setQuickCatLoading(false);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {quickCatLoading ? "Saving..." : "Save & Select"}
                                            </button>
                                        </div>
                                    )}

                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => {
                                            const selectedCatName = e.target.value;
                                            const matchedCat = categoriesList.find(c => c.name === selectedCatName);
                                            setFormData({
                                                ...formData,
                                                category: selectedCatName,
                                                department: matchedCat?.department || formData.department || "Clothing"
                                            });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                                    >
                                        <option value="" className="bg-white text-slate-500">── Select Category ──</option>
                                        {categoriesList && categoriesList.length > 0 ? (
                                            (() => {
                                                const currentDept = (formData.department || "Clothing").toLowerCase();
                                                const deptCats = categoriesList.filter(c => (c.department || "Clothing").toLowerCase() === currentDept);
                                                const otherCats = categoriesList.filter(c => (c.department || "Clothing").toLowerCase() !== currentDept);
                                                
                                                return (
                                                    <>
                                                        <optgroup label={`📁 ${formData.department?.toUpperCase() || 'CLOTHING'} CATEGORIES`} className="bg-slate-100 text-cyan-900 font-bold">
                                                            {deptCats.length > 0 ? (
                                                                deptCats.map((cat) => (
                                                                    <option key={cat._id || cat.id} value={cat.name} className="bg-white text-slate-800 font-medium">
                                                                        {cat.name}
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option disabled value="" className="bg-white text-slate-400">No categories in {formData.department} yet (Click "+ New Category" above)</option>
                                                            )}
                                                        </optgroup>
                                                        {otherCats.length > 0 && (
                                                            <optgroup label="📂 OTHER DEPARTMENTS" className="bg-slate-100 text-slate-500 font-bold">
                                                                {otherCats.map((cat) => (
                                                                    <option key={cat._id || cat.id} value={cat.name} className="bg-white text-slate-600 font-normal">
                                                                        {cat.name} ({cat.department || "Clothing"})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <option disabled className="bg-white text-slate-400">No categories found (Click "+ New Category" to create)</option>
                                        )}
                                        {/* Retain current product category if not in fetched list */}
                                        {formData.category && !categoriesList.some(c => c.name?.toLowerCase() === formData.category?.toLowerCase()) && (
                                            <option value={formData.category} className="bg-white text-cyan-700 font-semibold">
                                                {formData.category} (Current)
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4 text-cyan-600" />
                                            <span>Product Photos (Select Multiple) *</span>
                                        </label>
                                        <span className="text-[11px] text-slate-500 font-medium">
                                            Hold Shift/Ctrl to select multiple files • First photo is Primary
                                        </span>
                                    </div>

                                    {/* Upload Trigger Area */}
                                    <label className="border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col sm:flex-row items-center justify-center gap-3 group">
                                        {uploadingImage ? (
                                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 group-hover:scale-105 transition-transform flex-shrink-0">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="text-center sm:text-left">
                                            <div className="text-xs text-slate-800 font-bold">
                                                {uploadingImage ? "Uploading product photos..." : "Click or Drag to Upload Multiple Images"}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                PNG, JPG, WebP (Max 10MB each) • You can select multiple images at once
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageFileUpload}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                    </label>

                                    {/* Gallery & Primary Preview */}
                                    {((formData.images && formData.images.length > 0) || formData.image) && (
                                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-800">
                                                    Uploaded Photos ({formData.images?.length || (formData.image ? 1 : 0)})
                                                </span>
                                                <span className="text-[11px] text-cyan-700 font-semibold">
                                                    Click "Make Primary" to set the main cover image
                                                </span>
                                            </div>

                                            {/* Thumbnail cards grid */}
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                                                {(formData.images && formData.images.length > 0 ? formData.images : [formData.image]).map((imgUrl, idx) => {
                                                    const isPrimary = (formData.image === imgUrl) || (!formData.image && idx === 0);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`relative rounded-xl overflow-hidden group bg-white border-2 transition shadow-xs flex flex-col ${
                                                                isPrimary
                                                                    ? "border-cyan-400 ring-2 ring-cyan-400/30"
                                                                    : "border-slate-200 hover:border-slate-300"
                                                            }`}
                                                        >
                                                            <div className="w-full h-24 bg-slate-100 overflow-hidden relative">
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={`Product image ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                
                                                                {/* Primary Badge */}
                                                                {isPrimary && (
                                                                    <span className="absolute top-1.5 left-1.5 bg-cyan-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                                                        <Star className="w-2.5 h-2.5 fill-black" /> Primary
                                                                    </span>
                                                                )}

                                                                {/* Delete Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveImage(idx);
                                                                    }}
                                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition opacity-80 hover:opacity-100 cursor-pointer shadow-sm"
                                                                    title="Remove image"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {/* Card footer action */}
                                                            <div className="p-1 text-center bg-white border-t border-slate-100">
                                                                {isPrimary ? (
                                                                    <span className="text-[10px] font-bold text-cyan-700">
                                                                        Cover Photo
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetPrimaryImage(imgUrl)}
                                                                        className="w-full py-0.5 text-[10px] font-bold text-slate-700 hover:text-black hover:bg-cyan-100 rounded transition cursor-pointer"
                                                                    >
                                                                        Make Primary
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Add More Tile */}
                                                <label className="h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-white hover:bg-cyan-50/30 flex flex-col items-center justify-center cursor-pointer transition text-slate-500 hover:text-cyan-600">
                                                    <Plus className="w-5 h-5" />
                                                    <span className="text-[10px] font-bold mt-1">Add More</span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleImageFileUpload}
                                                        className="hidden"
                                                        disabled={uploadingImage}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Original Price (MRP)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.original_price}
                                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. 1999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Discount %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. 20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Fabric</label>
                                    <input
                                        type="text"
                                        value={formData.fabric}
                                        onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. Pure Cotton, Chanderi Silk"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Delivery Charge (INR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.delivery_charge}
                                        onChange={(e) => setFormData({ ...formData, delivery_charge: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="0 (or leave empty for default)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Primary Dispatch Warehouse (Shiprocket)</label>
                                    <select
                                        value={formData.pickup_location || "Home"}
                                        onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                                    >
                                        {(pickupLocations || []).map((loc) => (
                                            <option key={loc.id || loc.pickup_location} value={loc.pickup_location} className="bg-white text-slate-900">
                                                {loc.pickup_location} — {loc.city}, {loc.state} ({loc.pin_code}) {loc.is_primary_location ? "★ Primary" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Sizes (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.sizes}
                                        onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. S,M,L,XL,XXL"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Returnable Product?</label>
                                    <select
                                        value={formData.is_returnable ? "yes" : "no"}
                                        onChange={(e) => setFormData({ ...formData, is_returnable: e.target.value === "yes" })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                                    >
                                        <option value="yes">Yes — Returnable</option>
                                        <option value="no">No — Non-Returnable (Final Sale)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Return Policy Badge Text</label>
                                    <input
                                        type="text"
                                        value={formData.return_policy}
                                        onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs transition"
                                        placeholder="e.g. Easy 15-Day Returns or Non-Returnable"
                                    />
                                </div>
                            </div>

                            {/* ── Product Specifications Matrix ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                                <div>
                                    <span className="text-cyan-700 font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                        ✨ Specifications Matrix (Detailed Attributes)
                                    </span>
                                    <p className="text-xs text-slate-500 mt-1">
                                        These attributes power the specifications table on the live product detail page.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Pattern / Work</label>
                                        <input
                                            type="text"
                                            value={formData.pattern}
                                            onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Floral Print, Embroidered"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Sleeve Style</label>
                                        <input
                                            type="text"
                                            value={formData.sleeve_type}
                                            onChange={(e) => setFormData({ ...formData, sleeve_type: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Sleeveless, Full Sleeve, 3/4 Sleeves"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Fit Type</label>
                                        <input
                                            type="text"
                                            value={formData.fit_type}
                                            onChange={(e) => setFormData({ ...formData, fit_type: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Regular Comfort Fit, Flared"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Occasion</label>
                                        <input
                                            type="text"
                                            value={formData.occasion}
                                            onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Festive, Casual, Office Wear"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Country of Origin</label>
                                        <input
                                            type="text"
                                            value={formData.country_of_origin}
                                            onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. India 🇮🇳"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">HSN Code</label>
                                        <input
                                            type="text"
                                            value={formData.hsn_code}
                                            onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. 621133"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Wash & Care Instructions</label>
                                        <input
                                            type="text"
                                            value={formData.wash_care}
                                            onChange={(e) => setFormData({ ...formData, wash_care: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Hand Wash or Gentle Machine Wash in Cold Water"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Product Festival Offer / Coupon ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                                <div>
                                    <span className="text-cyan-700 font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                        🏷️ Product Special Coupon / Offer Code (Optional)
                                    </span>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Set a specific promo code or festival discount that customers can copy on this product page.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Offer / Coupon Code</label>
                                        <input
                                            type="text"
                                            value={formData.offer_code}
                                            onChange={(e) => setFormData({ ...formData, offer_code: e.target.value.toUpperCase() })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono font-bold transition"
                                            placeholder="e.g. FESTIVE10, SALE20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">Offer Banner Description</label>
                                        <input
                                            type="text"
                                            value={formData.offer_text}
                                            onChange={(e) => setFormData({ ...formData, offer_text: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Use Coupon FESTIVE10 for extra 10% OFF"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Multi-Warehouse Inventory & Variant Stock Allocation Card ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                                    <div>
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="text-cyan-700 font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-cyan-600" /> Shiprocket Multi-Warehouse Allocation
                                            </span>
                                            <span className="text-[11px] bg-cyan-100 text-cyan-800 border border-cyan-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                                Dynamic Shiprocket ({pickupLocations.length} Warehouses)
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Manage stock per size for each Shiprocket warehouse. Totals sync automatically!
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => fetchPickupLocations(true)}
                                            disabled={isSyncingWarehouses}
                                            className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                                            title="Sync live warehouses from Shiprocket"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 text-black ${isSyncingWarehouses ? "animate-spin" : ""}`} />
                                            <span>{isSyncingWarehouses ? "Syncing..." : "Sync Shiprocket"}</span>
                                        </button>
                                        <div className="text-right bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Stock</span>
                                            <span className="text-sm font-extrabold text-cyan-700 font-mono">{formData.stock || 0} units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(pickupLocations.length > 0 ? pickupLocations : DEFAULT_WAREHOUSES).map((wh) => {
                                        const whCode = wh.pickup_location;
                                        const whTotal = formData.warehouse_stock?.[whCode] ?? 0;
                                        const parsedSizeList = formData.sizes ? formData.sizes.split(",").map(s => s.trim()).filter(Boolean) : [];

                                        return (
                                            <div key={whCode} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                            <span className="text-cyan-600">📍</span>
                                                            <span>{whCode}</span>
                                                            {wh.is_primary_location && (
                                                                <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-300 font-bold">Primary</span>
                                                            )}
                                                            {formData.pickup_location === whCode && (
                                                                <span className="text-[10px] bg-cyan-400 text-black font-bold px-2 py-0.5 rounded">Selected Dispatch</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500 block mt-1 font-medium">{wh.city || "UP"}, PIN: {wh.pin_code || ""}</span>
                                                    </div>
                                                    <div className="text-right bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Warehouse Qty</span>
                                                        <span className="font-extrabold text-xs text-cyan-700 font-mono">{whTotal} units</span>
                                                    </div>
                                                </div>

                                                {parsedSizeList.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] text-slate-700 font-bold block uppercase tracking-wider">Quantities by Size:</span>
                                                        <div className="grid grid-cols-4 gap-2.5">
                                                            {parsedSizeList.map((sz) => {
                                                                const qty = formData.warehouse_size_stock?.[whCode]?.[sz] ?? "";
                                                                return (
                                                                    <div key={sz} className="text-center bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition">
                                                                        <span className="text-xs font-bold text-slate-800 font-mono block mb-1">{sz}</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="0"
                                                                            value={qty}
                                                                            onChange={(e) => handleWarehouseSizeStockChange(whCode, sz, e.target.value)}
                                                                            className="w-full bg-white border border-slate-300 rounded-lg py-1 text-center text-xs text-slate-900 font-extrabold font-mono focus:outline-none focus:border-cyan-400 placeholder-slate-400"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="text-xs text-slate-700 font-semibold block mb-1.5">Total Warehouse Stock</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={whTotal}
                                                            onChange={(e) => handleWarehouseTotalStockChange(whCode, e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:border-cyan-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs h-24 resize-none transition"
                                    placeholder="Enter detailed product description, fabric details, styling notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-200">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl shadow-md transition duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {showEditModal ? "Update Product Listing" : "Publish Product Listing"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setEditingProductId(null);
                                        setFormData(emptyForm);
                                    }}
                                    className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-black border border-slate-300 font-bold rounded-xl transition duration-200 text-xs cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-lg p-5 sm:p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => { setSharingProduct(null); setCopiedLink(false); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black rounded-full bg-slate-100 hover:bg-slate-200 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                            <QrCode className="w-6 h-6 text-cyan-500" />
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">Share & Print QR Code</h3>
                                <p className="text-xs text-slate-500">Scan QR code to view live product on store</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-3">
                            <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                                <img src={sharingProduct.image} alt={sharingProduct.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-slate-900 text-sm">{sharingProduct.title}</div>
                                <div className="text-xs text-cyan-600 font-mono font-bold mt-0.5">₹{sharingProduct.price?.toLocaleString()} | SKU: {sharingProduct.sku}</div>
                                {sharingProduct.pickup_location && (
                                    <div className="text-[10px] text-cyan-700 bg-cyan-100 border border-cyan-300 px-2 py-0.5 rounded mt-1 inline-block font-medium">
                                        📍 Warehouse: {sharingProduct.pickup_location}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 my-1">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://naripehnawa.com/product/' + sharingProduct.id)}`}
                                    alt="QR Code"
                                    className="w-40 h-40 object-contain"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 text-center">Scan with mobile camera to open product page directly</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://naripehnawa.com/product/${sharingProduct.id}`}
                                    className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://naripehnawa.com/product/${sharingProduct.id}`);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="px-3.5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 flex-shrink-0 shadow-md cursor-pointer"
                                >
                                    {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4 text-black" />}
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
                                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md text-center cursor-pointer"
                                >
                                    <Printer className="w-4 h-4 text-cyan-300" /> Print Label
                                </button>
                            </div>

                            {/* Email Recommendation Section */}
                            <div className="border-t border-slate-200 pt-3 space-y-2">
                                <label className="block text-[11px] font-bold text-slate-800">Email Product to Customer</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        placeholder="customer@email.com"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
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
                                        className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 flex-shrink-0 shadow-md cursor-pointer"
                                    >
                                        <Mail className="w-4 h-4 text-black" />
                                        {sendingEmail ? "Sending..." : "Send Email"}
                                    </button>
                                </div>
                                {emailStatusMsg && (
                                    <p className="text-[11px] font-medium text-cyan-700 mt-1">{emailStatusMsg}</p>
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
