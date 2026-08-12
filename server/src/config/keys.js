const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from app/.env if not present in server/.env
const appEnvPath = path.resolve(__dirname, '../../../server/app/.env');
const localEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: localEnvPath });
dotenv.config({ path: appEnvPath });

module.exports = {
  PORT: process.env.PORT || 7100,
  MONGODB_URI: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/NariPehnawa',
  MONGO_DB: process.env.MONGO_DB || 'NariPehnawa',
  JWT_SECRET: process.env.JWT_SECRET || 'nari_pehnawa_jwt_secret_key_2026_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxx',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Shiprocket
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || 'test@example.com',
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || 'testpassword',
  SHIPROCKET_BASE_URL: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
  SHIPROCKET_CHANNEL_ID: process.env.SHIPROCKET_CHANNEL_ID || '0',
  SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
  SHIPROCKET_WEBHOOK_SECRET: process.env.SHIPROCKET_WEBHOOK_SECRET || '',

  // SMTP Settings
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USERNAME: process.env.SMTP_USERNAME || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'support@naripehnawa.com',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Nari Pehnawa',

  // Meta WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v20.0',

  // Company Details (GST)
  COMPANY_NAME: process.env.COMPANY_NAME || 'Nari Pehnawa',
  COMPANY_GSTIN: process.env.COMPANY_GSTIN || '',
  COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || 'India',
  COMPANY_STATE: process.env.COMPANY_STATE || 'Delhi',
  INVOICE_TAX_PERCENT: parseFloat(process.env.INVOICE_TAX_PERCENT || '5')
};
