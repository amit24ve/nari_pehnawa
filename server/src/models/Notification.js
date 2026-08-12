const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'manager', 'warehouse', 'customer'], default: 'customer' },
  type: { type: String, enum: ['email', 'sms', 'whatsapp', 'in_app'], required: true },
  recipient: { type: String, required: true }, // email address or phone number
  subject: { type: String },
  body: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  error: { type: String },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
