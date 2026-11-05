import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Clock,
  History,
  Edit,
  Save,
} from "lucide-react";
import sellerApi from "./sellerApi";

const SellerInventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "all";

  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [newStockInput, setNewStockInput] = useState("");
  const [adjustReason, setAdjustReason] = useState("Restocked from manufacturing unit");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await sellerApi.getInventory({
        status: currentTab === "ledger" ? undefined : currentTab,
        search: searchQuery.trim(),
        limit: 50,
      });
      setProducts(res.products || []);
      setTotal(res.total || 0);
      setLogs(res.logs || []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [currentTab]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      setActionLoading(true);
      const qty = parseInt(newStockInput, 10);
      if (isNaN(qty) || qty < 0) {
        alert("Please enter a valid stock quantity >= 0");
        return;
      }
      await sellerApi.adjustStock({
        product_id: adjustingProduct.id || adjustingProduct._id,
        new_stock: qty,
        reason: adjustReason.trim(),
      });
      showToast(`Stock updated to ${qty} units`);
      setAdjustingProduct(null);
      loadInventory();
    } catch (err) {
      alert("Failed to adjust stock: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const lowStockCount = products.filter((p) => (p.stock_quantity ?? p.stock ?? 0) > 0 && (p.stock_quantity ?? p.stock ?? 0) <= 5).length;
  const outOfStockCount = products.filter((p) => !p.in_stock || (p.stock_quantity ?? p.stock ?? 0) <= 0).length;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891b2]">
              Warehouse & Stock
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Live Inventory Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor real-time unit levels, receive low-stock alerts, and perform audited stock adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInventory}
            className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: "all", label: "All Items" },
          { id: "low", label: "Low Stock Alert", badge: lowStockCount || undefined },
          { id: "out_of_stock", label: "Out of Stock", badge: outOfStockCount || undefined },
          { id: "ledger", label: "Audit Ledger History" },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentTab !== "ledger" ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter products by garment name or category..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
            />
          </div>

          {/* Product Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-semibold">Loading stock inventory...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Inventory Items</h3>
                <p className="text-xs text-slate-500 mt-1">Upload products to manage inventory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Listing Price</th>
                      <th className="py-3 px-4">Stock Units</th>
                      <th className="py-3 px-4">Inventory Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {products.map((p) => {
                      const qty = intQty(p.stock_quantity ?? p.stock ?? 0);
                      const isLow = qty > 0 && qty <= 5;
                      const isOut = !p.in_stock || qty <= 0;
                      const img = p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || "/placeholder.png";

                      return (
                        <tr key={p.id || p._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={img}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                                onError={(e) => { e.target.src = "/placeholder.png"; }}
                              />
                              <div className="min-w-0 max-w-xs">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                                <p className="text-[11px] text-slate-500">SKU: {p.sku || `NP-${String(p.id || p._id).substring(18)}`}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {p.category}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{p.price}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {qty}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">units</span>
                          </td>

                          <td className="py-3 px-4">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3 text-red-600" /> Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock ({qty})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Available
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingProduct(p);
                                setNewStockInput(String(qty));
                                setAdjustReason("Restocked from manufacturing unit");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0891b2] hover:text-white text-slate-700 text-xs font-bold transition cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Stock Ledger History Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0891b2]" />
                <span>Inventory Audit Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">Historical stock adjustments and restock logs</p>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              No stock adjustment entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Old Stock</th>
                    <th className="py-3 px-4">New Stock</th>
                    <th className="py-3 px-4">Change (Delta)</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "Recent"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {l.product_name || `Product #${l.product_id?.substring(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 font-mono">{l.old_quantity}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.new_quantity}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={l.delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {l.delta >= 0 ? `+${l.delta}` : l.delta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">{l.reason || "Stock change"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Adjust Stock: {adjustingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Available Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                >
                  <option value="Restocked from manufacturing unit">Restocked from manufacturing unit</option>
                  <option value="Damaged garments removed">Damaged garments removed</option>
                  <option value="Physical count audit reconciliation">Physical count audit reconciliation</option>
                  <option value="Return received back into inventory">Return received back into inventory</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "Save Stock Adjustment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function intQty(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

export default SellerInventory;

