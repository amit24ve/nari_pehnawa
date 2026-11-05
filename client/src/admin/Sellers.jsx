import React, { useState, useEffect, useCallback } from "react";
import {
  Store,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
  PackageCheck,
  CreditCard,
  Send,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  MapPin,
  FolderPlus,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const getAdminToken = () => {
  try {
    return localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const adminFetch = async (endpoint, options = {}) => {
  const token = getAdminToken();
  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || "Admin request failed");
  }
  return data;
};

const Sellers = () => {
  const [activeTab, setActiveTab] = useState("sellers"); // "sellers" | "inquiries" | "products"

  // Sellers state
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellerSearch, setSellerSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Inquiries state
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState("all");

  // Seller Products for Approval state
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productApprovalFilter, setProductApprovalFilter] = useState("all");

  // Marketplace & Commission Settings state
  const [marketplaceConfig, setMarketplaceConfig] = useState({
    global_commission_rate: 10,
    settlement_days: 7,
    min_payout: 500,
    shipping_fee_default: 50,
    rto_fee_default: 35,
    handling_fee_default: 10,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Selected seller modal
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [kycRemarks, setKycRemarks] = useState("");
  const [welcomeKitStatus, setWelcomeKitStatus] = useState("not_dispatched");
  const [welcomeKitAwb, setWelcomeKitAwb] = useState("");
  const [welcomeKitNotes, setWelcomeKitNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Selected inquiry reply modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("in_progress");
  const [replyLoading, setReplyLoading] = useState(false);

  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // Load sellers
  const loadSellers = useCallback(async () => {
    try {
      setLoadingSellers(true);
      const params = new URLSearchParams();
      if (kycFilter !== "all") params.set("kyc_status", kycFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sellerSearch.trim()) params.set("search", sellerSearch.trim());
      const qs = params.toString();

      const data = await adminFetch(`/seller/admin/sellers${qs ? `?${qs}` : ""}`);
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sellers:", err);
    } finally {
      setLoadingSellers(false);
    }
  }, [kycFilter, statusFilter, sellerSearch]);

  // Load inquiries
  const loadInquiries = useCallback(async () => {
    try {
      setLoadingInquiries(true);
      const params = new URLSearchParams();
      if (inquiryStatusFilter !== "all") params.set("status", inquiryStatusFilter);
      if (inquiryCategoryFilter !== "all") params.set("category", inquiryCategoryFilter);
      const qs = params.toString();

      const data = await adminFetch(`/seller/admin/inquiries${qs ? `?${qs}` : ""}`);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoadingInquiries(false);
    }
  }, [inquiryStatusFilter, inquiryCategoryFilter]);

  // Load seller products for approval
  const loadSellerProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      if (productApprovalFilter !== "all") params.set("approval_status", productApprovalFilter);
      const qs = params.toString();
      const res = await adminFetch(`/seller/admin/products${qs ? `?${qs}` : ""}`);
      setSellerProducts(res?.products || []);
    } catch (err) {
      console.error("Failed to load seller products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [productApprovalFilter]);

  const handleProductApproval = async (productId, status, remarks = "") => {
    try {
      await adminFetch(`/seller/admin/products/${productId}/approval`, {
        method: "PUT",
        body: { status, remarks },
      });
      showNotification(`Product status updated to ${status}.`);
      loadSellerProducts();
    } catch (err) {
      alert("Failed to update product approval: " + err.message);
    }
  };

  const loadMarketplaceConfig = useCallback(async () => {
    try {
      const data = await adminFetch("/seller/admin/marketplace-settings");
      if (data && typeof data.global_commission_rate !== "undefined") {
        setMarketplaceConfig(data);
      }
    } catch (err) {
      console.error("Failed to load marketplace settings:", err);
    }
  }, []);

  const handleSaveMarketplaceConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      await adminFetch("/seller/admin/marketplace-settings", {
        method: "PUT",
        body: marketplaceConfig,
      });
      showNotification("Marketplace commission and settlement settings saved successfully!");
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sellers") {
      loadSellers();
    } else if (activeTab === "inquiries") {
      loadInquiries();
    } else if (activeTab === "products") {
      loadSellerProducts();
    } else if (activeTab === "commission") {
      loadMarketplaceConfig();
    }
  }, [activeTab, loadSellers, loadInquiries, loadSellerProducts, loadMarketplaceConfig]);

  // Handle KYC status update
  const handleUpdateKyc = async (newKycStatus) => {
    if (!selectedSeller) return;
    try {
      setActionLoading(true);
      await adminFetch(`/seller/admin/sellers/${selectedSeller.id}/kyc`, {
        method: "PUT",
        body: {
          kyc_status: newKycStatus,
          kyc_remarks: kycRemarks || undefined,
          welcome_kit_status: welcomeKitStatus,
          welcome_kit_awb: welcomeKitAwb || undefined,
          welcome_kit_notes: welcomeKitNotes || undefined,
        },
      });
      showNotification(`Seller KYC status updated to ${newKycStatus.toUpperCase()}`);
      setSelectedSeller(null);
      setKycRemarks("");
      loadSellers();
    } catch (err) {
      alert("Failed to update KYC: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seller store active/suspended status update
  const handleToggleSellerStatus = async (currentStatus) => {
    if (!selectedSeller) return;
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      setActionLoading(true);
      await adminFetch(`/seller/admin/sellers/${selectedSeller.id}/status`, {
        method: "PUT",
        body: {
          status: nextStatus,
        },
      });
      showNotification(`Seller store status marked as ${nextStatus.toUpperCase()}`);
      setSelectedSeller((prev) => (prev ? { ...prev, status: nextStatus } : null));
      loadSellers();
    } catch (err) {
      alert("Failed to update store status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Admin reply to seller inquiry
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedInquiry || !replyMessage.trim()) return;

    try {
      setReplyLoading(true);
      await adminFetch(`/seller/admin/inquiries/${selectedInquiry.id}/reply`, {
        method: "POST",
        body: {
          message: replyMessage.trim(),
          status: replyStatus,
        },
      });
      showNotification("Reply sent to seller successfully!");
      setSelectedInquiry(null);
      setReplyMessage("");
      loadInquiries();
    } catch (err) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#0891b2]" />
            <span>Seller Management & Support Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage vendor registrations, KYC compliance, product catalog integration, and support SLAs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("sellers")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "sellers"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Registered Sellers ({sellers.length})
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "inquiries"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Support Desk (24-48h SLA)</span>
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-[#0891b2]" />
            <span>Product Approvals ({sellerProducts.filter((p) => p.approval_status === "pending" || !p.is_approved).length})</span>
          </button>
          <button
            onClick={() => setActiveTab("commission")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "commission"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Commission & Payouts</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}



      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 1: SELLERS LIST */}
      {activeTab === "sellers" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                placeholder="Search by shop name, seller name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-700"
              >
                <option value="all">All KYC Statuses</option>
                <option value="pending">KYC Pending</option>
                <option value="approved">KYC Approved</option>
                <option value="rejected">KYC Rejected</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-700"
              >
                <option value="all">All Stores</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={loadSellers}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSellers ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loadingSellers ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">Loading registered sellers...</p>
              </div>
            ) : sellers.length === 0 ? (
              <div className="p-12 text-center">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No sellers found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sellerSearch || kycFilter !== "all"
                    ? "Try adjusting your search criteria."
                    : "No merchant partners have registered yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Store & Owner</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Products</th>
                      <th className="py-3 px-4">KYC Status</th>
                      <th className="py-3 px-4">Store Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {sellers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {s.shop_name}
                            </span>
                            <span className="text-xs text-slate-500 block">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs space-y-0.5">
                            <span className="block text-slate-700">{s.email}</span>
                            <span className="block text-slate-400">{s.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-600 block">
                            {s.city}, {s.state}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {s.total_products || 0} items
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              s.kyc_status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : s.kyc_status === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {s.kyc_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              s.status === "active"
                                ? "bg-cyan-50 text-[#0891b2]"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {s.status === "active" ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSeller(s);
                              setKycRemarks(s.kyc_remarks || "");
                              setWelcomeKitStatus(s.welcome_kit_status || "not_dispatched");
                              setWelcomeKitAwb(s.welcome_kit_awb || "");
                              setWelcomeKitNotes(s.welcome_kit_notes || "");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0891b2] hover:text-white text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review & KYC</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}



      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: INQUIRIES & SUPPORT SLA */}
      {activeTab === "inquiries" && (
        <div className="space-y-4">
          {/* Inquiries Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={inquiryStatusFilter}
                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open (Needs Reply)</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={inquiryCategoryFilter}
                onChange={(e) => setInquiryCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-700"
              >
                <option value="all">All Inquiry Types</option>
                <option value="Category Expansion Request">Category Expansion Request</option>
                <option value="Packaging & Polybags Request">Packaging & Polybags Request</option>
                <option value="KYC & Document Verification">KYC & Document Verification</option>
                <option value="Payment & Payout Settlements">Payment & Payout Settlements</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Target SLA: Respond within 24-48 Hours</span>
              </div>
              <button
                onClick={loadInquiries}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInquiries ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Inquiries Cards */}
          {loadingInquiries ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Loading seller inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Inquiries Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are no open inquiries matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0891b2]/60 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0891b2] bg-cyan-50 px-2.5 py-0.5 rounded-full">
                        {inq.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          inq.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inq.status === "in_progress"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inq.status.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        From: {inq.shop_name} ({inq.seller_name})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(inq.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{inq.subject}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {inq.message}
                    </p>
                  </div>

                  {/* Replies count and CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-semibold">
                      {inq.replies?.length || 0} Admin replies recorded
                    </span>
                    <button
                      onClick={() => {
                        setSelectedInquiry(inq);
                        setReplyStatus(inq.status === "open" ? "in_progress" : inq.status);
                        setReplyMessage("");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Respond to Seller</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PRODUCT APPROVALS QUEUE */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter By Approval:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: "All Products" },
                  { id: "pending", label: "Pending Verification" },
                  { id: "approved", label: "Approved (Live)" },
                  { id: "rejected", label: "Rejected" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setProductApprovalFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      productApprovalFilter === f.id
                        ? "bg-[#0891b2] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadSellerProducts}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loadingProducts ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">Loading seller catalog queue...</p>
              </div>
            ) : sellerProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No seller products in this queue</h3>
                <p className="text-xs text-slate-400 mt-1">When sellers add new listings, they will appear here for verification before going live on the storefront.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Product & Photos</th>
                      <th className="py-3 px-4">Seller & Shop</th>
                      <th className="py-3 px-4">Category & Fabric</th>
                      <th className="py-3 px-4">Pricing Breakdown</th>
                      <th className="py-3 px-4">Approval State</th>
                      <th className="py-3 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sellerProducts.map((p) => {
                      const img = (p.images && p.images[0]) || p.image || p.image_url || "/placeholder.png";
                      const isPending = p.approval_status === "pending" || !p.is_approved;
                      const isApproved = p.approval_status === "approved" || p.is_approved;
                      const isRejected = p.approval_status === "rejected";

                      return (
                        <tr key={p.id || p._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={img}
                                alt={p.name}
                                className="w-12 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                              />
                              <div className="max-w-xs">
                                <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                                <span className="text-[11px] text-slate-400">ID: {(p.id || p._id)?.slice(-8)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block">{p.seller_name || p.brand || "Vendor"}</span>
                            <span className="text-[11px] text-slate-500">{p.seller_city || "City N/A"}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 block">{p.category}</span>
                            <span className="text-[11px] text-slate-400">{p.fabric || "Ethnic Wear"}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">₹{p.price} <span className="text-[10px] text-slate-400">(Customer)</span></span>
                            <span className="text-[11px] text-emerald-700 font-semibold block">Payout: ₹{p.seller_price || Math.max(0, p.price - 95)}</span>
                          </td>

                          <td className="py-3 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Live on Store</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleProductApproval(p.id || p._id, "approved")}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs cursor-pointer"
                                  >
                                    Approve & Make Live
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Enter rejection reason for seller:", "Product image quality or catalog details do not meet standards");
                                      if (reason) handleProductApproval(p.id || p._id, "rejected", reason);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : isApproved ? (
                                <button
                                  onClick={() => handleProductApproval(p.id || p._id, "rejected", "Temporarily delisted by Admin")}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                                >
                                  Delist
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleProductApproval(p.id || p._id, "approved")}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition cursor-pointer"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}



      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Seller KYC Review: {selectedSeller.shop_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Registered: {new Date(selectedSeller.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Seller Contact & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-400 block">Owner Name</span>
                <span className="font-bold text-slate-800 text-sm">{selectedSeller.name}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">Email Address</span>
                <span className="font-bold text-slate-800 text-sm">{selectedSeller.email}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">Mobile Phone</span>
                <span className="font-bold text-slate-800 text-sm">{selectedSeller.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block">Location / Address</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedSeller.address || ""}, {selectedSeller.city}, {selectedSeller.state} - {selectedSeller.pincode || ""}
                </span>
              </div>
            </div>

            {/* Tax & Bank Payout Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0891b2]" />
                <span>Taxation & Bank Payout Settlement</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block">GSTIN</span>
                  <span className="font-bold text-slate-800">{selectedSeller.gstin || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">PAN</span>
                  <span className="font-bold text-slate-800">{selectedSeller.pan || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Bank Name</span>
                  <span className="font-bold text-slate-800">{selectedSeller.bank_name || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Account No.</span>
                  <span className="font-bold text-slate-800">{selectedSeller.account_number || "Not Provided"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold block">Account Holder</span>
                  <span className="font-bold text-slate-800">{selectedSeller.account_holder_name || "Not Provided"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold block">IFSC Code</span>
                  <span className="font-bold text-slate-800">{selectedSeller.ifsc_code || "Not Provided"}</span>
                </div>
              </div>
            </div>

            {/* KYC Identity Verification Documents (Aadhaar, PAN & Shop Photo) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0891b2]" />
                <span>KYC Identity & Business Proofs</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Aadhaar Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Aadhaar Card</span>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">
                    {selectedSeller.aadhaar_number || "No number provided"}
                  </span>
                  <div className="flex gap-2 mt-2">
                    {selectedSeller.aadhaar_front_url ? (
                      <a
                        href={selectedSeller.aadhaar_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Front ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Front</span>
                    )}
                    {selectedSeller.aadhaar_back_url ? (
                      <a
                        href={selectedSeller.aadhaar_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Back ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Back</span>
                    )}
                  </div>
                </div>

                {/* PAN Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">PAN Card</span>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">
                    {selectedSeller.pan_number || selectedSeller.pan || "No PAN provided"}
                  </span>
                  <div className="mt-2">
                    {selectedSeller.pan_card_url ? (
                      <a
                        href={selectedSeller.pan_card_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200 inline-block"
                      >
                        View PAN Photo ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Photo</span>
                    )}
                  </div>
                </div>

                {/* Shop / Brand Photo */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Shop / Brand Image</span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {selectedSeller.brand_name || selectedSeller.shop_name}
                  </span>
                  <div className="flex gap-2 mt-2">
                    {selectedSeller.shop_image_url ? (
                      <a
                        href={selectedSeller.shop_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Shop ↗
                      </a>
                    ) : null}
                    {selectedSeller.brand_logo_url ? (
                      <a
                        href={selectedSeller.brand_logo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Logo ↗
                      </a>
                    ) : null}
                    {!selectedSeller.shop_image_url && !selectedSeller.brand_logo_url && (
                      <span className="text-[10px] text-slate-400 italic">No Image</span>
                    )}
                  </div>
                </div>

                {/* Merchant Owner Photo / Selfie */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Owner Selfie / Photo (खुद की फोटो)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {selectedSeller.name}
                  </span>
                  <div className="mt-2">
                    {selectedSeller.seller_photo_url ? (
                      <a
                        href={selectedSeller.seller_photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0891b2] hover:underline bg-white px-2 py-1 rounded border border-slate-200 inline-block"
                      >
                        View Owner Photo ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Photo Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Packaging Welcome Kit Dispatch Details */}
            <div className="p-4 bg-cyan-50/50 rounded-xl border border-cyan-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#0891b2]" />
                <span>Nari Pehnawa Packaging Welcome Kit Dispatch</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Welcome Kit Status
                  </label>
                  <select
                    value={welcomeKitStatus}
                    onChange={(e) => setWelcomeKitStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  >
                    <option value="not_dispatched">Not Dispatched (Processing)</option>
                    <option value="dispatched">Dispatched (Kit in Transit)</option>
                    <option value="delivered">Delivered to Seller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Courier AWB / Tracking Number
                  </label>
                  <input
                    type="text"
                    value={welcomeKitAwb}
                    onChange={(e) => setWelcomeKitAwb(e.target.value)}
                    placeholder="e.g. SR123456789IN"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Packaging Polybags Details / Kit Notes
                  </label>
                  <input
                    type="text"
                    value={welcomeKitNotes}
                    onChange={(e) => setWelcomeKitNotes(e.target.value)}
                    placeholder="e.g. 100 Pcs Tamper-evident Polybags + NP Tape + Guidelines Guide dispatched"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
              </div>
            </div>

            {/* Remarks input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Review Remarks (visible to merchant)
              </label>
              <input
                type="text"
                value={kycRemarks}
                onChange={(e) => setKycRemarks(e.target.value)}
                placeholder="e.g. Documents verified successfully / Please upload clearer photo of GST certificate"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleSellerStatus(selectedSeller.status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  selectedSeller.status === "active"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-cyan-200 text-[#0891b2] hover:bg-cyan-50"
                }`}
              >
                {selectedSeller.status === "active" ? "Suspend Store" : "Reactivate Store"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateKyc("rejected")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer disabled:opacity-50"
                >
                  Reject KYC
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateKyc("approved")}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Inquiry Reply Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0891b2] bg-cyan-50 px-2 py-0.5 rounded">
                  {selectedInquiry.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Reply to {selectedInquiry.shop_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Original Ticket details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Subject: {selectedInquiry.subject}</span>
                <span>{new Date(selectedInquiry.created_at).toLocaleString()}</span>
              </div>
              <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Existing replies */}
            {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Previous Replies:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedInquiry.replies.map((r, i) => (
                    <div key={i} className="bg-cyan-50/60 p-3 rounded-lg border border-cyan-100 text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <strong className="text-[#0891b2]">{r.sender_name}</strong>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-line">{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Update Ticket Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-800"
                >
                  <option value="in_progress">In Progress (Under Review / Processing)</option>
                  <option value="resolved">Resolved (Complete / Dispatched / Added)</option>
                  <option value="open">Keep Open</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Response Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="e.g. Category 'Banarasi Silk Dupattas' has been created and is now available in your Add Product dropdown! Or: Your 100 polybags pack has been dispatched via BlueDart with tracking #..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replyLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {replyLoading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply to Seller</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSION & SETTLEMENT SETTINGS */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveMarketplaceConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Marketplace Commission & Settlement Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default platform commissions, T+7 payment settlement windows, and logistics buffers
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Global Marketplace Commission (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={marketplaceConfig.global_commission_rate}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        global_commission_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Applied to all third-party seller product sales upon successful order delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Settlement Window (Days after Delivery)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={marketplaceConfig.settlement_days}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        settlement_days: parseInt(e.target.value, 10) || 7,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                  <span className="text-sm font-bold text-slate-600">Days</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard T+7 payout window allows customer return & dispute verification before disbursement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Minimum Payout Threshold (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={marketplaceConfig.min_payout}
                    onChange={(e) =>
                      setMarketplaceConfig((prev) => ({
                        ...prev,
                        min_payout: parseFloat(e.target.value) || 500,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum accumulated seller balance required to initiate automated bank transfer.
                </p>
              </div>
            </div>

            {/* Pricing Formula Buffers */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Default Logistics & Packaging Buffers (Meesho/Amazon Model)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Forward Shipping Charge (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.shipping_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          shipping_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Estimated carrier handover fee added to seller payout.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    RTO Return Risk Buffer (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={marketplaceConfig.rto_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          rto_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Covers return transit costs on un-delivered orders.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    NP Security Polybag Fee (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={marketplaceConfig.handling_fee_default}
                      onChange={(e) =>
                        setMarketplaceConfig((prev) => ({
                          ...prev,
                          handling_fee_default: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Official Nari Pehnawa tamper-evident bag fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Sellers;

