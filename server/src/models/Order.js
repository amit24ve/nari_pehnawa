const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  product_image: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String, required: true },
  color: { type: String },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  hsn_code: { type: String }
});

const ShippingAddressSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  address_line1: { type: String, required: true },
  address_line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, default: 'India' }
});

const OrderTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changed_by: { type: String, required: true },
  role: { type: String, required: true },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const ShippingInfoSchema = new mongoose.Schema({
  shipment_id: { type: String },
  awb_code: { type: String },
  courier_name: { type: String },
  pickup_status: { type: String },
  tracking_url: { type: String },
  expected_delivery: { type: Date },
  shipment_status: { type: String }
});

const OrderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_email: { type: String, required: true },
  items: [OrderItemSchema],
  shipping_address: ShippingAddressSchema,
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0.0 },
  shipping_cost: { type: Number, default: 0.0 },
  tax: { type: Number, default: 0.0 },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['COD', 'Razorpay'], default: 'COD' },
  payment_status: { 
    type: String, 
    enum: ['Pending', 'Authorized', 'Captured', 'Failed', 'Refunded'], 
    default: 'Pending' 
  },
  status: { 
    type: String, 
    enum: [
      'Pending Payment', 'Paid', 'Confirmed', 'Processing', 'Packed', 
      'Ready To Ship', 'Shipment Created', 'AWB Assigned', 'Pickup Requested', 
      'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered', 
      'Completed', 'Cancelled', 'Refunded', 'Returned', 'RTO'
    ], 
    default: 'Pending Payment' 
  },
  coupon_code: { type: String },
  shipping: ShippingInfoSchema,
  timeline: [OrderTimelineSchema],
  notes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
