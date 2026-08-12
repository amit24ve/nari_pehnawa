const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, required: true },
  ip_address: { type: String },
  details: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
