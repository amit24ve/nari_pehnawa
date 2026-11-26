import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import {
    User, Mail, Phone, Calendar, Edit2, Save, X, Camera, MapPin, Plus, Trash2,
    Home, Building, CheckCircle, Smartphone, Lock, ShieldCheck, Loader2, Eye, EyeOff,
    ShoppingBag, Coins, Sparkles, Package, Truck, Clock, XCircle, Search, Filter,
    ChevronDown, ChevronUp, Star, RefreshCw, AlertCircle, ArrowDownLeft, ArrowUpRight,
    ExternalLink
} from 'lucide-react';
import OrderTracking from '../components/OrderTracking';

const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry"
];

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab synced with ?tab= query param
    const activeTab = searchParams.get('tab') || 'profile';
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    // ── Profile Personal Info State ──
    const [isEditing, setIsEditing] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        phone: '',
        bio: '',
        avatar: ''
    });

    // ── Avatar Upload State ──
    const fileInputRef = useRef(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // ── Password State (No Old Password Required!) ──
    const [passwordForm, setPasswordForm] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    // ── Address States ──
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressMsg, setAddressMsg] = useState({ type: '', text: '' });
    const [addressForm, setAddressForm] = useState({
        type: 'home',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
    });

    // ── Orders State & Tracking ──
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [expandedTrackingOrderId, setExpandedTrackingOrderId] = useState(null);

    // Order Cancel Modal
    const [cancelModalOrder, setCancelModalOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('Changed my mind');
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [cancelFeedback, setCancelFeedback] = useState(null);

    // Review Modal
    const [reviewModalItem, setReviewModalItem] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState(null);

    // ── Coins Wallet State ──
    const [wallet, setWallet] = useState(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [coinTab, setCoinTab] = useState('all'); // "all" | "credit" | "debit"

    const getToken = () => localStorage.getItem('neel_token') || localStorage.getItem('token');

    // ── Initial Fetch & Populate ──
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || user.full_name || '',
                email: user.email || '',
                age: user.age || '',
                phone: user.phone || '',
                bio: user.bio || '',
                avatar: user.avatar || ''
            });
        }
        fetchAllUserData();
    }, [user]);

    const fetchAllUserData = async () => {
        const token = getToken();
        if (!token) return;

        // 1. Fetch Addresses
        fetchAddresses();

        // 2. Fetch Orders
        fetchOrders();

        // 3. Fetch Coins Wallet
        fetchWallet();
    };

    const fetchAddresses = async () => {
        const token = getToken();
        if (!token) return;
        setAddressesLoading(true);
        try {
            const res = await fetch(`${API_URL}/addresses/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching addresses:", err);
        } finally {
            setAddressesLoading(false);
        }
    };

    const fetchOrders = async () => {
        const token = getToken();
        if (!token) return;
        setOrdersLoading(true);
        try {
            const res = await fetch(`${API_URL}/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchWallet = async () => {
        const token = getToken();
        if (!token) return;
        setWalletLoading(true);
        try {
            const res = await fetch(`${API_URL}/coins/wallet`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (err) {
            console.error("Error fetching wallet:", err);
        } finally {
            setWalletLoading(false);
        }
    };

    // ── Save Personal Info ──
    const handleSaveProfile = async () => {
        setProfileLoading(true);
        setProfileMsg({ type: '', text: '' });
        const token = getToken();

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : undefined,
                phone: formData.phone ? formData.phone.trim() : undefined,
                bio: formData.bio || '',
                age: formData.age ? parseInt(formData.age, 10) : undefined,
                avatar: formData.avatar || undefined
            };

            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                if (updateUserProfile) {
                    updateUserProfile(updated);
                }
                setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            } else {
                const errData = await res.json().catch(() => ({}));
                setProfileMsg({ type: 'error', text: errData.detail || 'Failed to update profile' });
            }
        } catch (error) {
            setProfileMsg({ type: 'error', text: error.message || 'Something went wrong' });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Upload Avatar Photo ──
    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = getToken();
        const uploadData = new FormData();
        uploadData.append('file', file);

        setAvatarUploading(true);
        try {
            const res = await fetch(`${API_URL}/upload/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData
            });

            if (res.ok) {
                const data = await res.json();
                const newAvatarUrl = data.url;
                setFormData(prev => ({ ...prev, avatar: newAvatarUrl }));
                if (updateUserProfile && user) {
                    updateUserProfile({ ...user, avatar: newAvatarUrl });
                }
                setProfileMsg({ type: 'success', text: 'Profile picture updated successfully!' });
            } else {
                const err = await res.json().catch(() => ({}));
                setProfileMsg({ type: 'error', text: err.detail || 'Could not upload photo' });
            }
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.message || 'Upload failed' });
        } finally {
            setAvatarUploading(false);
        }
    };

    // ── Change / Set Password Directly (No Old Password Needed) ──
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (passwordForm.new_password.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setPasswordLoading(true);
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/users/me/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: passwordForm.new_password
                })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                // Keep user logged in with fresh token if returned
                if (data.token || data.access_token) {
                    const freshToken = data.token || data.access_token;
                    localStorage.setItem("neel_token", freshToken);
                    localStorage.setItem("token", freshToken);
                }
                setPasswordMsg({
                    type: 'success',
                    text: 'Password updated successfully! Your account is secured and you remain logged in.'
                });
                setPasswordForm({ new_password: '', confirm_password: '' });
            } else {
                setPasswordMsg({ type: 'error', text: data.detail || 'Failed to update password' });
            }
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.message || 'Something went wrong' });
        } finally {
            setPasswordLoading(false);
        }
    };

    // ── Address Handlers ──
    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();
        setAddressMsg({ type: '', text: '' });

        try {
            const payload = {
                type: addressForm.type,
                full_name: addressForm.full_name,
                phone: addressForm.phone,
                address_line1: addressForm.address_line1,
                address_line2: addressForm.address_line2 || '',
                city: addressForm.city,
                state: addressForm.state,
                pincode: addressForm.pincode,
                is_default: addressForm.is_default
            };

            let res;
            if (editingAddressId) {
                res = await fetch(`${API_URL}/addresses/${editingAddressId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/addresses/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                await fetchAddresses();
                setShowAddressForm(false);
                setEditingAddressId(null);
                setAddressMsg({
                    type: 'success',
                    text: editingAddressId ? 'Address updated successfully!' : 'Address added successfully!'
                });
            } else {
                const err = await res.json().catch(() => ({}));
                setAddressMsg({ type: 'error', text: err.detail || 'Failed to save address' });
            }
        } catch (err) {
            setAddressMsg({ type: 'error', text: err.message || 'Error saving address' });
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAddresses(prev => prev.filter(a => a.id !== id));
            }
        } catch (err) {
            console.error("Error deleting address:", err);
        }
    };

    const handleSetDefaultAddress = async (id) => {
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/addresses/${id}/default`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error setting default address:", err);
        }
    };

    // ── Order Actions (Cancel, Review) ──
    const handleCancelOrderSubmit = async (e) => {
        e.preventDefault();
        if (!cancelModalOrder) return;
        setCancellingOrder(true);
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/orders/${cancelModalOrder.id || cancelModalOrder._id}/cancel-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason: cancelReason,
                    order_id: cancelModalOrder.id || cancelModalOrder._id
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setCancelFeedback({ type: 'success', message: 'Cancellation request submitted successfully.' });
                setTimeout(() => {
                    setCancelModalOrder(null);
                    setCancelFeedback(null);
                    fetchOrders();
                }, 1500);
            } else {
                setCancelFeedback({ type: 'error', message: data.detail || 'Failed to cancel order' });
            }
        } catch (err) {
            setCancelFeedback({ type: 'error', message: err.message || 'Failed to cancel' });
        } finally {
            setCancellingOrder(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewModalItem) return;
        setSubmittingReview(true);
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/reviews/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: reviewModalItem.product_id,
                    rating: reviewRating,
                    title: "Verified Customer Review",
                    comment: reviewComment,
                    user_name: user?.name || "Verified Buyer"
                })
            });
            if (res.ok) {
                setReviewFeedback({ type: 'success', message: 'Thank you! Review submitted successfully.' });
                setTimeout(() => {
                    setReviewModalItem(null);
                    setReviewFeedback(null);
                    setReviewComment('');
                }, 1800);
            } else {
                const data = await res.json().catch(() => ({}));
                setReviewFeedback({ type: 'error', message: data.detail || 'Failed to submit review' });
            }
        } catch (err) {
            setReviewFeedback({ type: 'error', message: err.message || 'Failed to submit review' });
        } finally {
            setSubmittingReview(false);
        }
    };

    // Filtered Orders
    const filteredOrders = orders.filter(order => {
        const matchesFilter = orderFilter === 'all' ||
            (orderFilter === 'delivered' && ['delivered', 'completed'].includes((order.status || '').toLowerCase())) ||
            (orderFilter === 'transit' && ['shipped', 'in_transit', 'out_for_delivery', 'confirmed', 'processing'].includes((order.status || '').toLowerCase())) ||
            (orderFilter === 'cancelled' && ['cancelled', 'canceled'].includes((order.status || '').toLowerCase()));

        const matchesSearch = !orderSearchTerm ||
            (order.order_number || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
            (order.items || []).some(it => (it.product_name || it.name || '').toLowerCase().includes(orderSearchTerm.toLowerCase()));

        return matchesFilter && matchesSearch;
    });

    const activeOrdersCount = orders.filter(o => !['cancelled', 'canceled', 'delivered', 'completed'].includes((o.status || '').toLowerCase())).length;
    const coinsBalance = wallet?.coins_balance ?? user?.coins_balance ?? 0;
    const coinsRupeeVal = (coinsBalance / 10).toFixed(2);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16">
            {/* ══════════════════════════════════════════════════════════════
                1. GRAND HERO BANNER & USER MONOGRAM / AVATAR
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#D4AF37]/20 bg-gradient-to-r from-[#1B0307] via-[#350710] to-[#580C1F] text-white p-5 sm:p-8">
                {/* Background decorative watermark */}
                <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
                    <Sparkles className="w-72 h-72 text-[#D4AF37]" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* User Avatar + Identity Details */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Avatar with Camera Trigger */}
                        <div className="relative flex-shrink-0 group">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarFileChange}
                                className="hidden"
                            />
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#D4AF37] shadow-xl overflow-hidden bg-[#24040A] flex items-center justify-center text-3xl font-serif font-bold text-[#F3E5AB]">
                                {formData.avatar || user?.avatar ? (
                                    <img
                                        src={formData.avatar || user?.avatar}
                                        alt={formData.name || "User Avatar"}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to letter monogram if image fails
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span>{formData.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>

                            {/* Camera overlay upload icon */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#1B0307] rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                                title="Change or upload profile picture"
                            >
                                {avatarUploading ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                )}
                            </button>
                        </div>

                        {/* Name & Account Meta */}
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-white">
                                    {formData.name || 'Valued Customer'}
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#D4AF37]/20 text-[#F5E6BE] border border-[#D4AF37]/40">
                                    <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                                    <span>Verified Account</span>
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#F7F4EE]/80 mt-1 flex items-center gap-2 flex-wrap">
                                {formData.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                                        <span>{formData.email}</span>
                                    </span>
                                )}
                                {formData.phone && (
                                    <span className="flex items-center gap-1">
                                        <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                                        <span>{formData.phone}</span>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Quick KPI Stat Counter Cards (One-Click Tab Switchers) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('orders')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                                activeTab === 'orders'
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md'
                                    : 'bg-black/25 hover:bg-black/40 border-white/10 text-white/90'
                            }`}
                        >
                            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-[#F3E5AB] block flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3 text-[#D4AF37]" />
                                <span>Orders</span>
                            </span>
                            <span className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5 block">
                                {orders.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('coins')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                                activeTab === 'coins'
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md'
                                    : 'bg-black/25 hover:bg-black/40 border-white/10 text-white/90'
                            }`}
                        >
                            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-[#F3E5AB] block flex items-center gap-1">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>NP Coins</span>
                            </span>
                            <span className="text-lg sm:text-xl font-bold font-serif text-amber-300 mt-0.5 block">
                                {coinsBalance}
                            </span>
                            <span className="text-[9px] text-white/70">≈ ₹{coinsRupeeVal}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('addresses')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                                activeTab === 'addresses'
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md'
                                    : 'bg-black/25 hover:bg-black/40 border-white/10 text-white/90'
                            }`}
                        >
                            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-[#F3E5AB] block flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#D4AF37]" />
                                <span>Addresses</span>
                            </span>
                            <span className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5 block">
                                {addresses.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                2. LUXURY TAB NAVIGATION (ALL SECTIONS IN ONE PAGE)
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'profile'
                            ? 'bg-[#8B0000] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <User className="w-4 h-4" />
                    <span>Personal Info</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 min-w-[140px] sm:min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
                        activeTab === 'orders'
                            ? 'bg-[#8B0000] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>My Orders &amp; Tracking</span>
                    {activeOrdersCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-[#1B0307] text-[10px] font-bold rounded-full">
                            {activeOrdersCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('addresses')}
                    className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'addresses'
                            ? 'bg-[#8B0000] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <MapPin className="w-4 h-4" />
                    <span>Saved Addresses</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('coins')}
                    className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'coins'
                            ? 'bg-[#8B0000] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>NP Coins Wallet</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 min-w-[130px] sm:min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'security'
                            ? 'bg-[#8B0000] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <Lock className="w-4 h-4" />
                    <span>Security &amp; Password</span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB 1: PERSONAL INFORMATION & CONTACT DETAILS
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-[#8B0000]" />
                                <span>Personal Information</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Update your contact info and personal preferences
                            </p>
                        </div>

                        {!isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] hover:bg-[#700000] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    disabled={profileLoading}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Save</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setProfileMsg({ type: '', text: '' });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Feedback Alert */}
                    {profileMsg.text && (
                        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                            profileMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            <span>{profileMsg.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                    placeholder="Enter your name"
                                />
                            ) : (
                                <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs sm:text-sm font-medium text-gray-800 border border-transparent">
                                    {formData.name || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                    placeholder="yourname@domain.com"
                                />
                            ) : (
                                <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs sm:text-sm font-medium text-gray-800 border border-transparent flex items-center justify-between">
                                    <span>{formData.email || 'Not provided'}</span>
                                    {formData.email && (
                                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                                            Verified
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                    placeholder="10-digit mobile number"
                                />
                            ) : (
                                <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs sm:text-sm font-medium text-gray-800 border border-transparent">
                                    {formData.phone ? `+91 ${formData.phone}` : 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Age</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                    placeholder="e.g. 28"
                                />
                            ) : (
                                <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs sm:text-sm font-medium text-gray-800 border border-transparent">
                                    {formData.age ? `${formData.age} years` : 'Not specified'}
                                </p>
                            )}
                        </div>

                        {/* Bio / Preferred Location */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bio / City / Notes</label>
                            {isEditing ? (
                                <textarea
                                    rows={2}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                    placeholder="e.g. Ethnic wear connoisseur from Jaipur"
                                />
                            ) : (
                                <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs sm:text-sm font-medium text-gray-800 border border-transparent">
                                    {formData.bio || 'No bio provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2: MY ORDERS & LIVE SHIPROCKET TRACKING
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Orders Filter & Search Toolbar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={orderSearchTerm}
                                onChange={(e) => setOrderSearchTerm(e.target.value)}
                                placeholder="Search by Order ID or Item..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                            />
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                            {[
                                { key: 'all', label: 'All Orders' },
                                { key: 'transit', label: 'In Transit' },
                                { key: 'delivered', label: 'Delivered' },
                                { key: 'cancelled', label: 'Cancelled' }
                            ].map(btn => (
                                <button
                                    key={btn.key}
                                    type="button"
                                    onClick={() => setOrderFilter(btn.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                        orderFilter === btn.key
                                            ? 'bg-[#8B0000] text-white shadow-xs'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders List */}
                    {ordersLoading ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
                            <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-600 font-medium">Fetching your orders &amp; live shipping status...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                            <h3 className="text-lg font-bold text-gray-800">No Orders Found</h3>
                            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                                {orderSearchTerm || orderFilter !== 'all'
                                    ? "No orders match your filter criteria. Try clearing search or selecting 'All Orders'."
                                    : "You haven't placed any orders yet. Discover our latest festive handcrafted kurtis!"}
                            </p>
                            <Link
                                to="/new-arrivals"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B0000] hover:bg-[#700000] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                                <span>Explore New Arrivals</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => {
                                const orderId = order.id || order._id;
                                const isExpanded = expandedTrackingOrderId === orderId;
                                const isDelivered = ['delivered', 'completed'].includes((order.status || '').toLowerCase());
                                const isCancelled = ['cancelled', 'canceled'].includes((order.status || '').toLowerCase());
                                const isPendingCancel = order.cancellation_requested;
                                const shippingInfo = order.shipping || {};

                                return (
                                    <div
                                        key={orderId}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all hover:border-[#8B0000]/40"
                                    >
                                        {/* Card Top Info */}
                                        <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs text-[#8B0000]">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-gray-900">
                                                            {order.order_number || orderId}
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            isDelivered
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                : isCancelled
                                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        }`}>
                                                            {order.status || 'Confirmed'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Placed on {order.created_at_ist || new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons: Track Shipment, Cancel, Invoice */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedTrackingOrderId(isExpanded ? null : orderId)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B0000] hover:bg-[#700000] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                                >
                                                    <Truck className="w-3.5 h-3.5" />
                                                    <span>{isExpanded ? 'Hide Tracking' : 'Live Tracking'}</span>
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>

                                                {!isDelivered && !isCancelled && !isPendingCancel && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCancelModalOrder(order)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-red-600 border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Cancel</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Content: Items + Addresses */}
                                        <div className="p-4 sm:p-5 space-y-4">
                                            {/* Items list */}
                                            <div className="divide-y divide-gray-100">
                                                {(order.items || []).map((item, idx) => (
                                                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                                <img
                                                                    src={item.product_image || item.image || '/logo.png'}
                                                                    alt={item.product_name || item.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                                                                    {item.product_name || item.name || 'Ethnic Wear Item'}
                                                                </h4>
                                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                                    Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right flex-shrink-0">
                                                            <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                                                                ₹{Number(item.price || 0) * Number(item.quantity || 1)}
                                                            </span>
                                                            {isDelivered && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReviewModalItem(item)}
                                                                    className="text-[11px] text-[#0891b2] hover:underline font-semibold mt-1 inline-flex items-center gap-0.5"
                                                                >
                                                                    <Star className="w-3 h-3" />
                                                                    <span>Review</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Footer Info (Totals & Address) */}
                                            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
                                                <div>
                                                    <span className="font-semibold text-gray-800">Shipping To: </span>
                                                    <span>
                                                        {(order.shipping_address?.full_name) || 'Customer'}, {(order.shipping_address?.city) || ''} {(order.shipping_address?.postal_code || order.shipping_address?.pincode) || ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span>Payment: <strong className="text-gray-800">{order.payment_method || 'Online'}</strong></span>
                                                    <span className="text-sm font-bold text-gray-900">Total: ₹{order.total_amount || order.total || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable Live Tracking Panel */}
                                        {isExpanded && (
                                            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 animate-fadeIn">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                                        <Truck className="w-4 h-4 text-[#8B0000]" />
                                                        <span>Live Shiprocket Shipment Details</span>
                                                    </h4>
                                                    {(shippingInfo.awb || order.awb_code) && (
                                                        <span className="font-mono text-xs text-gray-600 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                                                            AWB: {shippingInfo.awb || order.awb_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <OrderTracking orderId={orderId} isAdmin={false} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 3: SAVED DELIVERY ADDRESSES
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'addresses' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#8B0000]" />
                                <span>Saved Delivery Addresses</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Manage your primary and alternate shipping addresses
                            </p>
                        </div>

                        {!showAddressForm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setAddressForm({
                                        type: 'home',
                                        full_name: user?.name || '',
                                        phone: user?.phone || '',
                                        address_line1: '',
                                        address_line2: '',
                                        city: '',
                                        state: 'Rajasthan',
                                        pincode: '',
                                        is_default: addresses.length === 0
                                    });
                                    setEditingAddressId(null);
                                    setShowAddressForm(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] hover:bg-[#700000] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add New Address</span>
                            </button>
                        )}
                    </div>

                    {/* Address Alert */}
                    {addressMsg.text && (
                        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                            addressMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {addressMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            <span>{addressMsg.text}</span>
                        </div>
                    )}

                    {/* New/Edit Address Form Modal/Drawer */}
                    {showAddressForm && (
                        <form onSubmit={handleAddressSubmit} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800">
                                    {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowAddressForm(false)}
                                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.full_name}
                                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="Receiver's name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={addressForm.phone}
                                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="10-digit phone number"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Flat, House no., Building, Apartment *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.address_line1}
                                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="Address line 1"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Area, Street, Sector, Village</label>
                                    <input
                                        type="text"
                                        value={addressForm.address_line2}
                                        onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="Address line 2 (Optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="e.g. Jaipur"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                                    <select
                                        required
                                        value={addressForm.state}
                                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={addressForm.pincode}
                                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm"
                                        placeholder="6-digit pincode"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address Type</label>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="addrType"
                                                checked={addressForm.type === 'home'}
                                                onChange={() => setAddressForm({ ...addressForm, type: 'home' })}
                                            />
                                            <span>Home</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="addrType"
                                                checked={addressForm.type === 'work'}
                                                onChange={() => setAddressForm({ ...addressForm, type: 'work' })}
                                            />
                                            <span>Office / Commercial</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.is_default}
                                        onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                        className="rounded text-[#8B0000] focus:ring-[#8B0000]"
                                    />
                                    <span>Set as default delivery address</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressForm(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-[#8B0000] hover:bg-[#700000] text-white text-xs font-bold rounded-xl shadow-xs"
                                    >
                                        Save Address
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Address Cards Grid */}
                    {addressesLoading ? (
                        <div className="py-8 text-center text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8B0000]" />
                            <span>Loading addresses...</span>
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-2xl p-6">
                            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium">No saved addresses yet.</p>
                            <p className="text-xs text-gray-400 mt-1">Add your shipping address for one-click checkout.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map(addr => (
                                <div
                                    key={addr.id}
                                    className={`p-4 rounded-2xl border transition-all relative ${
                                        addr.is_default
                                            ? 'border-[#8B0000] bg-[#FFF8F7]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 rounded bg-gray-100 text-gray-600">
                                                {addr.type === 'work' ? <Building className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                                {addr.type || 'Home'}
                                            </span>
                                            {addr.is_default && (
                                                <span className="text-[10px] bg-[#8B0000] text-white px-2 py-0.2 rounded-full font-bold">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAddressForm({
                                                        type: addr.type || 'home',
                                                        full_name: addr.full_name || '',
                                                        phone: addr.phone || '',
                                                        address_line1: addr.address_line1 || '',
                                                        address_line2: addr.address_line2 || '',
                                                        city: addr.city || '',
                                                        state: addr.state || '',
                                                        pincode: addr.pincode || addr.postal_code || '',
                                                        is_default: addr.is_default || false
                                                    });
                                                    setEditingAddressId(addr.id);
                                                    setShowAddressForm(true);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                                                title="Edit Address"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAddress(addr.id)}
                                                className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                                title="Delete Address"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-gray-900">{addr.full_name}</h4>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                        {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                                        {addr.city}, {addr.state} - <strong>{addr.pincode || addr.postal_code}</strong>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1.5">Phone: +91 {addr.phone}</p>

                                    {!addr.is_default && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetDefaultAddress(addr.id)}
                                            className="mt-3 text-[11px] text-[#8B0000] hover:underline font-semibold block"
                                        >
                                            Set as Default Address
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 4: REWARD COINS WALLET
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'coins' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Wallet Summary Card */}
                    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-6">
                            <Coins className="w-56 h-56 text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/20 text-white border border-white/20 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                    <span>Nari Pehnawa Reward Wallet</span>
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <h2 className="text-3xl sm:text-4xl font-serif font-bold">{coinsBalance}</h2>
                                    <span className="text-sm font-semibold text-amber-100">NP Coins</span>
                                </div>
                                <p className="text-xs sm:text-sm text-white/90 mt-1">
                                    Cash Redemption Value: <strong>₹{coinsRupeeVal}</strong> (10 Coins = ₹1 Discount)
                                </p>
                            </div>

                            <Link
                                to="/category/sale"
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-amber-900 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:bg-amber-50 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Shop &amp; Earn More</span>
                            </Link>
                        </div>
                    </div>

                    {/* How Coins Work Perks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
                            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 font-bold text-sm">
                                1
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-800">Earn On Every Purchase</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Earn 100 NP Coins on every regular garment and 50 Coins on sale items automatically credited upon order delivery.
                            </p>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
                            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 font-bold text-sm">
                                2
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-800">Redeem Up to 50%</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Apply coins directly during checkout to receive up to 50% instant discount off your cart subtotal.
                            </p>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 font-bold text-sm">
                                3
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-800">Never Expire</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Your earned coins stay safely in your Nari Pehnawa wallet for lifetime use on any future festive collection.
                            </p>
                        </div>
                    </div>

                    {/* Transaction History Ledger */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Coin Activity History</span>
                        </h3>

                        {walletLoading ? (
                            <div className="py-6 text-center text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                                <span>Loading ledger...</span>
                            </div>
                        ) : !wallet?.transactions || wallet.transactions.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">No coin transactions recorded yet.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {wallet.transactions.map((tx, idx) => {
                                    const isCredit = tx.type === 'credit';
                                    return (
                                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-800">{tx.description || tx.reason || (isCredit ? 'Order Reward' : 'Redemption')}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN') : 'Recent'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {isCredit ? `+${tx.amount}` : `-${tx.amount}`} Coins
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 5: ACCOUNT SECURITY & PASSWORD (NO OLD PASSWORD NEEDED)
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'security' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6 animate-fadeIn">
                    <div className="pb-4 border-b border-gray-100">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[#8B0000]" />
                            <span>Security &amp; Password Update</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Set or update your account password directly. No old password required!
                        </p>
                    </div>

                    {/* Password Feedback */}
                    {passwordMsg.text && (
                        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                            passwordMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            <span>{passwordMsg.text}</span>
                        </div>
                    )}

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                        <p className="font-semibold mb-1">Direct Password Management</p>
                        <p>
                            Because you are already logged in to your verified account ({formData.email || formData.phone || 'Verified User'}), you do not need to provide your previous password. Simply enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                New Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    placeholder="Enter new password (min. 6 characters)"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                                    title={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Confirm New Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    placeholder="Repeat new password"
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8B0000] hover:bg-[#700000] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                            {passwordLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                CANCEL ORDER MODAL
            ══════════════════════════════════════════════════════════════ */}
            {cancelModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span>Cancel Order {cancelModalOrder.order_number || cancelModalOrder.id}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCancelModalOrder(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {cancelFeedback && (
                            <div className={`p-3 rounded-xl text-xs ${
                                cancelFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {cancelFeedback.message}
                            </div>
                        )}

                        <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Reason for Cancellation *
                                </label>
                                <select
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm"
                                >
                                    <option value="Changed my mind">Changed my mind</option>
                                    <option value="Ordered by mistake">Ordered by mistake</option>
                                    <option value="Need to change shipping address">Need to change shipping address</option>
                                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                                    <option value="Delivery time is too long">Delivery time is too long</option>
                                    <option value="Other">Other reason</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOrder(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancellingOrder}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {cancellingOrder ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                WRITE REVIEW MODAL
            ══════════════════════════════════════════════════════════════ */}
            {reviewModalItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" />
                                <span>Write a Review</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setReviewModalItem(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {reviewFeedback && (
                            <div className={`p-3 rounded-xl text-xs ${
                                reviewFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {reviewFeedback.message}
                            </div>
                        )}

                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rating</label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${
                                                    star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Feedback *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Tell other shoppers about the fabric quality, fitting, and color..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8B0000] focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalItem(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-5 py-2 bg-[#8B0000] hover:bg-[#700000] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
