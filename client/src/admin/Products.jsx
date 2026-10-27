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
    Zap,
    Flame,
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
    const [viewingProduct, setViewingProduct] = useState(null);
    const [sharingProduct, setSharingProduct] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatusMsg, setEmailStatusMsg] = useState("");

    const [uploadingImage, setUploadingImage] = useState(false);
    const [showPrintCatalogModal, setShowPrintCatalogModal] = useState(false);
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(true);

    // Quick Mega Sale / BOGO Modal state
    const [dealModalProduct, setDealModalProduct] = useState(null);
    const [dealModalForm, setDealModalForm] = useState({
        deal_type: "bogo",
        buy_qty: 1,
        get_free_qty: 1,
        deal_text: "BUY 1 GET 1 FREE (BOGO)",
        sale_price: "",
        original_price: "",
        sale_title: "Mega Festive Sale"
    });
    const [savingDeal, setSavingDeal] = useState(false);
    const [dealSuccessMsg, setDealSuccessMsg] = useState("");
    const [filterOnlyDeals, setFilterOnlyDeals] = useState(false);

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
        pickup_location: "",
        size_stock: { "S": 0, "M": 0, "L": 0, "XL": 0 },
        warehouse_stock: {},
        warehouse_size_stock: {},
        is_returnable: true,
        return_policy: "Easy 15-Day Returns",
        pattern: "",
        sleeve_type: "",
        fit_type: "Regular Comfort Fit",
        occasion: "Festive, Casual, Office Wear",
        country_of_origin: "India 🇮🇳",
        hsn_code: "621133",
        wash_care: "Hand Wash or Gentle Machine Wash in Cold Water",
        offer_type: "none",
        sale_title: "Mega Festive Sale",
        deal_type: "buy5get1",
        deal_text: "BUY 5 GET 1 FREE",
        buy_qty: 5,
        get_free_qty: 1,
        on_sale: false,
        offer_code: "",
        offer_text: "",
        highlights: "",
        style_tip: ""
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

    const handleOpenAddModal = () => {
        fetchCategories();
        fetchPickupLocations();
        setFormData({
            ...emptyForm,
            size_stock: { "S": 0, "M": 0, "L": 0, "XL": 0 },
            stock: "0"
        });
        setShowAddModal(true);
    };

    const handleSizeStockChange = (size, qty) => {
        const val = qty === "" ? "" : Math.max(0, parseInt(qty) || 0);
        setFormData(prev => {
            const updatedSizeStock = { ...(prev.size_stock || {}), [size]: val };
            const sizeValues = Object.values(updatedSizeStock).filter(v => v !== "" && !isNaN(v));
            const totalStock = sizeValues.reduce((a, b) => a + Number(b), 0);
            return {
                ...prev,
                size_stock: updatedSizeStock,
                stock: totalStock.toString()
            };
        });
    };

    const handleQuickAddAllSizes = (delta) => {
        setFormData(prev => {
            const parsedSizes = prev.sizes ? prev.sizes.split(",").map(s => s.trim()).filter(Boolean) : ["S", "M", "L", "XL"];
            const updatedSizeStock = { ...(prev.size_stock || {}) };
            parsedSizes.forEach(sz => {
                const current = parseInt(updatedSizeStock[sz]) || 0;
                updatedSizeStock[sz] = Math.max(0, current + delta);
            });
            const sizeValues = Object.values(updatedSizeStock).filter(v => v !== "" && !isNaN(v));
            const totalStock = sizeValues.reduce((a, b) => a + Number(b), 0);
            return {
                ...prev,
                size_stock: updatedSizeStock,
                stock: totalStock.toString()
            };
        });
    };

    const handleToggleSizePreset = (sizeName) => {
        setFormData(prev => {
            const currentList = prev.sizes ? prev.sizes.split(",").map(s => s.trim()).filter(Boolean) : [];
            let newList;
            const updatedSizeStock = { ...(prev.size_stock || {}) };
            if (currentList.includes(sizeName)) {
                newList = currentList.filter(s => s !== sizeName);
                delete updatedSizeStock[sizeName];
            } else {
                newList = [...currentList, sizeName];
                if (updatedSizeStock[sizeName] === undefined) {
                    updatedSizeStock[sizeName] = 0;
                }
            }
            const sizeValues = Object.values(updatedSizeStock).filter(v => v !== "" && !isNaN(v));
            const totalStock = sizeValues.length > 0 ? sizeValues.reduce((a, b) => a + Number(b), 0) : (parseInt(prev.stock) || 0);
            return {
                ...prev,
                sizes: newList.join(","),
                size_stock: updatedSizeStock,
                stock: totalStock.toString()
            };
        });
    };

    const handleOpenDealModal = (p) => {
        setDealModalProduct(p);
        setDealSuccessMsg("");
        const curDealType = p.deal_type || (p.deal_text ? "custom" : "bogo");
        setDealModalForm({
            deal_type: curDealType,
            buy_qty: p.buy_qty || (curDealType === "buy2get1" ? 2 : (curDealType === "buy5get1" ? 5 : 1)),
            get_free_qty: p.get_free_qty || 1,
            deal_text: p.deal_text || "BUY 1 GET 1 FREE (BOGO)",
            regular_price: p.price ?? "",
            sale_price: p.mega_sale_price || p.price || "",
            original_price: p.original_price || (Math.round((Number(p.price) || 0) * 1.5)),
            sale_title: p.sale_title || "Mega Festive Sale"
        });
    };

    const handleSaveDealOffer = async (isDuplicate = false) => {
        if (!dealModalProduct) return;
        setSavingDeal(true);
        setDealSuccessMsg("");
        try {
            const token = getAuthToken();
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const isNone = dealModalForm.deal_type === "none";
            const regPrice = Number(dealModalForm.regular_price) || Number(dealModalProduct.price);
            const salePrice = Number(dealModalForm.sale_price) || regPrice;
            const newOrigPrice = Number(dealModalForm.original_price) || Number(dealModalProduct.original_price) || Math.round(regPrice * 1.5);

            if (isDuplicate) {
                // Clone product with 0 re-uploading needed!
                const newTitle = `${dealModalProduct.title} - [${isNone ? "Special Offer" : dealModalForm.deal_text}]`;
                const newSku = `${dealModalProduct.sku || "NP"}-BOGO-${Date.now().toString().slice(-4)}`;

                const clonePayload = {
                    title: newTitle,
                    description: dealModalProduct.description || "",
                    price: salePrice,
                    original_price: newOrigPrice,
                    category: dealModalProduct.category || "Uncategorized",
                    department: dealModalProduct.department || "Clothing",
                    brand: dealModalProduct.brand || "Nari Pehnawa",
                    image: dealModalProduct.image,
                    images: dealModalProduct.images || [],
                    stock: dealModalProduct.stock || 0,
                    size_stock: dealModalProduct.size_stock || {},
                    sizes: dealModalProduct.sizes || "S,M,L,XL",
                    sku: newSku,
                    fabric: dealModalProduct.fabric || "",
                    pattern: dealModalProduct.pattern || "",
                    sleeve_style: dealModalProduct.sleeve_style || "",
                    fit_type: dealModalProduct.fit_type || "",
                    delivery_charge: dealModalProduct.delivery_charge || 0,
                    is_returnable: dealModalProduct.is_returnable !== false,
                    return_policy_badge: dealModalProduct.return_policy_badge || "Easy 15-Day Returns",
                    on_sale: !isNone,
                    offer_type: isNone ? "none" : "megasale",
                    deal_type: isNone ? null : dealModalForm.deal_type,
                    deal_text: isNone ? null : dealModalForm.deal_text,
                    buy_qty: isNone ? null : dealModalForm.buy_qty,
                    get_free_qty: isNone ? null : dealModalForm.get_free_qty,
                    sale_title: isNone ? null : dealModalForm.sale_title,
                    mega_sale_price: isNone ? null : salePrice,
                };

                const res = await fetch(`${API_BASE_URL}/products/`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(clonePayload)
                });
                if (!res.ok) throw new Error("Failed to duplicate product listing");
                setDealSuccessMsg("✅ Duplicated as new Mega Sale / BOGO listing successfully!");
            } else {
                // Update existing product: PRESERVE regular single-piece price, save deal offer separately
                const updatePayload = {
                    ...dealModalProduct,
                    price: regPrice, // Regular catalog price preserved!
                    mega_sale_price: isNone ? null : salePrice, // Mega sale offer price stored separately
                    original_price: newOrigPrice,
                    on_sale: !isNone,
                    offer_type: isNone ? "none" : "megasale",
                    deal_type: isNone ? null : dealModalForm.deal_type,
                    deal_text: isNone ? null : dealModalForm.deal_text,
                    buy_qty: isNone ? null : dealModalForm.buy_qty,
                    get_free_qty: isNone ? null : dealModalForm.get_free_qty,
                    sale_title: isNone ? null : dealModalForm.sale_title,
                };

                const prodId = dealModalProduct.id || dealModalProduct._id;
                const res = await fetch(`${API_BASE_URL}/products/${prodId}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(updatePayload)
                });
                if (!res.ok) throw new Error("Failed to update product offer");
                setDealSuccessMsg(`✅ Regular price kept at ₹${regPrice.toLocaleString()}! Mega Sale price set to ₹${salePrice.toLocaleString()}`);
            }

            await fetchProducts();
            setTimeout(() => {
                setDealModalProduct(null);
                setDealSuccessMsg("");
            }, 1200);
        } catch (err) {
            console.error("Deal error:", err);
            alert("Error updating deal: " + err.message);
        } finally {
            setSavingDeal(false);
        }
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
            
            // Map clean size_stock from formData.size_stock
            const cleanSizeStock = {};
            if (parsedSizes.length > 0) {
                parsedSizes.forEach(sz => {
                    const q = formData.size_stock?.[sz];
                    cleanSizeStock[sz] = (q !== "" && !isNaN(q)) ? Math.max(0, parseInt(q)) : 0;
                });
            } else if (formData.size_stock && Object.keys(formData.size_stock).length > 0) {
                Object.entries(formData.size_stock).forEach(([sz, q]) => {
                    cleanSizeStock[sz] = (q !== "" && !isNaN(q)) ? Math.max(0, parseInt(q)) : 0;
                });
            }

            const sizeStockSum = Object.values(cleanSizeStock).reduce((a, b) => a + Number(b), 0);
            const totalStock = sizeStockSum > 0 ? sizeStockSum : (formData.stock ? Math.max(0, parseInt(formData.stock)) : 0);

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
                on_sale: formData.offer_type === "flash_sale" || Boolean(formData.on_sale) || (formData.discount ? parseInt(formData.discount) > 0 : false),
                is_new: true,
                in_stock: totalStock > 0,
                sizes: parsedSizes.length > 0 ? parsedSizes : ["Free Size"],
                size_stock: cleanSizeStock,
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
                offer_type: formData.offer_type || "none",
                sale_title: formData.offer_type === "flash_sale" ? (formData.sale_title || "Mega Festive Sale") : null,
                deal_type: formData.offer_type === "flash_sale" ? (formData.deal_type || "buy5get1") : null,
                deal_text: formData.offer_type === "flash_sale" ? (formData.deal_text || "BUY 5 GET 1 FREE") : null,
                buy_qty: formData.offer_type === "flash_sale" ? (parseInt(formData.buy_qty) || 5) : null,
                get_free_qty: formData.offer_type === "flash_sale" ? (parseInt(formData.get_free_qty) || 1) : null,
                offer_code: formData.offer_type === "coupon" || formData.offer_code ? formData.offer_code : null,
                offer_text: formData.offer_type === "coupon" || formData.offer_text ? formData.offer_text : null,
                highlights: formData.highlights
                    ? formData.highlights.split("\n").map(h => h.trim()).filter(Boolean)
                    : [],
                style_tip: formData.style_tip ? formData.style_tip.trim() : null,
                delivery_charge: formData.delivery_charge !== "" ? parseFloat(formData.delivery_charge) : 0.0,
                pickup_location: formData.pickup_location || null,
                warehouse_stock: { "All": totalStock },
                warehouse_size_stock: { "Default": cleanSizeStock }
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

        let initialSizeStock = { ...(product.size_stock || {}) };
        if (Object.keys(initialSizeStock).length === 0 && product.warehouse_size_stock) {
            Object.values(product.warehouse_size_stock).forEach(whSizes => {
                if (whSizes && typeof whSizes === "object") {
                    Object.entries(whSizes).forEach(([sz, q]) => {
                        const num = Number(q) || 0;
                        if (num > 0) {
                            initialSizeStock[sz] = (initialSizeStock[sz] || 0) + num;
                        }
                    });
                }
            });
        }

        const parsedSizes = Array.isArray(product.sizes)
            ? product.sizes
            : (product.sizes ? product.sizes.split(",").map(s => s.trim()).filter(Boolean) : ["S", "M", "L", "XL"]);

        parsedSizes.forEach(sz => {
            if (initialSizeStock[sz] === undefined) {
                initialSizeStock[sz] = 0;
            }
        });

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
            sizes: parsedSizes.join(","),
            size_stock: initialSizeStock,
            colors: Array.isArray(product.colors) ? product.colors.join(",") : (product.colors || ""),
            fabric: product.fabric || "",
            brand: product.brand || "Nari Pehnawa",
            delivery_charge: product.delivery_charge !== undefined && product.delivery_charge !== null ? product.delivery_charge : "",
            pickup_location: product.pickup_location || "",
            warehouse_stock: product.warehouse_stock || {},
            warehouse_size_stock: product.warehouse_size_stock || {},
            is_returnable: product.is_returnable !== false,
            return_policy: product.return_policy || "Easy 15-Day Returns",
            pattern: product.pattern || "",
            sleeve_type: product.sleeve_type || "",
            fit_type: product.fit_type || "Regular Comfort Fit",
            occasion: product.occasion || "Festive, Casual, Office Wear",
            country_of_origin: product.country_of_origin || "India 🇮🇳",
            hsn_code: product.hsn_code || "621133",
            wash_care: product.wash_care || "Hand Wash or Gentle Machine Wash in Cold Water",
            offer_type: product.offer_type || (product.offer_code ? "coupon" : (product.deal_type ? "megasale" : "none")),
            sale_title: product.sale_title || "Mega Festive Sale",
            deal_type: product.deal_type || (product.buy_qty ? (product.buy_qty === 5 ? "buy5get1" : "custom") : "buy5get1"),
            deal_text: product.deal_text || "",
            buy_qty: product.buy_qty || 5,
            get_free_qty: product.get_free_qty || 1,
            on_sale: product.on_sale || false,
            offer_code: product.offer_code || "",
            offer_text: product.offer_text || "",
            highlights: Array.isArray(product.highlights) ? product.highlights.join("\n") : (product.highlights || ""),
            style_tip: product.style_tip || ""
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
        if (filterOnlyDeals && !product.deal_text && !product.on_sale && product.offer_type !== "megasale") return false;
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
        if (stock <= 0) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Out of Stock</span>;
        if (stock <= 5) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">Low Stock</span>;
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">In Stock</span>;
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Products Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage catalog listings, active inventory warning stocks, and brands.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPrintCatalogModal(true)}
                        className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs cursor-pointer"
                        title="Open printable product catalog with QR codes"
                    >
                        <Printer className="w-4 h-4 text-slate-600" /> Print Catalog & QR
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-slate-600" /> Export CSV
                    </button>
                    {activeTab === "brands" ? (
                        <button
                            onClick={() => setShowAddBrandModal(true)}
                            className="flex items-center gap-2 bg-[#0891b2] hover:bg-[#0e7490] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-sm transition duration-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-white stroke-[2.5]" /> Add Brand
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 bg-[#0891b2] hover:bg-[#0e7490] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-sm transition duration-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-white stroke-[2.5]" /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Inventory Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => { setActiveTab("products"); setFilterCategory("all"); setSearchQuery(""); setCurrentPage(1); }}
                    className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs cursor-pointer hover:border-[#0891b2]/50 hover:shadow-sm transition transform hover:-translate-y-0.5 group"
                    title="Click to view all product listings"
                >
                    <div className="p-3 bg-cyan-50 rounded-xl text-[#0891b2] border border-cyan-100 group-hover:bg-cyan-100">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">Total Listings</span>
                        <span className="text-xl font-extrabold text-slate-900 font-mono">{filteredProducts.length} Products</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(false); setCurrentPage(1); }}
                    className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition transform hover:-translate-y-0.5 group"
                    title="Click to view full inventory stock"
                >
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 group-hover:bg-blue-100">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">Total Inventory Stock</span>
                        <span className="text-xl font-extrabold text-slate-900 font-mono">{totalStockUnits.toLocaleString("en-IN")} Units</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(false); setCurrentPage(1); }}
                    className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs cursor-pointer hover:border-emerald-400 hover:shadow-sm transition transform hover:-translate-y-0.5 group"
                    title="Click to view inventory asset valuation"
                >
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">Stock Valuation</span>
                        <span className="text-xl font-extrabold text-emerald-700 font-mono">₹{totalStockValuation.toLocaleString("en-IN")}</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("inventory"); setShowOnlyLowStock(true); setCurrentPage(1); }}
                    className="bg-white border border-amber-200 hover:border-amber-400 p-4 rounded-2xl flex items-center gap-3 shadow-xs cursor-pointer transition transform hover:-translate-y-0.5 group relative overflow-hidden"
                    title="Click to view & restock all low stock products"
                >
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-700 border border-amber-200 group-hover:bg-amber-100">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">Low Stock Alerts</span>
                        <span className="text-xl font-extrabold text-amber-800 font-mono">{lowStockCount} Items</span>
                        <span className="text-[10px] text-amber-700 block mt-0.5 font-bold underline">Click to view & restock &rarr;</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => { setActiveTab("products"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition cursor-pointer ${activeTab === "products" ? "text-[#0891b2]" : "text-slate-600 hover:text-slate-900"}`}
                >
                    Product Catalog
                    {activeTab === "products" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("inventory"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition cursor-pointer ${activeTab === "inventory" ? "text-[#0891b2]" : "text-slate-600 hover:text-slate-900"}`}
                >
                    Inventory Warnings
                    {activeTab === "inventory" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
                </button>
                <button
                    onClick={() => { setActiveTab("brands"); setCurrentPage(1); }}
                    className={`pb-3 text-sm font-bold relative transition cursor-pointer ${activeTab === "brands" ? "text-[#0891b2]" : "text-slate-600 hover:text-slate-900"}`}
                >
                    Brands Manager
                    {activeTab === "brands" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
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
                                    ? "bg-[#0891b2] text-white shadow-xs font-bold"
                                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
                            }`}
                        >
                            All Departments ({products.length})
                        </button>

                        {/* Mega Sale & BOGO Quick Filter */}
                        {(() => {
                            const dealCount = products.filter(p => p.deal_text || p.on_sale || p.offer_type === "megasale").length;
                            return (
                                <button
                                    type="button"
                                    onClick={() => { setFilterOnlyDeals(prev => !prev); setCurrentPage(1); }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                        filterOnlyDeals
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs font-extrabold ring-2 ring-amber-300"
                                            : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
                                    }`}
                                >
                                    <Zap className={`w-3.5 h-3.5 ${filterOnlyDeals ? "fill-white text-white" : "fill-amber-500 text-amber-600"}`} />
                                    <span>⚡ Mega Sale & BOGO ({dealCount})</span>
                                </button>
                            );
                        })()}
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
                                            ? "bg-[#0891b2] text-white shadow-xs font-bold"
                                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products by SKU or Name..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0891b2] transition"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0891b2] cursor-pointer"
                                >
                                    <option value="all">
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
                                                <optgroup key={dept} label={`📂 ${dept.toUpperCase()}`} className="font-bold text-slate-700">
                                                    {cats.map((cat) => {
                                                        const count = products.filter(p => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()).length;
                                                        return (
                                                            <option key={cat._id || cat.id} value={cat.name} className="font-normal text-slate-900">
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
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0891b2] cursor-pointer"
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
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs min-w-[950px]">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
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
                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                    {paginatedProducts.map((p, idx) => (
                                        <tr key={p.id || p._id || idx} className="hover:bg-slate-50/80 transition">
                                            {/* 1. Product */}
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 truncate max-w-[220px]" title={p.title}>{p.title}</div>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px]">
                                                            <span className="text-slate-500 font-medium">{p.brand || "Nari Pehnawa"}</span>
                                                            {p.deal_text && (
                                                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-bold">
                                                                    ⚡ {p.deal_text}
                                                                </span>
                                                            )}
                                                            {p.offer_code && !p.deal_text && (
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-bold">
                                                                    🏷️ {p.offer_code}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. SKU */}
                                            <td className="py-3.5 px-6 font-mono text-xs text-slate-500 font-medium whitespace-nowrap">
                                                {p.sku || "—"}
                                            </td>

                                            {/* 3. Category & Department */}
                                            <td className="py-3.5 px-6">
                                                <div className="flex flex-col gap-1 items-start min-w-[120px]">
                                                    <span className="text-slate-900 font-semibold">{p.category || "Uncategorized"}</span>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                                        {p.department || (categoriesList.find(c => c.name?.toLowerCase() === p.category?.toLowerCase())?.department || "Clothing")}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 4. Price */}
                                            <td className="py-3.5 px-6 whitespace-nowrap font-mono">
                                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                    <span>₹{Number(p.price || 0).toLocaleString()}</span>
                                                    <span className="text-[9px] font-sans font-medium text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Regular</span>
                                                </div>
                                                {p.original_price && Number(p.original_price) > Number(p.price) && (
                                                    <div className="text-[10px] text-slate-400 line-through">
                                                        ₹{Number(p.original_price).toLocaleString()}
                                                    </div>
                                                )}
                                                {p.on_sale && (p.mega_sale_price || p.deal_text) && (
                                                    <div className="mt-1 flex flex-col gap-0.5 font-sans">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
                                                            ⚡ Mega: ₹{Number(p.mega_sale_price || p.price).toLocaleString()}
                                                        </span>
                                                        {p.deal_text && (
                                                            <span className="text-[9px] text-amber-700 font-semibold truncate max-w-[130px]" title={p.deal_text}>
                                                                {p.deal_text}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 5. Stock */}
                                            <td className="py-3.5 px-6 font-mono whitespace-nowrap">
                                                <div className="font-extrabold text-slate-900 text-sm">
                                                    {p.stock ?? 0} <span className="text-xs font-semibold text-slate-500">units</span>
                                                </div>
                                                <div className="text-[11px] font-sans mt-0.5">
                                                    {Number(p.stock) > 0 ? (
                                                        <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 6. Status */}
                                            <td className="py-3.5 px-6 whitespace-nowrap">
                                                {getStockBadge(p.stock)}
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenDealModal(p)}
                                                        className={`p-2 rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1 font-bold text-xs ${
                                                            p.deal_text
                                                                ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 ring-1 ring-amber-300"
                                                                : "bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-300"
                                                        }`}
                                                        title={p.deal_text ? `Active Deal: ${p.deal_text} (Click to manage deal / duplicate)` : "Set Mega Sale / BOGO Deal & Price"}
                                                    >
                                                        <Zap className={`w-4 h-4 ${p.deal_text ? "fill-amber-500 text-amber-700" : "text-amber-600"}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => setSharingProduct(p)}
                                                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                                                        title="Share Product & QR Code"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingProduct(p)}
                                                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-cyan-700 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                                                        title="View Product Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl transition cursor-pointer font-bold shadow-2xs"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id || p._id)}
                                                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
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
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                                <Package className="w-12 h-12 opacity-40 animate-pulse text-slate-400" />
                                <span>No products matching query found.</span>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs">
                            <span className="text-slate-500">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="w-8 h-8 text-amber-700 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-900 text-base">Critical Stock Alerts & Restock Center</h4>
                                <p className="text-xs text-slate-600 mt-0.5">Showing products with low stock (5 or fewer units). Edit stock directly to restock inventory.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowOnlyLowStock(prev => !prev)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${showOnlyLowStock ? "bg-amber-200 border-amber-400 text-amber-900" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                            >
                                {showOnlyLowStock ? "Filter: Low Stock (5 or fewer Units)" : "Filter: Showing All Stock"}
                            </button>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-4 px-6">Product</th>
                                        <th className="py-4 px-6">SKU</th>
                                        <th className="py-4 px-6">Available Stock</th>
                                        <th className="py-4 px-6">Total Asset Value</th>
                                        <th className="py-4 px-6">Stock Status</th>
                                        <th className="py-4 px-6 text-right">Quick Restock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                    {(showOnlyLowStock ? filteredProducts.filter(p => (parseInt(p.stock || 0) || 0) <= 5) : paginatedProducts).map((p, idx) => {
                                        const assetValue = p.price * p.stock;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 px-6 font-bold text-slate-900">{p.title}</td>
                                                <td className="py-3.5 px-6 font-mono text-slate-500">{p.sku}</td>
                                                <td className="py-3.5 px-6 font-mono font-medium text-slate-800">{p.stock} units</td>
                                                <td className="py-3.5 px-6 font-mono text-slate-600">₹{assetValue.toLocaleString()}</td>
                                                <td className="py-3.5 px-6">{getStockBadge(p.stock)}</td>
                                                <td className="py-3.5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input 
                                                            type="number"
                                                            defaultValue={p.stock}
                                                            onBlur={(e) => handleUpdateStock(p.id, e.target.value)}
                                                            className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:border-[#0891b2] focus:outline-none"
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
                        <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs">
                            <span className="text-slate-500">Showing page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-4 px-6">Brand Name</th>
                                        <th className="py-4 px-6">Slug</th>
                                        <th className="py-4 px-6">Total Products</th>
                                        <th className="py-4 px-6">Country Origin</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                    {brandsLoading && brands.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-500">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0891b2]" />
                                                Loading brands...
                                            </td>
                                        </tr>
                                    ) : brands.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-500">
                                                No brands found. Click "Add Brand" above to register your brand.
                                            </td>
                                        </tr>
                                    ) : (
                                        brands.map((b, idx) => {
                                            const liveCount = products.filter(p => (p.brand || "").toLowerCase() === (b.name || "").toLowerCase()).length;
                                            return (
                                                <tr key={b.id || b._id || idx} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                                                        <Tag className="w-4 h-4 text-[#0891b2]" /> {b.name}
                                                    </td>
                                                    <td className="py-3.5 px-6 font-mono text-slate-500">{b.slug}</td>
                                                    <td className="py-3.5 px-6 font-mono text-slate-800">{liveCount || b.count || 0} listings</td>
                                                    <td className="py-3.5 px-6 text-slate-600">{b.country}</td>
                                                    <td className="py-3.5 px-6">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            b.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                                                        }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditBrand(b)}
                                                                className="p-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl transition cursor-pointer font-bold shadow-2xs"
                                                                title="Edit Brand"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBrand(b)}
                                                                className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
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
                                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-slate-700 text-white flex items-center justify-center transition opacity-80 hover:opacity-100 cursor-pointer shadow-sm"
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
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] text-xs transition"
                                        placeholder="0 (or leave empty for default)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5">Returnable Product?</label>
                                    <select
                                        value={formData.is_returnable ? "yes" : "no"}
                                        onChange={(e) => setFormData({ ...formData, is_returnable: e.target.value === "yes" })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] cursor-pointer"
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
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] text-xs transition"
                                        placeholder="e.g. Easy 15-Day Returns or Non-Returnable"
                                    />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-slate-700 font-bold text-xs">Sizes (comma separated or select chips below)</label>
                                        <span className="text-[11px] text-slate-500 font-medium">Click chip to toggle size</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.sizes}
                                        onChange={(e) => {
                                            const newSizesStr = e.target.value;
                                            const parsed = newSizesStr.split(",").map(s => s.trim()).filter(Boolean);
                                            const updatedSizeStock = { ...(formData.size_stock || {}) };
                                            parsed.forEach(sz => {
                                                if (updatedSizeStock[sz] === undefined) updatedSizeStock[sz] = 0;
                                            });
                                            setFormData({ ...formData, sizes: newSizesStr, size_stock: updatedSizeStock });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] text-xs transition"
                                        placeholder="e.g. S,M,L,XL,XXL"
                                    />
                                    {/* Quick Size Preset Chips */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span className="text-[11px] text-slate-500 font-semibold mr-1">Quick Add:</span>
                                        {["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"].map((sz) => {
                                            const activeList = formData.sizes ? formData.sizes.split(",").map(s => s.trim()) : [];
                                            const isSelected = activeList.includes(sz);
                                            return (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => handleToggleSizePreset(sz)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                                        isSelected
                                                            ? "bg-[#0891b2] text-white border-[#0891b2] shadow-2xs"
                                                            : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300"
                                                    }`}
                                                >
                                                    {isSelected ? `✓ ${sz}` : `+ ${sz}`}
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                                            ✨ Key Highlights (Optional — enter each bullet on a new line)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.highlights}
                                            onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder={"100% Pure Premium Cotton with Artisanal Handcrafting\nBreathable & Comfortable Silhouette for All-Day Wear\nPre-Shrunk Material with Vivid Color Fastness"}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                                            💡 Styling Tip (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.style_tip}
                                            onChange={(e) => setFormData({ ...formData, style_tip: e.target.value })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                                            placeholder="e.g. Pair with oxidized silver jhumkas and ethnic mojaris for a royal look"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Unified Offer & Promotion Scheme (Mega Sale, Flash Sale, BOGO, Buy X Get Y, Coupons) ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                                <div>
                                    <span className="text-slate-900 font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                        🎁 Product Offer & Promotion Scheme
                                    </span>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Attach a Mega Sale, Flash Sale & Event deal (e.g. Buy 5 Get 1 Free, Buy 5 Get 2 Free, BOGO) or a Special Promo Coupon to this product.
                                    </p>
                                </div>

                                {/* Offer Type Selector */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            offer_type: "none", 
                                            on_sale: false, 
                                            deal_type: "", 
                                            deal_text: "", 
                                            offer_code: "", 
                                            offer_text: "" 
                                        })}
                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col gap-1 cursor-pointer ${
                                            (formData.offer_type === "none" || !formData.offer_type)
                                                ? "bg-white border-[#0891b2] text-slate-900 ring-2 ring-[#0891b2]/20 shadow-xs"
                                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                                        }`}
                                    >
                                        <span className="text-sm">🏷️ Standard Price</span>
                                        <span className="text-[11px] font-normal text-slate-500">Regular catalog listing without active promotion</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            offer_type: "megasale", 
                                            on_sale: true, 
                                            sale_title: formData.sale_title || "Mega Festive Sale",
                                            deal_type: formData.deal_type || "buy5get1",
                                            buy_qty: formData.buy_qty || 5,
                                            get_free_qty: formData.get_free_qty || 1,
                                            deal_text: formData.deal_text || "BUY 5 GET 1 FREE"
                                        })}
                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col gap-1 cursor-pointer ${
                                            formData.offer_type === "megasale"
                                                ? "bg-white border-[#0891b2] text-slate-900 ring-2 ring-[#0891b2]/20 shadow-xs"
                                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                                        }`}
                                    >
                                        <span className="text-sm">⚡ Mega / Flash Sale</span>
                                        <span className="text-[11px] font-normal text-slate-500">BOGO, Buy 5 Get 1 Free, Buy X Get Y Free</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, offer_type: "coupon", on_sale: false })}
                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col gap-1 cursor-pointer ${
                                            formData.offer_type === "coupon"
                                                ? "bg-white border-[#0891b2] text-slate-900 ring-2 ring-[#0891b2]/20 shadow-xs"
                                                : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                                        }`}
                                    >
                                        <span className="text-sm">🎟️ Promo Coupon</span>
                                        <span className="text-[11px] font-normal text-slate-500">Specific voucher code to copy & apply at checkout</span>
                                    </button>
                                </div>

                                {/* Mega / Flash Sale Details */}
                                {formData.offer_type === "megasale" && (
                                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Event / Sale Title</label>
                                                <input
                                                    type="text"
                                                    value={formData.sale_title || ""}
                                                    onChange={(e) => setFormData({ ...formData, sale_title: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] transition"
                                                    placeholder="e.g. Mega Festive Sale, Flash Sale Deal"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Deal Format / Structure</label>
                                                <select
                                                    value={formData.deal_type || "buy5get1"}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let b = formData.buy_qty || 5;
                                                        let g = formData.get_free_qty || 1;
                                                        let text = "";
                                                        if (val === "buy5get1") { b = 5; g = 1; text = "BUY 5 GET 1 FREE"; }
                                                        else if (val === "buy5get2") { b = 5; g = 2; text = "BUY 5 GET 2 FREE"; }
                                                        else if (val === "bogo") { b = 1; g = 1; text = "BUY 1 GET 1 FREE (BOGO)"; }
                                                        else if (val === "buy2get1") { b = 2; g = 1; text = "BUY 2 GET 1 FREE"; }
                                                        else if (val === "buy3get1") { b = 3; g = 1; text = "BUY 3 GET 1 FREE"; }
                                                        else if (val === "percent") { text = "FLASH SALE DISCOUNT"; }
                                                        else { text = `BUY ${b} GET ${g} FREE`; }
                                                        setFormData({ ...formData, deal_type: val, buy_qty: b, get_free_qty: g, deal_text: text });
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] cursor-pointer"
                                                >
                                                    <option value="buy5get1">Buy 5 Get 1 Free</option>
                                                    <option value="buy5get2">Buy 5 Get 2 Free</option>
                                                    <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                                                    <option value="buy2get1">Buy 2 Get 1 Free</option>
                                                    <option value="buy3get1">Buy 3 Get 1 Free</option>
                                                    <option value="custom">Custom Buy X Get Y Free</option>
                                                    <option value="percent">Percentage Flash Discount</option>
                                                </select>
                                            </div>
                                        </div>

                                        {(formData.deal_type === "custom" || formData.deal_type?.startsWith("buy") || formData.deal_type === "bogo") && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                <div>
                                                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">Buy Quantity (X)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={formData.buy_qty ?? 5}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            const g = formData.get_free_qty || 1;
                                                            setFormData({ ...formData, buy_qty: val, deal_text: `BUY ${val} GET ${g} FREE` });
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] transition"
                                                        placeholder="e.g. 5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">Get Free Quantity (Y)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={formData.get_free_qty ?? 1}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            const b = formData.buy_qty || 1;
                                                            setFormData({ ...formData, get_free_qty: val, deal_text: `BUY ${b} GET ${val} FREE` });
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] transition"
                                                        placeholder="e.g. 1"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-slate-700 font-bold mb-1.5 text-xs">Deal Badge / Banner Text (Shown on Storefront & Cart)</label>
                                            <input
                                                type="text"
                                                value={formData.deal_text || ""}
                                                onChange={(e) => setFormData({ ...formData, deal_text: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#0891b2] transition"
                                                placeholder="e.g. BUY 5 GET 1 FREE"
                                            />
                                        </div>

                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">⚡</span>
                                                <div>
                                                    <span className="font-extrabold text-amber-900 block">{formData.sale_title || "Mega Festive Sale"}: {formData.deal_text || "BUY 5 GET 1 FREE"}</span>
                                                    <span className="text-[11px] text-amber-700">Discounts will be automatically calculated when customers add qualifying items to their cart!</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[10px] whitespace-nowrap">Active Deal</span>
                                        </div>
                                    </div>
                                )}

                                {/* Coupon Code Details */}
                                {formData.offer_type === "coupon" && (
                                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Offer / Coupon Code</label>
                                                <input
                                                    type="text"
                                                    value={formData.offer_code || ""}
                                                    onChange={(e) => setFormData({ ...formData, offer_code: e.target.value.toUpperCase() })}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#0891b2] transition"
                                                    placeholder="e.g. FESTIVE10, SALE20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-700 font-bold mb-1.5 text-xs">Offer Banner Description</label>
                                                <input
                                                    type="text"
                                                    value={formData.offer_text || ""}
                                                    onChange={(e) => setFormData({ ...formData, offer_text: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#0891b2] transition"
                                                    placeholder="e.g. Use Coupon FESTIVE10 for extra 10% OFF"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Product Stock & Variant Inventory Allocation Card ── */}
                            {(() => {
                                const parsedSizeList = formData.sizes ? formData.sizes.split(",").map(s => s.trim()).filter(Boolean) : [];
                                return (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                                            <div>
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="text-slate-900 font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                                                        <Layers className="w-4 h-4 text-cyan-600" /> Stock & Size-Wise Inventory
                                                    </span>
                                                    <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Auto-Synced Total
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Enter stock per size. Dispatch warehouse will be selected dynamically at order confirmation/fulfillment time.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
                                                <div className="text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Stock</span>
                                                    <span className="text-base font-extrabold text-cyan-700 font-mono">
                                                        {Number(formData.stock || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">units</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {parsedSizeList.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <span className="text-xs text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <span>📦</span> Quantities by Size:
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                                        <span className="text-slate-400 text-[11px] font-medium mr-1">Quick add to all:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickAddAllSizes(5)}
                                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                                                        >
                                                            +5 all
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickAddAllSizes(10)}
                                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                                                        >
                                                            +10 all
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickAddAllSizes(25)}
                                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                                                        >
                                                            +25 all
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const reset = {};
                                                                parsedSizeList.forEach(s => reset[s] = 0);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    stock: 0,
                                                                    size_stock: reset,
                                                                    warehouse_stock: { "All": 0 }
                                                                }));
                                                            }}
                                                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer active:scale-95"
                                                        >
                                                            Reset 0
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                    {parsedSizeList.map((sz) => {
                                                        const qty = formData.size_stock?.[sz] ?? 0;
                                                        return (
                                                            <div
                                                                key={sz}
                                                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-cyan-400 transition"
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs font-extrabold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                        {sz}
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold ${Number(qty) > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                                                        {Number(qty) > 0 ? `${qty} in stock` : "0 stock"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSizeStockChange(sz, Math.max(0, Number(qty || 0) - 1))}
                                                                        className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer select-none transition"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={qty}
                                                                        onChange={(e) => handleSizeStockChange(sz, e.target.value)}
                                                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1 text-center text-sm text-slate-900 font-extrabold font-mono focus:outline-none focus:border-cyan-500 focus:bg-white"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSizeStockChange(sz, Number(qty || 0) + 1)}
                                                                        className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer select-none transition"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                <div className="max-w-xs">
                                                    <label className="text-xs text-slate-700 font-bold block mb-1.5 uppercase tracking-wider">
                                                        Total Inventory Units (Free Size / Standard)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={formData.stock || ""}
                                                        onChange={(e) => {
                                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                stock: val,
                                                                warehouse_stock: { "All": val }
                                                            }));
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold font-mono focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                                                    />
                                                    <span className="text-[11px] text-slate-400 block mt-1">
                                                        Tip: Enter sizes in the field above (e.g. S, M, L, XL) to allocate inventory per size.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

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
            {/* ── QUICK MEGA SALE & BOGO MANAGER MODAL ── */}
            {dealModalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-lg p-5 sm:p-6 relative shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                        <button
                            onClick={() => { setDealModalProduct(null); setDealSuccessMsg(""); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-2xs">
                                <Zap className="w-5 h-5 fill-amber-500 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Mega Sale & BOGO Offer Manager</h3>
                                <p className="text-xs text-slate-500">Attach Buy 1 Get 1 Free, custom deal & price without re-uploading photos!</p>
                            </div>
                        </div>

                        {/* Product Summary */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-300 shadow-2xs flex-shrink-0">
                                <img src={dealModalProduct.image} alt={dealModalProduct.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-xs truncate">{dealModalProduct.title}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    Current Price: <span className="font-bold text-slate-900">₹{Number(dealModalProduct.price || 0).toLocaleString()}</span>
                                    {dealModalProduct.original_price && ` (MRP: ₹${Number(dealModalProduct.original_price).toLocaleString()})`}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    SKU: <span className="font-mono">{dealModalProduct.sku || "N/A"}</span> • Stock: {dealModalProduct.stock || 0} units
                                </div>
                            </div>
                        </div>

                        {/* Protection Tip */}
                        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-950">
                            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Catalog Regular Price is 100% Protected!</p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Setting a Mega Sale deal stores a dedicated offer price without overwriting your ₹{dealModalForm.regular_price || dealModalProduct.price} base price. Normal customers can still buy 1 piece at regular price.
                                </p>
                            </div>
                        </div>

                        {dealSuccessMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl text-center">
                                {dealSuccessMsg}
                            </div>
                        )}

                        {/* Deal Format Selection */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Select Promotion / Deal Format
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        { id: "bogo", label: "Buy 1 Get 1 Free", sub: "BOGO Offer", b: 1, g: 1, text: "BUY 1 GET 1 FREE (BOGO)" },
                                        { id: "buy2get1", label: "Buy 2 Get 1 Free", sub: "Buy 2 Get 1", b: 2, g: 1, text: "BUY 2 GET 1 FREE" },
                                        { id: "buy3get1", label: "Buy 3 Get 1 Free", sub: "Buy 3 Get 1", b: 3, g: 1, text: "BUY 3 GET 1 FREE" },
                                        { id: "buy5get1", label: "Buy 5 Get 1 Free", sub: "Buy 5 Get 1", b: 5, g: 1, text: "BUY 5 GET 1 FREE" },
                                        { id: "buy5get2", label: "Buy 5 Get 2 Free", sub: "Buy 5 Get 2", b: 5, g: 2, text: "BUY 5 GET 2 FREE" },
                                        { id: "none", label: "Regular Price Only", sub: "Remove Offer", b: 0, g: 0, text: "" }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setDealModalForm(prev => ({
                                                ...prev,
                                                deal_type: opt.id,
                                                buy_qty: opt.b,
                                                get_free_qty: opt.g,
                                                deal_text: opt.text
                                            }))}
                                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                dealModalForm.deal_type === opt.id
                                                    ? "bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/30 font-extrabold shadow-2xs"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>{opt.id === "none" ? "🏷️" : "⚡"}</span>
                                                <span className="text-xs">{opt.label}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">{opt.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Regular Single Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dealModalForm.regular_price}
                                        onChange={(e) => setDealModalForm(prev => ({ ...prev, regular_price: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                                        placeholder="e.g. 549"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Base single unit price</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ⚡ Mega Sale Deal Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dealModalForm.sale_price}
                                        onChange={(e) => setDealModalForm(prev => ({ ...prev, sale_price: e.target.value }))}
                                        className="w-full bg-amber-50/50 border border-amber-400 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                                        placeholder="e.g. 799"
                                    />
                                    <span className="text-[10px] text-amber-700 font-medium block mt-0.5">Special Mega Sale price</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Original MRP (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dealModalForm.original_price}
                                        onChange={(e) => setDealModalForm(prev => ({ ...prev, original_price: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                                        placeholder="e.g. 1499"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Strikethrough MRP price</span>
                                </div>
                            </div>

                            {dealModalForm.deal_type !== "none" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Deal Badge Text (Displayed on Product Card & Cart)
                                        </label>
                                        <input
                                            type="text"
                                            value={dealModalForm.deal_text}
                                            onChange={(e) => setDealModalForm(prev => ({ ...prev, deal_text: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                                            placeholder="e.g. BUY 1 GET 1 FREE (BOGO)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Event Title
                                        </label>
                                        <input
                                            type="text"
                                            value={dealModalForm.sale_title}
                                            onChange={(e) => setDealModalForm(prev => ({ ...prev, sale_title: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                                            placeholder="e.g. Mega Festive Sale"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={savingDeal}
                                    onClick={() => handleSaveDealOffer(false)}
                                    className="py-3 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                                >
                                    <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                                    <span>{savingDeal ? "Saving..." : "Apply to This Product"}</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={savingDeal}
                                    onClick={() => handleSaveDealOffer(true)}
                                    className="py-3 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                                    title="Clones product with same photos, sizes & description into a new BOGO listing"
                                >
                                    <Copy className="w-4 h-4 text-cyan-300" />
                                    <span>Duplicate as New Listing</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center">
                                Tip: "Duplicate" creates a separate BOGO listing keeping all original photos & descriptions with 0 re-uploading!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PRODUCT DETAILS & INVENTORY QUICK-VIEW MODAL ── */}
            {viewingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">Product Specifications & Inventory</h3>
                                    <p className="text-xs text-slate-500 font-medium">SKU: <span className="font-mono font-bold text-slate-700">{viewingProduct.sku || "N/A"}</span> • ID: <span className="font-mono text-slate-400">{viewingProduct.id || viewingProduct._id}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="p-2 text-slate-400 hover:text-black rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 space-y-5 flex-1">
                            {/* Product Hero Info */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                                <div className="md:col-span-4 flex flex-col items-center justify-center">
                                    <div className="w-full aspect-square max-w-[200px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                                        <img
                                            src={viewingProduct.image}
                                            alt={viewingProduct.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                                        />
                                    </div>
                                    {viewingProduct.images && viewingProduct.images.length > 0 && (
                                        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto max-w-[200px] pb-1">
                                            {viewingProduct.images.slice(0, 4).map((img, i) => (
                                                <img key={i} src={img} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                            ))}
                                            {viewingProduct.images.length > 4 && (
                                                <span className="text-[10px] text-slate-500 font-bold px-1.5 py-1 bg-slate-200 rounded">
                                                    +{viewingProduct.images.length - 4}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 text-[10px] font-extrabold uppercase">
                                                {viewingProduct.category || "Uncategorized"}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                                                {viewingProduct.department || "Clothing"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px] font-medium">
                                                {viewingProduct.brand || "Nari Pehnawa"}
                                            </span>
                                            {viewingProduct.deal_text && (
                                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                                    ⚡ {viewingProduct.deal_text}
                                                </span>
                                            )}
                                            {viewingProduct.offer_code && !viewingProduct.deal_text && (
                                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                                                    🏷️ {viewingProduct.offer_code}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{viewingProduct.title}</h2>
                                    </div>

                                    {/* Pricing & Stock Banner */}
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Selling Price</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                                    ₹{Number(viewingProduct.price || 0).toLocaleString()}
                                                </span>
                                                {viewingProduct.original_price && Number(viewingProduct.original_price) > Number(viewingProduct.price) && (
                                                    <span className="text-xs text-slate-400 line-through font-mono">
                                                        ₹{Number(viewingProduct.original_price).toLocaleString()}
                                                    </span>
                                                )}
                                                {viewingProduct.discount_percentage ? (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        {viewingProduct.discount_percentage}% OFF
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Inventory Status</span>
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className="text-base font-extrabold font-mono text-cyan-700">
                                                    {viewingProduct.stock ?? 0} units
                                                </span>
                                                {getStockBadge(viewingProduct.stock)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping & Return Details */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                            <span className="text-slate-400 text-[10px] block font-bold uppercase">Delivery</span>
                                            <span className="font-bold text-slate-800">
                                                {Number(viewingProduct.delivery_charge || 0) > 0 ? `₹${viewingProduct.delivery_charge}` : "Free Delivery"}
                                            </span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                            <span className="text-slate-400 text-[10px] block font-bold uppercase">Return Policy</span>
                                            <span className="font-bold text-slate-800">
                                                {viewingProduct.return_policy_badge || (viewingProduct.is_returnable ? "Returnable (15-Day)" : "Non-Returnable")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Size-Wise Inventory Matrix Breakdown ── */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-cyan-600" />
                                        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                                            Size-Wise Inventory Allocation
                                        </h4>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                        Total: {viewingProduct.stock || 0} Units
                                    </span>
                                </div>

                                {viewingProduct.size_stock && Object.keys(viewingProduct.size_stock).length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                        {Object.entries(viewingProduct.size_stock).map(([sz, qty]) => {
                                            const count = Number(qty || 0);
                                            return (
                                                <div
                                                    key={sz}
                                                    className={`p-3 rounded-xl border text-center transition ${count > 0 ? "bg-slate-50 border-slate-200" : "bg-rose-50/50 border-rose-200"}`}
                                                >
                                                    <span className="text-xs font-mono font-extrabold text-slate-800 block mb-1">
                                                        Size: {sz}
                                                    </span>
                                                    <div className="text-base font-extrabold font-mono text-slate-900">
                                                        {count} <span className="text-[10px] text-slate-500 font-sans font-normal">units</span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold mt-1 inline-block ${count > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                                        {count > 0 ? "In Stock" : "Out of Stock"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                        <p className="text-xs text-slate-600">Standard / Free Size Product: <span className="font-bold text-slate-900 font-mono">{viewingProduct.stock || 0} units</span> available.</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Specifications Matrix ── */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <Tag className="w-4 h-4 text-cyan-600" />
                                    <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                                        Specifications Matrix
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Fabric</span>
                                        <span className="font-bold text-slate-800">{viewingProduct.fabric || "—"}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Pattern / Work</span>
                                        <span className="font-bold text-slate-800">{viewingProduct.pattern || "—"}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Sleeve Style</span>
                                        <span className="font-bold text-slate-800">{viewingProduct.sleeve_style || "—"}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Fit Type</span>
                                        <span className="font-bold text-slate-800">{viewingProduct.fit_type || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {viewingProduct.description && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 shadow-2xs">
                                    <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Description & Details</h4>
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                        {viewingProduct.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const p = viewingProduct;
                                        setViewingProduct(null);
                                        setSharingProduct(p);
                                    }}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <Share2 className="w-3.5 h-3.5" /> Share & QR
                                </button>
                                <button
                                    onClick={() => window.open(`/product/${viewingProduct.id || viewingProduct._id}`, "_blank")}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Live Store View
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const p = viewingProduct;
                                        setViewingProduct(null);
                                        handleEdit(p);
                                    }}
                                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                                >
                                    <Edit2 className="w-3.5 h-3.5 text-black" /> Edit Listing
                                </button>
                                <button
                                    onClick={() => setViewingProduct(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REDESIGNED SHARE PRODUCT & QR CODE MODAL ── */}
            {sharingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-lg p-5 sm:p-6 relative shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                        <button
                            onClick={() => { setSharingProduct(null); setCopiedLink(false); setEmailStatusMsg(""); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shadow-2xs">
                                <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">Share & Print QR Hub</h3>
                                <p className="text-xs text-slate-500">Instant QR scan, WhatsApp share & sticker label printing</p>
                            </div>
                        </div>

                        {/* Product Summary Card */}
                        <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-300 shadow-2xs flex-shrink-0">
                                <img src={sharingProduct.image} alt={sharingProduct.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-sm truncate">{sharingProduct.title}</div>
                                <div className="text-xs text-cyan-700 font-mono font-bold mt-0.5">
                                    ₹{Number(sharingProduct.price || 0).toLocaleString()} <span className="text-slate-400 font-normal">| SKU:</span> {sharingProduct.sku || "N/A"}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    {sharingProduct.category || "Ethnic"} • {sharingProduct.stock || 0} units total
                                </div>
                            </div>
                        </div>

                        {/* QR Code Container */}
                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-2.5">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://naripehnawa.com/product/' + (sharingProduct.id || sharingProduct._id))}`}
                                    alt="QR Code"
                                    className="w-36 h-36 object-contain"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 text-center font-medium">
                                Point mobile camera at QR code to open live product listing directly
                            </p>
                        </div>

                        {/* Direct Link & Copy */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`https://naripehnawa.com/product/${sharingProduct.id || sharingProduct._id}`}
                                    className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 font-mono focus:outline-none select-all"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://naripehnawa.com/product/${sharingProduct.id || sharingProduct._id}`);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 flex-shrink-0 shadow-sm cursor-pointer active:scale-95"
                                >
                                    {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4 text-black" />}
                                    {copiedLink ? "Copied!" : "Copy URL"}
                                </button>
                            </div>

                            {/* Share Action Buttons */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${sharingProduct.title} on Nari Pehnawa: https://naripehnawa.com/product/${sharingProduct.id || sharingProduct._id}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm text-center"
                                >
                                    <Share2 className="w-4 h-4" /> WhatsApp
                                </a>

                                <button
                                    onClick={() => handlePrintSingleQRLabel(sharingProduct)}
                                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
                                >
                                    <Printer className="w-4 h-4 text-cyan-300" /> Print Sticker Label
                                </button>
                            </div>

                            {/* Email Recommendation Section */}
                            <div className="border-t border-slate-200 pt-3 space-y-2">
                                <label className="block text-[11px] font-bold text-slate-800">Direct Email to Customer</label>
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
                                                const res = await fetch(`${API_BASE_URL}/products/${sharingProduct.id || sharingProduct._id}/share-email`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "Authorization": `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ email: shareEmail })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    setEmailStatusMsg("✅ Email sent successfully to customer!");
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
                                        className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 flex-shrink-0 shadow-sm cursor-pointer"
                                    >
                                        <Mail className="w-4 h-4 text-black" />
                                        {sendingEmail ? "Sending..." : "Send"}
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
