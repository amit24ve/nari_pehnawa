import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  Package,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Info,
} from "lucide-react";
import shippingApi from "../services/shippingApi";
import ShipmentTimeline from "./ShipmentTimeline";

const PublicOrderTracking = () => {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setError(null);
      const res = await shippingApi.trackPublic(orderId);
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to load tracking details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchTracking();
    } else {
      setError("No Order ID provided in URL");
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fetching tracking status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Back Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#8B0000] transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Store
          </Link>
          {data?.awb && (
            <button
              onClick={() => fetchTracking(true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Loader2 className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#8B0000]" : "text-slate-400"}`} />
              {refreshing ? "Syncing..." : "Refresh Status"}
            </button>
          )}
        </div>

        {error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Tracking Unavailable</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{error}</p>
            <button
              onClick={() => fetchTracking()}
              className="px-4 py-2 bg-[#8B0000] text-white rounded-xl text-xs font-bold hover:bg-[#720000] transition shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order ID</span>
                  <span className="text-sm font-bold text-slate-800">#{data.order_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipment Status</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 capitalize border border-emerald-100 mt-0.5">
                    {(data.current_status || data.shipment_status || "Processing").replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {data.courier_name && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivery Partner</span>
                    <span className="font-bold text-slate-800">{data.courier_name}</span>
                  </div>
                )}
                {data.awb && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">AWB Tracking Number</span>
                    <span className="font-mono font-bold text-slate-800">{data.awb}</span>
                  </div>
                )}
                {data.estimated_delivery && (
                  <div>
                    <span className="text-slate-400 flex items-center gap-1 mb-0.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Estimated Delivery</span>
                    <span className="font-bold text-slate-800">{data.estimated_delivery}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Step Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-850 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-[#8B0000]" /> Transit Progress
              </h4>
              <div className="px-2">
                <ShipmentTimeline status={data.shipment_status} />
              </div>
            </div>

            {/* Detailed Activity Logs */}
            {data.tracking_history && data.tracking_history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-850 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Clock className="w-4 h-4 text-[#8B0000]" /> Detailed Tracking History
                </h4>
                <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-5 pt-1">
                  {data.tracking_history.map((event, idx) => {
                    const dateStr = event.date ? new Date(event.date).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    }) : "";
                    return (
                      <div key={idx} className="relative text-xs">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[24.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                          idx === 0 
                            ? "bg-[#8B0000] ring-[#8B0000]/10" 
                            : "bg-slate-300 ring-slate-100"
                        }`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-bold capitalize ${idx === 0 ? "text-[#8B0000]" : "text-slate-800"}`}>
                              {event.status || "Activity Update"}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/50">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" /> {event.location}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 mt-1 leading-relaxed">{event.activity || event.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{dateStr} {event.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer Info Support Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-xs text-slate-600">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">Need Help with your Shipment?</p>
                <p className="leading-relaxed">If you experience delays or need to update delivery instructions, please contact our support team at **support@naripehnawa.com** or call **+91 9140228795**.</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PublicOrderTracking;
