const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  source: { type: String, enum: ['wallet', 'card', 'cod', 'netbanking', 'upi'], required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
