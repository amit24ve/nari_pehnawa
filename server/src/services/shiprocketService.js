const axios = require('axios');
const keys = require('../config/keys');
const logger = require('../utils/logger');

class ShiprocketService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with Shiprocket and cache the JWT token
   */
  async authenticate() {
    try {
      // If token is still valid (Shiprocket tokens last 10 days, we refresh after 9 days)
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      logger.info('Authenticating with Shiprocket API...');
      const response = await axios.post(`${keys.SHIPROCKET_BASE_URL}/auth/login`, {
        email: keys.SHIPROCKET_EMAIL,
        password: keys.SHIPROCKET_PASSWORD
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Expire in 9 days (9 * 24 * 60 * 60 * 1000 ms)
        this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
        logger.info('Successfully authenticated with Shiprocket.');
        return this.token;
      } else {
        throw new Error('No token returned from Shiprocket authentication.');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      logger.error(`Shiprocket Authentication failed: ${errMsg}`);
      throw new Error(`Shiprocket auth failed: ${errMsg}`);
    }
  }

  /**
   * Helper to make authorized requests
   */
  async request(method, path, data = null, params = null) {
    const token = await this.authenticate();
    try {
      const config = {
        method,
        url: `${keys.SHIPROCKET_BASE_URL}${path}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      if (data) config.data = data;
      if (params) config.params = params;

      const response = await axios(config);
      return response.data;
    } catch (error) {
      // Handle token expiration / unauthorized
      if (error.response?.status === 401) {
        logger.warn('Shiprocket token unauthorized (401). Retrying with fresh login...');
        this.token = null; // force re-authentication
        const freshToken = await this.authenticate();
        error.config.headers['Authorization'] = `Bearer ${freshToken}`;
        const retryRes = await axios(error.config);
        return retryRes.data;
      }
      const errMsg = JSON.stringify(error.response?.data || error.message);
      logger.error(`Shiprocket API error on ${path}: ${errMsg}`);
      throw new Error(`Shiprocket API failure: ${errMsg}`);
    }
  }

  /**
   * Create an order in Shiprocket
   * @param {object} orderData - Shiprocket formatted order details
   */
  async createOrder(orderData) {
    logger.info(`Creating Shiprocket order for local order: ${orderData.order_id}`);
    return this.request('POST', '/orders/create/adhoc', orderData);
  }

  /**
   * Alias/helper for createOrder
   */
  async createShipment(orderData) {
    return this.createOrder(orderData);
  }

  /**
   * Check serviceability between postcodes
   */
  async checkServiceability(pickupPostcode, deliveryPostcode, weight = 0.5, cod = false) {
    const params = {
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      weight: weight,
      cod: cod ? 1 : 0
    };
    return this.request('GET', '/courier/serviceability', null, params);
  }

  /**
   * Assign courier and generate AWB for a shipment
   * @param {object} payload - { shipment_id, courier_id }
   */
  async assignCourier(payload) {
    logger.info(`Assigning courier and AWB for shipment: ${payload.shipment_id}`);
    return this.request('POST', '/courier/generate/awb', payload);
  }

  /**
   * Generate AWB for a shipment (alias or wrapper)
   */
  async generateAWB(shipmentId, courierId = null) {
    const payload = { shipment_id: shipmentId };
    if (courierId) payload.courier_id = courierId;
    return this.assignCourier(payload);
  }

  /**
   * Request pickup for shipment(s)
   * @param {string[]} shipmentIds 
   */
  async requestPickup(shipmentIds) {
    logger.info(`Requesting pickup for shipments: ${shipmentIds.join(', ')}`);
    return this.request('POST', '/courier/generate/pickup', { shipment_id: shipmentIds });
  }

  /**
   * Generate shipping label PDF URL
   * @param {string[]} shipmentIds 
   */
  async generateLabel(shipmentIds) {
    logger.info(`Generating label for shipments: ${shipmentIds.join(', ')}`);
    return this.request('POST', '/courier/generate/label', { shipment_id: shipmentIds });
  }

  /**
   * Generate manifest PDF URL
   * @param {string[]} shipmentIds 
   */
  async generateManifest(shipmentIds) {
    logger.info(`Generating manifest for shipments: ${shipmentIds.join(', ')}`);
    return this.request('POST', '/manifests/generate', { shipment_id: shipmentIds });
  }

  /**
   * Generate invoice PDF URL
   * @param {string[]} orderIds 
   */
  async generateInvoice(orderIds) {
    logger.info(`Generating invoices for orders: ${orderIds.join(', ')}`);
    return this.request('POST', '/orders/print/invoice', { ids: orderIds });
  }

  /**
   * Track shipment by AWB or Shipment ID
   * @param {string} awbCode 
   */
  async trackShipment(awbCode) {
    logger.info(`Tracking shipment with AWB: ${awbCode}`);
    return this.request('GET', `/courier/track/awb/${awbCode}`);
  }

  /**
   * Cancel shipment / order in Shiprocket
   * @param {string[]} orderIds - Shiprocket order IDs
   */
  async cancelShipment(orderIds) {
    logger.info(`Cancelling Shiprocket orders: ${orderIds.join(', ')}`);
    return this.request('POST', '/orders/cancel', { ids: orderIds });
  }

  /**
   * Create a return order in Shiprocket
   * @param {object} returnData 
   */
  async createReturn(returnData) {
    logger.info(`Creating return shipment in Shiprocket for order: ${returnData.order_id}`);
    return this.request('POST', '/orders/create/return', returnData);
  }

  /**
   * Create exchange shipment in Shiprocket
   */
  async createExchange(exchangeData) {
    logger.info(`Creating exchange order in Shiprocket for order: ${exchangeData.order_id}`);
    return this.request('POST', '/orders/create/adhoc', exchangeData);
  }
}

module.exports = new ShiprocketService();
