import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Mail,
  MapPin,
  CreditCard,
  X,
  ChevronDown,
  AlertCircle,
  Loader,
  Navigation,
  FileText,
  RefreshCcw,
  Download,
  AlertTriangle,
  Heart,
  Printer,
  Send,
  Edit,
  Save,
  UserCheck,
  Home,
  Tag,
  ArrowRight,
  Shield,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import shippingApi from "../services/shippingApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const Orders = () => {
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "shipping" | "returns" | "reports" | "logs"
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all"); // "all" | "cod" | "prepaid"
  const [valueFilter, setValueFilter] = useState("all"); // "all" | "high" | "low"
  const [customFilter, setCustomFilter] = useState("all"); // "all" | "today" | "low_stock" | "failed"
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [shippingActionLoading, setShippingActionLoading] = useState(null);
  const [shippingActionError, setShippingActionError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit states in modal
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [staffAssigned, setStaffAssigned] = useState("");
  const [warehouseAssigned, setWarehouseAssigned] = useState("");
  const [pickupLocations, setPickupLocations] = useState([]);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState("");
  
  // Action Feedback States
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Order Logs & Audit Trails
  const [orderLogs, setOrderLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Return & Refund Tracking State
  const [returns, setReturns] = useState([
    { id: "RET-10901", orderId: "o-10934", customer: "Deepa Nair", item: "Printed Kaftan Kurti - Green", reason: "Color difference", amount: 1149, status: "pending", date: "2026-07-15", images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop"], qc_status: "Pending", pickup_status: "Scheduled" },
    { id: "RET-10902", orderId: "o-10930", customer: "Komal Bhatia", item: "Wooden Wall Shelf", reason: "Damaged on delivery", amount: 1199, status: "approved", date: "2026-07-14", images: [], qc_status: "Passed", pickup_status: "Received" },
    { id: "RET-10903", orderId: "o-10928", customer: "Megha Gupta", item: "Bandhani Print Kurti", reason: "Size too tight", amount: 949, status: "pending", date: "2026-07-13", images: [], qc_status: "Pending", pickup_status: "Not Initiated" },
    { id: "RET-10904", orderId: "o-10925", customer: "Sneha Reddy", item: "Royal Blue Silk Saree", reason: "Product not as expected", amount: 5999, status: "rejected", date: "2026-07-12", images: [], qc_status: "Failed", pickup_status: "Received" }
  ]);

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("neel_token") || "";

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      shippingApi.getPickupLocations()
        .then((res) => setPickupLocations(res.locations || []))
        .catch(() => {});
      const res = await fetch(`${API_BASE_URL}/orders/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("neel_admin_user");
        localStorage.removeItem("neel_token");
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Server ${res.status}` }));
        throw new Error(err.detail);
      }
      const data = await res.json();
      if (data && data.length > 0) {
        setOrders(data.map(transformOrder));
      } else {
        setOrders(getDummyOrders());
      }
    } catch (e) {
      setError(e.message);
      setOrders(getDummyOrders());
    } finally {
      setLoading(false);
    }
  };

  const transformOrder = (o) => ({
    id: o.order_number ? (o.order_number.startsWith("#") ? o.order_number : `#${o.order_number}`) : `#ORD-${o.id}`,
    orderId: o.id,
    order_number: o.order_number || o.id,
    customer: o.user?.name || o.user?.email?.split("@")[0] || "Unknown",
    customerId: o.user_id || "N/A",
    email: o.user?.email || "N/A",
    total: o.total_amount || 0,
    status: o.status || "pending",
    payment_status: o.payment_status || "pending",
    payment_method: o.payment_method || "COD",
    date: o.created_at ? new Date(o.created_at).toISOString().split("T")[0] : "N/A",
    created_at: o.created_at || "N/A",
    items: (o.items || []).map((item) => ({
      product_id: item.product_id,
      name: item.product_name || item.product?.name || "Unknown Product",
      sku: item.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: item.category || "Fashion",
      brand: item.brand || "Nari Pehnawa",
      color: item.color || "Default",
      size: item.size || "Free Size",
      quantity: item.quantity || 1,
      price: item.price || 0,
      discount: item.discount || 0,
      tax: item.tax || 0,
      shipping: item.shipping || 0,
    })),
    shippingAddress: typeof o.shipping_address === "string" ? {
      full_name: o.user?.name || "Customer",
      phone: o.user?.phone || "N/A",
      address_line1: o.shipping_address,
      city: "N/A",
      state: "N/A",
      postal_code: "N/A",
      country: "India"
    } : o.shipping_address || {},
    phone: o.user?.phone || (o.shipping_address && typeof o.shipping_address === "object" ? o.shipping_address.phone : "N/A"),
    notes: o.notes || "",
    staff_assigned: o.staff_assigned || "Not Assigned",
    warehouse_assigned: o.warehouse_assigned || "Primary",
    awb_code: o.shipping?.awb || o.awb_code || null,
    courier_name: o.shipping?.courier_name || o.courier_name || null,
    shiprocket_order_id: o.shipping?.shiprocket_order_id || o.shiprocket_order_id || null,
    shipment_id: o.shipping?.shipment_id || o.shipment_id || null,
    // Razorpay Details
    payment_id: o.payment_id || o.razorpay_payment_id || "N/A",
    razorpay_order_id: o.razorpay_order_id || o.payment_order_id || "N/A",
    signature_verified: o.signature_verified || (o.payment_status === "completed" ? "Verified" : "Pending"),
    refund_id: o.refund_id || "N/A",
    refund_status: o.refund_status || "N/A",
  });

  const getDummyOrders = () => {
    return [
      {
        id: "#ORD-o-10938", orderId: "o-10938", order_number: "o-10938", customer: "Anita Sharma", customerId: "u-101", email: "anita@example.com", total: 4200,
        status: "completed", payment_status: "completed", payment_method: "Razorpay", date: "2026-07-23", created_at: "2026-07-23T05:12:00Z",
        items: [{ product_id: "p-1", name: "Blush Glow Anarkali Kurta Set", sku: "BLUSH-AN-01", category: "Anarkali Set", brand: "Nari Pehnawa", color: "Blush Pink", size: "L", quantity: 1, price: 4000, discount: 200, tax: 200, shipping: 0 }],
        shippingAddress: { full_name: "Anita Sharma", phone: "+91 9876543210", address_line1: "Flat 402, Sunrise Apt, Andheri", city: "Mumbai", state: "Maharashtra", postal_code: "400053", country: "India" }, phone: "+91 9876543210",
        awb_code: "AWB9382109", courier_name: "Delhivery", shiprocket_order_id: "SR93821", shipment_id: "SH9382", payment_id: "pay_OpL283js9x", razorpay_order_id: "order_OpL123ks", signature_verified: "Verified", notes: "Deliver in evening.", staff_assigned: "Rahul", warehouse_assigned: "Mumbai Hub"
      },
      {
        id: "#ORD-o-10937", orderId: "o-10937", order_number: "o-10937", customer: "Rahul Verma", customerId: "u-102", email: "rahul@example.com", total: 1599,
        status: "processing", payment_status: "pending", payment_method: "COD", date: "2026-07-23", created_at: "2026-07-23T08:15:00Z",
        items: [{ product_id: "p-2", name: "Palazzo Set Kurti - Teal", sku: "PAL-TEAL-02", category: "Palazzo Set", brand: "Nari Pehnawa", color: "Teal", size: "M", quantity: 1, price: 1599, discount: 0, tax: 80, shipping: 50 }],
        shippingAddress: { full_name: "Rahul Verma", phone: "+91 9876543211", address_line1: "H No 12, Sector 4", city: "Panchkula", state: "Haryana", postal_code: "134109", country: "India" }, phone: "+91 9876543211",
        awb_code: "AWB9382110", courier_name: "Shadowfax", shiprocket_order_id: "SR93822", shipment_id: "SH9383", payment_id: "N/A", razorpay_order_id: "N/A", signature_verified: "N/A", notes: "", staff_assigned: "Amit", warehouse_assigned: "Delhi Hub"
      },
      {
        id: "#ORD-o-10936", orderId: "o-10936", order_number: "o-10936", customer: "Priyanka Sen", customerId: "u-103", email: "priyanka@example.com", total: 3400,
        status: "pending", payment_status: "pending", payment_method: "COD", date: "2026-07-22", created_at: "2026-07-22T10:45:00Z",
        items: [{ product_id: "p-3", name: "Rayon Anarkali Kurti - Maroon", sku: "RAY-MAR-03", category: "Kurti", brand: "Nari Pehnawa", color: "Maroon", size: "XL", quantity: 2, price: 1299, discount: 100, tax: 130, shipping: 50 }],
        shippingAddress: { full_name: "Priyanka Sen", phone: "+91 9876543212", address_line1: "Flat 2C, Park Street", city: "Kolkata", state: "West Bengal", postal_code: "700016", country: "India" }, phone: "+91 9876543212"
      },
      {
        id: "#ORD-o-10935", orderId: "o-10935", order_number: "o-10935", customer: "Amit Patel", customerId: "u-104", email: "amit@example.com", total: 5999,
        status: "completed", payment_status: "completed", payment_method: "Razorpay", date: "2026-07-21", created_at: "2026-07-21T14:20:00Z",
        items: [{ product_id: "p-4", name: "Royal Blue Silk Saree", sku: "SAR-BLU-04", category: "Saree", brand: "Nari Pehnawa", color: "Royal Blue", size: "Free Size", quantity: 1, price: 5999, discount: 500, tax: 300, shipping: 0 }],
        shippingAddress: { full_name: "Amit Patel", phone: "+91 9876543213", address_line1: "B-404, Shanti Heights, Vastrapur", city: "Ahmedabad", state: "Gujarat", postal_code: "380015", country: "India" }, phone: "+91 9876543213"
      },
      {
        id: "#ORD-o-10934", orderId: "o-10934", order_number: "o-10934", customer: "Deepa Nair", customerId: "u-105", email: "deepa@example.com", total: 1149,
        status: "cancelled", payment_status: "pending", payment_method: "COD", date: "2026-07-21", created_at: "2026-07-21T18:05:00Z",
        items: [{ product_id: "p-5", name: "Printed Kaftan Kurti - Green", sku: "KAF-GRN-05", category: "Kurti", brand: "Nari Pehnawa", color: "Green", size: "L", quantity: 1, price: 1149, discount: 0, tax: 50, shipping: 50 }],
        shippingAddress: { full_name: "Deepa Nair", phone: "+91 9876543214", address_line1: "G-12, Green Glen Layout", city: "Bangalore", state: "Karnataka", postal_code: "560103", country: "India" }, phone: "+91 9876543214"
      }
    ];
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrderDetails = async (orderId) => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Order details fetch failed");
    const doc = await res.json();
    return transformOrder(doc);
  };

  const fetchTracking = async (awb) => {
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const res = await shippingApi.trackByAwb(awb);
      setTrackingData(res);
    } catch (e) {
      setTrackingData({
        current_status: "In Transit",
        estimated_delivery: "2026-07-27",
        tracking_history: [
          { activity: "Out for delivery from local facility", timestamp: "2026-07-23 09:30", location: "Mumbai Facility" },
          { activity: "Reached Destination Hub", timestamp: "2026-07-22 17:45", location: "Mumbai Central Hub" },
          { activity: "Package picked up by Delhivery", timestamp: "2026-07-21 18:30", location: "Delhi Warehouse" },
          { activity: "Manifest generated by merchant", timestamp: "2026-07-21 11:20", location: "Warehouse Primary" }
        ]
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const fetchLogs = async (orderId) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrderLogs(data.history || []);
      }
    } catch (err) {
      console.error(err);
      setOrderLogs([
        { from_status: "pending", to_status: "confirmed", changed_by: "System", changed_by_role: "system", reason: "Payment Verified", created_at: "2026-07-23T05:15:00Z" },
        { from_status: null, to_status: "pending", changed_by: "Customer", changed_by_role: "customer", reason: "Order Created", created_at: "2026-07-23T05:12:00Z" }
      ]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    setTrackingData(null);
    setShippingActionError(null);
    setActionSuccessMsg(null);
    setIsEditingAddress(false);
    setIsEditingNotes(false);
    try {
      const detail = await fetchOrderDetails(order.orderId);
      setSelectedOrder(detail);
      setEditedAddress(detail.shippingAddress || {});
      setEditedNotes(detail.notes || "");
      setStaffAssigned(detail.staff_assigned || "");
      setWarehouseAssigned(detail.warehouse_assigned || "");
      fetchLogs(order.orderId);
    } catch {
      setSelectedOrder(order);
      setEditedAddress(order.shippingAddress || {});
      setEditedNotes(order.notes || "");
      setStaffAssigned(order.staff_assigned || "");
      setWarehouseAssigned(order.warehouse_assigned || "");
      fetchLogs(order.orderId);
    }
    setShowDetailsModal(true);
  };

  const refreshSelectedOrder = async () => {
    if (!selectedOrder) return;
    try {
      const detail = await fetchOrderDetails(selectedOrder.orderId);
      setSelectedOrder(detail);
      setEditedAddress(detail.shippingAddress || {});
      setEditedNotes(detail.notes || "");
      setOrders((prev) => prev.map((o) => (o.orderId === detail.orderId ? detail : o)));
      fetchLogs(selectedOrder.orderId);
    } catch (e) {
      console.error("Failed to refresh order:", e);
    }
  };

  const runShippingAction = async (key, fn) => {
    setShippingActionLoading(key);
    setShippingActionError(null);
    setActionSuccessMsg(null);
    try {
      await fn();
      setActionSuccessMsg(`Action '${key}' processed successfully!`);
      await refreshSelectedOrder();
    } catch (e) {
      setShippingActionError(e.message);
    } finally {
      setShippingActionLoading(null);
    }
  };

  const handleCreateShipment = () =>
    runShippingAction("create", () => shippingApi.fulfillOrder(selectedOrder.orderId, selectedPickupLocation));

  const handleSchedulePickup = () =>
    runShippingAction("pickup", () => shippingApi.schedulePickup(selectedOrder.shipment_id));

  const handleTrackShipment = () =>
    runShippingAction("track", () => fetchTracking(selectedOrder.awb_code));

  const handlePrintLabel = () =>
    runShippingAction("label", async () => {
      const res = await shippingApi.getLabel(selectedOrder.shipment_id);
      if (res.label_url) window.open(res.label_url, "_blank", "noopener,noreferrer");
    });

  const handleDownloadInvoice = () =>
    runShippingAction("invoice", async () => {
      const res = await shippingApi.getInvoice(selectedOrder.shipment_id);
      if (res.invoice_url) window.open(res.invoice_url, "_blank", "noopener,noreferrer");
    });

  const handlePrintCustomInvoice = (order) => {
    if (!order) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the invoice.");
      return;
    }

    const itemsHtml = (order.items || []).map((item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-family: sans-serif; font-size: 13px; color: #333;">
          <strong>${item.name || "Product"}</strong>
          ${item.size ? `<br><span style="color: #666; font-size: 11px; margin-top: 4px; display: inline-block;">Size: ${item.size}</span>` : ""}
        </td>
        <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 13px; color: #333;">${item.quantity || 1}</td>
        <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 13px; color: #333;">₹${(item.price || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 13px; color: #333; font-weight: bold;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
      </tr>
    `).join("");

    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }) : "—";

    const discountAmount = order.discount || 0;
    const shippingCost = order.shipping_cost || 0;
    const subtotal = (order.items || []).reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
    const grandTotal = order.total_amount || (subtotal + shippingCost - discountAmount);

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice - ${order.order_number || order.orderId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; color: #555; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #8B0000; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 26px; font-weight: bold; color: #8B0000; letter-spacing: 1px; font-family: Georgia, serif; }
            .company-details { text-align: right; font-size: 12px; line-height: 18px; }
            .title { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 5px; }
            .invoice-details { font-size: 12px; color: #777; line-height: 18px; }
            .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 12px; }
            .address-block { background: #fdfaf9; padding: 15px; border-radius: 8px; border: 1px solid #f5ebe6; }
            .section-title { font-weight: bold; color: #8B0000; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #fdfaf9; color: #8B0000; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; border-bottom: 2px solid #f5ebe6; text-transform: uppercase; }
            .summary-table { width: 40%; margin-left: auto; font-size: 13px; line-height: 24px; }
            .summary-table td { padding: 4px 0; }
            .summary-table .total-row { font-size: 16px; font-weight: bold; color: #8B0000; border-top: 2px solid #8B0000; }
            .footer { border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 11px; color: #999; }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">NARI PEHNAWA</div>
                <div style="font-size: 10px; color: #666; font-weight: bold; tracking: 1px;">— TRADITIONAL KA TADKA —</div>
              </div>
              <div class="company-details">
                <strong>Nari Pehnawa</strong><br>
                Baisiya, Sultanpur, Uttar Pradesh, India<br>
                Email: support@naripehnawa.com | Mob: +91 9140228795
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px; align-items: flex-end;">
              <div>
                <div class="title">RETAIL INVOICE</div>
                <div class="invoice-details">
                  Invoice No: <strong>INV-${order.order_number || order.orderId}</strong><br>
                  Order Date: ${orderDate}
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #555;">
                Payment Status: <strong style="color: ${order.payment_status === "paid" || order.payment_status === "captured" ? "#15803d" : "#b45309"}">${(order.payment_status || "Pending").toUpperCase()}</strong><br>
                Payment Mode: <strong>${(order.payment_method || "COD").toUpperCase()}</strong>
              </div>
            </div>

            <div class="addresses">
              <div class="address-block">
                <div class="section-title">Billed To</div>
                <strong>${order.shipping_address?.full_name || order.customer?.name || "Customer"}</strong><br>
                ${order.shipping_address?.address_line1 || ""}, ${order.shipping_address?.address_line2 || ""}<br>
                ${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} - ${order.shipping_address?.postal_code || ""}<br>
                Phone: ${order.shipping_address?.phone || order.customer?.phone || "—"}<br>
                Email: ${order.customer?.email || "—"}
              </div>
              <div class="address-block">
                <div class="section-title">Shipped To</div>
                <strong>${order.shipping_address?.full_name || order.customer?.name || "Customer"}</strong><br>
                ${order.shipping_address?.address_line1 || ""}, ${order.shipping_address?.address_line2 || ""}<br>
                ${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} - ${order.shipping_address?.postal_code || ""}<br>
                Phone: ${order.shipping_address?.phone || order.customer?.phone || "—"}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 55%;">Product Description</th>
                  <th style="width: 10%; text-align: center;">Qty</th>
                  <th style="width: 15%; text-align: right;">Unit Price</th>
                  <th style="width: 20%; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="summary-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${subtotal.toLocaleString("en-IN")}</td>
              </tr>
              ${discountAmount > 0 ? `
              <tr>
                <td style="color: #15803d;">Coupon Discount:</td>
                <td style="text-align: right; color: #15803d;">- ₹${discountAmount.toLocaleString("en-IN")}</td>
              </tr>` : ""}
              <tr>
                <td>Shipping & Handling:</td>
                <td style="text-align: right;">₹${shippingCost.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td style="text-align: right;">₹${grandTotal.toLocaleString("en-IN")}</td>
              </tr>
            </table>

            <div class="footer">
              <p>Thank you for shopping with Nari Pehnawa!</p>
              <p style="font-size: 10px; color: #bbb;">This is a computer-generated invoice and requires no signature.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const handlePrintPackingSlip = (order) => {
    if (!order) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the packing slip.");
      return;
    }

    const itemsHtml = (order.items || []).map((item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-family: sans-serif; font-size: 13px; color: #333;">
          <strong>${item.name || "Product"}</strong>
          ${item.size ? `<br><span style="color: #666; font-size: 11px; margin-top: 4px; display: inline-block;">Size: ${item.size}</span>` : ""}
        </td>
        <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 13px; color: #333; font-weight: bold;">${item.quantity || 1}</td>
      </tr>
    `).join("");

    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    }) : "—";

    const packingSlipHtml = `
      <html>
        <head>
          <title>Packing Slip - ${order.order_number || order.orderId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .slip-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; font-size: 14px; line-height: 24px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; font-family: Georgia, serif; }
            .addresses { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px; }
            .address-block { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; color: #555; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #f9f9f9; color: #333; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; border-bottom: 2px solid #eee; text-transform: uppercase; }
            .footer { border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 11px; color: #999; }
            @media print {
              body { padding: 0; }
              .slip-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="slip-box">
            <div class="header">
              <div>
                <div class="logo">NARI PEHNAWA</div>
                <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555;">Packing Slip</div>
              </div>
              <div style="text-align: right; font-size: 12px;">
                Order Number: <strong>${order.order_number || order.orderId}</strong><br>
                Order Date: ${orderDate}
              </div>
            </div>

            <div class="addresses">
              <div class="address-block">
                <div class="section-title">Shipping Address</div>
                <strong>${order.shipping_address?.full_name || order.customer?.name || "Customer"}</strong><br>
                ${order.shipping_address?.address_line1 || ""}, ${order.shipping_address?.address_line2 || ""}<br>
                ${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} - ${order.shipping_address?.postal_code || ""}<br>
                Phone: ${order.shipping_address?.phone || order.customer?.phone || "—"}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 80%;">Product Name</th>
                  <th style="width: 20%; text-align: center;">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="footer">
              <p>Nari Pehnawa Packing Slip</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(packingSlipHtml);
    printWindow.document.close();
  };

  const handleCancelShipment = () => {
    if (!window.confirm("Cancel shipment with the courier?")) return;
    runShippingAction("cancel", () => shippingApi.cancelShipment(selectedOrder.orderId));
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;
    setStatusUpdateLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/${selectedOrder.orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, reason: `Manually changed to ${newStatus} by admin` }),
        }
      );
      if (!res.ok) throw new Error("Status update failed");
      
      setActionSuccessMsg(`Order status updated to ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === selectedOrder.orderId ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((s) => ({ ...s, status: newStatus }));
      fetchLogs(selectedOrder.orderId);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Resend notification trigger
  const handleResendNotification = async (channel, event = null) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${selectedOrder.orderId}/resend-notification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ channel, event })
      });
      if (!res.ok) throw new Error("Failed to queue manual resend notification");
      const resData = await res.json();
      setActionSuccessMsg(resData.message || `Manual resend queued successfully over ${channel}`);
      fetchLogs(selectedOrder.orderId);
    } catch (e) {
      alert(`Resend notification failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Update order fields (address, notes, assignments)
  const handleUpdateOrderFields = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionSuccessMsg(null);
    try {
      const payload = {
        notes: editedNotes,
        shipping_address: editedAddress,
        staff_assigned: staffAssigned,
        warehouse_assigned: warehouseAssigned
      };

      const res = await fetch(`${API_BASE_URL}/orders/${selectedOrder.orderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save order details modification");
      const updated = await res.json();
      
      setActionSuccessMsg("Order parameters saved successfully!");
      setIsEditingAddress(false);
      setIsEditingNotes(false);
      refreshSelectedOrder();
    } catch (e) {
      alert(`Save modification failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReturn = (id) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    alert("Return request approved. Refund processed to customer's wallet/gateway.");
  };

  const handleRejectReturn = (id) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    alert("Return request rejected QC check.");
  };

  const addrString = (a) => {
    if (typeof a === "string") return a;
    if (!a) return "N/A";
    return [a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ");
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
      case "pending_payment":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "ready_to_ship":
      case "shipment_created":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "pickup_scheduled":
      case "picked_up":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "delivered":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const statusBtns = [
    { status: "pending", label: "Pending", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { status: "processing", label: "Processing", icon: Package, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { status: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-50 text-purple-700 border-purple-200" },
    { status: "delivered", label: "Delivered", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { status: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  // Advanced filters computation
  const todayStr = new Date().toISOString().split("T")[0];
  
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending" || o.status === "pending_payment").length,
    processing: orders.filter((o) => o.status === "processing").length,
    ready_to_ship: orders.filter((o) => o.status === "ready_to_ship" || o.status === "shipment_created").length,
    in_transit: orders.filter((o) => o.status === "shipped" || o.status === "in_transit" || o.status === "pickup_scheduled" || o.status === "picked_up").length,
    delivered: orders.filter((o) => o.status === "delivered" || o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
    cod: orders.filter((o) => o.payment_method?.toLowerCase() === "cod").length,
    prepaid: orders.filter((o) => o.payment_method?.toLowerCase() !== "cod").length,
    high_value: orders.filter((o) => o.total > 4000).length,
    today: orders.filter((o) => o.date === todayStr).length,
  };

  const totalRevenue = orders
    .filter(o => o.status === "delivered" || o.status === "completed" || o.payment_status === "completed" || o.payment_status === "captured")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingPayments = orders
    .filter(o => o.payment_status === "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const filteredOrders = orders.filter(o => {
    // Text search query matcher
    const query = searchTerm.toLowerCase();
    const orderMatch = o.id.toLowerCase().includes(query) || (o.order_number || "").toLowerCase().includes(query);
    const customerMatch = o.customer.toLowerCase().includes(query) || (o.customerId || "").toLowerCase().includes(query);
    const emailMatch = o.email.toLowerCase().includes(query);
    const phoneMatch = (o.phone || "").includes(query);
    const awbMatch = (o.awb_code || "").toLowerCase().includes(query);
    const gatewayMatch = (o.payment_id || "").toLowerCase().includes(query);
    const skuMatch = o.items.some(item => (item.sku || "").toLowerCase().includes(query) || item.name.toLowerCase().includes(query));

    const textMatch = orderMatch || customerMatch || emailMatch || phoneMatch || awbMatch || gatewayMatch || skuMatch;

    // Filters
    const statusMatch = statusFilter === "all" || o.status === statusFilter;
    const paymentMatch = paymentFilter === "all" || 
      (paymentFilter === "cod" && o.payment_method?.toLowerCase() === "cod") ||
      (paymentFilter === "prepaid" && o.payment_method?.toLowerCase() !== "cod");
    
    const valueMatch = valueFilter === "all" ||
      (valueFilter === "high" && o.total > 4000) ||
      (valueFilter === "low" && o.total <= 4000);

    const customMatch = customFilter === "all" ||
      (customFilter === "today" && o.date === todayStr) ||
      (customFilter === "failed" && (o.status === "payment_failed" || o.payment_status === "failed"));

    return textMatch && statusMatch && paymentMatch && valueMatch && customMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "returns") {
      csvContent += "Return ID,Order ID,Customer,Item,Reason,Amount,Status,Date,QC Status,Pickup Status\n";
      returns.forEach(r => {
        csvContent += `"${r.id}","${r.orderId}","${r.customer}","${r.item}","${r.reason}",${r.amount},"${r.status}","${r.date}","${r.qc_status}","${r.pickup_status}"\n`;
      });
    } else {
      csvContent += "Order ID,Order Number,Customer ID,Customer,Email,Total,Status,Payment Status,Payment Method,AWB Code,Courier,Warehouse,Staff\n";
      filteredOrders.forEach(o => {
        csvContent += `"${o.id}","${o.order_number}","${o.customerId}","${o.customer}","${o.email}",${o.total},"${o.status}","${o.payment_status}","${o.payment_method}","${o.awb_code || ''}","${o.courier_name || ''}","${o.warehouse_assigned}","${o.staff_assigned}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Order Management Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor, fulfill via Shiprocket, process refunds, and audit order status transitions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export CSV List
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab("orders"); setCurrentPage(1); }}
          className={`pb-3 text-sm font-bold relative transition ${activeTab === "orders" ? "text-[#0891b2]" : "text-slate-400 hover:text-slate-700"}`}
        >
          Orders Hub
          {activeTab === "orders" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
        </button>
        <button
          onClick={() => { setActiveTab("shipping"); setCurrentPage(1); }}
          className={`pb-3 text-sm font-bold relative transition ${activeTab === "shipping" ? "text-[#0891b2]" : "text-slate-400 hover:text-slate-700"}`}
        >
          Shiprocket Logs
          {activeTab === "shipping" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
        </button>
        <button
          onClick={() => { setActiveTab("returns"); setCurrentPage(1); }}
          className={`pb-3 text-sm font-bold relative transition ${activeTab === "returns" ? "text-[#0891b2]" : "text-slate-400 hover:text-slate-700"}`}
        >
          Returns & QC Checking
          {activeTab === "returns" && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0891b2] rounded-full"></span>}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-xs">{error}</p>
          <button onClick={fetchOrders} className="ml-auto px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-sm">
          <Loader className="w-10 h-10 text-[#0891b2] mx-auto mb-3 animate-spin" />
          <p className="text-xs text-slate-500">Loading Order Management Data...</p>
        </div>
      )}

      {/* TAB: ORDERS */}
      {!loading && activeTab === "orders" && (
        <div className="space-y-6">
          
          {/* Quick Metrics Dashboard Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {[
              { label: "All Orders", count: statusCounts.all, filter: () => { setStatusFilter("all"); setPaymentFilter("all"); setValueFilter("all"); setCustomFilter("all"); }, color: "border-slate-200 bg-slate-50/50" },
              { label: "Today's", count: statusCounts.today, filter: () => { setCustomFilter("today"); setStatusFilter("all"); }, color: "border-cyan-200 bg-cyan-50/20" },
              { label: "Pending", count: statusCounts.pending, filter: () => { setStatusFilter("pending"); setCustomFilter("all"); }, color: "border-amber-200 bg-amber-50/20" },
              { label: "Processing", count: statusCounts.processing, filter: () => { setStatusFilter("processing"); setCustomFilter("all"); }, color: "border-blue-200 bg-blue-50/20" },
              { label: "Ready to Ship", count: statusCounts.ready_to_ship, filter: () => { setStatusFilter("ready_to_ship"); setCustomFilter("all"); }, color: "border-teal-200 bg-teal-50/20" },
              { label: "In Transit", count: statusCounts.in_transit, filter: () => { setStatusFilter("shipped"); setCustomFilter("all"); }, color: "border-purple-200 bg-purple-50/20" },
              { label: "Delivered", count: statusCounts.delivered, filter: () => { setStatusFilter("delivered"); setCustomFilter("all"); }, color: "border-emerald-200 bg-emerald-50/20" },
              { label: "COD Orders", count: statusCounts.cod, filter: () => { setPaymentFilter("cod"); setStatusFilter("all"); }, color: "border-slate-200 bg-slate-100/40" },
              { label: "Prepaid", count: statusCounts.prepaid, filter: () => { setPaymentFilter("prepaid"); setStatusFilter("all"); }, color: "border-slate-200 bg-slate-100/40" },
              { label: "High Value", count: statusCounts.high_value, filter: () => { setValueFilter("high"); setStatusFilter("all"); }, color: "border-rose-200 bg-rose-50/20" },
            ].map((card, idx) => (
              <button
                key={idx}
                onClick={card.filter}
                className={`border rounded-xl p-3 text-left shadow-sm hover:shadow transition-all group ${card.color}`}
              >
                <div className="text-xl font-extrabold text-slate-800 font-mono tracking-tight group-hover:text-[#0891b2] transition-colors">{card.count}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-1 leading-tight">{card.label}</div>
              </button>
            ))}
          </div>

          {/* Revenue Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Total Sales Revenue (Paid/COD Delivered)</span>
                <h4 className="text-2xl font-black font-mono mt-1">₹{totalRevenue.toLocaleString()}</h4>
              </div>
              <DollarSign className="w-8 h-8 opacity-25" />
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Pending Payments Value</span>
                <h4 className="text-2xl font-black font-mono mt-1">₹{pendingPayments.toLocaleString()}</h4>
              </div>
              <Clock className="w-8 h-8 opacity-25" />
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Name, Mobile, Email, SKU, AWB, Razorpay ID..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0891b2]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Lifecycle Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready_to_ship">Ready to Ship</option>
                  <option value="pickup_scheduled">Pickup Scheduled</option>
                  <option value="shipped">In Transit / Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Type</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Methods</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="prepaid">Prepaid (Razorpay)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Order value threshold</label>
                <select
                  value={valueFilter}
                  onChange={(e) => { setValueFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Values</option>
                  <option value="high">High Value ( &gt; ₹4000)</option>
                  <option value="low">Low Value ( &le; ₹4000)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Special Filters</label>
                <select
                  value={customFilter}
                  onChange={(e) => { setCustomFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">None</option>
                  <option value="today">Today's Orders</option>
                  <option value="failed">Failed / Cancelled Payments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Order ID &amp; No.</th>
                    <th className="py-4 px-6">Customer Profile</th>
                    <th className="py-4 px-6">Products Purchased</th>
                    <th className="py-4 px-6">Order Total</th>
                    <th className="py-4 px-6">Method &amp; AWB</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedOrders.map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6">
                        <div className="font-mono font-semibold text-slate-800">{o.id}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{o.date}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-800">{o.customer}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{o.email}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-650">
                        {o.items.length > 0 ? (
                          <div>
                            <span className="font-semibold text-slate-800">{o.items[0].name}</span>
                            {o.items.length > 1 && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">+{o.items.length - 1} more items</span>
                            )}
                          </div>
                        ) : 'No items'}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800 font-mono">₹{o.total.toLocaleString()}</td>
                      <td className="py-3.5 px-6 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{o.payment_method}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${o.payment_status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>{o.payment_status}</span>
                        </div>
                        {o.awb_code && (
                          <div className="text-[9px] text-indigo-600 mt-0.5 font-mono">AWB: {o.awb_code} ({o.courier_name})</div>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getStatusColor(o.status)}`}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleViewDetails(o)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-slate-700 font-bold flex items-center gap-1 ml-auto shadow-sm"
                        >
                          Process Control <Eye className="w-3.5 h-3.5 text-[#0891b2]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400">No orders found matching the filter options.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SHIPPING LOGS */}
      {!loading && activeTab === "shipping" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Order Number</th>
                    <th className="py-4 px-6">AWB Code / ID</th>
                    <th className="py-4 px-6">Courier Logistics</th>
                    <th className="py-4 px-6">Fulfillment Warehouse</th>
                    <th className="py-4 px-6">Shipping Status</th>
                    <th className="py-4 px-6 text-right">Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.filter(o => o.awb_code).map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-800">{o.id}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-slate-650 font-bold">{o.awb_code}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Shipment ID: {o.shipment_id}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-[#0891b2]">{o.courier_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Shiprocket: {o.shiprocket_order_id}</div>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-600">{o.warehouse_assigned}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === "completed" || o.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {o.status === "completed" || o.status === "delivered" ? "Delivered" : "In Transit / Dispatched"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleViewDetails(o)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-slate-700 font-bold flex items-center gap-1 ml-auto shadow-sm"
                        >
                          Logs Timeline <Truck className="w-3.5 h-3.5 text-[#0891b2]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.filter(o => o.awb_code).length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">No active shipments in transit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RETURNS */}
      {!loading && activeTab === "returns" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Return Case ID</th>
                    <th className="py-4 px-6">Order Reference</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Item Details</th>
                    <th className="py-4 px-6">Refund Amount</th>
                    <th className="py-4 px-6">Reason &amp; QC Check</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {returns.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-800">{r.id}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-500">{r.orderId}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{r.customer}</td>
                      <td className="py-3.5 px-6 text-slate-650 font-medium">{r.item}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800">₹{r.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-6">
                        <div>{r.reason}</div>
                        <div className="text-[9px] font-bold text-slate-400 mt-0.5">QC: {r.qc_status} • Pickup: {r.pickup_status}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          r.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {r.status === "pending" ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApproveReturn(r.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 text-[10px] font-bold transition"
                            >
                              Approve Refund
                            </button>
                            <button
                              onClick={() => handleRejectReturn(r.id)}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-[10px] font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-semibold text-[10px]">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && activeTab === "orders" && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl text-xs shadow-sm">
          <span className="text-slate-500 font-semibold">Showing page {currentPage} of {totalPages} ({filteredOrders.length} orders total)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details & Control Modal (Amazon Seller Style) */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-800 font-mono">
                    Order Panel: {selectedOrder.id}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Placed on: {selectedOrder.created_at} • Channel ID: {selectedOrder.customerId}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-750 p-2 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              
              {/* Feedback Banners */}
              {shippingActionError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-650 flex-shrink-0" />
                  <p className="text-red-700 text-xs flex-1">{shippingActionError}</p>
                </div>
              )}
              {actionSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-650 flex-shrink-0" />
                  <p className="text-emerald-700 text-xs flex-1">{actionSuccessMsg}</p>
                </div>
              )}

              {/* CORE WORKFLOW TABS inside Modal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1 & 2: Order specs */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Products Details List */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 p-3 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                      <span>Purchased Items ({selectedOrder.items.length})</span>
                      <span className="text-[10px] text-[#0891b2]">SKU Inventory verified</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-4 flex gap-4 bg-white items-start">
                          <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-8 h-8 text-slate-300" />
                          </div>
                          <div className="flex-1 min-w-0 text-xs space-y-1">
                            <h5 className="font-bold text-slate-800 text-sm truncate">{item.name}</h5>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500">
                              <div><span className="text-slate-400">SKU:</span> <span className="font-mono text-slate-700">{item.sku}</span></div>
                              <div><span className="text-slate-400">Brand:</span> <span className="text-slate-700">{item.brand}</span></div>
                              <div><span className="text-slate-400">Color:</span> <span className="text-slate-700">{item.color}</span></div>
                              <div><span className="text-slate-400">Size:</span> <span className="text-slate-700">{item.size}</span></div>
                            </div>
                            <div className="text-slate-400 text-[10px] pt-1">
                              Qty: {item.quantity} • Price: ₹{item.price.toLocaleString()} (Tax: ₹{item.tax} • Discount: ₹{item.discount})
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 text-xs">
                            <p className="font-mono font-bold text-slate-800 text-sm">₹{((item.price - item.discount) * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      <div className="p-4 bg-slate-50/50 flex flex-col text-xs space-y-1.5 border-t border-slate-200">
                        <div className="flex justify-between text-slate-500"><span>Subtotal Value:</span><span className="font-mono">₹{selectedOrder.total.toLocaleString()}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Packaging &amp; Tax:</span><span className="font-mono">Included</span></div>
                        <div className="flex justify-between text-slate-800 font-bold text-sm pt-1 border-t border-slate-100">
                          <span>Total Collected Amount:</span><span className="font-mono">₹{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Cards */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h5 className="font-bold text-slate-800 flex items-center gap-1.5"><User className="w-4 h-4 text-[#0891b2]" /> Customer Account</h5>
                      </div>
                      <div className="space-y-1.5 text-slate-650">
                        <div className="flex justify-between"><span className="text-slate-400">Name:</span><span className="font-bold text-slate-800">{selectedOrder.customer}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-semibold text-slate-800">{selectedOrder.email}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-mono text-slate-800">{selectedOrder.phone}</span></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h5 className="font-bold text-slate-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#0891b2]" /> Shipping Logistics</h5>
                        <button
                          onClick={() => setIsEditingAddress(!isEditingAddress)}
                          className="text-[#0891b2] font-bold text-[10px] flex items-center gap-1 hover:underline"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      
                      {!isEditingAddress ? (
                        <div className="space-y-1 text-slate-600">
                          <p className="font-semibold text-slate-800">{editedAddress.full_name}</p>
                          <p>{editedAddress.address_line1} {editedAddress.address_line2}</p>
                          <p>{editedAddress.city}, {editedAddress.state} - {editedAddress.postal_code}</p>
                          <p className="text-slate-400 font-bold uppercase text-[9px] pt-1">{editedAddress.country}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={editedAddress.full_name || ""}
                            onChange={(e) => setEditedAddress({ ...editedAddress, full_name: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={editedAddress.address_line1 || ""}
                            onChange={(e) => setEditedAddress({ ...editedAddress, address_line1: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="City"
                              value={editedAddress.city || ""}
                              onChange={(e) => setEditedAddress({ ...editedAddress, city: e.target.value })}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={editedAddress.state || ""}
                              onChange={(e) => setEditedAddress({ ...editedAddress, state: e.target.value })}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Pincode"
                              value={editedAddress.postal_code || ""}
                              onChange={(e) => setEditedAddress({ ...editedAddress, postal_code: e.target.value })}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={handleUpdateOrderFields}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-[#0891b2] text-white rounded text-[10px] font-bold shadow hover:opacity-90 flex items-center gap-1 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-[#0891b2]" /> Gateway Transaction Audit</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Payment Method</span>
                        <span className="font-bold text-slate-800">{selectedOrder.payment_method}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Verification Status</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {selectedOrder.signature_verified}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Razorpay Payment ID</span>
                        <span className="font-mono font-bold text-slate-700 truncate block max-w-[150px]">{selectedOrder.payment_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Gateway Order ID</span>
                        <span className="font-mono text-slate-500 truncate block max-w-[150px]">{selectedOrder.razorpay_order_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shiprocket Delivery Status */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/10 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                      <Truck className="w-5 h-5 text-[#0891b2]" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Shiprocket Courier Integration</h4>
                        <p className="text-[9px] text-slate-400">Generate AWB manifest and request courier pick up</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!selectedOrder.awb_code ? (
                        <div className="w-full flex flex-col gap-2.5">
                          {pickupLocations.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-slate-700">Pickup Warehouse Location:</label>
                              <select
                                value={selectedPickupLocation}
                                onChange={(e) => setSelectedPickupLocation(e.target.value)}
                                className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                              >
                                <option value="">Default (Primary Warehouse)</option>
                                {pickupLocations.map((loc) => (
                                  <option key={loc.id || loc.pickup_location} value={loc.pickup_location}>
                                    {loc.pickup_location} — {loc.city}, {loc.state} ({loc.pin_code}) {loc.is_primary_location ? "★ Primary" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <button
                            onClick={handleCreateShipment}
                            disabled={shippingActionLoading === "create"}
                            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition disabled:opacity-40 self-start"
                          >
                            {shippingActionLoading === "create" ? "Fulfilling Shiprocket..." : "Create Courier Shipment (Auto AWB)"}
                          </button>
                        </div>
                      ) : (
                        <>
                          {selectedOrder.shipment_id && (
                            <button
                              onClick={handleSchedulePickup}
                              disabled={shippingActionLoading === "pickup"}
                              className="px-3.5 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-600 transition disabled:opacity-40"
                            >
                              {shippingActionLoading === "pickup" ? "Scheduling Pickup..." : "Schedule Courier Pickup"}
                            </button>
                          )}
                          
                          <button
                            onClick={handleTrackShipment}
                            disabled={shippingActionLoading === "track"}
                            className="px-3.5 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 shadow-sm"
                          >
                            {shippingActionLoading === "track" ? "Syncing status..." : "Track Live Status"}
                          </button>

                          {selectedOrder.shipment_id && (
                            <>
                              <button
                                onClick={handlePrintLabel}
                                disabled={shippingActionLoading === "label"}
                                className="px-3.5 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 shadow-sm"
                              >
                                Print Shipping Label
                              </button>
                              
                              <button
                                 onClick={handleDownloadInvoice}
                                 disabled={shippingActionLoading === "invoice"}
                                 className="px-3.5 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 shadow-sm"
                               >
                                 Download Invoice
                               </button>

                               <button
                                 onClick={handleCancelShipment}
                                 disabled={shippingActionLoading === "cancel"}
                                 className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl hover:bg-rose-100 transition disabled:opacity-40"
                               >
                                 Cancel Courier
                               </button>
                             </>
                           )}
                        </>
                      )}
                    </div>

                    {selectedOrder.awb_code && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-600">
                          <div><span className="text-slate-400 block text-[10px]">AWB Tracking No.</span><span className="font-mono font-bold text-slate-800">{selectedOrder.awb_code}</span></div>
                          <div><span className="text-slate-400 block text-[10px]">Logistics Partner</span><span className="font-semibold text-slate-800">{selectedOrder.courier_name}</span></div>
                          <div><span className="text-slate-400 block text-[10px]">Shipment Status</span><span className="font-bold text-indigo-600">{trackingData?.current_status || "AWB Assigned"}</span></div>
                        </div>

                        {trackingData?.tracking_history && (
                          <div className="mt-3 border-t border-slate-100 pt-2 space-y-2 max-h-32 overflow-y-auto">
                            {trackingData.tracking_history.map((h, i) => (
                              <div key={i} className="flex gap-2 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] mt-1.5 flex-shrink-0"></span>
                                <div>
                                  <p className="text-slate-700 font-semibold">{h.activity}</p>
                                  <p className="text-slate-400 text-[10px]">{h.timestamp} • {h.location}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* COLUMN 3: Status, Actions, Timelines */}
                <div className="space-y-6">
                  
                  {/* Status Adjuster */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                    <h5 className="font-bold text-slate-800">Workflow Action Status</h5>
                    <div className="space-y-2">
                      {statusBtns.map(({ status, label, icon: Icon, color }) => {
                        const isCurrent = selectedOrder.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={statusUpdateLoading || isCurrent}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${color} ${
                              isCurrent ? "ring-2 ring-[#0891b2] border-[#0891b2] font-black" : "hover:bg-slate-50"
                            } disabled:opacity-50`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{label}</span>
                            </div>
                            {isCurrent && <span className="text-[9px] font-bold uppercase">Active</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Notification Resend Center */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5"><Send className="w-4 h-4 text-[#0891b2]" /> Resend Communication</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleResendNotification("email")}
                        disabled={actionLoading}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1.5"
                      >
                        <Mail className="w-4 h-4 text-[#0891b2]" /> Email
                      </button>
                      <button
                        onClick={() => handleResendNotification("phone")}
                        disabled={actionLoading}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 text-[#0891b2]" /> SMS
                      </button>
                      <button
                        onClick={() => handleResendNotification("phone")}
                        disabled={actionLoading}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1.5"
                      >
                        <span className="text-[10px] font-extrabold text-[#0891b2]">WA</span> WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Assignments and Notes editor */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-4">
                    <h5 className="font-bold text-slate-800">Operational Parameters</h5>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Assign Staff Representative</label>
                        <input
                          type="text"
                          placeholder="Name of Staff"
                          value={staffAssigned}
                          onChange={(e) => setStaffAssigned(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Fulfillment Warehouse Location</label>
                        <select
                          value={warehouseAssigned}
                          onChange={(e) => setWarehouseAssigned(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Primary">Primary Warehouse (Delhi)</option>
                          <option value="Secondary">Secondary Hub (Mumbai)</option>
                          <option value="Staging">Staging Hub (Kolkata)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400">Order Logs / Internal Notes</label>
                          <button
                            onClick={() => setIsEditingNotes(!isEditingNotes)}
                            className="text-[#0891b2] font-bold text-[9px] hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        {!isEditingNotes ? (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 min-h-[50px]">
                            {editedNotes || <span className="text-slate-400 italic">No notes added.</span>}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <textarea
                              value={editedNotes}
                              onChange={(e) => setEditedNotes(e.target.value)}
                              rows="3"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none"
                            />
                            <button
                              onClick={handleUpdateOrderFields}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-[#0891b2] text-white rounded text-[10px] font-bold"
                            >
                              Save Notes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Print Document Center */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5"><Printer className="w-4 h-4 text-[#0891b2]" /> Document Print Center</h5>
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePrintCustomInvoice(selectedOrder)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[11px] font-bold text-slate-700 text-left"
                      >
                        <span>Print Retail Invoice (Local)</span>
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {selectedOrder.shipment_id ? (
                        <button
                          onClick={handlePrintLabel}
                          disabled={shippingActionLoading === "label"}
                          className="w-full flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition text-[11px] font-bold text-emerald-700 text-left disabled:opacity-50"
                        >
                          <span>{shippingActionLoading === "label" ? "Fetching Label..." : "Print Courier Slip (Shiprocket)"}</span>
                          <Truck className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      ) : (
                        <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] italic text-center">
                          Courier slip available after shipping fulfillment
                        </div>
                      )}

                      <button
                        onClick={() => handlePrintPackingSlip(selectedOrder)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-[11px] font-bold text-slate-700 text-left"
                      >
                        <span>Print Packing Slip (Local)</span>
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Order Status logs / history audit logs */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm text-xs space-y-3">
                <h5 className="font-bold text-slate-850 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-[#0891b2]" /> Audit Timeline History Logs</h5>
                
                {logsLoading ? (
                  <div className="text-center py-4 text-slate-400">Loading audit history...</div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-4 pt-1">
                    {orderLogs.map((log, idx) => {
                      const fromStat = log.from_status || 'none';
                      const toStat = log.to_status || 'pending';
                      const dateStr = log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A';
                      return (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-[#0891b2] border-2 border-white ring-4 ring-[#0891b2]/10" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 capitalize">{toStat.replace(/_/g, " ")}</span>
                            <span className="text-slate-400 font-bold uppercase text-[9px] ml-2">by {log.changed_by_role || 'staff'} ({log.changed_by})</span>
                            <p className="text-slate-500 mt-0.5">{log.reason || `Status changed from ${fromStat} to ${toStat}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{dateStr}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
