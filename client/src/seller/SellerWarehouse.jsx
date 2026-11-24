import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Save,
  RefreshCw,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const SellerWarehouse = () => {
  const { seller } = useSellerAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [warehouseData, setWarehouseData] = useState({
    pickup_location: "",
    warehouse_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    address_line1: "",
    address_2: "",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
    country: "India",
    is_synced_shiprocket: false,
    linked_products_count: 0,
    shiprocket_synced_at: null,
  });

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await sellerApi.getWarehouse();
      if (res && res.warehouse) {
        const wh = res.warehouse;
        setWarehouseData({
          pickup_location: res.pickup_location || wh.pickup_location || "",
          warehouse_name: wh.warehouse_name || `${seller?.shop_name || "Merchant"} Warehouse`,
          contact_name: wh.contact_name || seller?.name || "",
          contact_phone: wh.contact_phone || seller?.phone || "",
          contact_email: wh.contact_email || seller?.email || "",
          address_line1: wh.address_line1 || seller?.address || "",
          address_2: wh.address_2 || "",
          city: wh.city || seller?.city || "",
          state: wh.state || seller?.state || "Uttar Pradesh",
          pincode: wh.pincode || seller?.pincode || "",
          country: wh.country || "India",
          is_synced_shiprocket: Boolean(wh.is_synced_shiprocket),
          linked_products_count: res.linked_products_count || 0,
          shiprocket_synced_at: wh.shiprocket_synced_at || null,
        });
      }
    } catch (err) {
      console.error("Failed to load warehouse:", err);
      setError(err.message || "Failed to load warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouse();
  }, [seller]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWarehouseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!warehouseData.address_line1.trim()) {
      setError("Address Line 1 is required.");
      return;
    }
    if (!warehouseData.city.trim()) {
      setError("City is required.");
      return;
    }
    if (!warehouseData.pincode.trim() || warehouseData.pincode.trim().length !== 6) {
      setError("Please enter a valid 6-digit postal pincode.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const payload = {
        warehouse_name: warehouseData.warehouse_name.trim(),
        contact_name: warehouseData.contact_name.trim(),
        contact_phone: warehouseData.contact_phone.trim(),
        contact_email: warehouseData.contact_email.trim(),
        address_line1: warehouseData.address_line1.trim(),
        address_2: warehouseData.address_2.trim(),
        city: warehouseData.city.trim(),
        state: warehouseData.state,
        pincode: warehouseData.pincode.trim(),
        country: warehouseData.country || "India",
      };

      const res = await sellerApi.updateWarehouse(payload);
      setSuccess(
        `Warehouse address saved! All ${res.linked_products_count || warehouseData.linked_products_count} catalog products have been linked to this pickup address.`
      );
      if (res.warehouse) {
        setWarehouseData((prev) => ({
          ...prev,
          ...res.warehouse,
          pickup_location: res.pickup_location || res.warehouse.pickup_location || prev.pickup_location,
          is_synced_shiprocket: Boolean(res.warehouse.is_synced_shiprocket),
          linked_products_count: res.linked_products_count,
        }));
      }
    } catch (err) {
      console.error("Save warehouse error:", err);
      setError(err.message || "Failed to update warehouse details.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncShiprocket = async () => {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");
      const res = await sellerApi.syncShiprocketWarehouse();
      if (res.success) {
        setSuccess(`Shiprocket pickup location '${res.pickup_location}' verified and synchronized successfully!`);
        setWarehouseData((prev) => ({
          ...prev,
          is_synced_shiprocket: true,
          shiprocket_synced_at: new Date().toISOString(),
        }));
      } else {
        setError(res.message || res.detail || "Failed to synchronize with Shiprocket.");
      }
    } catch (err) {
      console.error("Sync Shiprocket error:", err);
      setError(err.message || "Failed to connect to Shiprocket API.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-9 h-9 border-3 border-[#0891b2] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Loading Warehouse & Logistics Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[#0891b2] border border-cyan-100 flex-shrink-0">
            <Building2 className="w-6 h-6 text-[#0891b2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Warehouse & Pickup Location
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your dedicated shipping warehouse for courier pickups and automated fulfillment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncShiprocket}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-300 disabled:opacity-50 cursor-pointer"
            title="Sync pickup location with Shiprocket Logistics Engine"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#0891b2]" : "text-slate-600"}`} />
            <span>{syncing ? "Syncing..." : "Sync Shiprocket"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pickup Code Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Shiprocket Location ID
          </div>
          <div className="text-base font-mono font-extrabold text-[#0891b2] truncate" title={warehouseData.pickup_location}>
            {warehouseData.pickup_location || "Auto Generated"}
          </div>
          <div className="text-[11px] text-slate-500">
            Printed on courier dispatch manifests
          </div>
        </div>

        {/* Sync Status Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Logistics Verification
          </div>
          <div className="flex items-center gap-2">
            {warehouseData.is_synced_shiprocket ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Synchronized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                Pending Verification
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {warehouseData.shiprocket_synced_at
              ? `Last synced: ${new Date(warehouseData.shiprocket_synced_at).toLocaleDateString()}`
              : "Auto-synced during first order fulfillment"}
          </div>
        </div>

        {/* Linked Catalog Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Assigned Catalog Products
          </div>
          <div className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <span>{warehouseData.linked_products_count} Items</span>
          </div>
          <div className="text-[11px] text-slate-500">
            All your products dispatch from this address
          </div>
        </div>
      </div>

      {/* Main Address Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Warehouse & Dispatch Facility Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Couriers will arrive at this physical address for parcel pickup when orders are confirmed.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Facility Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Warehouse / Facility Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="warehouse_name"
                  value={warehouseData.warehouse_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Royal Silks Central Warehouse"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Person Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="contact_name"
                  value={warehouseData.contact_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Contact Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dispatch Coordinator Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="contact_phone"
                  value={warehouseData.contact_phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number for pickup driver"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Facility Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="contact_email"
                  value={warehouseData.contact_email}
                  onChange={handleChange}
                  placeholder="contact@store.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Complete Street Address (Building / Floor / Plot / Street) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                name="address_line1"
                rows="2"
                value={warehouseData.address_line1}
                onChange={handleChange}
                required
                placeholder="e.g. Plot No. 42, Industrial Area, Near City Transport Hub"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Landmark / Area / Suite (Optional)
            </label>
            <input
              type="text"
              name="address_2"
              value={warehouseData.address_2}
              onChange={handleChange}
              placeholder="e.g. Behind State Bank, Phase 2"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City / District *
              </label>
              <input
                type="text"
                name="city"
                value={warehouseData.city}
                onChange={handleChange}
                required
                placeholder="e.g. Sultanpur"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                State *
              </label>
              <select
                name="state"
                value={warehouseData.state}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white cursor-pointer"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                6-Digit Postal Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={warehouseData.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setWarehouseData((prev) => ({ ...prev, pincode: val }));
                }}
                required
                maxLength={6}
                placeholder="e.g. 228151"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#0891b2] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0891b2] flex-shrink-0" />
            <span>Updating this address updates pickup routing for all products published by your shop.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Saving Details..." : "Save Warehouse Address"}</span>
          </button>
        </div>
      </form>

      {/* Logistics & Automated Routing Guide */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0891b2]" />
          <span>How Multi-Seller Courier Pickup Works</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Nari Pehnawa operates a fully automated multi-seller logistics network integrated with top national courier partners including Delhivery, Blue Dart, Shadowfax, and Xpressbees. When a customer places an order containing one of your products, our shipping system automatically assigns your designated warehouse pickup address. The courier driver will arrive directly at this address to collect the packaged parcel with the generated AWB shipping label.
        </p>
      </div>
    </div>
  );
};

export default SellerWarehouse;
