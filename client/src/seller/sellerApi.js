/**
 * Seller Portal API Client for Nari Pehnawa
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

export const getSellerToken = () => {
  try {
    return localStorage.getItem("np_seller_token") || localStorage.getItem("neel_token") || localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

export const setSellerToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("np_seller_token", token);
    } else {
      localStorage.removeItem("np_seller_token");
    }
  } catch {}
};

export const getSellerStoredUser = () => {
  try {
    const raw = localStorage.getItem("np_seller_user") || localStorage.getItem("neel_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSellerStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem("np_seller_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("np_seller_user");
    }
  } catch {}
};

const sellerRequest = async (endpoint, options = {}) => {
  const token = getSellerToken();
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Unauthorized / expired token
    setSellerToken("");
    setSellerStoredUser(null);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || "An error occurred with your seller request";
    throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
};

export const sellerApi = {
  // Auth
  register: (payload) =>
    sellerRequest("/seller/register", { method: "POST", body: payload }),

  login: (payload) =>
    sellerRequest("/seller/login", { method: "POST", body: payload }),

  // Profile & KYC
  getMe: () => sellerRequest("/seller/me"),

  updateProfile: (payload) =>
    sellerRequest("/seller/profile", { method: "PUT", body: payload }),

  // Stats & Policy
  getStats: (range = "7d") => sellerRequest(`/seller/dashboard/stats?range=${range}`),

  getPackagingPolicy: () => sellerRequest("/seller/packaging-policy"),

  // Orders Management
  getOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", params.limit);
    if (params.skip) query.set("skip", params.skip);
    const qs = query.toString();
    return sellerRequest(`/seller/orders${qs ? `?${qs}` : ""}`);
  },

  getOrderDetail: (orderId) => sellerRequest(`/seller/orders/${orderId}`),

  updateOrderStatus: (orderId, payload) =>
    sellerRequest(`/seller/orders/${orderId}/status`, { method: "PUT", body: payload }),

  // Inventory Management
  getInventory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", params.limit);
    if (params.skip) query.set("skip", params.skip);
    const qs = query.toString();
    return sellerRequest(`/seller/inventory${qs ? `?${qs}` : ""}`);
  },

  adjustStock: (payload) =>
    sellerRequest("/seller/inventory/adjust", { method: "POST", body: payload }),

  // Returns & Reverse Logistics
  getReturns: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.limit) query.set("limit", params.limit);
    if (params.skip) query.set("skip", params.skip);
    const qs = query.toString();
    return sellerRequest(`/seller/returns${qs ? `?${qs}` : ""}`);
  },

  raiseReturnDispute: (orderId, payload) =>
    sellerRequest(`/seller/returns/${orderId}/dispute`, { method: "POST", body: payload }),

  // Reports & Data Exports (CSV)
  downloadReport: async (type = "orders") => {
    const token = getSellerToken();
    const res = await fetch(`${API_BASE_URL}/seller/reports/export?type=${type}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to download report");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nari_pehnawa_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Finance & Settlements
  getFinanceOverview: () => sellerRequest("/seller/finance/overview"),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.search) query.set("search", params.search);
    if (params.is_active !== undefined) query.set("is_active", params.is_active);
    if (params.limit) query.set("limit", params.limit);
    if (params.skip) query.set("skip", params.skip);
    const qs = query.toString();
    return sellerRequest(`/seller/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id) => sellerRequest(`/seller/products/${id}`),

  createProduct: (payload) =>
    sellerRequest("/seller/products", { method: "POST", body: payload }),

  updateProduct: (id, payload) =>
    sellerRequest(`/seller/products/${id}`, { method: "PUT", body: payload }),

  deleteProduct: (id) =>
    sellerRequest(`/seller/products/${id}`, { method: "DELETE" }),

  // Dropdowns
  getCategories: () => sellerRequest("/seller/categories"),
  getBrands: () => sellerRequest("/seller/brands"),

  // Inquiries & SLA tickets
  getInquiries: () => sellerRequest("/seller/inquiries"),

  createInquiry: (payload) =>
    sellerRequest("/seller/inquiries", { method: "POST", body: payload }),

  // Image Upload
  uploadImage: async (file) => {
    const token = getSellerToken();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload image");
    }
    return res.json();
  },

  // Multiple Image Upload
  uploadImages: async (files) => {
    const token = getSellerToken();
    const fd = new FormData();
    for (const f of files) {
      fd.append("files", f);
    }
    const res = await fetch(`${API_BASE_URL}/upload/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload images");
    }
    return res.json();
  },
};

export default sellerApi;

