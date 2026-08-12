const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'], default: 'pending' },
  method: { type: String },
  email: { type: String },
  phone: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
