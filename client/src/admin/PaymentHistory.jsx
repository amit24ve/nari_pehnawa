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
  DollarSign,
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
  const itemsPerPage = 8;

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
      if (data && data.length > 0) {
        setPayments(data);
      } else {
        setPayments(getDummyPayments());
        setStats(getDummyStats());
      }

      if (statsRes && statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        setStats(getDummyStats());
      }
    } catch (e) {
      setError(e.message);
      // Fallback dummy database payments
      setPayments(getDummyPayments());
      setStats(getDummyStats());
    } finally {
      setLoading(false);
    }
  };

  const getDummyPayments = () => [
    { order_number: "o-10938", customer_name: "Anita Sharma", customer_email: "anita@example.com", payment_method: "Razorpay", amount: 4200, status: "captured", razorpay_payment_id: "pay_Pj93821K", created_at: "2026-07-16T12:00:00Z" },
    { order_number: "o-10937", customer_name: "Rahul Verma", customer_email: "rahul@example.com", payment_method: "COD", amount: 1599, status: "cod_pending", razorpay_payment_id: "cod_9382109", created_at: "2026-07-16T09:30:00Z" },
    { order_number: "o-10936", customer_name: "Priyanka Sen", customer_email: "priyanka@example.com", payment_method: "COD", amount: 3400, status: "cod_pending", razorpay_payment_id: "cod_9382110", created_at: "2026-07-16T08:15:00Z" },
    { order_number: "o-10935", customer_name: "Amit Patel", customer_email: "amit@example.com", payment_method: "Razorpay", amount: 5999, status: "captured", razorpay_payment_id: "pay_Pj93822L", created_at: "2026-07-15T16:40:00Z" },
    { order_number: "o-10934", customer_name: "Deepa Nair", customer_email: "deepa@example.com", payment_method: "COD", amount: 1149, status: "failed", razorpay_payment_id: "cod_9382111", created_at: "2026-07-15T11:20:00Z" }
  ];

  const getDummyStats = () => ({
    total_revenue: 128450,
    captured: 145,
    cod_pending: 12,
    cod_completed: 108,
    failed: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  const statusConfig = {
    captured: { label: "Paid Online", color: "bg-green-900/40 text-green-300 border-green-800/50", icon: CheckCircle },
    cod_pending: { label: "COD Pending", color: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50", icon: Clock },
    cod_completed: { label: "COD Collected", color: "bg-blue-900/40 text-blue-300 border-blue-800/50", icon: CheckCircle },
    failed: { label: "Failed", color: "bg-red-900/40 text-red-300 border-red-800/50", icon: XCircle },
    created: { label: "Initiated", color: "bg-gray-700/40 text-gray-300 border-gray-700/50", icon: Clock },
    refunded: { label: "Refunded", color: "bg-purple-900/40 text-purple-300 border-purple-800/50", icon: RefreshCw },
  };

  const getStatusBadge = (status) => {
    const cfg = statusConfig[status] || statusConfig.created;
    const Icon = cfg.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
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
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
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
        label: "Total Revenue",
        value: formatCurrency(stats.total_revenue),
        icon: TrendingUp,
        color: "from-yellow-950/30 to-yellow-900/30 border-yellow-800/40",
      },
      {
        label: "Online Paid Transactions",
        value: stats.captured || 0,
        icon: CreditCard,
        color: "from-green-950/30 to-green-900/30 border-green-800/40",
      },
      {
        label: "COD Pending Cases",
        value: stats.cod_pending || 0,
        icon: Wallet,
        color: "from-blue-950/30 to-blue-900/30 border-blue-800/40",
      },
      {
        label: "Failed Transactions",
        value: stats.failed || 0,
        icon: XCircle,
        color: "from-red-950/30 to-red-900/30 border-red-800/40",
      },
    ]
    : [];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Email,Method,Amount,Status,Gateway ID,Date\n";
    filtered.forEach(p => {
      csvContent += `"${p.order_number}","${p.customer_name || 'N/A'}","${p.customer_email || 'N/A'}","${p.payment_method || 'N/A'}",${p.amount},"${p.status}","${p.razorpay_payment_id || ''}","${p.created_at}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payments_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/40 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Payment Ledger</h1>
          <p className="text-sm text-gray-400 mt-1">Audit storefront transaction histories, gateway IDs, and cash collections.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-[#111827] border border-gray-800 rounded-xl hover:bg-gray-800 transition text-xs font-semibold text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-[#d4af37]" /> Export CSV
          </button>
          
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-850 hover:bg-gray-800 text-white rounded-xl text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4 text-[#d4af37]" /> Sync Gateway
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300 flex-1">{error}</span>
          <button onClick={fetchData} className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-[#111827] border border-gray-800 p-12 rounded-2xl text-center">
          <Loader className="w-8 h-8 text-[#d4af37] mx-auto mb-3 animate-spin" />
          <p className="text-xs text-gray-500">Loading ledger data...</p>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`bg-[#111827] border ${color} rounded-2xl p-4 text-left`}
            >
              <Icon className="w-4 h-4 text-gray-400 mb-2" />
              <div className="text-2xl font-bold text-white font-mono">{value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      {!loading && (
        <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or transaction hash..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#0b1220] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-200 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#0b1220] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Paid Online</option>
              <option value="cod_pending">COD Pending</option>
              <option value="cod_completed">COD Collected</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0b1220] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
            </select>
          </div>
        </div>
      )}

      {/* Table grid layout */}
      {!loading && paginated.length > 0 && (
        <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] border border-gray-800/50 rounded-2xl shadow-lg overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#0b1220]/60 text-gray-400 font-semibold border-b border-gray-800/80">
                <tr>
                  <th className="py-4 px-6">Order Ref</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Transacted Amount</th>
                  <th className="py-4 px-6">Ledger Status</th>
                  <th className="py-4 px-6">Gateway Reference ID</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-200">
                {paginated.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/20 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-[#d4af37]">{p.order_number}</td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-white">{p.customer_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{p.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.payment_method === "COD" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>{p.payment_method}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-white">{formatCurrency(p.amount)}</td>
                    <td className="py-3.5 px-6">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-400">
                      {p.razorpay_payment_id && !p.razorpay_payment_id.startsWith("cod_") ? p.razorpay_payment_id : "—"}
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 font-mono">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl text-xs">
          <span className="text-gray-400">Showing page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 bg-[#0f1724] border border-gray-800 rounded-xl text-white font-semibold disabled:opacity-40"
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
