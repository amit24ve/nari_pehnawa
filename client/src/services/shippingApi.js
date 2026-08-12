/**
 * Shipping API service — thin wrapper around the backend's /shipping/*
 * endpoints. Centralizes auth headers, the API base URL, and error
 * handling so components never talk to `fetch` directly for shipping data.
 *
 * Shiprocket credentials never touch the frontend — every call here hits
 * our own backend, which holds the Shiprocket secret and talks to
 * Shiprocket server-to-server.
 */

const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

function getToken() {
  return (
    localStorage.getItem("neel_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body / not JSON
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const shippingApi = {
  /** Customer + admin: shipping status stored for an order */
  getOrderShipping: (orderId) => request(`/shipping/order/${orderId}`),

  /** Live AWB tracking (also syncs the order's stored status) */
  trackByAwb: (awb) => request(`/shipping/track/${awb}`),

  /** Admin: create the Shiprocket order for an app order */
  createShipment: (orderId, dimensions) =>
    request(`/shipping/create-order`, {
      method: "POST",
      body: { order_id: orderId, dimensions },
    }),

  /** Admin: generate AWB / assign courier */
  generateAwb: (shipmentId, courierId) =>
    request(`/shipping/generate-awb`, {
      method: "POST",
      body: { shipment_id: shipmentId, courier_id: courierId },
    }),

  /** Admin: schedule courier pickup */
  schedulePickup: (shipmentId, pickupDate) =>
    request(`/shipping/schedule-pickup`, {
      method: "POST",
      body: { shipment_id: shipmentId, pickup_date: pickupDate },
    }),

  /** Admin: get all registered pickup locations/warehouses from Shiprocket */
  getPickupLocations: () => request("/shipping/pickup-locations"),

  /** Admin: run the full create -> AWB -> pickup pipeline in one call */
  fulfillOrder: (orderId, pickupLocation) =>
    request(`/shipping/fulfill/${orderId}`, {
      method: "POST",
      params: { pickup_location: pickupLocation },
    }),

  /** Admin: cancel a shipment by order id (or explicit AWBs) */
  cancelShipment: (orderId, awbs) =>
    request(`/shipping/cancel`, {
      method: "POST",
      body: { order_id: orderId, awbs },
    }),

  /** Admin: reassign a different courier for a shipment */
  reassignCourier: (shipmentId, courierId) =>
    request(`/shipping/reassign-courier`, {
      method: "POST",
      body: { shipment_id: shipmentId, courier_id: courierId },
    }),

  /** Check available couriers + rates between two pincodes */
  checkServiceability: (pickupPostcode, deliveryPostcode, weight = 0.5, cod = false) =>
    request(`/shipping/courier-serviceability`, {
      params: {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight,
        cod,
      },
    }),

  /** Admin: get (and persist) the shipping label PDF URL */
  getLabel: (shipmentId) => request(`/shipping/label/${shipmentId}`),

  /** Admin: get (and persist) the invoice PDF URL */
  getInvoice: (shipmentId) => request(`/shipping/invoice/${shipmentId}`),
};

export default shippingApi;
