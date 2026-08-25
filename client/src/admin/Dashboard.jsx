import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  IndianRupee,
  Package,
  ArrowUpRight,
  Calendar,
  Download,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Layers,
  Globe
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Reusable mini SVG Sparkline for bottom stats
const MiniSparkline = ({ data = [], strokeColor = "#06b6d4" }) => {
  if (data.length === 0) return null;
  const maxVal = Math.max(1, ...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 90 - ((val - minVal) / range) * 80;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="w-16 h-8 overflow-visible flex-shrink-0" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// Custom SVG Line Chart
const SVGLineChart = ({ data = [], height = 180 }) => {
  if (data.length === 0) return <div className="text-gray-400 text-xs py-12 text-center">No data available</div>;

  const maxVal = Math.max(1, ...data.map(d => d.value));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 80; // keep 20% top padding
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  const areaD = pathD + ` L 100 100 L 0 100 Z`;

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Horizontal gridlines */}
        {[20, 40, 60, 80].map((gl, idx) => (
          <line key={idx} x1="0" y1={gl} x2="100" y2={gl} stroke="#f1f5f9" strokeWidth="0.75" strokeDasharray="3,3" />
        ))}
        {/* Gradient fill */}
        <path d={areaD} fill="url(#lineGrad)" />
        {/* Border stroke */}
        <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
        {/* Data points */}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="1.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="1.5" />
        ))}
      </svg>
      {/* Bottom Labels */}
      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-gray-400 font-semibold">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

