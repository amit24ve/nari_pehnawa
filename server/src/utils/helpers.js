const crypto = require('crypto');

/**
 * Generate a unique order number
 * @returns {string}
 */
const generateOrderNumber = () => {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ts}-${rand}`;
};

/**
 * Generate a unique invoice number
 * @returns {string}
 */
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${rand}`;
};

/**
 * Check if the input is a valid MongoDB ObjectId
 * @param {string} id 
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  generateOrderNumber,
  generateInvoiceNumber,
  isValidObjectId
};
