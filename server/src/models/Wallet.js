const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const WalletSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
  transactions: [WalletTransactionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', WalletSchema);
