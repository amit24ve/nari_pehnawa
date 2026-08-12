const Razorpay = require('razorpay');
const crypto = require('crypto');
const keys = require('../config/keys');
const logger = require('../utils/logger');

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: keys.RAZORPAY_KEY_ID,
  key_secret: keys.RAZORPAY_KEY_SECRET
});

/**
 * Create a new Razorpay order
 * @param {number} amount - Amount in INR
 * @param {string} currency - Currency (default 'INR')
 * @param {string} receipt - Receipt string identifier
 * @returns {Promise<object>}
 */
const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    logger.info(`Razorpay order created successfully: ${order.id}`);
    return order;
  } catch (error) {
    logger.error(`Error creating Razorpay order: ${error.message}`);
    throw new Error(`Razorpay order creation failed: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId 
 * @param {string} razorpayPaymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', keys.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isValid = generated_signature === signature;
    if (isValid) {
      logger.info(`Razorpay signature verification succeeded for payment ${razorpayPaymentId}`);
    } else {
      logger.warn(`Razorpay signature verification failed for payment ${razorpayPaymentId}`);
    }
    return isValid;
  } catch (error) {
    logger.error(`Error verifying Razorpay signature: ${error.message}`);
    return false;
  }
};

/**
 * Create a refund for a payment
 * @param {string} paymentId 
 * @param {number} amount - Amount in INR
 * @param {string} reason 
 * @returns {Promise<object>}
 */
const createRefund = async (paymentId, amount, reason = 'Customer request') => {
  try {
    const options = {
      payment_id: paymentId,
      amount: Math.round(amount * 100), // in paise
      notes: { reason }
    };
    const refund = await razorpay.refunds.create(options);
    logger.info(`Razorpay refund created successfully: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error(`Error processing Razorpay refund: ${error.message}`);
    throw new Error(`Razorpay refund failed: ${error.message}`);
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  createRefund,
  razorpayClient: razorpay
};
