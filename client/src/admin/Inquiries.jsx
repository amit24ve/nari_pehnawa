import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Scissors,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  User,
  Package,
  Layers,
  ExternalLink,
  History,
  Save,
  Eye,
  Check,
  X,
  Send,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCheck
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const STATUS_OPTIONS = [
  "New",
  "Under Review",
  "Contacted",
  "Measurement Verification",
  "Quotation Sent",
  "Approved",
  "In Production",
  "Solved",
  "Completed",
  "Rejected"
];

const Inquiries = () => {
  const [searchParams] = useSearchParams();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(() => {
    const t = searchParams.get("type");
    return t === "reseller" ? "seller" : (t || "all");
  });
  
  // View Details Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // Internal Notes State inside modal or row
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Status updating indicator
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchInquiries = () => {
    setLoading(true);
    let url = `${API_BASE_URL}/inquiries/`;
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInquiries(data);
          // Update selectedInquiry if modal is open
          if (selectedInquiry) {
            const found = data.find((i) => i.id === selectedInquiry.id);
            if (found) setSelectedInquiry(found);
          }
        } else {
          setInquiries([]);
        }
      })
      .catch((err) => console.error("Error fetching inquiries:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = searchParams.get("type");
    if (t) setTypeFilter(t === "reseller" ? "seller" : t);
  }, [searchParams]);

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleStatusChange = (id, newStatus) => {
    setUpdatingStatusId(id);
    fetch(`${API_BASE_URL}/inquiries/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const nowIso = new Date().toISOString();
          setInquiries((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: newStatus,
                    updated_at: nowIso,
                    status_history: [
                      ...(item.status_history || []),
                      { status: newStatus, timestamp: nowIso, note: `Status updated to ${newStatus}` }
                    ]
                  }
                : item
            )
          );
          if (selectedInquiry && selectedInquiry.id === id) {
            setSelectedInquiry((prev) => ({
              ...prev,
              status: newStatus,
              updated_at: nowIso,
              status_history: [
                ...(prev.status_history || []),
                { status: newStatus, timestamp: nowIso, note: `Status updated to ${newStatus}` }
              ]
            }));
          }
        } else {
          alert(res.detail || "Failed to update status");
        }
      })
      .catch((err) => {
        console.error("Status update error:", err);
        alert("Failed to update status");
      })
      .finally(() => setUpdatingStatusId(null));
  };

  const handleSaveNotes = (id) => {
    setSavingNotes(true);
    setNotesSuccess(false);
    fetch(`${API_BASE_URL}/inquiries/${id}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internal_notes: notesText })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInquiries((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, internal_notes: notesText } : item
            )
          );
          if (selectedInquiry && selectedInquiry.id === id) {
            setSelectedInquiry((prev) => ({ ...prev, internal_notes: notesText }));
          }
          setNotesSuccess(true);
          setTimeout(() => setNotesSuccess(false), 2500);
        } else {
          alert(res.detail || "Failed to save notes");
        }
      })
      .catch((err) => {
        console.error("Notes error:", err);
        alert("Failed to save notes");
      })
      .finally(() => setSavingNotes(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry?")) return;

    fetch(`${API_BASE_URL}/inquiries/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInquiries((prev) => prev.filter((item) => item.id !== id));
          if (selectedInquiry?.id === id) setSelectedInquiry(null);
        } else {
          alert(res.detail || "Failed to delete inquiry");
        }
      })
      .catch((err) => console.error("Delete inquiry error:", err));
  };

  const openViewModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setNotesText(inquiry.internal_notes || "");
    setNotesSuccess(false);
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("solve") || s.includes("complet") || s.includes("approv")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    }
    if (s.includes("new")) {
      return "bg-amber-50 text-amber-800 border-amber-300";
    }
    if (s.includes("review") || s.includes("contact")) {
      return "bg-sky-50 text-sky-800 border-sky-300";
    }
    if (s.includes("product") || s.includes("measure")) {
      return "bg-indigo-50 text-indigo-800 border-indigo-300";
    }
    if (s.includes("quot") || s.includes("await")) {
      return "bg-purple-50 text-purple-800 border-purple-300";
    }
    if (s.includes("reject") || s.includes("close")) {
      return "bg-rose-50 text-rose-800 border-rose-300";
    }
    return "bg-slate-100 text-slate-800 border-slate-300";
  };

  const getWhatsAppUrl = (item) => {
    if (!item?.phone) return "#";
    const rawDigits = item.phone.replace(/[^0-9]/g, "");
    const phoneFormatted = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const msg = `Namaste ${item.name || "Customer"}, this is Nari Pehnawa regarding your inquiry #${item.id}. How may we assist you today?`;
    return `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`;
  };

  // KPI Metrics Computation
  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => (i.status || "").toLowerCase().includes("new")).length;
  const inProgressCount = inquiries.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s.includes("review") || s.includes("contact") || s.includes("product") || s.includes("measure") || s.includes("quot");
  }).length;
  const solvedCount = inquiries.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s.includes("solve") || s.includes("complet") || s.includes("approv");
  }).length;
  const sellerCount = inquiries.filter((i) => i.inquiry_type === "reseller" || i.inquiry_type === "seller").length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#0891b2]" />
            <span>Customer &amp; Seller Inquiries</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming inquiries, update resolution status, track custom body measurements, and follow up directly via WhatsApp or Call.
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0891b2]" : ""}`} />
          <span>Refresh Inquiries</span>
        </button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Inquiries</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">All time</span>
          </div>
        </div>

        {/* New / Action Required */}
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> New / Pending
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-900">{newCount}</span>
            <span className="text-xs text-amber-700 font-bold">Needs Action</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" /> In Progress
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-sky-900">{inProgressCount}</span>
            <span className="text-xs text-sky-700 font-medium">Under review</span>
          </div>
        </div>

        {/* Solved / Completed */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved / Done
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-emerald-900">{solvedCount}</span>
            <span className="text-xs text-emerald-700 font-medium">Resolved</span>
          </div>
        </div>

        {/* Seller Inquiries */}
        <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Seller Inquiries
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-purple-900">{sellerCount}</span>
            <span className="text-xs text-purple-700 font-medium">Registration</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID (NP-...), Name, Phone, Email, Product, Address..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0891b2] font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inquiry Scope */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer"
            >
              <option value="all">All Inquiries ({inquiries.length})</option>
              <option value="customization">Customization &amp; Tailoring</option>
              <option value="seller">Seller &amp; Vendor Inquiries</option>
              <option value="general">General Messages</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:border-[#0891b2] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Quick Category Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            typeFilter === "all"
              ? "bg-[#0891b2] text-white shadow-xs font-black"
              : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
          }`}
        >
          All Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setTypeFilter("customization")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "customization"
              ? "bg-[#0891b2] text-white shadow-xs font-black"
              : "bg-white text-slate-700 border border-slate-200 hover:border-[#0891b2]"
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-[#0891b2]" />
          <span>Tailoring &amp; Custom Orders ({inquiries.filter((i) => i.inquiry_type === "customization").length})</span>
        </button>
        <button
          onClick={() => setTypeFilter("seller")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "seller" || typeFilter === "reseller"
              ? "bg-[#0891b2] text-white shadow-xs font-black"
              : "bg-white text-slate-700 border border-slate-200 hover:border-[#0891b2]"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-purple-600" />
          <span>Seller &amp; Vendor Inquiries ({sellerCount})</span>
        </button>
        <button
          onClick={() => setTypeFilter("general")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "general"
              ? "bg-[#0891b2] text-white shadow-xs font-black"
              : "bg-white text-slate-700 border border-slate-200 hover:border-[#0891b2]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span>General Contact ({inquiries.filter((i) => i.inquiry_type === "general").length})</span>
        </button>
      </div>

      {/* ── Inquiries List ── */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#0891b2] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-xs">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Inquiries Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are no customer inquiries matching your selected search or filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {inquiries.map((item) => {
            const isSeller = item.inquiry_type === "reseller" || item.inquiry_type === "seller";
            const isCustomization = item.inquiry_type === "customization";
            const isUpdating = updatingStatusId === item.id;
            const waUrl = getWhatsAppUrl(item);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-[#0891b2]/50 hover:shadow-sm"
              >
                {/* ── Top Header Row ── */}
                <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-900 text-white shadow-2xs">
                      {item.id}
                    </span>
                    
                    {/* Inquiry Scope Badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
                      {isCustomization ? (
                        <>
                          <Scissors className="w-3 h-3 text-[#0891b2]" />
                          <span>Custom Tailoring</span>
                        </>
                      ) : isSeller ? (
                        <>
                          <Briefcase className="w-3 h-3 text-purple-600" />
                          <span>Seller &amp; Vendor Inquiry</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          <span>General Query</span>
                        </>
                      )}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${getStatusBadgeStyle(
                        item.status
                      )}`}
                    >
                      {item.status || "New"}
                    </span>

                    {item.customization_type && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {item.customization_type}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto md:ml-0 font-medium">
                      <Clock className="w-3 h-3" />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })
                        : "Recent"}
                    </span>
                  </div>

                  {/* Top Right Quick Status Select & Action Buttons */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {/* Live Status Change Selector */}
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Status:
                      </span>
                      <select
                        disabled={isUpdating}
                        value={item.status || "New"}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {isUpdating && <RefreshCw className="w-3 h-3 text-[#0891b2] animate-spin" />}
                    </div>

                    {/* Quick WhatsApp button */}
                    {item.phone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => openViewModal(item)}
                      className="px-3 py-1 bg-[#0891b2] hover:bg-[#06b6d4] text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete Inquiry"
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Main Compact Summary ── */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Customer Info (4 cols) */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                        {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate leading-snug">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <a
                            href={`tel:${item.phone}`}
                            className="hover:text-[#0891b2] font-semibold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{item.phone}</span>
                          </a>
                          {item.email && (
                            <span className="text-slate-400 truncate max-w-[140px]" title={item.email}>
                              {item.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product or Subject Request (5 cols) */}
                  <div className="md:col-span-5 border-l-0 md:border-l border-slate-100 md:pl-4">
                    {item.product_name ? (
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-12 object-cover rounded-md border border-slate-200 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.product_name}
                          </p>
                          {item.product_price && (
                            <span className="text-xs font-bold text-[#0891b2]">
                              ₹{Number(item.product_price).toLocaleString()}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.message || item.additional_instructions || "Custom order requested"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.subject || (isSeller ? "Seller & Vendor Partnership Request" : "Customer Inquiry")}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.message || item.additional_instructions || "No additional message text provided."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Status & Actions (3 cols) */}
                  <div className="md:col-span-3 flex flex-col items-start md:items-end justify-center gap-1.5 md:border-l border-slate-100 md:pl-4">
                    {(item.delivery_address || item.shipping_city) && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <span className="truncate">{item.shipping_city || item.delivery_address}</span>
                      </div>
                    )}
                    {item.internal_notes ? (
                      <span className="text-[10px] text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 font-semibold truncate max-w-[190px]">
                        Note: {item.internal_notes}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No admin notes yet</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: FULL INQUIRY & MEASUREMENTS VIEW / STATUS UPDATE ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                  {selectedInquiry.id}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Inquiry Details &amp; Workflow
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Received on {selectedInquiry.created_at ? new Date(selectedInquiry.created_at).toLocaleString("en-IN") : "Recent"}
                  </span>
                </div>
              </div>

              {/* Status Change Selector inside Modal Header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Status:</span>
                  <select
                    value={selectedInquiry.status || "New"}
                    onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* Customer Contact Information Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700 block">
                  Customer &amp; Delivery Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                    <strong className="text-slate-900 text-sm">{selectedInquiry.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-emerald-700 hover:underline">
                        {selectedInquiry.phone}
                      </a>
                      <a
                        href={getWhatsAppUrl(selectedInquiry)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-2.5 h-2.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                    {selectedInquiry.email ? (
                      <a href={`mailto:${selectedInquiry.email}`} className="font-semibold text-[#0891b2] hover:underline truncate block">
                        {selectedInquiry.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                  {(selectedInquiry.delivery_address || selectedInquiry.shipping_full_address) && (
                    <div className="sm:col-span-2 lg:col-span-3 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Shipping / Delivery Address</span>
                      <p className="text-slate-800 font-medium leading-relaxed mt-0.5">
                        {selectedInquiry.delivery_address || selectedInquiry.shipping_full_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller / Vendor Profile (if seller inquiry) */}
              {(selectedInquiry.inquiry_type === "seller" || selectedInquiry.inquiry_type === "reseller" || selectedInquiry.shop_name || selectedInquiry.brand || selectedInquiry.gstin) && (
                <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-purple-900 block flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-700" />
                    <span>Seller &amp; Vendor Profile Details</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Shop / Brand Name</span>
                      <strong className="text-slate-900">{selectedInquiry.shop_name || selectedInquiry.brand || selectedInquiry.company || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">GSTIN / Tax ID</span>
                      <strong className="text-slate-900 font-mono">{selectedInquiry.gstin || selectedInquiry.tax_id || "Not Provided"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Business Category</span>
                      <strong className="text-slate-900">{selectedInquiry.category || selectedInquiry.product_types || "Apparel & Ethnic Wear"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Reference (if any) */}
              {(selectedInquiry.product_name || selectedInquiry.product_image || selectedInquiry.product_price) && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700 block">
                    Product Reference
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedInquiry.product_image && (
                      <img
                        src={selectedInquiry.product_image}
                        alt={selectedInquiry.product_name}
                        className="w-14 h-16 object-cover rounded-lg border border-slate-200 shadow-2xs"
                      />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {selectedInquiry.product_name || "Custom Design"}
                      </h4>
                      {selectedInquiry.product_price && (
                        <p className="text-xs font-extrabold text-[#0891b2] mt-0.5">
                          ₹{Number(selectedInquiry.product_price).toLocaleString()}
                        </p>
                      )}
                      {selectedInquiry.custom_color && (
                        <p className="text-[11px] text-slate-500">Color: {selectedInquiry.custom_color}</p>
                      )}
                      {selectedInquiry.customization_type && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                          Scope: {selectedInquiry.customization_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inquiry Message / Instructions */}
              {(selectedInquiry.message || selectedInquiry.additional_instructions) && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Customer Message &amp; Special Instructions:
                  </span>
                  <p className="text-xs text-amber-950 font-normal leading-relaxed whitespace-pre-line">
                    {selectedInquiry.message || selectedInquiry.additional_instructions}
                  </p>
                </div>
              )}

              {/* Tailor Measurements (Top / Kurti) */}
              {(selectedInquiry.shoulder || selectedInquiry.bust || selectedInquiry.waist || selectedInquiry.hip || selectedInquiry.kurti_length || selectedInquiry.sleeve_length || selectedInquiry.bust_size) && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-[#0891b2]" />
                      <span>Top / Kurti Custom Measurements (Inches)</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Inches</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {selectedInquiry.shoulder && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Shoulder</span>
                        <strong className="text-slate-900">{selectedInquiry.shoulder} in</strong>
                      </div>
                    )}
                    {(selectedInquiry.bust || selectedInquiry.bust_size) && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Bust</span>
                        <strong className="text-slate-900">{selectedInquiry.bust || selectedInquiry.bust_size} in</strong>
                      </div>
                    )}
                    {selectedInquiry.upper_bust && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Upper Bust</span>
                        <strong className="text-slate-900">{selectedInquiry.upper_bust} in</strong>
                      </div>
                    )}
                    {(selectedInquiry.waist || selectedInquiry.waist_size) && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Waist</span>
                        <strong className="text-slate-900">{selectedInquiry.waist || selectedInquiry.waist_size} in</strong>
                      </div>
                    )}
                    {(selectedInquiry.hip || selectedInquiry.hip_size) && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Hip</span>
                        <strong className="text-slate-900">{selectedInquiry.hip || selectedInquiry.hip_size} in</strong>
                      </div>
                    )}
                    {selectedInquiry.armhole && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Armhole</span>
                        <strong className="text-slate-900">{selectedInquiry.armhole} in</strong>
                      </div>
                    )}
                    {selectedInquiry.sleeve_length && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Sleeve Length</span>
                        <strong className="text-slate-900">{selectedInquiry.sleeve_length} in</strong>
                      </div>
                    )}
                    {selectedInquiry.sleeve_opening && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Sleeve Opening</span>
                        <strong className="text-slate-900">{selectedInquiry.sleeve_opening} in</strong>
                      </div>
                    )}
                    {(selectedInquiry.kurti_length || selectedInquiry.dress_length) && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Kurti Length</span>
                        <strong className="text-slate-900">{selectedInquiry.kurti_length || selectedInquiry.dress_length} in</strong>
                      </div>
                    )}
                    {selectedInquiry.front_neck_depth && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Front Neck Depth</span>
                        <strong className="text-slate-900">{selectedInquiry.front_neck_depth} in</strong>
                      </div>
                    )}
                    {selectedInquiry.back_neck_depth && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Back Neck Depth</span>
                        <strong className="text-slate-900">{selectedInquiry.back_neck_depth} in</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tailor Measurements (Bottom / Pant) */}
              {(selectedInquiry.bottom_waist || selectedInquiry.bottom_hip || selectedInquiry.thigh || selectedInquiry.bottom_length || selectedInquiry.bottom_style) && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0891b2]" />
                      <span>Bottom / Trouser Measurements (Inches)</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Inches</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {selectedInquiry.bottom_waist && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Waist</span>
                        <strong className="text-slate-900">{selectedInquiry.bottom_waist} in</strong>
                      </div>
                    )}
                    {selectedInquiry.bottom_hip && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Hip</span>
                        <strong className="text-slate-900">{selectedInquiry.bottom_hip} in</strong>
                      </div>
                    )}
                    {selectedInquiry.thigh && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Thigh</span>
                        <strong className="text-slate-900">{selectedInquiry.thigh} in</strong>
                      </div>
                    )}
                    {selectedInquiry.knee && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Knee</span>
                        <strong className="text-slate-900">{selectedInquiry.knee} in</strong>
                      </div>
                    )}
                    {selectedInquiry.calf && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Calf</span>
                        <strong className="text-slate-900">{selectedInquiry.calf} in</strong>
                      </div>
                    )}
                    {selectedInquiry.bottom_length && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Bottom Length</span>
                        <strong className="text-slate-900">{selectedInquiry.bottom_length} in</strong>
                      </div>
                    )}
                    {selectedInquiry.bottom_style && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 col-span-2">
                        <span className="text-[10px] text-slate-500 block">Style</span>
                        <strong className="text-slate-900">{selectedInquiry.bottom_style}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Internal Workshop Notes Management */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0891b2]" />
                    <span>Internal Admin Notes &amp; Follow-up</span>
                  </label>
                  {notesSuccess && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Note saved!
                    </span>
                  )}
                </div>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record call notes, fabric selection, agreed price, quotation sent details..."
                  rows={3}
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0891b2] font-medium text-slate-800"
                />
                <button
                  disabled={savingNotes}
                  onClick={() => handleSaveNotes(selectedInquiry.id)}
                  className="px-4 py-2 bg-[#0891b2] hover:bg-[#06b6d4] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingNotes ? "Saving..." : "Save Internal Note"}</span>
                </button>
              </div>

              {/* Audit History Timeline */}
              {selectedInquiry.status_history && selectedInquiry.status_history.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Status History Audit Trail ({selectedInquiry.status_history.length})</span>
                  </span>
                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedInquiry.status_history.map((h, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
                          <span>Status set to <strong>{h.status}</strong> {h.note ? `— ${h.note}` : ""}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {h.timestamp ? new Date(h.timestamp).toLocaleString("en-IN") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedInquiry.id, "Solved")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark as Solved</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedInquiry.id, "Under Review")}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Under Review</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedInquiry.phone && (
                  <a
                    href={getWhatsAppUrl(selectedInquiry)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Client</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Inquiries;
