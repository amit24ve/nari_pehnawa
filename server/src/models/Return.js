const mongoose = require('mongoose');

const ReturnItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true }
});

const ReturnSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  items: [ReturnItemSchema],
  reason: { type: String, required: true },
  type: { type: String, enum: ['return', 'exchange'], default: 'return' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'picked_up', 'received', 'refunded', 'completed'], 
    default: 'pending' 
  },
  shipment_details: {
    return_shipment_id: { type: String },
    return_awb_code: { type: String },
    courier_name: { type: String }
  },
  exchange_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  refund_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', ReturnSchema);
