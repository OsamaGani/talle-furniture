const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Saved shipping address — a user can have many. Each one is a complete,
// shippable record (recipient name + phone + full address) because the
// person receiving an order doesn't have to be the account holder.
const addressItemSchema = new mongoose.Schema({
  label:    { type: String, default: '', trim: true },     // e.g. "Home", "Office", "Mom"
  fullName: { type: String, required: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  street:   { type: String, required: true, trim: true },
  city:     { type: String, required: true, trim: true },
  state:    { type: String, required: true, trim: true },
  zip:      { type: String, required: true, trim: true },
  country:  { type: String, default: 'India', trim: true },
  isDefault:{ type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, default: '' },
    // Legacy single-address field — kept so existing users keep their data.
    // New code reads/writes the addresses[] array; this is no longer surfaced.
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    addresses: [addressItemSchema],
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    verificationOTP: { type: String, default: '' },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    // Password reset — server stores a hashed token to defend against DB leak.
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpiresAt: { type: Date },
    // Per-account brute-force protection. The IP-based rate limit catches a
    // single attacker hammering the login endpoint, but a determined one
    // could rotate IPs to brute-force a specific account. Tracking failed
    // attempts on the user record itself caps that at LOCKOUT_THRESHOLD
    // failures regardless of where the requests originate from.
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
