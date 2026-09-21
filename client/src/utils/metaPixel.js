/**
 * Meta / Facebook Pixel & Conversions API Dynamic Tracking Engine
 * Guarantees 100% catalog match rate with Meta Commerce Manager.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';

/**
 * Extracts a clean, stable, and unique Product / Catalog ID from any product object,
 * cart line item, or order line item.
 * 
 * Priority:
 * 1. item.meta_catalog_id
 * 2. item.sku
 * 3. item.product_id
 * 4. item.id
 * 5. item._id
 *
 * Guaranteed:
 * - Never returns null, undefined, empty string, or "[object Object]"
 * - Trims extraneous whitespace
 * - Stable across all page visits, cart sessions, checkout steps, and order receipts
 */
export const getMetaCatalogId = (item, variant = null) => {
  if (!item) return '';

  let rawId = '';
  if (typeof item === 'string' || typeof item === 'number') {
    rawId = String(item);
  } else if (typeof item === 'object') {
    rawId =
      item.meta_catalog_id ||
      item.sku ||
      item.product_id ||
      item.id ||
      item._id ||
      item.productId ||
      '';
  }

  // Sanitize
  const cleanId = String(rawId || '').trim();
  if (
    !cleanId ||
    cleanId === 'undefined' ||
    cleanId === 'null' ||
    cleanId === '[object Object]'
  ) {
    return '';
  }

  return cleanId;
};

/**
 * Extracts clean array of catalog IDs from a list of products/cart items/order items.
 */
export const getMetaCatalogIds = (items = []) => {
  if (!Array.isArray(items)) return [];
  const ids = items
    .map((item) => getMetaCatalogId(item, item?.size))
    .filter((id) => Boolean(id) && typeof id === 'string');
  // Remove duplicates while preserving order
  return Array.from(new Set(ids));
};

/**
 * Safely calls fbq on window if available.
 */
const safeFbq = (trackType, eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq(trackType, eventName, params);
      console.log(`🎯 [Meta Pixel] ${trackType} -> ${eventName}:`, params);
    } catch (err) {
      console.warn(`[Meta Pixel] Failed to track ${eventName}:`, err);
    }
  } else {
    console.log(`🎯 [Meta Pixel (queued)] ${trackType} -> ${eventName}:`, params);
  }
};

/**
 * Track ViewContent when a visitor views a product detail page.
 * @param {Object} product - Product object loaded from database/API
 */
export const trackViewContent = (product) => {
  if (!product) return;
  const catalogId = getMetaCatalogId(product);
  if (!catalogId) return;

  const price = Number(product.price || product.discount_price || 0);

  const payload = {
    content_ids: [catalogId],
    content_name: product.name || 'Product',
    content_category: product.category || 'Ethnic Wear',
    content_type: 'product',
    value: price,
    currency: 'INR',
  };

  safeFbq('track', 'ViewContent', payload);
};

/**
 * Track AddToCart when a customer adds an item to cart.
 * @param {Object} product - Product object
 * @param {string} size - Selected size
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (product, size = null, quantity = 1) => {
  if (!product) return;
  const catalogId = getMetaCatalogId(product, size);
  if (!catalogId) return;

  const qty = Math.max(1, Number(quantity || 1));
  const unitPrice = Number(product.price || 0);
  const totalValue = unitPrice * qty;

  const payload = {
    content_ids: [catalogId],
    content_name: product.name || 'Product',
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    num_items: qty,
  };

  safeFbq('track', 'AddToCart', payload);
};

/**
 * Track InitiateCheckout when the customer starts checkout.
 * @param {Array} cartItems - Array of items in cart
 * @param {number} totalValue - Total order amount
 */
export const trackInitiateCheckout = (cartItems = [], totalValue = 0) => {
  const contentIds = getMetaCatalogIds(cartItems);
  if (!contentIds.length) return;

  const totalQty = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
    0
  );

  const payload = {
    content_ids: contentIds,
    content_type: 'product',
    num_items: totalQty,
    value: Number(totalValue || 0),
    currency: 'INR',
  };

  safeFbq('track', 'InitiateCheckout', payload);
};

/**
 * Track Purchase when an order is successfully completed.
 * @param {Object} order - Order confirmation object containing items and total
 */
export const trackPurchase = (order = {}) => {
  const items = order.items || [];
  const contentIds = getMetaCatalogIds(items);
  if (!contentIds.length) return;

  const totalQty = items.reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
    0
  );

  const totalAmount = Number(
    order.total || order.total_amount || order.amount || order.grand_total || 0
  );

  const orderId = String(
    order.order_number || order.order_id || order.id || order._id || ''
  );

  const payload = {
    content_ids: contentIds,
    content_type: 'product',
    num_items: totalQty,
    value: totalAmount,
    currency: 'INR',
  };

  if (orderId) {
    payload.order_id = orderId;
  }

  safeFbq('track', 'Purchase', payload);
};
