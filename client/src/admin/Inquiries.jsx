import React, { useState, useEffect } from "react";
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
  ChevronDown,
  ExternalLink,
  History,
  Save
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const STATUS_OPTIONS = [
  "New",
  "Under Review",
  "Measurement Verification",
  "Quotation Sent",
  "Awaiting Customer Confirmation",
  "Approved",
  "In Production",
  "Completed",
  "Rejected"
];

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("customization"); // default to customization
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState(null);

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
        if (Array.isArray(data)) setInquiries(data);
        else setInquiries([]);
      })
      .catch((err) => console.error("Error fetching inquiries:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleStatusChange = (id, newStatus) => {
    fetch(`${API_BASE_URL}/inquiries/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInquiries((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: newStatus,
                    status_history: [
                      ...(item.status_history || []),
                      { status: newStatus, timestamp: new Date().toISOString() }
                    ]
                  }
                : item
            )
          );
        }
      })
      .catch((err) => console.error("Status update error:", err));
  };

  const handleSaveNotes = (id) => {
    setSavingNotes(true);
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
          setEditingNotesId(null);
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
    if (!window.confirm("Are you sure you want to delete this customization inquiry?")) return;

    fetch(`${API_BASE_URL}/inquiries/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInquiries((prev) => prev.filter((item) => item.id !== id));
        }
      })
      .catch((err) => console.error("Delete inquiry error:", err));
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "New":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Under Review":
      case "Measurement Verification":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "Quotation Sent":
      case "Awaiting Customer Confirmation":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "Approved":
      case "In Production":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "Completed":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Rejected":
        return "bg-rose-100 text-rose-900 border-rose-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* ── Page Title Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-[#780016]" />
            <span>Customization Inquiries &amp; Bespoke Orders</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage custom outfit requests, tailor measurements, customer delivery details, and workflow statuses.
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Inquiries</span>
        </button>
      </div>

      {/* ── Filter & Search Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID (NP-...), Name, Phone, Product..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#780016]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inquiry Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Scope:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white font-semibold focus:outline-none focus:border-[#780016] cursor-pointer"
            >
              <option value="customization">✂️ Customization Inquiries</option>
              <option value="all">All Inquiries</option>
              <option value="reseller">💼 Reseller Applications</option>
              <option value="general">💬 General Queries</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white font-semibold focus:outline-none focus:border-[#780016] cursor-pointer"
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

      {/* ── Quick Tab Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter("customization")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "customization"
              ? "bg-[#780016] text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:border-[#780016]"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Custom Outfits ({inquiries.filter((i) => i.inquiry_type === "customization").length})</span>
        </button>
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            typeFilter === "all"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-900"
          }`}
        >
          All Inquiries ({inquiries.length})
        </button>
      </div>

      {/* ── Inquiries List ── */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <RefreshCw className="w-8 h-8 text-[#780016] animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading customization inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No Inquiries Found</h3>
          <p className="text-xs text-gray-500 mt-1">
            There are no inquiries matching your selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((item) => {
            const hasTopMeasurements = Boolean(
              item.shoulder ||
              item.bust ||
              item.upper_bust ||
              item.waist ||
              item.hip ||
              item.armhole ||
              item.sleeve_length ||
              item.sleeve_opening ||
              item.kurti_length ||
              item.front_neck_depth ||
              item.back_neck_depth ||
              item.bust_size
            );

            const hasBottomMeasurements = Boolean(
              item.bottom_waist ||
              item.bottom_hip ||
              item.thigh ||
              item.knee ||
              item.calf ||
              item.bottom_opening ||
              item.rise ||
              item.inseam_length ||
              item.outseam_length ||
              item.bottom_length
            );

            const isExpanded = expandedInquiryId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all hover:border-[#780016]/40"
              >
                {/* ── Top Header Row ── */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#780016] text-white">
                      {item.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                        item.status
                      )}`}
                    >
                      {item.status || "New"}
                    </span>
                    {item.customization_type && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        Type: {item.customization_type}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })
                        : "Recent"}
                    </span>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">
                        Status:
                      </span>
                      <select
                        value={item.status || "New"}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-white font-bold text-gray-800 focus:outline-none focus:border-[#780016] cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete Inquiry"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Main Body Card ── */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Left Column: Customer & Product Info (5 cols) */}
                  <div className="md:col-span-5 space-y-4">
                    
                    {/* Customer Info */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                        Customer Details
                      </span>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#780016]" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <a
                          href={`tel:${item.phone}`}
                          className="hover:text-[#780016] flex items-center gap-1.5 font-medium"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{item.phone}</span>
                        </a>
                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="hover:text-[#780016] flex items-center gap-1.5 truncate"
                          >
                            <Mail className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </a>
                        )}
                        {(item.delivery_address || item.shipping_full_address) && (
                          <div className="flex items-start gap-1.5 pt-1 text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">
                              {item.delivery_address || item.shipping_full_address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    {(item.product_name || item.product_image || item.product_price) && (
                      <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                          Product Requested
                        </span>
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-12 h-14 object-cover rounded-lg border border-gray-200"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 leading-snug truncate">
                              {item.product_name || "Custom Outfit"}
                            </h4>
                            {item.product_price && (
                              <span className="text-xs font-extrabold text-[#780016]">
                                ₹{item.product_price}
                              </span>
                            )}
                            {item.custom_color && (
                              <p className="text-[11px] text-gray-500">Color: {item.custom_color}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Instructions */}
                    {item.additional_instructions && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                        <strong className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Customer Instructions:
                        </strong>
                        <p className="whitespace-pre-line leading-relaxed font-normal">
                          {item.additional_instructions}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Right Column: Submitted Measurements (7 cols) */}
                  <div className="md:col-span-7 space-y-4">
                    
                    {/* Top Measurements Group */}
                    {hasTopMeasurements && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                        <div className="px-3.5 py-2 bg-stone-100 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-[#780016] uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Top / Kurti Measurements</span>
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">Inches</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {item.shoulder && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Shoulder</span>
                              <strong className="text-gray-900">{item.shoulder} in</strong>
                            </div>
                          )}
                          {(item.bust || item.bust_size) && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Bust</span>
                              <strong className="text-gray-900">{item.bust || item.bust_size} in</strong>
                            </div>
                          )}
                          {item.upper_bust && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Upper Bust</span>
                              <strong className="text-gray-900">{item.upper_bust} in</strong>
                            </div>
                          )}
                          {(item.waist || item.waist_size) && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Waist</span>
                              <strong className="text-gray-900">{item.waist || item.waist_size} in</strong>
                            </div>
                          )}
                          {(item.hip || item.hip_size) && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Hip</span>
                              <strong className="text-gray-900">{item.hip || item.hip_size} in</strong>
                            </div>
                          )}
                          {item.armhole && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Armhole</span>
                              <strong className="text-gray-900">{item.armhole} in</strong>
                            </div>
                          )}
                          {item.sleeve_length && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Sleeve Length</span>
                              <strong className="text-gray-900">{item.sleeve_length} in</strong>
                            </div>
                          )}
                          {item.sleeve_opening && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Sleeve Opening</span>
                              <strong className="text-gray-900">{item.sleeve_opening} in</strong>
                            </div>
                          )}
                          {(item.kurti_length || item.dress_length) && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Kurti Length</span>
                              <strong className="text-gray-900">{item.kurti_length || item.dress_length} in</strong>
                            </div>
                          )}
                          {item.front_neck_depth && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Front Neck</span>
                              <strong className="text-gray-900">{item.front_neck_depth} in</strong>
                            </div>
                          )}
                          {item.back_neck_depth && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Back Neck</span>
                              <strong className="text-gray-900">{item.back_neck_depth} in</strong>
                            </div>
                          )}
                          {item.cup_size && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Cup Size</span>
                              <strong className="text-gray-900">{item.cup_size}</strong>
                            </div>
                          )}
                          {item.height && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Customer Height</span>
                              <strong className="text-gray-900">{item.height}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Measurements Group */}
                    {hasBottomMeasurements && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                        <div className="px-3.5 py-2 bg-stone-100 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#780016]" />
                            <span>Bottom / Trouser Measurements</span>
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">Inches</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {item.bottom_waist && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Waist</span>
                              <strong className="text-gray-900">{item.bottom_waist} in</strong>
                            </div>
                          )}
                          {item.bottom_hip && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Hip</span>
                              <strong className="text-gray-900">{item.bottom_hip} in</strong>
                            </div>
                          )}
                          {item.thigh && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Thigh</span>
                              <strong className="text-gray-900">{item.thigh} in</strong>
                            </div>
                          )}
                          {item.knee && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Knee</span>
                              <strong className="text-gray-900">{item.knee} in</strong>
                            </div>
                          )}
                          {item.calf && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Calf</span>
                              <strong className="text-gray-900">{item.calf} in</strong>
                            </div>
                          )}
                          {item.bottom_opening && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Bottom Opening</span>
                              <strong className="text-gray-900">{item.bottom_opening} in</strong>
                            </div>
                          )}
                          {item.rise && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Rise</span>
                              <strong className="text-gray-900">{item.rise} in</strong>
                            </div>
                          )}
                          {item.inseam_length && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Inseam Length</span>
                              <strong className="text-gray-900">{item.inseam_length} in</strong>
                            </div>
                          )}
                          {item.outseam_length && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Outseam Length</span>
                              <strong className="text-gray-900">{item.outseam_length} in</strong>
                            </div>
                          )}
                          {item.bottom_length && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Total Bottom Length</span>
                              <strong className="text-gray-900">{item.bottom_length} in</strong>
                            </div>
                          )}
                          {item.bottom_style && (
                            <div className="p-1.5 rounded-lg bg-gray-50">
                              <span className="text-[10px] text-gray-500 block">Bottom Style</span>
                              <strong className="text-gray-900">{item.bottom_style}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Internal Notes Management */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Internal Admin Notes</span>
                        </span>
                        {editingNotesId !== item.id ? (
                          <button
                            onClick={() => {
                              setEditingNotesId(item.id);
                              setNotesText(item.internal_notes || "");
                            }}
                            className="text-[11px] text-[#780016] font-bold hover:underline cursor-pointer"
                          >
                            {item.internal_notes ? "Edit Note" : "+ Add Note"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="text-[11px] text-gray-500 font-medium hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {editingNotesId === item.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add internal workshop note (e.g., Fabric cut dispatched to weaver, client confirmed neckline depth)..."
                            rows={3}
                            className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#780016]"
                          />
                          <button
                            disabled={savingNotes}
                            onClick={() => handleSaveNotes(item.id)}
                            className="px-3 py-1.5 bg-[#780016] text-white text-xs font-bold rounded-lg hover:bg-[#5A0010] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingNotes ? "Saving..." : "Save Note"}</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">
                          {item.internal_notes || "No internal notes recorded yet."}
                        </p>
                      )}
                    </div>

                    {/* Status History (Collapsible) */}
                    {item.status_history && item.status_history.length > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={() => setExpandedInquiryId(isExpanded ? null : item.id)}
                          className="text-[11px] text-gray-500 font-semibold hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3" />
                          <span>
                            {isExpanded ? "Hide" : "View"} Audit History ({item.status_history.length} events)
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] space-y-1.5">
                            {item.status_history.map((h, idx) => (
                              <div key={idx} className="flex items-center justify-between text-gray-600">
                                <span>Status changed to <strong>{h.status}</strong></span>
                                <span className="text-gray-400">
                                  {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Inquiries;