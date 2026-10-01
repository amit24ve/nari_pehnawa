import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, Truck, CheckCircle, XCircle, Clock, ChevronUp, ChevronDown as ChevronDownIcon, Star, MessageSquare, X, Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import OrderTracking from '../components/OrderTracking';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // Review Modal States
    const [reviewModalItem, setReviewModalItem] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewHoverRating, setReviewHoverRating] = useState(0);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState(null);
    const [reviewedProducts, setReviewedProducts] = useState({});

    // Cancel Modal States
    const [cancelModalOrder, setCancelModalOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('Changed my mind');
    const [customCancelReason, setCustomCancelReason] = useState('');
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [cancelFeedback, setCancelFeedback] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return 'Default Address';
        if (typeof addr === 'string') return addr;
        const parts = [
            addr.full_name,
            addr.address_line1,
            addr.address_line2,
            addr.city,
            addr.state,
            addr.postal_code,
            addr.country
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Default Address';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <Clock className="w-5 h-5" />,
            processing: <Package className="w-5 h-5" />,
            shipped: <Truck className="w-5 h-5" />,
            delivered: <CheckCircle className="w-5 h-5" />,
            cancelled: <XCircle className="w-5 h-5" />
        };
        return icons[status] || <Package className="w-5 h-5" />;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            processing: 'bg-blue-100 text-blue-800 border-blue-200',
            shipped: 'bg-purple-100 text-purple-800 border-purple-200',
            delivered: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const filteredOrders = (orders || [])
        .filter(order => filter === 'all' || (order.status || 'pending') === filter)
        .filter(order => {
            const orderIdStr = (order.id || order.order_number || '').toString().toLowerCase();
            const statusStr = (order.status || 'pending').toLowerCase();
            const term = (searchTerm || '').toLowerCase();
            return orderIdStr.includes(term) || statusStr.includes(term);
        });

    const filterOptions = [
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const openReviewModal = (item, order) => {
        const pid = item.product_id || item.id || item._id;
        setReviewModalItem({
            ...item,
            product_id: pid,
            order_id: order.id || order.order_number || order._id
        });
        setReviewRating(5);
        setReviewHoverRating(0);
        setReviewTitle('');
        setReviewComment('');
        setReviewImages([]);
        setReviewFeedback(null);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (reviewImages.length + files.length > 4) {
            setReviewFeedback({ type: 'error', message: 'You can upload up to 4 photos.' });
            return;
        }

        setUploadingImage(true);
        setReviewFeedback(null);
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${API_URL}/upload/review-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        const fullUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
                        setReviewImages(prev => [...prev, fullUrl]);
                    }
                } else {
                    throw new Error('Failed to upload image');
                }
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setReviewFeedback({ type: 'error', message: 'Failed to upload photo. Please ensure it is JPG or PNG under 15MB.' });
        } finally {
            setUploadingImage(false);
        }
    };

    const removeReviewImage = (indexToRemove) => {
        setReviewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!reviewModalItem) return;

        setSubmittingReview(true);
        setReviewFeedback(null);

        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const payload = {
                product_id: String(reviewModalItem.product_id || reviewModalItem.id || 'unknown'),
                product_name: reviewModalItem.product_name || reviewModalItem.name || 'Ethnic Wear Product',
                rating: Number(reviewRating),
                comment: reviewComment.trim() || undefined,
                images: reviewImages,
                verified_purchase: true,
                size_purchased: reviewModalItem.size || undefined,
                color_purchased: reviewModalItem.color || undefined
            };

            const res = await fetch(`${API_URL}/reviews/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to submit review');
            }

            const prodKey = String(reviewModalItem.product_id || reviewModalItem.id);
            setReviewedProducts(prev => ({ ...prev, [prodKey]: true }));
            setReviewFeedback({
                type: 'success',
                message: 'Thank you! Your review has been submitted for admin approval and will appear on the product page once approved.'
            });

            setTimeout(() => {
                setReviewModalItem(null);
                setReviewFeedback(null);
            }, 2500);
        } catch (err) {
            console.error('Review submit error:', err);
            setReviewFeedback({ type: 'error', message: err.message || 'Error submitting review. Please try again.' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCancelOrder = async (e) => {
        e.preventDefault();
        if (!cancelModalOrder) return;

        const reasonText = cancelReason === 'Other'
            ? (customCancelReason.trim() || 'Other reason')
            : cancelReason;

        setCancellingOrder(true);
        setCancelFeedback(null);

        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
        const orderId = cancelModalOrder.id || cancelModalOrder._id;

        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/cancel-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reasonText })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to cancel order');
            }

            setCancelFeedback({
                type: 'success',
                message: data.message || 'Order has been successfully cancelled. Any reward coins have been updated.'
            });

            // Update local order list immediately
            setOrders(prev => prev.map(o => {
                if (String(o.id || o._id) === String(orderId)) {
                    return { ...o, status: 'cancelled' };
                }
                return o;
            }));

            setTimeout(() => {
                setCancelModalOrder(null);
                setCancelFeedback(null);
                fetchOrders();
            }, 2000);
        } catch (err) {
            console.error('Cancel order error:', err);
            setCancelFeedback({
                type: 'error',
                message: err.message || 'Error processing cancellation. Please try again.'
            });
        } finally {
            setCancellingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2]"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">My Orders</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">Track and manage your orders</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Search by order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent text-sm sm:text-base"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {filterOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${filter === option.value
                                    ? 'bg-[#0891b2] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                    {filteredOrders.map((order) => {
                        const orderStatus = order.status || 'pending';
                        const canCancel = ['pending', 'processing', 'confirmed', 'placed'].includes(orderStatus.toLowerCase()) && !order?.shipping?.awb;
                        const rawNum = (order.order_number || order.id || '').toString().trim();
                        const displayOrderNum = (rawNum.length === 24 && /^[0-9a-fA-F]+$/.test(rawNum))
                            ? `ORD_${rawNum.slice(-6).toUpperCase()}`
                            : (rawNum ? rawNum.replace(/^#/, '') : `ORD_${String(order.id || '').slice(-6).toUpperCase()}`);
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#0891b2]" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 text-sm sm:text-base">Order #{displayOrderNum}</h3>
                                                <p className="text-xs sm:text-sm text-gray-600 break-words">
                                                    Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 ${getStatusColor(orderStatus)}`}>
                                                {getStatusIcon(orderStatus)}
                                                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                                            </span>

                                            {canCancel && (
                                                <button
                                                    onClick={() => {
                                                        setCancelModalOrder(order);
                                                        setCancelReason('Changed my mind');
                                                        setCustomCancelReason('');
                                                        setCancelFeedback(null);
                                                    }}
                                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold"
                                                >
                                                    <XCircle className="w-4 h-4 text-rose-600" />
                                                    Cancel Order
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                                            >
                                                <Truck className="w-4 h-4" />
                                                {expandedOrderId === order.id ? 'Hide Tracking' : 'Track Order'}
                                                {expandedOrderId === order.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDownIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                                                <p className="text-base sm:text-lg font-bold text-gray-800">₹{Number(order.total_amount || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-600">Payment Method</p>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">{order.payment_method || 'COD'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-600">Delivery Address</p>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{formatAddress(order.shipping_address)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Items ({order.items.length})</p>
                                            <div className="space-y-3">
                                                {order.items.map((item, idx) => {
                                                    const prodKey = String(item.product_id || item.id || idx);
                                                    const isDelivered = (order.status || '').toLowerCase() === 'delivered';
                                                    const hasReviewed = !!reviewedProducts[prodKey];

                                                    return (
                                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                                                            <div className="flex items-center gap-3">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.product_name || 'Product'} className="w-12 h-12 rounded object-cover border border-gray-200" />
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                                        <Package className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-semibold text-gray-800 line-clamp-1">{item.product_name || item.name || 'Product'}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                        <span>Qty: {item.quantity}</span>
                                                                        {item.size && <span>• Size: {item.size}</span>}
                                                                        {item.color && <span>• Color: {item.color}</span>}
                                                                        <span>• ₹{Number(item.price || 0).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rate & Review Button (Delivered Orders) */}
                                                            {isDelivered && (
                                                                <div className="flex sm:justify-end">
                                                                    {hasReviewed ? (
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                                                            <CheckCircle className="w-3.5 h-3.5" /> Review Submitted
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openReviewModal(item, order)}
                                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                                                                        >
                                                                            <Star className="w-3.5 h-3.5 fill-current" /> Rate & Review
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Shipment Tracking (expandable) */}
                                    {expandedOrderId === order.id && (
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <OrderTracking orderId={order.id} isAdmin={false} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                    <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Orders Found</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                        {searchTerm || filter !== 'all'
                            ? 'Try adjusting your filters'
                            : "You haven't placed any orders yet"}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors text-sm sm:text-base"
                    >
                        Start Shopping
                    </button>
                </div>
            )}

            {/* Review Submission Modal */}
            {reviewModalItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95">
                        {/* Modal Header (Centered Maroon Banner) */}
                        <div className="bg-[#8B0000] text-white py-5 px-6 rounded-t-3xl text-center relative sticky top-0 z-20 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setReviewModalItem(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-serif font-bold tracking-wide flex items-center justify-center gap-2">
                                <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                                Rate &amp; Review Product
                            </h3>
                            <p className="text-xs text-rose-100/90 mt-1">
                                Share your genuine rating and feedback with other shoppers
                            </p>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={submitReview} className="p-6 md:p-8 space-y-6">
                            {/* Product Info */}
                            <div className="flex items-center gap-4 p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100">
                                {reviewModalItem.image ? (
                                    <img src={reviewModalItem.image} alt={reviewModalItem.product_name} className="w-16 h-16 rounded-xl object-cover border border-rose-200/60 shadow-xs" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                                        <Package className="w-7 h-7" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-[#8B0000] uppercase tracking-wider">Ordered Item</span>
                                    <h4 className="font-semibold text-gray-900 text-sm truncate">{reviewModalItem.product_name || reviewModalItem.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Order #{reviewModalItem.order_id}</p>
                                </div>
                            </div>

                            {/* Overall Rating (Center Aligned - Mandatory) */}
                            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/70 text-center flex flex-col items-center justify-center">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Overall Rating <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            onMouseEnter={() => setReviewHoverRating(star)}
                                            onMouseLeave={() => setReviewHoverRating(0)}
                                            className="p-1.5 text-gray-300 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                                        >
                                            <Star
                                                className={`w-9 h-9 transition-colors ${
                                                    (reviewHoverRating || reviewRating) >= star
                                                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 text-sm font-bold text-[#8B0000]">
                                    {['', '1 Star - Poor', '2 Stars - Fair', '3 Stars - Good', '4 Stars - Very Good', '5 Stars - Excellent'][reviewHoverRating || reviewRating]}
                                </div>
                            </div>

                            {/* Review Description (Optional) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Your Review / Feedback
                                    </label>
                                    <span className="text-[11px] font-normal text-gray-400">Optional</span>
                                </div>
                                <textarea
                                    rows={4}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Share details about the fitting, material, color, quality, and your shopping experience..."
                                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#8B0000] focus:border-transparent outline-none resize-none transition"
                                />
                            </div>

                            {/* Upload Product Photos (Optional) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Product Photos (Wear / Unbox)
                                    </label>
                                    <span className="text-[11px] font-normal text-gray-500">{reviewImages.length}/4 photos</span>
                                </div>
                                
                                <div className="space-y-3">
                                    {/* Photos Preview Grid */}
                                    {reviewImages.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {reviewImages.map((imgUrl, imgIdx) => (
                                                <div key={imgIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group shadow-xs">
                                                    <img src={imgUrl} alt={`Upload ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReviewImage(imgIdx)}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Area */}
                                    {reviewImages.length < 4 && (
                                        <label className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 hover:border-[#8B0000] rounded-2xl cursor-pointer bg-gray-50 hover:bg-rose-50/30 transition ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                            {uploadingImage ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#8B0000]" />
                                                    <span>Uploading photo...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-[#8B0000]">
                                                    <Camera className="w-5 h-5" />
                                                    <span>Click to attach photos (Wear / Unbox)</span>
                                                </div>
                                            )}
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Feedback Alert */}
                            {reviewFeedback && (
                                <div className={`p-3.5 rounded-2xl text-xs font-medium text-center ${reviewFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                    {reviewFeedback.message}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalItem(null)}
                                    className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition cursor-pointer font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview || !reviewRating}
                                    className="px-8 py-3 text-sm font-bold text-white bg-[#8B0000] hover:bg-[#6B0000] rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                                >
                                    {submittingReview ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        'Submit Review'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancelModalOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-500/20 border border-rose-400/30 rounded-xl">
                                    <XCircle className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-serif font-bold">Cancel Order</h3>
                                    <p className="text-xs text-rose-200 mt-0.5">Order #{cancelModalOrder.order_number || cancelModalOrder.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCancelModalOrder(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCancelOrder} className="p-6 space-y-4">
                            {/* Order Summary Box */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Total Amount:</span>
                                    <span className="font-bold text-slate-800">₹{Number(cancelModalOrder.total_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Payment Method:</span>
                                    <span className="font-semibold text-slate-700">{cancelModalOrder.payment_method || 'COD'}</span>
                                </div>
                                {cancelModalOrder.coins_earned > 0 && (
                                    <div className="flex justify-between text-amber-700 bg-amber-50/70 p-1.5 rounded-lg font-medium mt-1">
                                        <span>Earned Coins to reverse:</span>
                                        <span className="font-bold">-{cancelModalOrder.coins_earned} Coins</span>
                                    </div>
                                )}
                                {cancelModalOrder.coins_used > 0 && (
                                    <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-1.5 rounded-lg font-medium mt-1">
                                        <span>Redeemed Coins to refund:</span>
                                        <span className="font-bold">+{cancelModalOrder.coins_used} Coins</span>
                                    </div>
                                )}
                            </div>

                            {/* Reason Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Reason for Cancellation *
                                </label>
                                <div className="space-y-2">
                                    {[
                                        'Changed my mind',
                                        'Found a better price / offer',
                                        'Incorrect delivery address or contact',
                                        'Ordered by mistake',
                                        'Want to change size or product',
                                        'Other'
                                    ].map((reason) => (
                                        <label
                                            key={reason}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                                cancelReason === reason
                                                    ? 'border-rose-400 bg-rose-50/40 text-slate-900 font-semibold shadow-xs'
                                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cancelReason"
                                                value={reason}
                                                checked={cancelReason === reason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                className="text-rose-600 focus:ring-rose-500"
                                            />
                                            <span>{reason}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {cancelReason === 'Other' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Please specify reason
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={customCancelReason}
                                        onChange={(e) => setCustomCancelReason(e.target.value)}
                                        placeholder="Type your cancellation reason here..."
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                        required
                                    />
                                </div>
                            )}

                            {/* Notice regarding coins */}
                            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                                <p className="font-semibold mb-0.5">⚠️ Coin Balance & Refund Policy</p>
                                <p>Upon cancellation, any reward coins awarded on this order will be deducted from your wallet balance, and any coins you redeemed will be credited back.</p>
                            </div>

                            {/* Feedback */}
                            {cancelFeedback && (
                                <div className={`p-3 rounded-xl text-xs font-medium ${
                                    cancelFeedback.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}>
                                    {cancelFeedback.message}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOrder(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancellingOrder}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50 transition flex items-center gap-2"
                                >
                                    {cancellingOrder ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Cancelling...</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            <span>Confirm Cancellation</span>
                                        </>
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

export default Orders;
