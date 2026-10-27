import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  MousePointer,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  PauseCircle,
  PlayCircle,
  Calendar,
  Instagram,
  Mail,
  Phone,
  FileText,
  CreditCard,
  History,
  X,
  ChevronRight,
  ShieldCheck,
  Package,
  Trash2,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const FRONTEND_ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://naripehnawa.com";

const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);

  // Active records in modals
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("orders"); // orders, ledger, payouts, audit

  // Newly generated links display
  const [newlyCreatedLinks, setNewlyCreatedLinks] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Available products for picker
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    referral_code: "",
    commission_rate: 10,
    customer_discount_rate: 5,
    commission_basis: "eligible_subtotal",
    email: "",
    phone: "",
    instagram_handle: "",
    notes: "",
    start_date: "",
    end_date: "",
    approved_products: [],
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    commission_rate: 10,
    customer_discount_rate: 5,
    commission_basis: "eligible_subtotal",
    email: "",
    phone: "",
    instagram_handle: "",
    notes: "",
    start_date: "",
    end_date: "",
    approved_products: [],
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    payment_method: "Bank Transfer",
    reference_id: "",
    notes: "",
  });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const getToken = () =>
    localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

  // ── Fetch Collaborations ───────────────────────────────────────────────────
  const fetchCollaborations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to load collaborations");
      }
      const data = await res.json();
      setCollaborations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (productsList.length > 0) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/products-picker`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProductsList(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
    finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  // ── Copy Helper ────────────────────────────────────────────────────────────
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ── Quick Summary Calculations ─────────────────────────────────────────────
  const totalClicks = collaborations.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalOrders = collaborations.reduce((acc, c) => acc + (c.attributed_orders || 0), 0);
  const totalSales = collaborations.reduce((acc, c) => acc + (c.eligible_sales || 0), 0);
  const totalEarned = collaborations.reduce((acc, c) => acc + (c.commission_earned || 0), 0);
  const totalPaid = collaborations.reduce((acc, c) => acc + (c.commission_paid || 0), 0);
  const totalLiability = collaborations.reduce((acc, c) => acc + (c.outstanding_liability || 0), 0);

  // ── Filtered Collaborations ────────────────────────────────────────────────
  const filteredCollabs = collaborations.filter((c) => {
    const matchSearch =
      searchTerm === "" ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.referral_code && c.referral_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.instagram_handle && c.instagram_handle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      statusFilter === "all" || (c.status && c.status.toLowerCase() === statusFilter.toLowerCase());

    return matchSearch && matchStatus;
  });

  // ── Create Collaboration ───────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        referral_code: createForm.referral_code.trim().toUpperCase(),
        commission_rate: parseFloat(createForm.commission_rate) || 10,
        customer_discount_rate: parseFloat(createForm.customer_discount_rate) || 0,
        commission_basis: createForm.commission_basis,
        email: createForm.email ? createForm.email.trim() : null,
        phone: createForm.phone ? createForm.phone.trim() : null,
        instagram_handle: createForm.instagram_handle ? createForm.instagram_handle.trim() : null,
        notes: createForm.notes ? createForm.notes.trim() : null,
        start_date: createForm.start_date ? new Date(createForm.start_date).toISOString() : null,
        end_date: createForm.end_date ? new Date(createForm.end_date).toISOString() : null,
        approved_products:
          createForm.approved_products.length > 0 ? createForm.approved_products : null,
      };

      const res = await fetch(`${API_BASE_URL}/collab/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create collaboration");
      }

      const created = await res.json();
      setShowCreateModal(false);

      // Show tokens modal with clear copy buttons
      const refUrl = `${FRONTEND_ORIGIN}/?ref=${created.referral_code}`;
      const dashUrl = `${FRONTEND_ORIGIN}/collab/${created.raw_dashboard_token}`;

      setNewlyCreatedLinks({
        creatorName: created.name,
        referralCode: created.referral_code,
        referralUrl: refUrl,
        dashboardUrl: dashUrl,
      });
      setShowTokensModal(true);

      // Reset form
      setCreateForm({
        name: "",
        referral_code: "",
        commission_rate: 10,
        customer_discount_rate: 5,
        commission_basis: "eligible_subtotal",
        email: "",
        phone: "",
        instagram_handle: "",
        notes: "",
        start_date: "",
        end_date: "",
        approved_products: [],
      });

      fetchCollaborations();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ── Open Detail Drilldown ──────────────────────────────────────────────────
  const openDetailModal = async (creatorId) => {
    setSelectedCreatorId(creatorId);
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailTab("orders");
    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/${creatorId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();
      setDetailData(data);
    } catch (e) {
      alert(e.message);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────
  const openEditModal = (creator) => {
    setSelectedCreatorId(creator.id);
    setEditForm({
      name: creator.name || "",
      commission_rate: creator.commission_rate ?? 10,
      customer_discount_rate: creator.customer_discount_rate ?? 5,
      commission_basis: creator.commission_basis || "eligible_subtotal",
      email: creator.email || "",
      phone: creator.phone || "",
      instagram_handle: creator.instagram_handle || "",
      notes: creator.notes || "",
      start_date: creator.start_date ? creator.start_date.substring(0, 10) : "",
      end_date: creator.end_date ? creator.end_date.substring(0, 10) : "",
      approved_products: creator.approved_products || [],
    });
    fetchProducts();
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        commission_rate: parseFloat(editForm.commission_rate) || 10,
        customer_discount_rate: parseFloat(editForm.customer_discount_rate) || 0,
        commission_basis: editForm.commission_basis,
        email: editForm.email ? editForm.email.trim() : null,
        phone: editForm.phone ? editForm.phone.trim() : null,
        instagram_handle: editForm.instagram_handle ? editForm.instagram_handle.trim() : null,
        notes: editForm.notes ? editForm.notes.trim() : null,
        start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : null,
        end_date: editForm.end_date ? new Date(editForm.end_date).toISOString() : null,
        approved_products:
          editForm.approved_products.length > 0 ? editForm.approved_products : null,
      };

      const res = await fetch(`${API_BASE_URL}/collab/admin/${selectedCreatorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to update collaboration");
      }

      setShowEditModal(false);
      fetchCollaborations();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete Collaboration Handler ───────────────────────────────────────────
  const handleDeleteCreator = async (creatorId, creatorName) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete collaboration "${creatorName}"?\n\nThis will remove their referral link, dashboard access, and all associated history. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/${creatorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to delete collaboration");
      }

      setShowDetailModal(false);
      fetchCollaborations();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ── Status Change Handler ──────────────────────────────────────────────────
  const handleStatusChange = async (creatorId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this collaboration as ${newStatus}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/${creatorId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Status update failed");
      }
      fetchCollaborations();
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Regenerate Token Handler ───────────────────────────────────────────────
  const handleRegenerateToken = async (creatorId, creatorName, refCode) => {
    if (
      !window.confirm(
        "Are you sure you want to regenerate the private dashboard link? The previous link will stop working immediately."
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/${creatorId}/regenerate-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error("Failed to regenerate token");
      const data = await res.json();

      const refUrl = `${FRONTEND_ORIGIN}/?ref=${refCode}`;
      const dashUrl = `${FRONTEND_ORIGIN}/collab/${data.raw_token}`;

      setNewlyCreatedLinks({
        creatorName: creatorName,
        referralCode: refCode,
        referralUrl: refUrl,
        dashboardUrl: dashUrl,
      });
      setShowTokensModal(true);
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Record Payout ──────────────────────────────────────────────────────────
  const openPayoutModal = (creator) => {
    setSelectedCreatorId(creator.id);
    setPayoutForm({
      amount: creator.outstanding_liability > 0 ? creator.outstanding_liability : "",
      payment_method: "Bank Transfer",
      reference_id: "",
      notes: "",
    });
    setShowPayoutModal(true);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    try {
      const payload = {
        creator_id: selectedCreatorId,
        amount: parseFloat(payoutForm.amount),
        payment_method: payoutForm.payment_method,
        reference_id: payoutForm.reference_id ? payoutForm.reference_id.trim() : null,
        notes: payoutForm.notes ? payoutForm.notes.trim() : null,
      };

      const res = await fetch(`${API_BASE_URL}/collab/admin/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to record payout");
      }

      setShowPayoutModal(false);
      fetchCollaborations();
      if (showDetailModal && selectedCreatorId) {
        openDetailModal(selectedCreatorId);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // ── Export CSV Handler ─────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collab/admin/reports/export-csv`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nari_pehnawa_influencers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Error exporting CSV: " + e.message);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    }
    if (s === "paused") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <PauseCircle className="w-3 h-3 text-amber-500" />
          Paused
        </span>
      );
    }
    if (s === "expired") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <Clock className="w-3 h-3 text-gray-500" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <Ban className="w-3 h-3 text-red-500" />
        Revoked
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Influencer Collaborations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-[#0891b2]">
              Referral Engine
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage creator partnerships, 10% referral links, attribution analytics, and verified payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={() => {
              fetchProducts();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-md shadow-[#0891b2]/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Collaboration
          </button>
        </div>
      </div>

      {/* ── KPI Overview Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Creators</span>
            <Users className="w-4 h-4 text-[#0891b2]" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{collaborations.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Active partnerships</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Clicks</span>
            <MousePointer className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Total referral visits</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
          <p className="text-[11px] text-gray-400 mt-1">Attributed purchases</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Eligible product subtotal</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Earned</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalEarned.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Calculated commissions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unpaid</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">₹{totalLiability.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Pending payout liability</p>
        </div>
      </div>

      {/* ── Search and Filter Toolbar ───────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search creator, code, handle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891b2]/20 focus:border-[#0891b2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891b2]/20 text-gray-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>

          <button
            onClick={fetchCollaborations}
            title="Refresh list"
            className="p-2 border border-gray-200 rounded-xl hover:bg-slate-50 text-gray-500 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Main Collaborations Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#0891b2] animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading influencer collaborations...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchCollaborations}
              className="mt-3 text-xs text-[#0891b2] underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredCollabs.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-800">No collaborations found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
              Create your first creator partnership to generate customer referral links and private performance dashboards.
            </p>
            <button
              onClick={() => {
                fetchProducts();
                setShowCreateModal(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0891b2] hover:bg-[#0e7490] transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Creator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Creator</th>
                  <th className="py-3.5 px-4">Referral Link</th>
                  <th className="py-3.5 px-4">Rates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Traffic</th>
                  <th className="py-3.5 px-4 text-right">Sales / Earned</th>
                  <th className="py-3.5 px-4 text-right">Due Liability</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCollabs.map((c) => {
                  const refUrl = `${FRONTEND_ORIGIN}/?ref=${c.referral_code}`;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      {/* Creator Profile */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          {c.instagram_handle && (
                            <span className="flex items-center gap-1 text-pink-600 font-medium">
                              <Instagram className="w-3 h-3" />
                              @{c.instagram_handle.replace("@", "")}
                            </span>
                          )}
                          {c.phone && <span>{c.phone}</span>}
                        </div>
                      </td>

                      {/* Referral Link & Quick Copy */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono font-bold text-xs text-[#0891b2]">
                            {c.referral_code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(refUrl, `ref_${c.id}`)}
                            title="Copy customer referral link"
                            className="p-1 hover:bg-white rounded transition text-gray-500"
                          >
                            {copiedKey === `ref_${c.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Rates (Commission + Follower Discount) */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">Comm: {c.commission_rate}%</div>
                        <div className="text-[11px] text-pink-600 font-semibold">
                          Follower Disc: {c.customer_discount_rate ?? 0}%
                        </div>
                        <div className="text-[10px] text-gray-400 capitalize">
                          {c.commission_basis === "eligible_subtotal" ? "Subtotal" : "Order Value"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                      {/* Traffic */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-gray-800">{c.clicks || 0} clicks</div>
                        <div className="text-[11px] text-gray-400">
                          {c.unique_visitors || 0} unique
                        </div>
                      </td>

                      {/* Sales & Commission */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-emerald-700">
                          ₹{(c.eligible_sales || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-amber-600 font-medium">
                          Comm: ₹{(c.commission_earned || 0).toLocaleString()} ({c.attributed_orders || 0} orders)
                        </div>
                      </td>

                      {/* Due Liability */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-bold ${
                            c.outstanding_liability > 0 ? "text-rose-600" : "text-gray-400"
                          }`}
                        >
                          ₹{(c.outstanding_liability || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Paid: ₹{(c.commission_paid || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetailModal(c.id)}
                            title="View Full Details & Orders"
                            className="p-1.5 rounded-lg text-[#0891b2] hover:bg-cyan-50 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPayoutModal(c)}
                            title="Record Payout"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRegenerateToken(c.id, c.name, c.referral_code)}
                            title="Regenerate & View Creator Dashboard Link"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Settings"
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-slate-100 transition"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>

                          {/* Quick Status toggle */}
                          {c.status === "active" ? (
                            <button
                              onClick={() => handleStatusChange(c.id, "paused")}
                              title="Pause Collaboration"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(c.id, "active")}
                              title="Resume Collaboration"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Creator */}
                          <button
                            onClick={() => handleDeleteCreator(c.id, c.name)}
                            title="Delete Collaboration"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ── Modal: Create Creator Collaboration ─────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#0891b2]" />
              <h2 className="text-xl font-bold text-gray-900">Create Creator Collaboration</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Generates a verified customer referral link and an isolated private creator dashboard link.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Creator Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashish Sharma"
                  value={createForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCreateForm((prev) => ({
                      ...prev,
                      name,
                      // Auto suggest code if not set
                      referral_code:
                        prev.referral_code === ""
                          ? name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8) + "10"
                          : prev.referral_code,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0891b2]/20 focus:border-[#0891b2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Unique Referral Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KASHISH10"
                    value={createForm.referral_code}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        referral_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                      })
                    }
                    className="w-full font-mono uppercase px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0891b2]/20 focus:border-[#0891b2] outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block truncate">
                    ?ref={createForm.referral_code || "CODE"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Creator Comm (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={createForm.commission_rate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, commission_rate: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0891b2]/20 focus:border-[#0891b2] outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-bold text-gray-400">
                      %
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Creator earnings</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-700 uppercase mb-1">
                    Follower Disc (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={createForm.customer_discount_rate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, customer_discount_rate: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-pink-50/40 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-bold text-pink-700"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-bold text-pink-400">
                      %
                    </span>
                  </div>
                  <span className="text-[11px] text-pink-600 font-medium mt-0.5 block">Customer discount</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Commission Calculation Basis
                </label>
                <select
                  value={createForm.commission_basis}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, commission_basis: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0891b2]/20 focus:border-[#0891b2] outline-none"
                >
                  <option value="eligible_subtotal">
                    Eligible product subtotal after discounts (excludes shipping & tax)
                  </option>
                  <option value="order_total">
                    Full order total amount
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@kashish_official"
                    value={createForm.instagram_handle}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, instagram_handle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="creator@gmail.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Product eligibility */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Product Eligibility ({createForm.approved_products.length === 0 ? "All Products Approved" : `${createForm.approved_products.length} Products Selected`})
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600 max-h-36 overflow-y-auto space-y-1">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-gray-200">
                    <span className="font-semibold">Selective Product Restriction</span>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, approved_products: [] })}
                      className="text-[11px] text-[#0891b2] font-semibold hover:underline"
                    >
                      Clear (Allow All)
                    </button>
                  </div>
                  {productsList.slice(0, 30).map((p) => {
                    const isSelected = createForm.approved_products.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                approved_products: [...createForm.approved_products, p.id],
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                approved_products: createForm.approved_products.filter(
                                  (id) => id !== p.id
                                ),
                              });
                            }
                          }}
                          className="rounded text-[#0891b2] focus:ring-[#0891b2]"
                        />
                        <span className="truncate">{p.name} (₹{p.price})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Diwali campaign promo partner, 1 reel + 2 stories agreed."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-md transition disabled:opacity-50"
                >
                  {createSubmitting ? "Generating..." : "Generate Links & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Two Separate Links Generated (Success Display) ────────── */}
      {showTokensModal && newlyCreatedLinks && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#0891b2]/30">
            <button
              onClick={() => setShowTokensModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Links Ready for {newlyCreatedLinks.creatorName}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Every collaboration has two distinct, isolated links: one for customers and one private link for the creator.
              </p>
            </div>

            <div className="space-y-4">
              {/* Link A: Customer Referral Link */}
              <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#0891b2] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    1. Customer Referral Link
                  </span>
                  <span className="text-[11px] text-gray-500">For Followers / Bio</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={newlyCreatedLinks.referralUrl}
                    className="w-full text-xs font-mono bg-white px-3 py-2 rounded-lg border border-cyan-300 text-gray-800 select-all"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(newlyCreatedLinks.referralUrl, "modal_ref")
                    }
                    className="px-3 py-2 bg-[#0891b2] text-white rounded-lg text-xs font-semibold hover:bg-[#0e7490] flex items-center gap-1 transition"
                  >
                    {copiedKey === "modal_ref" ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Followers who click this link receive a 30-day attribution token for purchases.
                </p>
              </div>

              {/* Link B: Private Creator Dashboard Link */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    2. Private Creator Dashboard Link
                  </span>
                  <span className="text-[11px] text-purple-600 font-semibold">No Login Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={newlyCreatedLinks.dashboardUrl}
                    className="w-full text-xs font-mono bg-white px-3 py-2 rounded-lg border border-purple-300 text-gray-800 select-all"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(newlyCreatedLinks.dashboardUrl, "modal_dash")
                    }
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 flex items-center gap-1 transition"
                  >
                    {copiedKey === "modal_dash" ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                  <span>Zero customer PII exposed. Unguessable token hash.</span>
                  <a
                    href={newlyCreatedLinks.dashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Preview <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTokensModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Creator Detailed Drilldown ───────────────────────────────── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 text-[#0891b2] animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading creator details & orders...</p>
              </div>
            ) : detailData ? (
              <>
                {/* Header Profile */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {detailData.creator?.name}
                        </h2>
                        {getStatusBadge(detailData.creator?.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[#0891b2] font-semibold">
                          Code: {detailData.creator?.referral_code}
                        </span>
                        <span className="font-medium text-gray-700">
                          Comm Rate: {detailData.creator?.commission_rate}%
                        </span>
                        <span className="font-semibold text-pink-600">
                          Follower Disc: {detailData.creator?.customer_discount_rate || 0}%
                        </span>
                        {detailData.creator?.instagram_handle && (
                          <span className="text-pink-600 font-medium">
                            @{detailData.creator.instagram_handle.replace("@", "")}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPayoutModal(detailData.creator)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Record Payout
                      </button>
                      <button
                        onClick={() => handleDeleteCreator(detailData.creator?.id, detailData.creator?.name)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase">Clicks</span>
                      <span className="text-base font-bold text-gray-800">
                        {detailData.summary?.total_clicks || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase">Attributed Orders</span>
                      <span className="text-base font-bold text-gray-800">
                        {detailData.summary?.attributed_orders || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase">Total Earned</span>
                      <span className="text-base font-bold text-amber-600">
                        ₹{(detailData.summary?.commission_earned || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase">Unpaid Due</span>
                      <span className="text-base font-bold text-rose-600">
                        ₹{(detailData.summary?.outstanding_liability || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold mb-4">
                  <button
                    onClick={() => setDetailTab("orders")}
                    className={`pb-2 border-b-2 transition ${
                      detailTab === "orders"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Orders ({detailData.orders?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab("ledger")}
                    className={`pb-2 border-b-2 transition ${
                      detailTab === "ledger"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Commission Ledger ({detailData.ledger?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab("payouts")}
                    className={`pb-2 border-b-2 transition ${
                      detailTab === "payouts"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Payouts ({detailData.payouts?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab("audit")}
                    className={`pb-2 border-b-2 transition ${
                      detailTab === "audit"
                        ? "border-[#0891b2] text-[#0891b2]"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Audit Logs ({detailData.audit_logs?.length || 0})
                  </button>
                </div>

                {/* Tab Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto">
                  {/* ORDERS TAB */}
                  {detailTab === "orders" && (
                    <div>
                      {!detailData.orders || detailData.orders.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                          No attributed orders recorded yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Order / Date</th>
                              <th className="py-2.5 px-3">Customer Info</th>
                              <th className="py-2.5 px-3">Items Purchased</th>
                              <th className="py-2.5 px-3">Sale Value</th>
                              <th className="py-2.5 px-3">Commission</th>
                              <th className="py-2.5 px-3">Order Status</th>
                              <th className="py-2.5 px-3">Comm Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailData.orders.map((o) => (
                              <tr key={o.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-bold text-gray-800">
                                    {o.order_number || o.order_id}
                                  </div>
                                  <div className="text-[11px] text-gray-400">
                                    {new Date(o.attributed_at || o.created_at).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-gray-800">
                                    {o.customer_name || "Guest Customer"}
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    {o.customer_phone || o.customer_email || "—"}
                                  </div>
                                  {o.customer_city && (
                                    <div className="text-[10px] text-gray-400">
                                      📍 {o.customer_city}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 max-w-[200px]">
                                  {Array.isArray(o.items) && o.items.length > 0 ? (
                                    <div className="text-[11px] text-gray-700 space-y-0.5">
                                      {o.items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="truncate" title={item.product_name || item.name}>
                                          • {item.product_name || item.name} (x{item.quantity || 1})
                                        </div>
                                      ))}
                                      {o.items.length > 2 && (
                                        <div className="text-[10px] text-gray-400 font-medium">
                                          +{o.items.length - 2} more items
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-gray-800">
                                  ₹{o.eligible_base?.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-amber-600">
                                  ₹{o.commission_amount?.toLocaleString()} ({o.commission_rate}%)
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="capitalize px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                                    {o.order_status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-semibold">
                                  <span
                                    className={`capitalize px-2 py-0.5 rounded ${
                                      o.commission_status === "paid"
                                        ? "bg-purple-100 text-purple-700"
                                        : o.commission_status === "approved" ||
                                          o.commission_status === "payable"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : o.commission_status === "reversed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {o.commission_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* LEDGER TAB */}
                  {detailTab === "ledger" && (
                    <div>
                      {!detailData.ledger || detailData.ledger.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                          Ledger is clean with no historical movements yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Entry Type</th>
                              <th className="py-2.5 px-3">Order Ref</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailData.ledger.map((l) => (
                              <tr key={l.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-gray-500">
                                  {new Date(l.created_at).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-semibold uppercase">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] ${
                                      l.entry_type === "commission_earned"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : l.entry_type === "commission_reversed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {l.entry_type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-gray-600">
                                  {l.order_id || "—"}
                                </td>
                                <td
                                  className={`py-2.5 px-3 text-right font-bold ${
                                    l.amount < 0 ? "text-red-600" : "text-emerald-700"
                                  }`}
                                >
                                  {l.amount < 0 ? `-₹${Math.abs(l.amount)}` : `+₹${l.amount}`}
                                </td>
                                <td className="py-2.5 px-3 text-gray-600">{l.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* PAYOUTS TAB */}
                  {detailTab === "payouts" && (
                    <div>
                      {!detailData.payouts || detailData.payouts.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                          No payout transactions recorded for this creator yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Method</th>
                              <th className="py-2.5 px-3">Reference / UTR</th>
                              <th className="py-2.5 px-3">Recorded By</th>
                              <th className="py-2.5 px-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailData.payouts.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-gray-500">
                                  {new Date(p.created_at).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700">
                                  ₹{p.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-800">
                                  {p.payment_method}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-gray-600">
                                  {p.reference_id || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-gray-500">{p.recorded_by}</td>
                                <td className="py-2.5 px-3 text-gray-600">{p.notes || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* AUDIT LOGS TAB */}
                  {detailTab === "audit" && (
                    <div>
                      {!detailData.audit_logs || detailData.audit_logs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">
                          No configuration audits recorded yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Action</th>
                              <th className="py-2.5 px-3">Admin</th>
                              <th className="py-2.5 px-3">Details / Changes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailData.audit_logs.map((a) => (
                              <tr key={a.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-gray-500">
                                  {new Date(a.created_at).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-gray-800">
                                  {a.action}
                                </td>
                                <td className="py-2.5 px-3 text-gray-600">{a.admin_user}</td>
                                <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                                  {JSON.stringify(a.details || {})}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Modal: Record Payout ────────────────────────────────────────────── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Record Commission Payout</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Record verified bank transfer or UPI payment made to creator. This updates the ledger and lowers outstanding liability.
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Payout Amount (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 2500"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={payoutForm.payment_method}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, payment_method: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1289381928"
                  value={payoutForm.reference_id}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, reference_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Transferred for Diwali campaign sales."
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                >
                  {payoutSubmitting ? "Recording..." : "Confirm Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Collaboration ───────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Collaboration Settings</h2>
            <p className="text-xs text-gray-500 mb-5">
              Changes to commission percentage are logged to the audit ledger with timestamp and admin ID.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Creator Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Creator Commission Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={editForm.commission_rate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, commission_rate: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-bold text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-700 uppercase mb-1">
                    Follower Discount Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={editForm.customer_discount_rate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, customer_discount_rate: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-pink-50/40 border border-pink-200 rounded-xl outline-none font-bold text-pink-700"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-bold text-pink-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Commission Basis
                </label>
                <select
                  value={editForm.commission_basis}
                  onChange={(e) =>
                    setEditForm({ ...editForm, commission_basis: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option value="eligible_subtotal">Eligible subtotal (excl. shipping/tax)</option>
                  <option value="order_total">Full order total</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={editForm.instagram_handle}
                    onChange={(e) =>
                      setEditForm({ ...editForm, instagram_handle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows="2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0891b2] hover:bg-[#0e7490] shadow-md transition disabled:opacity-50"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaborations;
