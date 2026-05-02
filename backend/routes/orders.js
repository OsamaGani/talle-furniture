const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { sendStatusEmail } = require('../utils/orderEmails');

const router = express.Router();

// Pricing rules — KEEP IN SYNC with frontend/src/context/CartContext.jsx.
// All authoritative pricing happens server-side; the client values are
// display-only and never trusted.
const SHIPPING_FEE = 50;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.18;

const round2 = (n) => +Number(n).toFixed(2);

// Compute the unit price the customer should actually pay for this product
// at this quantity, respecting wholesale eligibility and discount.
function unitPriceFor(product, qty, user) {
  const isApprovedWholesale =
    user.accountType === 'wholesale' &&
    user.wholesaleApproved === true &&
    product.wholesalePrice > 0 &&
    product.wholesaleMinQty > 0 &&
    qty >= product.wholesaleMinQty;

  if (isApprovedWholesale) return round2(product.wholesalePrice);
  if (product.discount > 0) return round2(product.price - (product.price * product.discount) / 100);
  return round2(product.price);
}

router.post('/', protect, asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items' });
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street) {
    return res.status(400).json({ message: 'Shipping address is incomplete' });
  }

  const allowedMethods = ['COD', 'Razorpay'];
  const safeMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'COD';

  // ---- Atomically reserve stock and recompute prices server-side ----
  // For every cart item we do a conditional decrement: only succeeds if
  // there's enough stock left. If any item fails, we restore everything we
  // already decremented and bail. This prevents oversell + price-spoof in
  // one shot.
  const reserved = []; // { id, qty } so we can roll back on failure
  const safeItems = [];
  let itemsPrice = 0;

  try {
    for (const it of items) {
      if (!mongoose.isValidObjectId(it?.product)) {
        throw Object.assign(new Error('Invalid product in cart'), { status: 400 });
      }
      const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 0));
      if (!qty) throw Object.assign(new Error('Invalid quantity'), { status: 400 });

      const updated = await Product.findOneAndUpdate(
        { _id: it.product, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!updated) {
        throw Object.assign(new Error(`Out of stock for one of your items`), { status: 400 });
      }
      reserved.push({ id: updated._id, qty });

      const unit = unitPriceFor(updated, qty, req.user);
      const isWholesalePrice =
        req.user.accountType === 'wholesale' &&
        req.user.wholesaleApproved === true &&
        updated.wholesalePrice > 0 &&
        qty >= updated.wholesaleMinQty;

      safeItems.push({
        product: updated._id,
        name: updated.name,
        image: updated.image || (updated.images && updated.images[0]) || '',
        price: unit,
        qty,
        isWholesalePrice,
      });
      itemsPrice += unit * qty;
    }

    itemsPrice = round2(itemsPrice);
    const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const taxPrice = round2(itemsPrice * TAX_RATE);
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

    const order = await Order.create({
      user: req.user._id,
      items: safeItems,
      shippingAddress,
      paymentMethod: safeMethod,
      accountType: req.user.accountType || 'retail',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // Send "order received" email
    try {
      if (req.user?.email) {
        await sendStatusEmail(order, req.user.email, req.user.name);
        console.log(`📧 Order placed email -> ${req.user.email}`);
      }
    } catch (err) { console.error('Order email error:', err.message); }

    res.status(201).json(order);
  } catch (err) {
    // Roll back any stock we already decremented
    await Promise.allSettled(
      reserved.map((r) => Product.findByIdAndUpdate(r.id, { $inc: { stock: r.qty } }))
    );
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Could not create order' });
  }
}));

router.get('/myorders', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
}));

router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Forbidden' });
  res.json(order);
}));

// NOTE: the old PUT /:id/pay route was removed because it accepted the
// "paid" flag from the client without any signature, ownership, or
// gateway verification — anyone could mark any order paid. Real payment
// confirmation flows through:
//   - /api/payment/razorpay/verify    (HMAC-verified)
//   - /api/payment/razorpay/webhook   (HMAC-verified, server-to-server)
//   - admin status update (COD orders flip to paid on delivery)

router.put('/:id/status', protect, admin, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const newStatus = req.body.status;
  const note = req.body.note || '';
  if (!newStatus) return res.status(400).json({ message: 'Status required' });
  // Reject anything outside the canonical status list to prevent garbage
  // values polluting the order pipeline.
  if (!Order.STATUSES.includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const oldStatus = order.status;
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, note, at: new Date() });
  if (req.body.trackingNumber !== undefined) {
    order.trackingNumber = String(req.body.trackingNumber).slice(0, 80);
  }
  if (req.body.carrier !== undefined) {
    order.carrier = String(req.body.carrier).slice(0, 80);
  }
  if (newStatus === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    // COD: cash is collected on delivery, so flip the order to paid the
    // moment it's marked delivered. Revenue dashboard now reflects reality.
    if (!order.isPaid && order.paymentMethod === 'COD') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        ...(order.paymentResult || {}),
        id: 'COD-' + (order.orderNumber || order._id),
        status: 'COMPLETED',
        updateTime: new Date().toISOString(),
        provider: 'COD',
      };
    }
  }
  // Cancelling a previously-paid COD order should revert isPaid so the
  // revenue total stays accurate.
  if (newStatus === 'cancelled' && order.paymentMethod === 'COD' && order.isPaid && !order.deliveredAt) {
    order.isPaid = false;
    order.paidAt = null;
  }
  const updated = await order.save();

  // Send status email to customer (only if status actually changed)
  let emailResult = { sent: false };
  if (oldStatus !== newStatus) {
    try {
      const customer = await User.findById(order.user);
      if (customer && customer.email) {
        emailResult = await sendStatusEmail(updated, customer.email, customer.name, note);
        console.log(`📧 Status email -> ${customer.email}: ${newStatus} (${emailResult.sent ? 'sent' : (emailResult.dev ? 'dev-log' : 'failed')})`);
      }
    } catch (err) {
      console.error('Status email error:', err.message);
    }
  }

  res.json({ ...updated.toObject(), emailSent: emailResult.sent });
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await order.deleteOne();
  res.json({ message: 'Deleted' });
}));

module.exports = router;
