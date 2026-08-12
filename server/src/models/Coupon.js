const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, required: true }, // discount percentage or flat rate
  min_cart_value: { type: Number, default: 0 },
  max_discount: { type: Number }, // max discount limit for percentage coupons
  active: { type: Boolean, default: true },
  start_date: { type: Date, default: Date.now },
  expiry_date: { type: Date },
  usage_limit: { type: Number }, // max total times this coupon can be used
  usage_count: { type: Number, default: 0 } // total times it was used
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', CouponSchema);
