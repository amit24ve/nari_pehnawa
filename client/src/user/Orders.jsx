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
        setReviewModalItem({
            ...item,
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
        if (!reviewComment.trim()) {
            setReviewFeedback({ type: 'error', message: 'Please write a review comment.' });
            return;
        }

        setSubmittingReview(true);
        setReviewFeedback(null);

        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const payload = {
                product_id: String(reviewModalItem.product_id || reviewModalItem.id || 'unknown'),
                product_name: reviewModalItem.product_name || reviewModalItem.name || 'Ethnic Wear Product',
                rating: Number(reviewRating),
                title: reviewTitle.trim() || undefined,
                comment: reviewComment.trim(),
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
                                                <h3 className="font-bold text-gray-800 text-sm sm:text-base">Order #{order.order_number || order.id}</h3>
                                                <p className="text-xs sm:text-sm text-gray-600 break-words">
                                                    Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                                            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 ${getStatusColor(orderStatus)}`}>
                                                {getStatusIcon(orderStatus)}
                                                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                                            </span>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] text-white p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-serif font-bold">Rate & Review Product</h3>
                                <p className="text-xs text-gray-300 mt-0.5">Your review will be verified and displayed on the product page</p>
                            </div>
                            <button
                                onClick={() => setReviewModalItem(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={submitReview} className="p-6 space-y-4">
                            {/* Product Info */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                {reviewModalItem.image ? (
                                    <img src={reviewModalItem.image} alt={reviewModalItem.product_name} className="w-14 h-14 rounded-lg object-cover border" />
                                ) : (
                                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                        <Package className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm truncate">{reviewModalItem.product_name || reviewModalItem.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Order #{reviewModalItem.order_id}</p>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Overall Rating *</label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            onMouseEnter={() => setReviewHoverRating(star)}
                                            onMouseLeave={() => setReviewHoverRating(0)}
                                            className="p-1 text-gray-300 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={`w-7 h-7 ${(reviewHoverRating || reviewRating) >= star
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-xs font-semibold text-gray-600 ml-2">
                                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewHoverRating || reviewRating]}
                                    </span>
                                </div>
                            </div>

                            {/* Review Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Review Title (Optional)</label>
                                <input
                                    type="text"
                                    value={reviewTitle}
                                    onChange={(e) => setReviewTitle(e.target.value)}
                                    placeholder="e.g. Gorgeous fabric, perfect festive fit!"
                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Review Comment */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Your Review *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Share details about the fitting, material, color, and your shopping experience..."
                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            {/* Upload Product Photos */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Product Photos (Optional)</span>
                                    <span className="text-[11px] font-normal text-gray-500">{reviewImages.length}/4 photos</span>
                                </label>
                                
                                <div className="space-y-2">
                                    {/* Photos Preview Grid */}
                                    {reviewImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {reviewImages.map((imgUrl, imgIdx) => (
                                                <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={imgUrl} alt={`Upload ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReviewImage(imgIdx)}
                                                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    {reviewImages.length < 4 && (
                                        <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-[#0891b2] rounded-xl cursor-pointer bg-gray-50 hover:bg-cyan-50/40 transition ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#0891b2]" />
                                                    <span>Uploading photo...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-[#0891b2]">
                                                    <Camera className="w-4 h-4" />
                                                    <span>Attach Photos (Wear / Unbox)</span>
                                                </div>
                                            )}
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Feedback Alert */}
                            {reviewFeedback && (
                                <div className={`p-3 rounded-xl text-xs font-medium ${reviewFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                    {reviewFeedback.message}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalItem(null)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0891b2] hover:bg-[#0e7490] rounded-xl shadow-md disabled:opacity-50 transition flex items-center gap-2"
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

export default Orders;
