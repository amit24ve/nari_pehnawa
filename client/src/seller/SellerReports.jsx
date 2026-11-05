import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  Boxes,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import sellerApi from "./sellerApi";

const SellerReports = () => {
  const [downloadingType, setDownloadingType] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async (type, title) => {
    try {
      setDownloadingType(type);
      setError("");
      setSuccess("");
      await sellerApi.downloadReport(type);
      setSuccess(`${title} generated and downloaded successfully!`);
    } catch (err) {
      setError(err.message || `Failed to download ${title}`);
    } finally {
      setDownloadingType(null);
    }
  };

  const reports = [
    {
      id: "orders",
      title: "Orders & Fulfillment Report",
      desc: "Complete record of customer orders, item counts, order status, destination cities, and tracking AWB codes.",
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      fileType: "CSV Spreadsheet",
    },
    {
      id: "products",
      title: "Product Catalog Master",
      desc: "Comprehensive export of your listings including SKU, category, brand, customer prices, seller payouts, and stock levels.",
      icon: Package,
      color: "text-[#0891b2] bg-cyan-50 border-cyan-200",
      buttonColor: "bg-[#0891b2] hover:bg-[#0e7490]",
      fileType: "CSV Spreadsheet",
    },
    {
      id: "inventory",
      title: "Inventory Audit Ledger",
      desc: "Chronological log of stock level updates, manual quantity adjustments, delta values, and audit reasons.",
      icon: Boxes,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      fileType: "CSV Spreadsheet",
    },
    {
      id: "settlements",
      title: "Settlement & Commission Statement",
      desc: "Authoritative financial ledger detailing gross sales, 10% marketplace commission, courier fees, and net payouts for accounting.",
      icon: IndianRupee,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      fileType: "CSV Spreadsheet",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#0891b2]" />
          <span>Reports & Data Exports</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Download raw business data in standardized CSV format for tax accounting (GSTR-1), inventory planning, and order reconciliation
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => {
          const Icon = rep.icon;
          const isDownloading = downloadingType === rep.id;
          return (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${rep.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {rep.fileType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{rep.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {rep.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Real-time Database Export
                </span>
                <button
                  disabled={isDownloading}
                  onClick={() => handleDownload(rep.id, rep.title)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 ${rep.buttonColor}`}
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-800 mb-1">
          Compliance & Data Security Assurance:
        </p>
        <p className="leading-relaxed">
          All CSV exports are generated dynamically with real-time permissions strictly restricted to your vendor account (<code>seller_id</code>). Sensitive platform configuration and third-party customer payment credentials are never exposed in vendor exports.
        </p>
      </div>
    </div>
  );
};

export default SellerReports;

