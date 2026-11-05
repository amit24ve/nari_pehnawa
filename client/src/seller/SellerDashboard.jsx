import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  PlusCircle,
  PackageCheck,
  MessageSquare,
  Clock,
  Sparkles,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Box,
  TrendingUp,
  IndianRupee,
  Calendar,
  AlertCircle,
  FileText,
  Boxes,
} from "lucide-react";
import { useSellerAuth } from "./SellerAuthContext";
import sellerApi from "./sellerApi";

// SVG Line / Area Chart for Sales Trend
const SalesTrendChart = ({ data = [], height = 160 }) => {
  if (!data || data.length === 0) {
    return <div className="text-slate-400 text-xs py-10 text-center">No sales data for this period</div>;
  }

  const maxVal = Math.max(1, ...data.map((d) => d.sales || 0));
  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = 90 - ((d.sales || 0) / maxVal) * 75;
    return { x, y, sales: d.sales, label: d.label };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sellerSalesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map((gl, idx) => (
          <line key={idx} x1="0" y1={gl} x2="100" y2={gl} stroke="#f1f5f9" strokeWidth="0.75" strokeDasharray="3,3" />
        ))}

        <path d={areaD} fill="url(#sellerSalesGrad)" />
        <path d={pathD} fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="1.8" fill="#ffffff" stroke="#0891b2" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-slate-400 font-semibold">
        <span>{data[0]?.label}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState("7d"); // "today" | "7d" | "30d" | "all"
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    out_of_stock_products: 0,
    low_stock_products: 0,
    total_stock_units: 0,
    total_sales_amount: 0,
    total_orders: 0,
    pending_orders: 0,
    ready_to_ship: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    net_earnings: 0,
    available_balance: 0,
    pending_settlements: 0,
    open_inquiries: 0,
    daily_sales_trend: [],
    action_items: [],
    kyc_status: "pending",
    welcome_kit_status: "not_dispatched",
    welcome_kit_awb: "",
    welcome_kit_notes: "",
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, productsData, inquiriesData] = await Promise.all([
        sellerApi.getStats(dateRange).catch(() => ({})),
        sellerApi.getProducts({ limit: 5 }).catch(() => ({ products: [] })),
        sellerApi.getInquiries().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (productsData?.products) setRecentProducts(productsData.products);
      if (Array.isArray(inquiriesData)) setRecentInquiries(inquiriesData.slice(0, 4));
    } catch (err) {
      console.error("Failed to load seller dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const shopName = seller?.shop_name || "Partner Store";

  return (
    <div className="space-y-6">
      {/* Top Header - Matches Admin Panel Clean Style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891b2]">
              Seller Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Real-Time Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome back, {shopName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational center for orders, live inventory, marketplace settlements, and carrier dispatch.
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dateRange === r.id
                    ? "bg-white text-[#0891b2] shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </div>
      </div>

      {/* Action Center / To-Do Alerts */}
      {stats.action_items && stats.action_items.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#0891b2]" />
              <span>To-Do & Action Center ({stats.action_items.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">Immediate attention items</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {stats.action_items.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                  item.type === "warning"
                    ? "bg-amber-50/70 border-amber-200 hover:bg-amber-50 text-amber-950"
                    : item.type === "alert"
                    ? "bg-red-50/70 border-red-200 hover:bg-red-50 text-red-950"
                    : item.type === "success"
                    ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 text-emerald-950"
                    : "bg-cyan-50/70 border-cyan-200 hover:bg-cyan-50 text-cyan-950"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Primary KPI Cards Grid (Clickable to filtered views) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales */}
        <Link
          to="/seller/finance"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0891b2] transition group"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Sales</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">₹{stats.total_sales_amount || 0}</h3>
          <span className="text-[10px] text-[#0891b2] font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            View Ledger →
          </span>
        </Link>

        {/* Total Orders */}
        <Link
          to="/seller/orders"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0891b2] transition group"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{stats.total_orders || 0}</h3>
          <span className="text-[10px] text-[#0891b2] font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            All Orders →
          </span>
        </Link>

        {/* Processing Orders */}
        <Link
          to="/seller/orders?status=processing"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition group"
        >
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">To Pack</span>
          <h3 className="text-xl font-bold text-amber-700 mt-1">{stats.pending_orders || 0}</h3>
          <span className="text-[10px] text-amber-600 font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            Pack Now →
          </span>
        </Link>

        {/* Ready to Ship */}
        <Link
          to="/seller/orders?status=ready_to_ship"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition group"
        >
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Ready to Ship</span>
          <h3 className="text-xl font-bold text-indigo-700 mt-1">{stats.ready_to_ship || 0}</h3>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            Dispatch Queue →
          </span>
        </Link>

        {/* Low Stock Items */}
        <Link
          to="/seller/inventory?tab=low"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-400 transition group"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{stats.low_stock_products || 0}</h3>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            Restock ({stats.out_of_stock_products || 0} out) →
          </span>
        </Link>

        {/* Available Settlement Balance */}
        <Link
          to="/seller/finance"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 transition group"
        >
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Net Payout</span>
          <h3 className="text-xl font-bold text-emerald-700 mt-1">₹{stats.available_balance || 0}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 group-hover:underline flex items-center gap-0.5">
            T+7 Cycle →
          </span>
        </Link>
      </div>

      {/* Sales Trend Chart & Orders Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Sales Trend SVG Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#0891b2]" />
                <span>Sales Revenue Trend (₹)</span>
              </h3>
              <p className="text-xs text-slate-500">Gross ordered value across {dateRange.toUpperCase()}</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Total: ₹{stats.total_sales_amount || 0}
            </span>
          </div>

          <div className="pt-4">
            <SalesTrendChart data={stats.daily_sales_trend || []} height={170} />
          </div>
        </div>

        {/* Right 1 Col: Orders Status Pill Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Order Fulfillment Status
              </h3>
              <p className="text-xs text-slate-500">Live suborders breakdown</p>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>New & Processing</span>
                </span>
                <span className="font-bold text-slate-900">{stats.pending_orders || 0}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span>Ready to Ship (Packed)</span>
                </span>
                <span className="font-bold text-slate-900">{stats.ready_to_ship || 0}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0891b2]"></span>
                  <span>In Transit / Shipped</span>
                </span>
                <span className="font-bold text-slate-900">{stats.shipped_orders || 0}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Delivered to Customer</span>
                </span>
                <span className="font-bold text-slate-900">{stats.delivered_orders || 0}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span>Cancelled / Failed</span>
                </span>
                <span className="font-bold text-slate-900">{stats.cancelled_orders || 0}</span>
              </div>
            </div>
          </div>

          <Link
            to="/seller/orders"
            className="w-full mt-4 py-2 px-3 text-center rounded-lg bg-slate-50 hover:bg-slate-100 text-[#0891b2] text-xs font-bold transition border border-slate-200"
          >
            Open Order Manager →
          </Link>
        </div>
      </div>


      {/* Recent Products & Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              My Active Products
            </h3>
            <Link
              to="/seller/products"
              className="text-xs font-bold text-[#0891b2] hover:underline flex items-center gap-1"
            >
              <span>View All ({stats.total_products || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No products uploaded yet</p>
              <Link
                to="/seller/products/new"
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0891b2] text-white text-xs font-bold shadow-xs hover:bg-[#0e7490] transition"
              >
                Upload First Garment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentProducts.map((p) => {
                const img = p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png";
                return (
                  <div key={p.id || p._id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={img}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                        onError={(e) => { e.target.src = "/placeholder.png"; }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {p.category} • ₹{p.price} • Stock: {p.stock_quantity ?? p.stock ?? 0}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/seller/products"
                      className="text-xs font-bold text-[#0891b2] hover:underline flex-shrink-0"
                    >
                      Manage
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Inquiries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Support Desk
            </h3>
            <Link
              to="/seller/inquiries"
              className="text-xs font-bold text-[#0891b2] hover:underline flex items-center gap-1"
            >
              <span>Tickets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No support tickets</p>
              <Link
                to="/seller/inquiries"
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                Ask Admin
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInquiries.map((inq) => (
                <div key={inq.id || inq._id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 truncate">
                      {inq.category}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                      {inq.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">{inq.subject}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
