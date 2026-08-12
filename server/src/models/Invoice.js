const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  invoice_number: { type: String, required: true, unique: true },
  invoice_date: { type: Date, default: Date.now },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true }, // GST amount
  tax_percent: { type: Number, default: 5 }, // GST % e.g. 5
  total: { type: Number, required: true },
  pdf_url: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
