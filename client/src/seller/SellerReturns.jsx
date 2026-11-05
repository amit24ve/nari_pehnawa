import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  Eye,
  Camera,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  X,
} from "lucide-react";
import sellerApi from "./sellerApi";

const SellerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Dispute Modal
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("Wrong item returned by customer");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (activeTab === "cancelled") params.status = "cancelled";
      if (activeTab === "in_transit") params.status = "return_in_transit";
      if (activeTab === "returned") params.status = "returned";

      const res = await sellerApi.getReturns(params);
      let list = res.returns || [];

      if (activeTab === "disputed") {
        list = list.filter((r) => r.dispute_status !== "none");
      }

      setReturns(list);
      setTotal(res.total || list.length);
    } catch (err) {
      setError(err.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeOrder) return;
    try {
      setSubmittingDispute(true);
      let uploadedUrl = null;
      if (evidenceFile) {
        const uploadRes = await sellerApi.uploadImage(evidenceFile);
        uploadedUrl = uploadRes.url || uploadRes.image_url;
      }

      await sellerApi.raiseReturnDispute(disputeOrder.id, {
        reason: disputeReason,
        description: disputeDesc,
        evidence_image_url: uploadedUrl,
      });

      alert("Dispute ticket lodged! Admin team will review within 24-48 hours.");
      setDisputeOrder(null);
      setDisputeDesc("");
      setEvidenceFile(null);
      loadData();
    } catch (err) {
      alert("Failed to raise dispute: " + err.message);
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#0891b2]" />
            <span>Returns & Cancellations Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track return pickups, reverse logistics, and claim damages for defective returns
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Policy Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-slate-800">
        <div className="p-2 bg-white rounded-lg border border-slate-200 flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-[#0891b2]" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-sm text-slate-900">Nari Pehnawa Seller Return Protection</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            If an item is returned damaged, used, or substituted, file a Condition Dispute within 48 hours of reverse delivery with proof photos.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: "all", label: "All Returns & Cancellations" },
          { key: "cancelled", label: "Cancelled Orders" },
          { key: "in_transit", label: "Reverse In-Transit" },
          { key: "returned", label: "Received / Delivered Back" },
          { key: "disputed", label: "Disputes & Claims" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Returns List */}
      <div className="space-y-4">
        {loading && returns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
            <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading reverse logistics & returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-800">Zero Returns & Cancellations!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your store maintains healthy fulfillment. When customers initiate return requests or cancellations, they will appear here.
            </p>
          </div>
        ) : (
          returns.map((ret) => {
            const hasDispute = ret.dispute_status && ret.dispute_status !== "none";
            return (
              <div
                key={ret.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Order #{ret.order_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ret.status === "cancelled" || ret.status === "canceled"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : ret.status === "returned"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {ret.status}
                      </span>
                      {hasDispute && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          Dispute: {ret.dispute_status}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Date: {ret.created_at ? new Date(ret.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 block">
                      Refund Amount
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{ret.refund_amount}
                    </span>
                  </div>
                </div>

                {/* Reason & Address */}
                <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Return / Cancellation Reason:
                    </span>
                    <p className="text-slate-600 italic">
                      "{ret.return_reason}"
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Reverse Pickup Details:
                    </span>
                    <p className="text-slate-600">
                      {ret.shipping_address?.city || "Customer Location"}, {ret.shipping_address?.state || "India"}
                    </p>
                    {ret.tracking_awb && (
                      <span className="text-[11px] text-[#0891b2] font-semibold mt-1 block">
                        AWB: {ret.tracking_awb}
                      </span>
                    )}
                  </div>
                </div>

                {/* Returned Items */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {ret.items?.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={it.image || it.image_url || "/placeholder.png"}
                          alt={it.name || "Product"}
                          className="w-10 h-12 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[180px]">
                            {it.name || "Ethnic Garment"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Qty: {it.quantity || 1} {it.size ? `| Size: ${it.size}` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!hasDispute ? (
                      <button
                        onClick={() => setDisputeOrder(ret)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Claim Damage / Dispute</span>
                      </button>
                    ) : (
                      <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        Claim Lodged ({ret.dispute_reason || "Under Admin Review"})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dispute Modal */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>File Return Damage / Dispute</span>
              </h3>
              <button
                onClick={() => setDisputeOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Lodging dispute for Order <strong>#{disputeOrder.order_number}</strong>. Nari Pehnawa administration will inspect courier tamper seals and evidence.
            </p>

            <form onSubmit={handleSubmitDispute} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispute Reason *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  <option value="Wrong item returned by customer">Wrong item returned by customer</option>
                  <option value="Garment received in torn / damaged condition">Garment received in torn / damaged condition</option>
                  <option value="Tamper-evident polybag seal broken or missing">Tamper-evident polybag seal broken or missing</option>
                  <option value="Used / washed garment with tags removed">Used / washed garment with tags removed</option>
                  <option value="Empty box / package received from courier">Empty box / package received from courier</option>
                  <option value="Other return fraud">Other return fraud</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe the discrepancy observed upon unpacking the returned polybag..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evidence Photo (Recommended)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-[#0891b2] hover:file:bg-cyan-100"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingDispute ? "Submitting..." : "Submit Dispute Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReturns;

