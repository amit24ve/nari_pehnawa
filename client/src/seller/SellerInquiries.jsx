import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  MessageSquare,
  PlusCircle,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  PackageCheck,
  Building2,
  CreditCard,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const INQUIRY_CATEGORIES = [
  {
    name: "Category Expansion Request",
    desc: "Request addition of a new ethnic wear category not currently available",
    icon: FolderPlus,
  },
  {
    name: "Packaging & Polybags Request",
    desc: "Order official Nari Pehnawa tamper-evident polybags or security tape",
    icon: PackageCheck,
  },
  {
    name: "KYC & Document Verification",
    desc: "Questions regarding GST, PAN, or Shop verification status",
    icon: ShieldCheck,
  },
  {
    name: "Payment & Payout Settlements",
    desc: "Inquiries regarding bank transfers, order commissions, or payouts",
    icon: CreditCard,
  },
  {
    name: "Catalog & Product Listing",
    desc: "Assistance with product photos, size charts, or bulk listings",
    icon: HelpCircle,
  },
  {
    name: "General Inquiry",
    desc: "Any other operational queries or suggestions",
    icon: MessageSquare,
  },
];

const SellerInquiries = () => {
  const { seller } = useSellerAuth();
  const location = useLocation();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New ticket form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: location.state?.prefillCategory || "Category Expansion Request",
    subject: "",
    message: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  // Expanded ticket details
  const [expandedId, setExpandedId] = useState(null);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await sellerApi.getInquiries();
      setInquiries(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !expandedId) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    if (location.state?.prefillCategory) {
      setFormData((prev) => ({
        ...prev,
        category: location.state.prefillCategory,
      }));
      setShowForm(true);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Please fill in both subject and message");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await sellerApi.createInquiry({
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
      });

      setSuccess("Your inquiry has been submitted! Admin will respond within 24 to 48 hours.");
      setFormData({
        category: "Category Expansion Request",
        subject: "",
        message: "",
        priority: "medium",
      });
      setShowForm(false);
      loadInquiries();
    } catch (err) {
      setError(err.message || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 24-48h SLA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Guaranteed SLA: Response within 24 to 48 Hours</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Seller Support & Inquiry Desk</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Direct communication with the Nari Pehnawa administration team. Request new categories, order security polybags, or get fast resolution for KYC and store questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? "Close Form" : "New Support Ticket"}</span>
          </button>
          <button
            onClick={loadInquiries}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* New Inquiry Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Support Inquiry</h2>
              <p className="text-xs text-slate-500">
                Guaranteed response directly from Nari Pehnawa Admin within 24-48 hours
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inquiry Topic / Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  {INQUIRY_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  <option value="low">Low (General Query)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Urgent / Dispatch Blocked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Please add 'Banarasi Silk Dupattas' category / Need 100 Medium Polybags"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Message *
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your requirement in detail so our team can immediately take action..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>Team replies within 24 to 48 hours</span>
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry to Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inquiry List & Discussion Thread */}
      <div className="space-y-4">
        {loading && inquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading support inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Support Tickets Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Whenever you need a new category added, polybag dispatches, or account help, raise a ticket here for 24-48h resolution.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0891b2] text-white text-xs font-bold hover:bg-[#0e7490] transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise First Inquiry</span>
            </button>
          </div>
        ) : (
          inquiries.map((inq) => {
            const isExpanded = expandedId === inq.id;
            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0891b2] bg-cyan-50 px-2.5 py-0.5 rounded-full">
                        {inq.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          inq.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inq.status === "in_progress"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inq.status.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        SLA: {inq.sla || "24-48 Hours"}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {inq.subject}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{inq.message}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        {inq.replies?.length || 0} Replies
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(inq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded conversation thread */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 space-y-4">
                    {/* Original Ticket */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#0891b2]" />
                          <span>{seller?.shop_name || "My Store"} (You)</span>
                        </span>
                        <span>{new Date(inq.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {inq.message}
                      </p>
                    </div>

                    {/* Admin Replies */}
                    {inq.replies && inq.replies.length > 0 ? (
                      <div className="space-y-3 pl-4 sm:pl-6 border-l-2 border-[#0891b2]/30">
                        {inq.replies.map((reply, ridx) => (
                          <div
                            key={ridx}
                            className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#0891b2] flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#0891b2]" />
                                <span>{reply.sender_name || "Nari Pehnawa Admin Team"}</span>
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          Ticket received by Admin. A dedicated specialist will review your request and reply within 24 to 48 hours.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SellerInquiries;

