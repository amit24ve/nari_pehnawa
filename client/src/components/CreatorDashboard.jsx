import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  MousePointer,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  Package,
  Truck,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Percent,
} from "lucide-react";
import logoImg from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const FRONTEND_ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://naripehnawa.com";

const CreatorDashboard = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeFilter, setRangeFilter] = useState("all"); // 'today' | '7d' | '30d' | 'all'
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchDashboardData = async (range = rangeFilter) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/collab/dashboard/${token}?range_filter=${range}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("This creator link is invalid, expired, or has been revoked.");
        }
        throw new Error("Failed to load creator collaboration dashboard.");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(rangeFilter);
  }, [token, rangeFilter]);

  const copyReferralLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active Collaboration
        </span>
      );
    }
    if (s === "paused") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Collaboration Paused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        Collaboration Inactive
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800">
      {/* ── Brand Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Nari Pehnawa"
              className="h-9 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-tight block text-[#0891b2]">
                Nari Pehnawa
              </span>
              <span className="text-[11px] text-gray-500 font-medium block">
                Creator Partner Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-gray-600 border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Private Dashboard
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="py-28 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <RefreshCw className="w-10 h-10 text-[#0891b2] animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Loading your creator dashboard...</h3>
            <p className="text-sm text-gray-400 mt-1">
              Verifying secure token and aggregating performance statistics...
            </p>
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-rose-200 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Access Unavailable</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mt-2">{error}</p>
            <p className="text-xs text-gray-400 mt-4">
              If you believe this is in error, please contact the Nari Pehnawa collaboration team at{" "}
              <a href="mailto:support@naripehnawa.com" className="text-[#0891b2] underline">
                support@naripehnawa.com
              </a>
              .
            </p>
          </div>
        ) : data ? (
          <>
            {/* ── Welcome & Overview Card ────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-white via-cyan-50/20 to-pink-50/30 rounded-3xl border border-cyan-100/80 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      Welcome, {data.creator_name}! 👋
                    </h1>
                    {getStatusBadge(data.collaboration_status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 max-w-xl">
                    Thank you for partnering with Nari Pehnawa. Track all your follower clicks, attributed orders, and verified commissions live below.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold text-gray-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-800">
                      <Percent className="w-3.5 h-3.5 text-[#0891b2]" />
                      Commission Rate: <strong className="text-[#0891b2]">{data.commission_rate}%</strong>
                    </span>

                    {data.customer_discount_rate > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 shadow-sm text-pink-700">
                        <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                        Follower Discount: <strong>{data.customer_discount_rate}% OFF</strong>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Attribution Window: <strong>30 Days</strong>
                    </span>

                    {data.start_date && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                        Started: {new Date(data.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Referral Share Box */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cyan-200 shadow-md max-w-md w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#0891b2] uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Your Follower Referral Link
                    </span>
                    <span className="text-[10px] bg-cyan-50 text-[#0891b2] px-2 py-0.5 rounded-full font-bold">
                      {data.referral_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      readOnly
                      value={`${FRONTEND_ORIGIN}/?ref=${data.referral_code}`}
                      className="w-full text-xs font-mono bg-slate-50 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-800 select-all outline-none"
                    />
                    <button
                      onClick={() =>
                        copyReferralLink(`${FRONTEND_ORIGIN}/?ref=${data.referral_code}`)
                      }
                      className="px-4 py-2.5 bg-[#0891b2] text-white rounded-xl text-xs font-semibold hover:bg-[#0e7490] flex items-center gap-1.5 shadow-md shadow-[#0891b2]/20 transition flex-shrink-0"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Link
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
                    📌 Share this link or your code <strong className="text-gray-900 font-mono">{data.referral_code}</strong> with your audience.
                    {data.customer_discount_rate > 0 ? (
                      <span> Followers receive <strong className="text-pink-600">{data.customer_discount_rate}% discount</strong> at checkout, and you earn <strong className="text-[#0891b2]">{data.commission_rate}% commission</strong>!</span>
                    ) : (
                      <span> Earn <strong className="text-[#0891b2]">{data.commission_rate}% commission</strong> on all purchases within 30 days.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Date Range Filter Toolbar ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Performance Period:</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: "today", label: "Today" },
                  { key: "7d", label: "Last 7 Days" },
                  { key: "30d", label: "Last 30 Days" },
                  { key: "all", label: "All Time" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setRangeFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      rangeFilter === item.key
                        ? "bg-white text-[#0891b2] shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Performance Stats Grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase">Clicks</span>
                  <MousePointer className="w-4 h-4 text-[#0891b2]" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.metrics?.total_clicks || 0}
                </div>
                <span className="text-[11px] text-gray-400">Total visits</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase">Unique Visitors</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.metrics?.unique_visitors || 0}
                </div>
                <span className="text-[11px] text-gray-400">Unique visitors</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase">Orders</span>
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.metrics?.total_attributed_orders || 0}
                </div>
                <span className="text-[11px] text-gray-400">Attributed purchases</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase">Conversion</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.metrics?.conversion_rate || 0}%
                </div>
                <span className="text-[11px] text-gray-400">Visitor-to-order rate</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase">Sales Value</span>
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{(data.metrics?.total_eligible_sales_value || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400">Eligible product sales</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-cyan-200 shadow-sm bg-gradient-to-br from-white to-cyan-50/40">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium uppercase text-[#0891b2]">Total Earned</span>
                  <IndianRupee className="w-4 h-4 text-[#0891b2]" />
                </div>
                <div className="text-2xl font-bold text-[#0891b2]">
                  ₹{(data.commission?.total_earned || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-[#0891b2] font-semibold">Your total commission</span>
              </div>
            </div>

            {/* ── Commission & Financial Pipeline ──────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Pending Verification</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  ₹{(data.commission?.pending_verification || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Orders in transit or awaiting return/refund window clearance.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved & Unpaid</span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-2">
                  ₹{(data.commission?.approved_unpaid || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Delivered orders verified for next payment cycle payout.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
                <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase mb-1">
                  <IndianRupee className="w-4 h-4" />
                  <span>Already Paid</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 mt-2">
                  ₹{(data.commission?.already_paid || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Total earnings transferred directly to your bank/UPI.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold uppercase mb-1">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reversals</span>
                </div>
                <div className="text-2xl font-bold text-gray-600 mt-2">
                  ₹{(data.commission?.reversed || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Commission adjusted due to customer cancellations or returns.
                </p>
              </div>
            </div>

            {/* ── Order Status Funnel ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                Order Lifecycle Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Pending</span>
                  <span className="text-lg font-bold text-gray-700">
                    {data.order_breakdown?.pending || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Paid</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {data.order_breakdown?.paid || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Processing</span>
                  <span className="text-lg font-bold text-blue-600">
                    {data.order_breakdown?.processing || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Shipped</span>
                  <span className="text-lg font-bold text-purple-600">
                    {data.order_breakdown?.shipped || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Delivered</span>
                  <span className="text-lg font-bold text-teal-600">
                    {data.order_breakdown?.delivered || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-500">
                    {data.order_breakdown?.cancelled || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-400 uppercase block">Returned</span>
                  <span className="text-lg font-bold text-amber-600">
                    {data.order_breakdown?.returned_refunded || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Sanitized Recent Orders Table (Zero Customer PII) ──────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Recent Attributed Orders
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live record of purchases attributed to your referral link (customer personal information is kept private).
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-50 text-[#0891b2]">
                  {data.recent_orders?.length || 0} Orders
                </span>
              </div>

              {!data.recent_orders || data.recent_orders.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No attributed orders yet for this timeframe.</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Share your referral link on social media to start generating orders and commissions!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="py-3 px-4">Order Ref</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Eligible Amount</th>
                        <th className="py-3 px-4">Your Commission</th>
                        <th className="py-3 px-4">Order Status</th>
                        <th className="py-3 px-4">Commission Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.recent_orders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                            {order.order_id}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            ₹{(order.eligible_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#0891b2]">
                            ₹{(order.commission || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-gray-700 font-medium">
                              {order.order_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span
                              className={`capitalize px-2.5 py-0.5 rounded-full ${
                                order.commission_status === "paid"
                                  ? "bg-purple-100 text-purple-700"
                                  : order.commission_status === "approved" ||
                                    order.commission_status === "payable"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : order.commission_status === "reversed"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {order.commission_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Policy & Calculation Notice ─────────────────────────────────── */}
            <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-[#0891b2]" />
                <span>How Commission & Attribution Works</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li>
                  <strong>Attribution:</strong> Followers who visit through your link have purchases attributed to you for up to 30 days based on last-click attribution.
                </li>
                <li>
                  <strong>Calculation Formula:</strong> Commission = Eligible Product Subtotal × {data.commission_rate}%. Shipping charges and taxes are excluded.
                </li>
                <li>
                  <strong>Verification Period:</strong> Commissions transition from <em>Pending</em> to <em>Payable</em> upon order delivery and completion of the return/exchange window.
                </li>
                <li>
                  <strong>Reversals:</strong> If an order is cancelled before fulfillment or returned by the customer, the corresponding commission is automatically reversed.
                </li>
                <li>
                  <strong>Payouts:</strong> Verified commissions are settled directly via Bank Transfer or UPI by the Nari Pehnawa finance team.
                </li>
              </ul>
            </div>
          </>
        ) : null}
      </main>

      {/* ── Minimal Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Nari Pehnawa. All rights reserved. Private Creator Collaboration Portal.
      </footer>
    </div>
  );
};

export default CreatorDashboard;
