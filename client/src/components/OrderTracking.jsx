import React, { useEffect, useState } from "react";
import {
  Truck,
  Package,
  Calendar,
  ExternalLink,
  RefreshCw,
  FileText,
  Tag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import shippingApi from "../services/shippingApi";
import ShipmentTimeline from "./ShipmentTimeline";

/**
 * OrderTracking — customer-facing shipment tracking panel for a single
 * order. Shows courier name, tracking number, current status, estimated
 * delivery date, a visual timeline, and links to track / download
 * invoice+label (label/invoice are admin-only on the backend, so those
 * buttons only render when `isAdmin` is true).
 *
 * Usage:
 *   <OrderTracking orderId={order.id} isAdmin={false} />
 */
const OrderTracking = ({ orderId, isAdmin = false }) => {
  const [info, setInfo] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [docLoading, setDocLoading] = useState(null); // "label" | "invoice" | null

  const load = async () => {
    try {
      setError(null);
      const data = await shippingApi.getOrderShipping(orderId);
      setInfo(data);
    } catch (e) {
      console.warn("No shipping details found, checking history...", e);
    } finally {
      // Always fetch history as a fallback/additional audit trail
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
        const res = await fetch(`${API_URL}/orders/${orderId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const resData = await res.json();
          setHistoryLogs(resData.history || []);
        }
      } catch (err) {
        console.error("Error fetching order history logs:", err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const refreshTracking = async () => {
    if (!info?.awb) return;
    setRefreshing(true);
    try {
      await shippingApi.trackByAwb(info.awb);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (type) => {
    if (!info?.shipment_id) return;
    setDocLoading(type);
    try {
      const result =
        type === "label"
          ? await shippingApi.getLabel(info.shipment_id)
          : await shippingApi.getInvoice(info.shipment_id);
      const url = type === "label" ? result.label_url : result.invoice_url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(`Could not fetch ${type}: ${e.message}`);
    } finally {
      setDocLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!info || info.shipment_status === "new") {
    if (historyLogs && historyLogs.length > 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              Order Status Timeline
            </h3>
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-gray-100 ml-2.5">
            {historyLogs.map((log, idx) => {
              const statusName = log.to_status || "pending";
              const dateStr = log.created_at
                ? new Date(log.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              return (
                <div key={idx} className="relative flex gap-3">
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#d4af37] border-2 border-white ring-4 ring-[#d4af37]/20" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {statusName.replace(/_/g, " ")}
                    </p>
                    {log.reason && (
                      <p className="text-xs text-gray-500 mt-0.5">{log.reason}</p>
                    )}
                    {dateStr && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{dateStr}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
        <Package className="w-4 h-4 flex-shrink-0" />
        Shipment has not been created yet for this order.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#d4af37]" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            Shipment Tracking
          </h3>
        </div>
        <button
          onClick={refreshTracking}
          disabled={refreshing || !info.awb}
          className="flex items-center gap-1.5 text-xs font-medium text-[#8B0000] hover:text-[#6B0000] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Courier</p>
          <p className="font-medium text-gray-900">{info.courier_name || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tracking No.</p>
          <p className="font-medium text-gray-900 font-mono">
            {info.tracking_number || info.awb || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-medium text-gray-900 capitalize">
            {(info.current_status || info.shipment_status || "—").replace(/_/g, " ")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Est. Delivery
          </p>
          <p className="font-medium text-gray-900">
            {info.estimated_delivery || "To be updated"}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="pt-2 border-t border-gray-100">
        <ShipmentTimeline status={info.shipment_status} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {info.tracking_url && (
          <a
            href={info.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-[#8B0000]/10 text-[#8B0000] rounded-lg hover:bg-[#8B0000]/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Tracking Link
          </a>
        )}
        {isAdmin && info.shipment_id && (
          <>
            <button
              onClick={() => handleDownload("invoice")}
              disabled={docLoading === "invoice"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {docLoading === "invoice" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Download Invoice
            </button>
            <button
              onClick={() => handleDownload("label")}
              disabled={docLoading === "label"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {docLoading === "label" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Tag className="w-3.5 h-3.5" />
              )}
              Download Label
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
