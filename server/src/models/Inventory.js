const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: String, required: true },
  color: { type: String, default: 'Default' },
  stock: { type: Number, required: true, default: 0 },
  low_stock_threshold: { type: Number, default: 5 }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness for product-size-color combo
InventorySchema.index({ product_id: 1, size: 1, color: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', InventorySchema);
