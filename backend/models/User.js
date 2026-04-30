const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    accountType: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    businessName: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    wholesaleApproved: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    verificationOTP: { type: String, default: '' },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    // Password reset — server stores a hashed token to defend against DB leak.
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpiresAt: { type: Date },
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
