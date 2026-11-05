import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  TrendingUp,
  Percent,
  Truck,
  ArrowRight,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const SellerFinance = () => {
  const { seller } = useSellerAuth();
  const [finance, setFinance] = useState({
    gross_sales: 0,
    platform_commission: 0,
    logistics_deductions: 0,
    net_earnings: 0,
    available_balance: 0,
    pending_settlements: 0,
    kyc_verified: false,
    bank_account_configured: false,
    bank_name: "Not configured",
    account_number_masked: "••••",
    settlement_cycle: "T+7 Days Post Delivery",
  });
  const [loading, setLoading] = useState(true);

  const loadFinance = async () => {
    try {
      setLoading(true);
      const res = await sellerApi.getFinanceOverview();
      if (res) setFinance(res);
    } catch (err) {
      console.error("Failed to load finance overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const kycStatus = seller?.kyc_status || "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891b2]">
              Finance & Settlements
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Payout Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Earnings & Settlement Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent marketplace accounting, commissions, shipping deductions, and bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={loadFinance}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Refresh Finance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KYC Alert if not verified */}
      {kycStatus !== "approved" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Direct Bank Settlement Pending:</strong> Your KYC documents (Aadhaar & PAN) must be approved by admin to trigger automatic NEFT/IMPS payout settlements into your bank account.
            </span>
          </div>
          <Link
            to="/seller/profile"
            className="font-bold text-amber-900 underline hover:no-underline whitespace-nowrap ml-3"
          >
            Verify KYC →
          </Link>
        </div>
      )}

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{finance.gross_sales}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Customer listing value ordered</p>
        </div>

        {/* Platform Commission (10%) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Commission</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">-₹{finance.platform_commission}</h3>
          <p className="text-[11px] text-slate-500 mt-1">10% Nari Pehnawa fee</p>
        </div>

        {/* Available Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available for Payout</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{finance.available_balance}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Delivered orders (cleared)</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlement</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">₹{finance.pending_settlements}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{finance.settlement_cycle}</p>
        </div>
      </div>

      {/* Commission & Logistics Breakdown Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <Percent className="w-4 h-4 text-[#0891b2]" />
          <span>Marketplace Financial Accounting Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">1. Garment Selling Price</span>
            <p className="text-xs text-slate-500 mt-1">
              Set by seller on product add form. Includes dynamic delivery (+₹50), RTO buffer (+₹35), and NP polybag fee (+₹10).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">2. Standard Deductions</span>
            <p className="text-xs text-slate-500 mt-1">
              Platform commission (10%) and forward carrier shipping charges are deducted automatically upon successful delivery.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block">3. Settlement Cycle</span>
            <p className="text-xs text-slate-500 mt-1">
              Net seller payouts are settled within <strong>T+7 days</strong> following customer delivery confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Registered Payout Bank Account */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0891b2]" />
            <span>Registered Bank Account for Direct Settlements</span>
          </h3>
          <Link
            to="/seller/profile"
            className="text-xs font-bold text-[#0891b2] hover:underline"
          >
            Update Bank Details →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-400 font-semibold block">Bank Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{finance.bank_name || seller?.bank_name || "Not set"}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-400 font-semibold block">Account Number</span>
            <span className="font-bold text-slate-900 font-mono text-sm mt-0.5 block">
              {seller?.account_number ? `••••${seller.account_number.slice(-4)}` : "Not configured"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-400 font-semibold block">IFSC Code</span>
            <span className="font-bold text-slate-900 font-mono text-sm mt-0.5 block">{seller?.ifsc_code || "Not set"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerFinance;

