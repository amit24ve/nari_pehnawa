import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Filter,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileText,
  Printer,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  Box,
  Copy,
  Check,
} from "lucide-react";
import sellerApi from "./sellerApi";
import shippingApi from "../services/shippingApi";

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "processing", label: "New & Processing" },
  { id: "ready_to_ship", label: "Ready to Ship" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const SellerOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [packingOrder, setPackingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingAwb, setTrackingAwb] = useState("");
  const [courierName, setCourierName] = useState("Shiprocket Express");
  const [toast, setToast] = useState("");

  // Live Shiprocket Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleOpenTracking = async (order, forceRefresh = false) => {
    setTrackingOrder(order);
    setTrackingLoading(true);
    setTrackingData(null);
    setCopiedAwb(false);

    try {
      const q =
        order.shipping?.awb ||
        order.shipping?.awb_code ||
        order.tracking_awb ||
        order.order_number ||
        order.id ||
        order._id;
      const res = await shippingApi.trackPublic(q);
      setTrackingData(res);
    } catch (err) {
      console.warn("Live tracking fetch warning:", err);
      // Fallback with order's local shipping info
      setTrackingData({
        order_number: order.order_number || order.id,
        current_status: order.shipping?.current_status || order.status || "Ready to Ship",
        courier_name: order.shipping?.courier_name || "Shiprocket Express",
        awb: order.shipping?.awb || order.shipping?.awb_code || order.tracking_awb || "AWB Processing",
        tracking_history: [],
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await sellerApi.getOrders({
        status: currentStatus,
        search: searchQuery.trim(),
        limit: 50,
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await sellerApi.updateOrderStatus(orderId, {
        status: newStatus,
        tracking_awb: trackingAwb || undefined,
        courier_name: courierName || undefined,
      });
      showToast(`Order marked as ${newStatus.toUpperCase()}`);
      setPackingOrder(null);
      setTrackingAwb("");
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert("Failed to update order: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    const s = String(st || "").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === "shipped" || s === "out_for_delivery") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Truck className="w-3 h-3 text-cyan-600" /> Shipped
        </span>
      );
    }
    if (s === "packed" || s === "ready_to_ship") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <PackageCheck className="w-3 h-3 text-indigo-600" /> Ready to Ship
        </span>
      );
    }
    if (s === "cancelled" || s === "canceled") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3 text-red-600" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" /> Processing
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891b2]">
              Fulfillment
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Orders & Shipments</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Seller Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage incoming orders, pack garments in official Nari Pehnawa polybags, and generate shipping slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>


      {/* Status Tabs Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ status: tab.id })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer Name, or City..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {currentStatus === "all"
                ? "You haven't received any customer orders yet. Make sure your products are live and in stock."
                : `No orders matching status filter "${currentStatus}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Items in Order</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Seller Subtotal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => {
                  const addr = o.shipping_address || {};
                  const createdDate = o.created_at ? new Date(o.created_at).toLocaleDateString() : "Recent";
                  return (
                    <tr key={o.id || o._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {o.order_number || o.id?.substring(0, 10)}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" /> {createdDate}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 uppercase">
                          Pay: {o.payment_method || "Online"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-xs">
                          {(o.seller_items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {it.product_image && (
                                <img
                                  src={it.product_image}
                                  alt={it.product_name}
                                  className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0"
                                  onError={(e) => { e.target.src = "/placeholder.png"; }}
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                  {it.product_name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ""} • ₹{it.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 text-xs truncate">
                          {addr.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{addr.city ? `${addr.city}, ${addr.state || ""}` : "India"}</span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                        ₹{o.seller_subtotal || o.total_amount || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(o.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0891b2] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTracking(o)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-[#0891b2] hover:text-white text-cyan-800 border border-cyan-200 text-xs font-semibold shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                          title="Live Shiprocket Courier Tracking"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#0891b2] hover:text-white" />
                          <span>Track</span>
                        </button>

                        {["placed", "confirmed", "processing", "pending"].includes(String(o.status).toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => setPackingOrder(o)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            Pack Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pack Order / Ready to Ship Modal */}
      {packingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#0891b2]" />
                <span>Pack & Dispatch Order</span>
              </h3>
              <button
                type="button"
                onClick={() => setPackingOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200/80 text-xs text-cyan-950 space-y-1">
              <p className="font-bold">✓ Centralized Polybag Checklist:</p>
              <p>1. Fold garment neatly with seller brand tags intact.</p>
              <p>2. Insert into official Nari Pehnawa security tamper-evident polybag.</p>
              <p>3. Seal using peel-and-stick tamper tape.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Courier Partner
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Airway Bill (AWB) Tracking No. (Optional)
                </label>
                <input
                  type="text"
                  value={trackingAwb}
                  onChange={(e) => setTrackingAwb(e.target.value)}
                  placeholder="e.g. 1423456789 or generate via Shiprocket"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPackingOrder(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(packingOrder.id || packingOrder._id, "ready_to_ship")}
                className="px-4 py-2 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "Mark as Ready to Ship"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details & Printable Slip Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Seller Dispatch Order
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Order #{selectedOrder.order_number || selectedOrder.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTracking(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-[#0891b2] hover:text-white text-cyan-800 border border-cyan-200 text-xs font-bold transition cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Live Tracking</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Nari Pehnawa Packing Slip Header */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-extrabold tracking-wider text-[#d4af37]">NARI PEHNAWA</h2>
                  <p className="text-[10px] text-slate-300 italic">Traditional Ka Tadka • Official Customer Packing Slip</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-200 border border-slate-700">
                    Order #{selectedOrder.order_number || selectedOrder.id}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Date: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : "Recent"}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center text-[11px] text-slate-300">
                <span>Dispatch Hub: {selectedOrder.seller_items?.[0]?.pickup_location || "Nari Pehnawa Seller Hub"}</span>
                <span className="text-slate-400">Carrier: {selectedOrder.shipping?.courier_name || "Shiprocket Express"}</span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800 text-xs">Customer Delivery Destination:</p>
              <p className="font-semibold text-slate-900">{selectedOrder.shipping_address?.name}</p>
              <p className="text-slate-600">{selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.address}</p>
              <p className="text-slate-600">
                {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}
              </p>
              <p className="text-slate-600 font-mono">Phone: {selectedOrder.shipping_address?.phone || "N/A"}</p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seller Garment Items:
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {(selectedOrder.seller_items || selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {it.product_image && (
                        <img
                          src={it.product_image}
                          alt={it.product_name}
                          className="w-10 h-10 rounded object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{it.product_name}</p>
                        <p className="text-slate-500">Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ""}</p>
                        {it.pickup_location && (
                          <p className="text-[10px] text-slate-400">Warehouse: {it.pickup_location}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">₹{it.price * (it.quantity || 1)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Guarantee Notice */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nari Pehnawa Official Packaging &amp; Return Assurance:</span>
              </p>
              <p className="text-[11px] text-emerald-800">
                This item is fulfilled via the Nari Pehnawa Merchant Network and sealed in an authentic Nari Pehnawa tamper-evident bag.
              </p>
              <p className="text-[11px] text-emerald-800">
                3-day easy return &amp; exchange available at <strong>naripehnawa.com/track-order</strong>. Customer Care: support@naripehnawa.com
              </p>
            </div>

            {/* Payout Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Items Subtotal:</span>
                <span className="font-bold text-slate-800">₹{selectedOrder.seller_subtotal || selectedOrder.total_amount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Platform Handling Fee (+10 Extra NP Polybag):</span>
                <span className="font-semibold text-slate-700">-₹10.00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-sm">
                <span>Net Estimated Seller Settlement:</span>
                <span className="text-[#0891b2]">₹{Math.max(0, (selectedOrder.seller_subtotal || selectedOrder.total_amount || 0) * 0.90 - 10).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Shiprocket Courier Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#0891b2]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Shiprocket Live Tracking
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order #{trackingOrder.order_number || trackingOrder.id} • Real-time Courier Telemetry
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTracking(trackingOrder, true)}
                  disabled={trackingLoading}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Refresh Live Status"
                >
                  <RefreshCw className={`w-4 h-4 ${trackingLoading ? "animate-spin text-[#0891b2]" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackingOrder(null);
                    setTrackingData(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {trackingLoading && !trackingData ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-7 h-7 text-[#0891b2] animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold">Connecting to Shiprocket courier network...</p>
              </div>
            ) : (
              <>
                {/* Status & Carrier Overview Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Courier Partner
                      </span>
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#0891b2]" />
                        {trackingData?.courier_name || trackingOrder.shipping?.courier_name || "Shiprocket Express"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Current Status
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 uppercase">
                        {trackingData?.current_status || trackingOrder.shipping?.current_status || trackingOrder.status || "In Transit"}
                      </span>
                    </div>
                  </div>

                  {/* AWB Section */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">AWB Tracking Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {trackingData?.awb || trackingOrder.shipping?.awb || trackingOrder.shipping?.awb_code || trackingOrder.tracking_awb || "AWB Processing"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAwb(trackingData?.awb || trackingOrder.shipping?.awb || trackingOrder.tracking_awb)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy AWB"
                      >
                        {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {trackingData?.tracking_url && (
                        <a
                          href={trackingData.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0891b2] hover:underline flex items-center gap-1 font-semibold text-[11px] ml-1"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logistics Route: Pickup Warehouse -> Delivery Destination */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-white rounded-xl border border-slate-200 p-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pickup Facility (Warehouse)</span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {trackingOrder.seller_items?.[0]?.pickup_location || "Seller Facility Hub"}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {trackingOrder.seller_items?.[0]?.seller_warehouse?.city 
                        ? `${trackingOrder.seller_items[0].seller_warehouse.city}, ${trackingOrder.seller_items[0].seller_warehouse.state} (${trackingOrder.seller_items[0].seller_warehouse.pincode})`
                        : "Registered Dispatch Facility"}
                    </p>
                  </div>

                  <div className="space-y-1 border-l border-slate-100 pl-3">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Customer Destination</span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {trackingOrder.shipping_address?.city || "Customer City"}, {trackingOrder.shipping_address?.state || ""}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      PIN: {trackingOrder.shipping_address?.pincode || trackingOrder.shipping_address?.postal_code || "India"}
                    </p>
                  </div>
                </div>

                {/* Live Scanning History Timeline */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Transit Telemetry &amp; Scans</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auto-synced via Shiprocket</span>
                  </h4>

                  {trackingData?.tracking_history && trackingData.tracking_history.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
                      {trackingData.tracking_history.map((scan, sIdx) => (
                        <div key={sIdx} className="p-3 text-xs flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#0891b2] mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{scan.activity || scan.status || "Checkpoint Scan"}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{scan.location || "In Transit"}</span>
                              <span>•</span>
                              <span>{scan.date || scan.time || "Recent"}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50">
                      <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                      <p className="font-medium text-slate-700">Awaiting courier physical pickup scan.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Once the courier partner scans the Nari Pehnawa polybag at your warehouse, live tracking checkpoints will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTrackingOrder(null);
                  setTrackingData(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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

export default SellerOrders;

