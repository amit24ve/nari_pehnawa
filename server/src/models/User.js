const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  type: { type: String, default: 'home' },
  full_name: { type: String, required: true },
  phone: { type: String, required: true },
  address_line1: { type: String, required: true },
  address_line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  is_default: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'warehouse', 'customer'], default: 'customer' },
  is_admin: { type: Boolean, default: false },
  age: { type: Number },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joined_date: { type: Date, default: Date.now },
  last_login: { type: Date },
  orders_count: { type: Number, default: 0 },
  phone: { type: String },
  bio: { type: String },
  addresses: [AddressSchema],
  settings: {
    notifications: { type: Map, of: Boolean, default: { email: true, sms: true, whatsapp: true } },
    privacy: { type: Map, of: Boolean, default: {} }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
