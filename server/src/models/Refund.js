const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  razorpay_refund_id: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  reason: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Refund', RefundSchema);
