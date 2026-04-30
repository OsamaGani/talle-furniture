const express = require('express');
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { sendStatusEmail } = require('../utils/orderEmails');

const router = express.Router();

router.post('/', protect, asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'No items' });

  for (const it of items) {
    const p = await Product.findById(it.product);
    if (!p) return res.status(400).json({ message: `Product ${it.name} not found` });
    if (p.stock < it.qty) return res.status(400).json({ message: `Not enough stock for ${p.name}` });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    accountType: req.user.accountType || 'retail',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  for (const it of items) {
    await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.qty } });
  }

  // Send "order received" email
  try {
    if (req.user?.email) {
      await sendStatusEmail(order, req.user.email, req.user.name);
      console.log(`📧 Order placed email -> ${req.user.email}`);
    }
  } catch (err) { console.error('Order email error:', err.message); }

  res.status(201).json(order);
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

router.put('/:id/pay', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = req.body;
  order.status = 'processing';
  const updated = await order.save();
  res.json(updated);
}));

router.put('/:id/status', protect, admin, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const newStatus = req.body.status;
  const note = req.body.note || '';
  if (!newStatus) return res.status(400).json({ message: 'Status required' });
  const oldStatus = order.status;
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, note, at: new Date() });
  if (req.body.trackingNumber) {
    order.trackingNumber = req.body.trackingNumber;
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
