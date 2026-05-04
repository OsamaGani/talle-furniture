const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { sendStatusEmail } = require('../utils/orderEmails');
const { audit } = require('../utils/audit');

const router = express.Router();

// Pricing rules — KEEP IN SYNC with frontend/src/context/CartContext.jsx.
// All authoritative pricing happens server-side; the client values are
// display-only and never trusted.
const SHIPPING_FEE = 50;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.18;

const round2 = (n) => +Number(n).toFixed(2);

// Compute the unit price the customer should actually pay for this product
// at this quantity, respecting wholesale eligibility, the product-level
// discount, and any colour-variant price/discount override.
//
// Variant pricing rules:
//   * variant.price > 0      → use that as the base instead of product.price
//   * variant.discount > 0   → use that as the discount instead of product.discount
//   * either of those zero/missing → fall back to the product-level value
//   * wholesale price stays product-level (wholesale buyers usually order
//     mixed colours; per-colour B2B pricing isn't needed yet)
function unitPriceFor(product, qty, user, color) {
  const variant = color
    ? (product.colorVariants || []).find((v) => v.color.toLowerCase() === color.toLowerCase())
    : null;
  const basePrice = (variant && variant.price > 0) ? variant.price : product.price;
  const discount  = (variant && variant.discount != null && variant.discount > 0) ? variant.discount : product.discount;

  const isApprovedWholesale =
    user.accountType === 'wholesale' &&
    user.wholesaleApproved === true &&
    product.wholesalePrice > 0 &&
    product.wholesaleMinQty > 0 &&
    qty >= product.wholesaleMinQty;

  if (isApprovedWholesale) return round2(product.wholesalePrice);
  if (discount > 0) return round2(basePrice - (basePrice * discount) / 100);
  return round2(basePrice);
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

      // Validate the colour FIRST so unitPriceFor can apply variant
      // pricing if the customer picked a coloured variant with its own price.
      let color = String(it?.color || '').trim().slice(0, 40);
      if (color && Array.isArray(updated.colors) && updated.colors.length > 0) {
        const match = updated.colors.find((c) => c.toLowerCase() === color.toLowerCase());
        color = match || '';
      } else if (color && (!updated.colors || updated.colors.length === 0)) {
        color = '';
      }

      const unit = unitPriceFor(updated, qty, req.user, color);
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
        color,
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

// Customer-initiated cancellation. Allowed only while the order is still in
// 'pending' or 'confirmed' status — once it's been packed/shipped the
// customer needs to go through the returns flow with the admin instead.
//
// Side effects on cancel:
//   * stock for every line item is restored (atomic $inc per product)
//   * status flips to 'cancelled' with a customer-attributed history entry
//   * if paid via Razorpay, an automatic refund is requested through the
//     Razorpay API. The refund record is saved on the order so the customer
//     can see "Refund initiated, expect 5–7 business days" on the order page.
//   * if paid via COD that hasn't been delivered yet — nothing to refund.
//   * customer + admin both get a status email so everyone's in sync.
router.put('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only the order owner can cancel from the customer side. Admins use the
  // dedicated /:id/status route.
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only cancel your own orders' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ message: 'This order is already cancelled' });
  }

  const cancellable = ['pending', 'confirmed'];
  if (!cancellable.includes(order.status)) {
    return res.status(400).json({
      message: 'This order has already been packed or shipped — please contact us to arrange a return instead of cancelling.',
    });
  }

  const reason = String(req.body?.reason || '').trim().slice(0, 200);

  // Restore stock — fire-and-forget per item; failures don't block the cancel
  // because over-restoring is recoverable from inventory; under-restoring isn't.
  await Promise.allSettled(
    order.items.map((it) =>
      Product.findByIdAndUpdate(it.product, { $inc: { stock: it.qty } })
    )
  );

  // Update order itself
  order.status = 'cancelled';
  order.cancelledBy = 'customer';
  order.cancelledAt = new Date();
  order.cancelledReason = reason;
  order.statusHistory.push({
    status: 'cancelled',
    note: reason ? `Cancelled by customer · ${reason}` : 'Cancelled by customer',
    at: new Date(),
  });

  // ---- Refund flow ----
  if (order.isPaid && order.paymentMethod === 'Razorpay' && order.paymentResult?.id) {
    const id = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!id || !secret) {
      // Razorpay not configured on this environment — flag for manual refund.
      order.refund = {
        status: 'pending_manual',
        amount: Math.round(order.totalPrice * 100),
        initiatedAt: new Date(),
        failureReason: 'Razorpay credentials not configured',
      };
    } else {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({ key_id: id, key_secret: secret });
        const refund = await razorpay.payments.refund(order.paymentResult.id, {
          amount: Math.round(order.totalPrice * 100),
          speed: 'normal', // 'optimum' = instant refund (Razorpay charges extra)
          notes: {
            orderId: String(order._id),
            orderNumber: order.orderNumber || '',
            reason: reason || 'Customer cancelled',
          },
        });
        order.refund = {
          status: 'initiated',
          id: refund.id,
          amount: refund.amount,
          initiatedAt: new Date(),
        };
        // Reverse the paid flag so revenue dashboards stay accurate. paidAt
        // is left intact as the historical timestamp of original capture.
        order.isPaid = false;
        console.log(`💸 Razorpay refund initiated for order ${order._id} -> ${refund.id}`);
      } catch (err) {
        console.error('Razorpay refund failed:', err.message);
        order.refund = {
          status: 'pending_manual',
          amount: Math.round(order.totalPrice * 100),
          initiatedAt: new Date(),
          failureReason: err.message || 'Razorpay refund call failed',
        };
      }
    }
  } else if (order.paymentMethod === 'COD' && !order.isPaid) {
    // COD that wasn't delivered yet — nothing was charged, nothing to refund.
    order.refund = { status: 'not_applicable', amount: 0 };
  } else if (order.isPaid && order.paymentMethod === 'COD') {
    // Pre-paid COD (rare edge case — admin marked paid before delivery).
    // Roll back the paid flag and require manual refund.
    order.isPaid = false;
    order.refund = {
      status: 'pending_manual',
      amount: Math.round(order.totalPrice * 100),
      initiatedAt: new Date(),
      failureReason: 'Pre-paid COD requires manual cash refund',
    };
  } else {
    order.refund = { status: 'not_applicable', amount: 0 };
  }

  const updated = await order.save();

  // Notify the customer + admin via status email (best-effort)
  try {
    const customer = await User.findById(order.user);
    if (customer?.email) {
      await sendStatusEmail(updated, customer.email, customer.name, reason);
    }
  } catch (err) {
    console.error('Cancel email failed:', err.message);
  }

  res.json(updated);
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
  // Tag admin-driven cancellations so the dashboard can distinguish them
  // from customer self-cancellations. Only stamp on the transition into
  // cancelled (don't overwrite an existing customer cancellation if an
  // admin happens to re-save the same status).
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    order.cancelledBy = 'admin';
    order.cancelledAt = new Date();
    if (note) order.cancelledReason = note;
  }
  order.statusHistory.push({
    status: newStatus,
    note: newStatus === 'cancelled' && note ? `Cancelled by admin · ${note}` : note,
    at: new Date(),
  });
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

  audit(req, 'order.status-change', order._id, { from: oldStatus, to: newStatus, note });
  res.json({ ...updated.toObject(), emailSent: emailResult.sent });
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await order.deleteOne();
  audit(req, 'order.delete', order._id, { orderNumber: order.orderNumber, totalPrice: order.totalPrice });
  res.json({ message: 'Deleted' });
}));

module.exports = router;
