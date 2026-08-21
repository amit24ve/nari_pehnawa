import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, Truck, CheckCircle, XCircle, Clock, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import OrderTracking from '../components/OrderTracking';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

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
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{order.shipping_address || 'Default Address'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Items ({order.items.length})</p>
                                            <div className="space-y-2">
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-sm">
                                                        <div className="w-12 h-12 bg-gray-100 rounded"></div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-800">{item.product_name || 'Product'}</p>
                                                            <p className="text-gray-600">Qty: {item.quantity}</p>
                                                        </div>
                                                        <p className="font-semibold text-gray-800">₹{Number(item.price || 0).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <p className="text-sm text-[#0891b2] font-semibold">+{order.items.length - 2} more items</p>
                                                )}
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
        </div>
    );
};

export default Orders;
