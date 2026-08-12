import React, { useState, useEffect } from "react";
import { MessageSquare, Phone, Mail, Clock, Search, Trash2, CheckCircle2, AlertCircle, RefreshCw, Send, CornerDownRight, MessageCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchInquiries = () => {
    setLoading(true);
    let url = `${API_BASE_URL}/inquiries/`;
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
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
  }, [statusFilter]);

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
    const text = encodeURIComponent(
      `Hello ${item.name},\nThank you for contacting Nari Pehnawa regarding: "${item.subject}".\n\nOur Response:\n${replyText || item.reply_message || "How can we assist you further?"}`
    );
    const cleanPhone = (item.phone || "").replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const getEmailReplyUrl = (item) => {
    const subject = encodeURIComponent(`Nari Pehnawa Support: Re ${item.subject}`);
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
            <MessageSquare className="w-6 h-6 text-[#8B0000]" /> Customer Inquiries &amp; Replies
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            View customer questions, save official responses, and reply via WhatsApp or Email
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name, Phone, Email or Topic..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-semibold focus:outline-none focus:border-[#8B0000]"
          >
            <option value="all">All Inquiries</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Inquiries Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading customer inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No Inquiries Found</h3>
          <p className="text-xs text-gray-500 mt-1">Customer inquiries submitted from website will appear here.</p>
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
                  <div className="flex items-center justify-between gap-2 border-b pb-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400">{item.id}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                    <p className="text-xs font-semibold text-[#8B0000] mt-0.5">{item.subject}</p>
                  </div>

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

                  {/* Customer Message */}
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
                          className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(item.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="px-3 py-1 bg-[#8B0000] hover:bg-[#6B0000] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                        >
                          {submittingReply ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
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
                      className="text-xs font-bold text-[#8B0000] hover:underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
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
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
