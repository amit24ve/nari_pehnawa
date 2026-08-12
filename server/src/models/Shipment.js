const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  shipment_id: { type: String, required: true, unique: true },
  awb_code: { type: String },
  courier_name: { type: String },
  courier_id: { type: String },
  pickup_status: { type: String, default: 'pending' },
  tracking_url: { type: String },
  expected_delivery: { type: Date },
  shipment_status: { type: String, default: 'Created' },
  length: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true }, // in kg
  label_url: { type: String },
  invoice_url: { type: String },
  manifest_url: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
