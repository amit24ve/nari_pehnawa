import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Search,
  CheckCircle,
  RotateCcw,
  XCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import shippingApi from "../services/shippingApi";
import ShipmentTimeline from "./ShipmentTimeline";
import useSEO from "../hooks/useSEO";

const PublicOrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Input states for the search form
  const [inputOrderId, setInputOrderId] = useState(orderId || "");
  const [inputContact, setInputContact] = useState("");
  const [inputPincode, setInputPincode] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Return / Cancellation modal states
  const [actionModal, setActionModal] = useState(null); // 'return' | 'cancel' | null
  const [actionReason, setActionReason] = useState("");
  const [actionComments, setActionComments] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useSEO(
    "Return, Cancellation & Order Tracking | Nari Pehnawa",
    "Track your Nari Pehnawa order live with Shiprocket, generate return or cancellation requests with Order ID, Email/Mobile Number, and Pincode."
  );

  const fetchTracking = async (qId = inputOrderId, contact = inputContact, pin = inputPincode, isRefresh = false) => {
    const cleanId = (qId || "").trim();
    const cleanContact = (contact || "").trim();
    const cleanPin = (pin || "").trim();

    if (!cleanId && !cleanContact && !cleanPin) {
      setError("Please enter your Order ID, Mobile Number / Email, or Pincode to track your order.");
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    setActionSuccess(null);

    try {
      const res = await shippingApi.trackPublic(cleanId, cleanContact, cleanPin);
      setData(res);
      if (cleanId && cleanId !== orderId) {
        navigate(`/track-order/${encodeURIComponent(cleanId)}`, { replace: true });
      }
    } catch (e) {
      setError(e.message || "No order or shipment found matching the details provided. Please verify and try again.");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      setInputOrderId(orderId);
      fetchTracking(orderId, "", "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking(inputOrderId, inputContact, inputPincode, false);
  };

  // Submit return or cancellation request
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionReason) {
      alert("Please select a valid reason.");
      return;
    }

    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

    setActionSubmitting(true);
    try {
      if (actionModal === "cancel") {
        const res = await fetch(`${API_URL}/orders/${data.order_id || data.order_number}/cancel-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reason: actionReason }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.detail || "Cancellation request failed");
        setActionSuccess(resData.message || "Cancellation request submitted successfully!");
      } else if (actionModal === "return") {
        const returnPayload = {
          order_id: data.order_id || data.order_number,
          items: (data.items || []).map((itm) => ({
            product_id: itm.product_id || "item",
            quantity: itm.quantity || 1,
            reason: actionReason,
          })),
          reason: actionReason,
          comments: actionComments || "",
        };
        const res = await fetch(`${API_URL}/returns/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(returnPayload),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.detail || "Return request failed");
        setActionSuccess("Return request created successfully! Our team will arrange pickup.");
      }
      setTimeout(() => {
        setActionModal(null);
        fetchTracking(inputOrderId, inputContact, inputPincode, true);
      }, 2000);
    } catch (err) {
      alert(err.message || "Action failed. Please make sure you are logged in if this order is linked to your account.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 md:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Breadcrumb */}
        <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1.5 border-b border-stone-100 pb-3">
          <Link to="/" className="hover:text-[#8B0000] transition">HOME</Link>
          <span>/</span>
          <span className="text-[#8B0000] font-bold">TRACK ORDER</span>
        </div>

        {/* Header Heading matching uploaded reference */}
        <div className="text-center pt-2 pb-4 space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black uppercase text-[#1c1917] tracking-wide">
            RETURN, CANCELLATION AND ORDER TRACKING
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Create Return &amp; Cancellation Request and get updates about your Order status. Enter your Order ID and Email or Mobile Number.
          </p>
        </div>

        {/* 3-Field Search Box in Gold/Bordered Container */}
        <div className="rounded-xl border-2 border-[#d4af37]/60 bg-[#fffdfa] p-4 sm:p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Enter Order Id */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-semibold text-stone-500">
                Enter Order Id
              </label>
              <input
                type="text"
                placeholder="e.g. NP-1002 or 1002"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                className="w-full bg-transparent border-b-2 border-stone-300 focus:border-[#8B0000] py-2 px-1 text-sm font-semibold text-stone-800 outline-none transition placeholder:text-stone-400"
              />
            </div>

            {/* Enter Mobile Number or Email */}
            <div className="sm:col-span-4 space-y-1">
              <label className="block text-[11px] font-semibold text-stone-500">
                Enter Mobile Number or Email
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 or user@email.com"
                value={inputContact}
                onChange={(e) => setInputContact(e.target.value)}
                className="w-full bg-transparent border-b-2 border-stone-300 focus:border-[#8B0000] py-2 px-1 text-sm font-semibold text-stone-800 outline-none transition placeholder:text-stone-400"
              />
            </div>

            {/* Enter Pincode */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-semibold text-stone-500">
                Enter Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 228001"
                value={inputPincode}
                onChange={(e) => setInputPincode(e.target.value)}
                className="w-full bg-transparent border-b-2 border-stone-300 focus:border-[#8B0000] py-2 px-1 text-sm font-semibold text-stone-800 outline-none transition placeholder:text-stone-400"
              />
            </div>

            {/* Track Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#8B0000] hover:bg-[#6b0000] active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{loading ? "SEARCHING..." : "TRACK"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2 animate-fadeIn">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-850 text-sm">Tracking Details Not Found</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>
        )}

        {/* Results Showcase */}
        {data && (
          <div className="space-y-6 animate-fadeIn pt-2">
            
            {/* Top Overview & Action Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Order Number:</span>
                    <span className="text-base font-black text-stone-800 font-mono">#{data.order_number}</span>
                  </div>
                  {data.customer_name && (
                    <p className="text-xs text-stone-600 mt-0.5">
                      Customer: <strong className="text-stone-800">{data.customer_name}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Shipment Status</span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 capitalize border border-emerald-200 mt-0.5 shadow-xs">
                      {(data.current_status || data.shipment_status || "Processing").replace(/_/g, " ")}
                    </span>
                  </div>
                  {data?.awb && (
                    <button
                      onClick={() => fetchTracking(inputOrderId, inputContact, inputPincode, true)}
                      disabled={refreshing}
                      className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition flex items-center gap-1.5 disabled:opacity-50"
                      title="Sync live status with Shiprocket"
                    >
                      <Loader2 className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#8B0000]" : "text-stone-500"}`} />
                      <span className="hidden sm:inline">{refreshing ? "Syncing..." : "Sync"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Shipment Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                {data.courier_name && (
                  <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">Courier Partner</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#8B0000]" /> {data.courier_name}
                    </span>
                  </div>
                )}
                {data.awb && (
                  <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">Shiprocket AWB</span>
                    <span className="font-mono font-bold text-stone-800 select-all">{data.awb}</span>
                  </div>
                )}
                {data.estimated_delivery && (
                  <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-100">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">Est. Delivery</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" /> {data.estimated_delivery}
                    </span>
                  </div>
                )}
                <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">Payment &amp; Total</span>
                  <span className="font-bold text-stone-800">
                    ₹{Number(data.total_amount || 0).toFixed(2)} ({data.payment_method || "COD"})
                  </span>
                </div>
              </div>

              {/* Action Buttons: Return / Cancel / Support */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {data.can_cancel && (
                    <button
                      type="button"
                      onClick={() => { setActionModal("cancel"); setActionReason(""); setActionSuccess(null); }}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Request Cancellation
                    </button>
                  )}
                  {data.can_return && (
                    <button
                      type="button"
                      onClick={() => { setActionModal("return"); setActionReason(""); setActionSuccess(null); }}
                      className="px-3.5 py-2 bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white border border-[#8B0000]/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Request Return / Exchange
                    </button>
                  )}
                  {data.tracking_url && (
                    <a
                      href={data.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Shiprocket Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  Verified Shiprocket Tracking Partner
                </div>
              </div>
            </div>

            {/* Visual Step Timeline */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                <Truck className="w-4 h-4 text-[#8B0000]" /> Transit &amp; Delivery Progress
              </h4>
              <div className="px-2">
                <ShipmentTimeline status={data.shipment_status} />
              </div>
            </div>

            {/* Order Items List */}
            {data.items && data.items.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <ShoppingBag className="w-4 h-4 text-[#8B0000]" /> Order Items ({data.items.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                      {item.image ? (
                        <img src={item.image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover border border-stone-200 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 flex-shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-800 truncate">{item.product_name}</p>
                        <p className="text-stone-500 mt-0.5">
                          Qty: {item.quantity} {item.size && `• Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                        </p>
                        <p className="font-semibold text-[#8B0000] mt-0.5">₹{Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Activity Logs */}
            {data.tracking_history && data.tracking_history.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Clock className="w-4 h-4 text-[#8B0000]" /> Detailed Activity Logs
                </h4>
                <div className="relative border-l-2 border-stone-200 ml-3 pl-5 space-y-5 pt-1">
                  {data.tracking_history.map((event, idx) => {
                    const dateStr = event.date ? new Date(event.date).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    }) : "";
                    return (
                      <div key={idx} className="relative text-xs">
                        <span className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                          idx === 0 ? "bg-[#8B0000] ring-[#8B0000]/10" : "bg-stone-300 ring-stone-100"
                        }`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-bold capitalize ${idx === 0 ? "text-[#8B0000]" : "text-stone-800"}`}>
                              {event.status || "Status Update"}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200/50">
                                <MapPin className="w-2.5 h-2.5 text-stone-400" /> {event.location}
                              </span>
                            )}
                          </div>
                          <p className="text-stone-600 mt-1 leading-relaxed">{event.activity || event.description}</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{dateStr} {event.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assistance Banner */}
            <div className="bg-[#FAF5ED] border border-[#d4af37]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-700">
              <ShieldCheck className="w-5 h-5 text-[#8B0000] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[#8B0000]">Need Instant Assistance With Your Order?</p>
                <p className="leading-relaxed">
                  Our customer care team is available 24/7. Reach out at <a href="mailto:support@naripehnawa.com" className="font-bold underline">support@naripehnawa.com</a> or WhatsApp/Call <a href="tel:+919140228795" className="font-bold underline">+91 9140228795</a> with your Order ID.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Return & Cancellation Action Modal */}
        {actionModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn text-stone-800">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#8B0000] uppercase tracking-wide">
                  {actionModal === "cancel" ? "Request Order Cancellation" : "Request Return / Size Exchange"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition"
                >
                  ✕
                </button>
              </div>

              {actionSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm text-stone-800">{actionSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1.5">
                      Select Reason *
                    </label>
                    <select
                      required
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8B0000]"
                    >
                      <option value="">-- Choose a reason --</option>
                      {actionModal === "cancel" ? (
                        <>
                          <option value="Changed my mind">Changed my mind</option>
                          <option value="Ordered by mistake">Ordered by mistake</option>
                          <option value="Delivery time is too long">Delivery time is too long</option>
                          <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                          <option value="Incorrect shipping address">Incorrect shipping address</option>
                          <option value="Other">Other reason</option>
                        </>
                      ) : (
                        <>
                          <option value="Size does not fit (Want Exchange)">Size does not fit (Want Exchange)</option>
                          <option value="Color or fabric different from picture">Color or fabric different from picture</option>
                          <option value="Defective or damaged product received">Defective or damaged product received</option>
                          <option value="Quality not as expected">Quality not as expected</option>
                          <option value="Incorrect item received">Incorrect item received</option>
                          <option value="Other">Other reason</option>
                        </>
                      )}
                    </select>
                  </div>

                  {actionModal === "return" && (
                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">
                        Comments / Requested Size (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={actionComments}
                        onChange={(e) => setActionComments(e.target.value)}
                        placeholder="e.g. Please exchange with size L or arrange pickup"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8B0000]"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-5 py-2 bg-[#8B0000] hover:bg-[#6b0000] text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Submit Request</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicOrderTracking;
