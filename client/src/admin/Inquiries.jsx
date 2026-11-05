import React, { useState, useEffect } from "react";
import { MessageSquare, Phone, Mail, Clock, Search, Trash2, CheckCircle2, AlertCircle, RefreshCw, Send, CornerDownRight, MessageCircle, Briefcase, Scissors, Sparkles, Filter } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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
            prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
          );
        }
      })
      .catch((err) => console.error("Status update error:", err));
  };

  const handleReplySubmit = (id) => {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    fetch(`${API_BASE_URL}/inquiries/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply_message: replyText, status: "Resolved" })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setInquiries((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...res.data } : item))
          );
          setReplyingId(null);
          setReplyText("");
        } else {
          alert(res.detail || "Failed to save reply");
        }
      })
      .catch((err) => {
        console.error("Reply error:", err);
        alert("Failed to submit reply");
      })
      .finally(() => setSubmittingReply(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this customer inquiry?")) return;

    fetch(`${API_BASE_URL}/inquiries/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInquiries((prev) => prev.filter((item) => item.id !== id));
        }
      })
      .catch((err) => console.error("Delete inquiry error:", err));
  };

  const getWhatsAppReplyUrl = (item) => {
    let greeting = "";
    if (item.inquiry_type === "reseller") {
      greeting = `Hello ${item.name},\nThank you for reaching out to become a Reseller with Nari Pehnawa! 💼\n\nWe are excited to share our wholesale prices, catalog, and onboarding terms with you.\n\nOur Response:\n${replyText || item.reply_message || "When would be a good time for a quick 5-min call or WhatsApp chat?"}`;
    } else if (item.inquiry_type === "customization") {
      greeting = `Hello ${item.name},\nThank you for choosing Nari Pehnawa! ✂️\n\nRegarding your customization request for: "${item.product_name || item.subject}"\nCustom Size: ${item.custom_size || "Custom"}\nColor/Design: ${item.custom_color || "Standard"}\n\nOur Response:\n${replyText || item.reply_message || "Our design master is reviewing your measurements and can craft this for you. Let us confirm details!"}`;
    } else {
      greeting = `Hello ${item.name},\nThank you for contacting Nari Pehnawa regarding: "${item.subject}".\n\nOur Response:\n${replyText || item.reply_message || "How can we assist you further?"}`;
    }
    const cleanPhone = (item.phone || "").replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(greeting)}`;
  };

  const getEmailReplyUrl = (item) => {
    const subject = encodeURIComponent(`Nari Pehnawa: Re ${item.subject}`);
    const body = encodeURIComponent(
      `Hello ${item.name},\n\nThank you for reaching out to Nari Pehnawa.\n\nInquiry Details: "${item.message}"\n\nResponse:\n${replyText || item.reply_message || ""}\n\nWarm regards,\nNari Pehnawa Team`
    );
    return `mailto:${item.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#8B0000]" /> Inquiries &amp; Reseller Applications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage Become a Reseller partners, Product Customization requests, and customer questions
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Name, Phone, Reseller, Product..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        {/* Category / Type Filter & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inquiry Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold focus:outline-none focus:border-[#8B0000] cursor-pointer"
            >
              <option value="all">All Inquiry Types</option>
              <option value="reseller">💼 Become a Reseller</option>
              <option value="customization">✂️ Product Customization</option>
              <option value="general">💬 General Inquiries</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold focus:outline-none focus:border-[#8B0000] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Pill Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            typeFilter === "all"
              ? "bg-[#8B0000] text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:border-[#8B0000]"
          }`}
        >
          All Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setTypeFilter("reseller")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "reseller"
              ? "bg-purple-700 text-white shadow-sm"
              : "bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Become a Reseller</span>
        </button>
        <button
          onClick={() => setTypeFilter("customization")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "customization"
              ? "bg-rose-700 text-white shadow-sm"
              : "bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Customization Requests</span>
        </button>
        <button
          onClick={() => setTypeFilter("general")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === "general"
              ? "bg-gray-800 text-white shadow-sm"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>General Queries</span>
        </button>
      </div>

      {/* Inquiries Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No Inquiries Found</h3>
          <p className="text-xs text-gray-500 mt-1">Inquiries matching your selected filters will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inquiries.map((item) => {
            const statusColor =
              item.status === "Resolved"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : item.status === "Contacted"
                ? "bg-blue-100 text-blue-800 border-blue-300"
                : "bg-amber-100 text-amber-800 border-amber-300";

            const isReplying = replyingId === item.id;

            return (
              <div
                key={item.id || item._id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: ID + Status + Type Tag */}
                  <div className="flex items-center justify-between gap-2 border-b pb-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400">{item.id}</span>
                    <div className="flex items-center gap-1.5">
                      {item.inquiry_type === "reseller" ? (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-purple-700" /> Reseller
                        </span>
                      ) : item.inquiry_type === "customization" ? (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                          <Scissors className="w-3 h-3 text-rose-700" /> Custom Fit
                        </span>
                      ) : null}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Subject */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                    <p className="text-xs font-semibold text-[#8B0000] mt-0.5">{item.subject}</p>
                  </div>

                  {/* Context Info Box: Reseller or Customization Specs */}
                  {item.inquiry_type === "reseller" && item.reseller_type && (
                    <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 text-xs">
                      <span className="text-[10px] uppercase font-bold text-purple-900 block">Reseller Model:</span>
                      <span className="font-semibold text-purple-950">{item.reseller_type}</span>
                    </div>
                  )}

                  {item.inquiry_type === "customization" && (
                    <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        {item.product_name && (
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-rose-900 block">Product:</span>
                            <span className="font-bold text-gray-900 truncate block">{item.product_name}</span>
                          </div>
                        )}
                        {item.custom_type && (
                          <span className="text-[9.5px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                            {item.custom_type === "top_only" ? "Top / Kurti" : item.custom_type === "bottom_only" ? "Bottom Only" : "Complete Set"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60 text-[11px]">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-rose-800 block">Bust &amp; Cup:</span>
                          <span className="font-bold text-gray-900">
                            {item.bust_size ? `${item.bust_size}" ${item.cup_size || ""}` : (item.custom_size || "Standard")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-rose-800 block">Customer Height:</span>
                          <span className="font-bold text-gray-900">{item.height || "Not specified"}</span>
                        </div>
                      </div>

                      {(item.waist_size || item.hip_size || item.sleeve_type || item.neck_design || item.bottom_style) && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-rose-200/40 text-[10.5px] text-gray-700">
                          {item.waist_size && <div><strong>Waist:</strong> {item.waist_size}"</div>}
                          {item.hip_size && <div><strong>Hip:</strong> {item.hip_size}"</div>}
                          {item.sleeve_type && <div><strong>Sleeves:</strong> {item.sleeve_type}</div>}
                          {item.neck_design && <div><strong>Neck:</strong> {item.neck_design}</div>}
                          {item.bottom_style && <div><strong>Bottom:</strong> {item.bottom_style} ({item.bottom_length || ""}in)</div>}
                        </div>
                      )}

                      {item.custom_color && (
                        <div className="text-[11px] pt-1 border-t border-rose-200/40">
                          <span className="text-[10px] uppercase font-semibold text-rose-800 block">Color / Design Preference:</span>
                          <span className="font-bold text-gray-900">{item.custom_color}</span>
                        </div>
                      )}

                      {(item.advance_amount || item.advance_paid) && (
                        <div className="pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[11px] bg-emerald-50/80 -mx-1 px-2 py-1 rounded-lg border border-emerald-200">
                          <div>
                            <span className="text-[9.5px] uppercase font-black text-emerald-800 block">
                              {item.advance_paid ? "✅ 50% Advance Paid" : "⏳ 50% Advance Pending"}
                            </span>
                            <span className="font-extrabold text-emerald-900">₹{item.advance_amount || 0}</span>
                          </div>
                          {item.remaining_amount ? (
                            <div className="text-right">
                              <span className="text-[9.5px] uppercase font-semibold text-gray-500 block">Balance on Delivery</span>
                              <span className="font-bold text-gray-900">₹{item.remaining_amount}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                      {(item.shipping_full_address || item.shipping_address) && (
                        <div className="pt-1.5 border-t border-rose-200/60 text-[11px] bg-amber-50/70 -mx-1 px-2 py-1.5 rounded-lg border border-amber-200">
                          <span className="text-[9.5px] uppercase font-bold text-amber-900 block">
                            📍 Delivery / Dispatch Address:
                          </span>
                          <span className="font-semibold text-gray-900 block leading-tight">
                            {item.shipping_full_address || `${item.shipping_address || ""}, ${item.shipping_city || ""} ${item.shipping_state || ""} - ${item.shipping_pincode || ""}`.trim()}
                          </span>
                        </div>
                      )}
                      {item.payment_id && (
                        <div className="text-[10px] text-gray-500 font-mono truncate">
                          Pay ID: {item.payment_id}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${item.phone}`} className="font-semibold text-gray-900 hover:underline">
                        {item.phone}
                      </a>
                    </div>
                    {item.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${item.email}`} className="text-gray-700 hover:underline truncate">
                          {item.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Message Box */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                    <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                      "{item.message}"
                    </p>
                  </div>

                  {/* Existing Admin Reply */}
                  {item.reply_message && (
                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                        <span className="flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-emerald-700" /> Admin Response:
                        </span>
                        {item.replied_at && (
                          <span className="text-emerald-600 font-normal">
                            {new Date(item.replied_at).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-950 font-semibold leading-relaxed whitespace-pre-wrap">
                        {item.reply_message}
                      </p>
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 space-y-2 animate-fadeIn">
                      <label className="block text-[10px] font-extrabold uppercase text-[#8B0000]">Write Official Reply</label>
                      <textarea
                        rows="3"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the customer..."
                        className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B0000] bg-white font-medium"
                      ></textarea>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                          className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-black font-bold rounded-lg cursor-pointer transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(item.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                        >
                          {submittingReply ? <RefreshCw className="w-3 h-3 animate-spin text-black" /> : <Send className="w-3 h-3 text-black" />}
                          <span>Save Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="space-y-2.5 pt-4 border-t mt-4">
                  {/* WhatsApp & Email Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppReplyUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <MessageCircle className="w-3 h-3 fill-white" /> WhatsApp
                    </a>
                    {item.email && (
                      <a
                        href={getEmailReplyUrl(item)}
                        className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setReplyingId(isReplying ? null : item.id);
                        setReplyText(item.reply_message || "");
                      }}
                      className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <Send className="w-3 h-3 text-black" />
                      <span>{item.reply_message ? "Edit Reply" : "Reply"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-[11px] font-bold py-1 px-1.5 border rounded-lg bg-gray-50 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
