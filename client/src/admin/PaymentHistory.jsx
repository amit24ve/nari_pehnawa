import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  Loader,
  Download
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [paymentsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/payments/?limit=200`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/payments/stats`, { headers }).catch(() => null),
      ]);

      if (!paymentsRes || !paymentsRes.ok) throw new Error("Failed to fetch payments");
      const { payments: data } = await paymentsRes.json();
      if (data && Array.isArray(data)) {
        setPayments(data);
      } else {
        setPayments([]);
      }

      if (statsRes && statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        setStats({
          total_revenue: 0,
          captured: 0,
          cod_pending: 0,
          cod_completed: 0,
          failed: 0
        });
      }
    } catch (e) {
      setError(e.message);
      setPayments([]);
      setStats({
        total_revenue: 0,
        captured: 0,
        cod_pending: 0,
        cod_completed: 0,
        failed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status, failureReason) => {
    if (status === "captured") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Paid Online
        </span>
      );
    }
    if (status === "cod_completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
          COD Collected
        </span>
      );
    }
    if (status === "cod_pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          COD Pending
        </span>
      );
    }
    // Failed or incomplete / uncaptured
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 w-fit">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Payment Failed
        </span>
        {failureReason && (
          <span className="text-[10px] text-slate-500 mt-0.5">
            {failureReason}
          </span>
        )}
      </div>
    );
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
      : "—";

  const formatCurrency = (amt) =>
    `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  /* ── filter & sort ── */
  const filtered = payments.filter((p) => {
    const sl = searchTerm.toLowerCase();
    const matchSearch =
      !sl ||
      (p.order_number || "").toLowerCase().includes(sl) ||
      (p.customer_name || "").toLowerCase().includes(sl) ||
      (p.customer_email || "").toLowerCase().includes(sl) ||
      (p.razorpay_payment_id || "").toLowerCase().includes(sl) ||
      (p.razorpay_order_id || "").toLowerCase().includes(sl);

    let matchStatus = true;
    if (statusFilter === "captured") {
      matchStatus = p.status === "captured";
    } else if (statusFilter === "cod") {
      matchStatus = p.status === "cod_pending" || p.status === "cod_completed" || p.payment_method === "COD";
    } else if (statusFilter === "failed") {
      matchStatus = p.status === "failed" || p.status === "created";
    }
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'customer') return (a.customer_name || '').localeCompare(b.customer_name || '');
    if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statCards = stats
    ? [
      {
        label: "Total Verified Revenue",
        value: formatCurrency(stats.total_revenue),
        icon: TrendingUp,
        iconColor: "text-emerald-600 bg-emerald-50",
      },
      {
        label: "Online Paid Transactions",
        value: stats.captured || 0,
        icon: CreditCard,
        iconColor: "text-[#0891b2] bg-cyan-50",
      },
      {
        label: "COD Pending Cases",
        value: stats.cod_pending || 0,
        icon: Wallet,
        iconColor: "text-amber-600 bg-amber-50",
      },
      {
        label: "Failed / Incomplete Attempts",
        value: stats.failed || 0,
        icon: XCircle,
        iconColor: "text-slate-600 bg-slate-100",
      },
    ]
    : [];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Email,Method,Amount,Status,Gateway ID,Date\n";
    filtered.forEach(p => {
      csvContent += `"${p.order_number || ''}","${p.customer_name || 'N/A'}","${p.customer_email || 'N/A'}","${p.payment_method || 'N/A'}",${p.amount},"${p.status}","${p.razorpay_payment_id || ''}","${p.created_at}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payments_ledger_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Audit storefront transaction histories, gateway verification, and cash collections.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export CSV
          </button>
          
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Sync Gateway
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-800">
          <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={fetchData} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, iconColor }) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1.5">{value}</div>
              </div>
              <div className={`p-3 rounded-2xl ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      {!loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, or transaction ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0891b2] transition"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0891b2] font-semibold cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="captured">Paid Online (Razorpay)</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="failed">Failed / Incomplete</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0891b2] font-semibold cursor-pointer"
            >
              <option value="date">Sort by Date (Latest First)</option>
              <option value="amount">Sort by Amount (Highest First)</option>
              <option value="customer">Sort by Customer Name</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-xs">
          <Loader className="w-8 h-8 text-[#0891b2] mx-auto mb-3 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading ledger transactions...</p>
        </div>
      )}

      {/* Table grid layout */}
      {!loading && (
        paginated.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-6">Order Reference</th>
                    <th className="py-3.5 px-6">Customer Details</th>
                    <th className="py-3.5 px-6">Payment Method</th>
                    <th className="py-3.5 px-6">Transacted Amount</th>
                    <th className="py-3.5 px-6">Payment Status</th>
                    <th className="py-3.5 px-6">Gateway Reference ID</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginated.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {p.order_number || <span className="text-slate-400 italic">Pre-Order Init</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{p.customer_name || "Direct Checkout"}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.customer_email || p.customer_phone || "—"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.payment_method === "COD"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                        }`}>
                          {p.payment_method === "COD" ? "Cash on Delivery (COD)" : "Online (Razorpay)"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(p.status, p.failure_reason)}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600 text-[11px]">
                        {p.razorpay_payment_id && !p.razorpay_payment_id.startsWith("cod_") ? (
                          <span className="font-semibold text-slate-800">{p.razorpay_payment_id}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-bold text-slate-900">No Payment Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Online Razorpay transactions and Cash on Delivery (COD) orders will appear here automatically when placed.
            </p>
          </div>
        )
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs">
          <span className="text-slate-600 font-medium">Showing page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentHistory;
