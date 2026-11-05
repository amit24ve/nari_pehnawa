import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
} from "lucide-react";
import sellerApi from "./sellerApi";

const SellerProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Tab filter: "all" | "live" | "out_of_stock" | "draft"
  const currentTab = searchParams.get("tab") || "all";

  // Quick edit stock & price modal
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [quickStock, setQuickStock] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [savingQuickEdit, setSavingQuickEdit] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 15;

  // Delete modal
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        limit,
        skip: (page - 1) * limit,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (currentTab === "live") params.is_active = true;
      if (currentTab === "draft") params.is_active = false;

      const [res, cats] = await Promise.all([
        sellerApi.getProducts(params),
        sellerApi.getCategories().catch(() => []),
      ]);

      let prods = res.products || [];
      if (currentTab === "pending") {
        prods = prods.filter((p) => p.approval_status === "pending" || !p.is_approved);
      } else if (currentTab === "live") {
        prods = prods.filter((p) => (p.approval_status === "approved" || p.is_approved) && p.is_active);
      } else if (currentTab === "out_of_stock") {
        prods = prods.filter((p) => (p.stock || 0) <= 0);
      }

      setProducts(prods);
      setTotal(res.total || 0);
      setCategories(cats || []);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, currentTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenQuickEdit = (p) => {
    setQuickEditProduct(p);
    setQuickStock(String(p.stock || 0));
    setQuickPrice(String(p.price || 0));
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    try {
      setSavingQuickEdit(true);
      const newStock = parseInt(quickStock, 10);
      const newPrice = parseFloat(quickPrice);
      if (isNaN(newStock) || newStock < 0) {
        alert("Please enter a valid stock quantity");
        return;
      }
      if (isNaN(newPrice) || newPrice < 0) {
        alert("Please enter a valid price");
        return;
      }

      await sellerApi.updateProduct(quickEditProduct.id, {
        stock: newStock,
        price: newPrice,
      });

      // Also adjust inventory log if stock changed
      if (newStock !== (quickEditProduct.stock || 0)) {
        sellerApi.adjustStock({
          product_id: quickEditProduct.id,
          new_quantity: newStock,
          reason: "Quick catalog update",
        }).catch(() => {});
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === quickEditProduct.id
            ? { ...p, stock: newStock, price: newPrice }
            : p
        )
      );
      setQuickEditProduct(null);
    } catch (err) {
      alert("Failed to update product: " + err.message);
    } finally {
      setSavingQuickEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await sellerApi.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      loadData();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await sellerApi.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your ethnic collections, stock levels, and store visibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Catalog Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: "all", label: "All Catalog" },
          { key: "live", label: "Live On Store" },
          { key: "pending", label: "Pending Admin Approval" },
          { key: "out_of_stock", label: "Out of Stock" },
          { key: "draft", label: "Drafts & Inactive" },
        ].map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSearchParams({ tab: tab.key });
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0891b2] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name, fabric, or brand..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-[#0891b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading your store catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== "all"
                ? "Try clearing filters to see all products."
                : "You haven't listed any products yet. Click 'Add New Product' to get started."}
            </p>
            <Link
              to="/seller/products/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0891b2] text-white text-xs font-bold hover:bg-[#0e7490] transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Brand & Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => {
                  const img = (p.images && p.images[0]) || p.image_url || "/placeholder.png";
                  const totalStock = p.stock || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-slate-900 block truncate">
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-400 block truncate">
                              ID: {p.id?.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {p.brand || "Seller Brand"}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {p.category || "General"}
                          </span>
                        </div>
                      </td>

                      {/* Price & Marketplace Payout Breakdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            ₹{p.price} <span className="text-[10px] text-slate-400 font-normal">(Customer Price)</span>
                          </span>
                          {p.seller_price ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Your Payout: ₹{p.seller_price}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Your Payout: ₹{Math.max(0, p.price - 95)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block">
                            (+₹{p.delivery_charge || 50} Ship | +₹{p.rto_charge || 35} RTO | +₹{p.handling_fee || 10} Polybag)
                          </span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            totalStock > 0
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} units` : "Out of Stock"}
                        </span>
                      </td>

                      {/* Verification & Live Status */}
                      <td className="py-3 px-4">
                        {p.approval_status === "rejected" ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200"
                            title={p.approval_remarks || "Rejected during admin quality check"}
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span>Rejected</span>
                          </span>
                        ) : p.approval_status === "pending" || !p.is_approved ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                            title="Admin verifies new listings within 24-48 business hours"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Under Admin Review</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                              p.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                            title="Click to toggle store visibility"
                          >
                            {p.is_active ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved (Live)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Hidden</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickEdit(p)}
                            className="p-1.5 text-slate-600 hover:text-[#0891b2] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Quick update stock & price"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <a
                            href={`/product/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="View on store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Link
                            to={`/seller/products/new?edit=${p.id}`}
                            className="p-1.5 text-[#0891b2] hover:bg-cyan-50 rounded-lg transition"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete product"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} products
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Edit Stock & Price Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Quick Update Product</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {quickEditProduct.name}
            </p>

            <form onSubmit={handleSaveQuickEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Stock (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quickStock}
                  onChange={(e) => setQuickStock(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickEdit}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {savingQuickEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? This will remove the product from the Nari Pehnawa storefront.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;

