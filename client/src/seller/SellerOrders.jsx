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
} from "lucide-react";
import sellerApi from "./sellerApi";

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
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

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0891b2] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          View Details
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
                  Seller Suborder
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Order #{selectedOrder.order_number || selectedOrder.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800 text-xs">Customer Shipping Address:</p>
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
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">₹{it.price * (it.quantity || 1)}</p>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default SellerOrders;