// Custom SVG Bar Chart
const SVGBarChart = ({ data = [], height = 180 }) => {
  if (data.length === 0) return <div className="text-gray-400 text-xs py-12 text-center">No data available</div>;

  const maxVal = Math.max(1, ...data.map(d => d.value));

  return (
    <div className="w-full flex items-end justify-between gap-3 px-2" style={{ height: `${height}px` }}>
      {data.map((d, i) => {
        const heightPct = Math.max(6, (d.value / maxVal) * 90);
        return (
          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
            <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">{d.value}</span>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-t-md relative h-[140px] flex items-end">
              <div 
                className="w-full bg-gradient-to-t from-[#0891b2] to-[#22d3ee] rounded-t-[4px] shadow-sm group-hover:brightness-105 transition duration-300"
                style={{ height: `${heightPct}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-gray-400 mt-2 truncate w-full text-center font-semibold">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Custom SVG Donut Chart for Visitors Overview
const SVGDonutChart = ({ data = [], height = 140 }) => {
  if (data.length === 0) return <div className="text-gray-400 text-xs py-12 text-center">No data available</div>;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"]; // Purple, Blue, Green, Orange

  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col items-center gap-4 justify-center" style={{ minHeight: `${height}px` }}>
      <div className="w-28 h-28 relative flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f8fafc" strokeWidth="3" />
          {data.map((d, i) => {
            const percentage = (d.value / total) * 100;
            const strokeDash = `${percentage} ${100 - percentage}`;
            const strokeOffset = 100 - accumulatedAngle;
            accumulatedAngle += percentage;
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="4.2"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-gray-400 font-semibold">Total Visitors</span>
          <span className="text-sm font-bold text-gray-900 font-mono leading-tight">{total.toLocaleString()}</span>
          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">▲ 15.3%</span>
        </div>
      </div>

      <div className="space-y-1.5 w-full mt-2">
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(0);
          return (
            <div key={i} className="flex items-center justify-between text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
                <span className="truncate max-w-[120px] font-medium">{d.label}</span>
              </div>
              <span className="font-semibold text-gray-800 font-mono">{pct}% <span className="text-gray-400">({d.value.toLocaleString()})</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon: Icon, trend, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'from-cyan-500 to-cyan-600 text-white shadow-cyan-100',
    blue: 'from-blue-500 to-indigo-600 text-white shadow-blue-100',
    green: 'from-emerald-500 to-teal-600 text-white shadow-emerald-100',
    orange: 'from-orange-400 to-amber-500 text-white shadow-orange-100'
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
      <div>
        <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider font-bold">{title}</div>
        <div className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 font-medium">
            <span>vs last month</span>
            <span className={`font-bold flex items-center gap-0.5 ${
              trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex-shrink-0`}>
        {Icon ? <Icon className="w-5.5 h-5.5 text-white" /> : null}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [usersSummary, setUsersSummary] = useState(null);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback dummy records representing a real live store (matching image exactly)
  const dummySalesData = {
    today: [
      { label: "00:00", value: 120 }, { label: "04:00", value: 80 }, { label: "08:00", value: 240 },
      { label: "12:00", value: 450 }, { label: "16:00", value: 680 }, { label: "20:00", value: 510 }
    ],
    "7days": [
      { label: "Mon", value: 2100 }, { label: "Tue", value: 2450 }, { label: "Wed", value: 2890 },
      { label: "Thu", value: 3200 }, { label: "Fri", value: 4100 }, { label: "Sat", value: 4900 }, { label: "Sun", value: 5200 }
    ],
    "30days": [
      { label: "21 May", value: 72000 }, { label: "28 May", value: 84000 },
      { label: "04 Jun", value: 98000 }, { label: "11 Jun", value: 114000 },
      { label: "18 Jun", value: 121000 }, { label: "21 Jun", value: 128450 }
    ],
    year: [
      { label: "Jan", value: 45000 }, { label: "Feb", value: 49000 }, { label: "Mar", value: 56000 },
      { label: "Apr", value: 61000 }, { label: "May", value: 64000 }, { label: "Jun", value: 72000 }
    ]
  };

  const dummyOrdersData = {
    today: [
      { label: "00:00", value: 2 }, { label: "04:00", value: 1 }, { label: "08:00", value: 4 },
      { label: "12:00", value: 8 }, { label: "16:00", value: 12 }, { label: "20:00", value: 9 }
    ],
    "7days": [
      { label: "Mon", value: 24 }, { label: "Tue", value: 28 }, { label: "Wed", value: 31 },
      { label: "Thu", value: 35 }, { label: "Fri", value: 42 }, { label: "Sat", value: 49 }, { label: "Sun", value: 56 }
    ],
    "30days": [
      { label: "21 May", value: 42 }, { label: "28 May", value: 48 },
      { label: "04 Jun", value: 55 }, { label: "11 Jun", value: 75 },
      { label: "18 Jun", value: 82 }, { label: "21 Jun", value: 95 }
    ],
    year: [
      { label: "Jan", value: 450 }, { label: "Feb", value: 490 }, { label: "Mar", value: 560 },
      { label: "Apr", value: 610 }, { label: "May", value: 640 }, { label: "Jun", value: 720 }
    ]
  };

  const dummyTraffic = [
    { label: "Organic Search", value: 6474 },
    { label: "Direct", value: 3486 },
    { label: "Social Media", value: 1494 },
    { label: "Referral", value: 996 }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsResponse, usersResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/stats`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/admin/users/summary`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/admin/orders/summary`, { headers }).catch(() => null)
      ]);

      if (
        (statsResponse && statsResponse.status === 401) ||
        (usersResponse && usersResponse.status === 401) ||
        (ordersResponse && ordersResponse.status === 401)
      ) {
        localStorage.removeItem("neel_admin_user");
        localStorage.removeItem("neel_token");
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
      }

      let stats = null, users = null, orders = null;

      if (statsResponse && statsResponse.ok) stats = await statsResponse.json();
      if (usersResponse && usersResponse.ok) users = await usersResponse.json();
      if (ordersResponse && ordersResponse.ok) orders = await ordersResponse.json();

      setDashboardStats(stats);
      setUsersSummary(users);
      setOrdersSummary(orders);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'shipped':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const handleExportCSV = () => {
    const orders = dashboardStats?.recent_orders || [];
    if (orders.length === 0) return alert("No recent orders available to export");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Total,Status,Date\n";
    orders.forEach(o => {
      csvContent += `"${o.id}","${o.customer_name || 'Guest'}",${o.total},"${o.status}","${o.created_at}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Dashboard Error</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Exact recent orders from database seeding or fallback:
  const recentOrders = dashboardStats?.recent_orders || [
    { id: "ORD-1025", customer_name: "Neha Sharma", total: 1299, status: "delivered", created_at: new Date().toISOString() },
    { id: "ORD-1024", customer_name: "Priya Verma", total: 2499, status: "processing", created_at: new Date().toISOString() },
    { id: "ORD-1023", customer_name: "Anjali Singh", total: 899, status: "shipped", created_at: new Date().toISOString() },
    { id: "ORD-1022", customer_name: "Kavita Patel", total: 1699, status: "delivered", created_at: new Date().toISOString() }
  ];

  // Limit recent orders to 4 as shown in the screenshot
  const displayOrders = recentOrders.slice(0, 4);

  // Exact best sellers list from the screenshot
  const topProducts = [
    { name: "Elegant Floral Kurti", sales: "1200+ sold", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop", pct: 100 },
    { name: "Designer Anarkali Suit", sales: "950+ sold", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&h=100&fit=crop", pct: 79 },
    { name: "Cotton Printed Kurti", sales: "875+ sold", image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=100&h=100&fit=crop", pct: 72 },
    { name: "Embroidered Palazzo Set", sales: "760+ sold", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop", pct: 63 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin! Here's what's happening with your store today.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-600 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent border-none text-gray-700 focus:outline-none cursor-pointer font-bold"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-[#0891b2]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(dashboardStats ? (dashboardStats.total_revenue ?? 0) : 128450)}
          change="12.5%"
          trend="up"
          icon={() => <span className="text-lg font-extrabold text-white">₹</span>}
          color="cyan"
        />
        <StatCard
          title="Total Orders"
          value={(ordersSummary ? (ordersSummary.total ?? 0) : 265).toLocaleString()}
          change="8.2%"
          trend="up"
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={(usersSummary ? (usersSummary.customers ?? 0) : 2).toLocaleString()}
          change="4.3%"
          trend="up"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Products"
          value={(dashboardStats ? (dashboardStats.total_products ?? 0) : 1800).toLocaleString()}
          change="0.0%"
          trend="up"
          icon={Package}
          color="orange"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Trend Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                Revenue & Sales Trends
              </h2>
              <div className="flex gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total Revenue</span>
                  <span className="text-base font-bold text-[#0891b2] font-mono">{formatCurrency(dashboardStats ? (dashboardStats.total_revenue ?? 0) : 128450)}</span>
                  <span className="text-[9px] text-emerald-600 font-bold ml-1.5">▲ 12.5%</span>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total Orders</span>
                  <span className="text-base font-bold text-indigo-600 font-mono">{ordersSummary ? (ordersSummary.total ?? 0) : 265}</span>
                  <span className="text-[9px] text-emerald-600 font-bold ml-1.5">▲ 8.2%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
              <span className="text-[10px] text-gray-500 font-semibold">Revenue (₹)</span>
            </div>
          </div>
          <SVGLineChart data={dummySalesData[timeRange]} />
        </div>

        {/* Volume Orders Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                Order Volumes
              </h2>
              <div className="mt-2">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total Orders</span>
                <span className="text-base font-bold text-cyan-600 font-mono">{ordersSummary ? (ordersSummary.total ?? 0) : 265}</span>
                <span className="text-[9px] text-emerald-600 font-bold ml-1.5">▲ 8.2%</span>
              </div>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-[10px] font-bold text-gray-600 border border-slate-200 rounded-lg p-1 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="7days">7 Days</option>
              <option value="30days">This Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <SVGBarChart data={dummyOrdersData[timeRange]} />
        </div>

      </div>

      {/* 3-Column Tables & Donut Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Top Selling Products */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-800">Top Selling Products</h2>
              <button className="text-xs text-[#0891b2] font-semibold flex items-center gap-0.5 hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {topProducts.map((p, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-400 w-4 font-mono">{index + 1}</span>
                  <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-gray-800 truncate leading-snug">{p.name}</h3>
                    <span className="text-[10px] text-gray-500 block mt-0.5 font-semibold">{p.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Recent Transactions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
              <button className="text-xs text-[#0891b2] font-semibold flex items-center gap-0.5 hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {displayOrders.map((order, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500 font-mono">
                      {order.customer_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-800 truncate leading-snug">#{order.id}</h3>
                      <p className="text-[10px] text-gray-500 font-semibold truncate mt-0.5">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2.5">
                    <p className="text-xs font-bold text-gray-900 font-mono">{formatCurrency(order.total)}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold capitalize leading-none ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Visitors Overview (Donut) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-800">Visitors Overview</h2>
            <select className="text-[10px] font-bold text-gray-600 border border-slate-200 rounded-lg p-1 focus:outline-none">
              <option value="month">This Month</option>
            </select>
          </div>
          <SVGDonutChart data={dummyTraffic} />
        </div>

      </div>

      {/* Sparkline Small Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Visitors Sparkline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Visitors</span>
            <h4 className="text-lg font-bold text-gray-900 font-mono mt-1">12,450</h4>
            <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">▲ +15.3%</span>
          </div>
          <MiniSparkline data={[10000, 10500, 11200, 10800, 11500, 12000, 12450]} strokeColor="#8b5cf6" />
        </div>

        {/* Page Views Sparkline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Page Views</span>
            <h4 className="text-lg font-bold text-gray-900 font-mono mt-1">28,356</h4>
            <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">▲ +10.2%</span>
          </div>
          <MiniSparkline data={[22000, 24000, 23500, 25000, 27000, 26500, 28356]} strokeColor="#3b82f6" />
        </div>

        {/* Add to Cart Sparkline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Add to Cart</span>
            <h4 className="text-lg font-bold text-gray-900 font-mono mt-1">1,245</h4>
            <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">▲ +7.8%</span>
          </div>
          <MiniSparkline data={[900, 1000, 1100, 1050, 1150, 1200, 1245]} strokeColor="#10b981" />
        </div>

        {/* Conversion Rate Sparkline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Conversion Rate</span>
            <h4 className="text-lg font-bold text-gray-900 font-mono mt-1">3.65%</h4>
            <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">▲ +8.4%</span>
          </div>
          <MiniSparkline data={[3.1, 3.2, 3.4, 3.3, 3.5, 3.6, 3.65]} strokeColor="#f59e0b" />
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
