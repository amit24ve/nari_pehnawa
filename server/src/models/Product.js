const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: 'Bunaai' },
  price: { type: Number, required: true },
  original_price: { type: Number },
  discount: { type: Number },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  category: { type: String, required: true },
  sub_category: { type: String },
  description: { type: String },
  on_sale: { type: Boolean, default: false },
  is_new: { type: Boolean, default: false },
  in_stock: { type: Boolean, default: true },
  stock_quantity: { type: Number, default: 100 },
  sizes: { type: [String], default: ['S', 'M', 'L', 'XL'] },
  colors: { type: [String], default: [] },
  fabric: { type: String },
  pattern: { type: String },
  sleeve_type: { type: String },
  rating: { type: Number, default: 0.0 },
  review_count: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  hsn_code: { type: String } // GST HSN/SAC code
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
