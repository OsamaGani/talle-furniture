const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: Number,
  qty: { type: Number, required: true, min: 1 },
  // Customer-selected colour at time of order. Stored verbatim (e.g.
  // "Red", "Pastel Blue") so emails / invoices / shipping labels can
  // print the exact name shown on the product page. Empty string when
  // the product has no colour options configured.
  color: { type: String, default: '' },
});

const statusEvent = new mongoose.Schema({
  status: String,
  note: String,
  at: { type: Date, default: Date.now },
}, { _id: false });

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
      phone: String,
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentResult: {
      // Generic identifier (Razorpay payment_id, COD-orderNumber, ...)
      id: String,
      status: String,
      updateTime: String,
      email: String,
      // Razorpay-specific payment metadata for the customer-facing receipt.
      // All optional — populated when the gateway returns enough info.
      provider: String,         // 'Razorpay' | 'COD'
      method: String,           // 'upi' | 'card' | 'netbanking' | 'wallet'
      vpa: String,              // UPI handle (e.g. 9876543210@ybl)
      bank: String,             // bank name for netbanking / UPI
      wallet: String,           // wallet name (Paytm, PhonePe wallet, etc.)
      cardLast4: String,        // last 4 digits of card
      cardBrand: String,        // Visa / MasterCard / Rupay / Amex
      cardNetwork: String,      // network printed on card
      cardType: String,         // credit / debit
      rrn: String,              // Bank reference number (UPI)
      acquirerData: { type: Object },
      amount: Number,           // amount captured (in paise)
      fee: Number,              // gateway fee (paise)
      tax: Number,              // GST on fee (paise)
      orderId: String,          // razorpay order id
      capturedAt: Date,
    },
    itemsPrice: Number,
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    statusHistory: [statusEvent],
    estimatedDelivery: Date,
    trackingNumber: String,
    carrier: { type: String, default: '' }, // e.g. 'Bluedart', 'FedEx', 'Self Delivery'

    // Cancellation + refund tracking. Customers can cancel their own orders
    // before they're packed/shipped; if they paid online we attempt a
    // Razorpay-side refund automatically.
    cancelledBy: { type: String, enum: ['', 'customer', 'admin'], default: '' },
    cancelledReason: { type: String, default: '' },
    cancelledAt: Date,
    refund: {
      // 'initiated' = Razorpay accepted the refund request
      // 'completed' = funds returned to customer (set by webhook later)
      // 'failed'    = refund call errored — manual intervention needed
      // 'pending_manual' = paid order cancelled but auto-refund failed; admin to resolve
      // 'not_applicable' = COD or unpaid; nothing to refund
      status: { type: String, default: '' },
      id: { type: String, default: '' },     // Razorpay refund id (rfnd_...)
      amount: { type: Number, default: 0 },  // in paise, mirrors Razorpay
      initiatedAt: Date,
      completedAt: Date,
      failureReason: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.orderNumber = 'TM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    this.statusHistory = [{ status: 'pending', note: 'Order placed successfully', at: new Date() }];
    this.estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  }
  next();
});

orderSchema.statics.STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
